"""
app.py — TradeAgent AI Backend
================================
FastAPI server with:
  - Market scanning, screening, and deep-analysis endpoints
  - A 24x7 background agent (APScheduler) that:
      * Monitors Nifty, BankNifty, and watchlist stocks every 5 minutes
      * Runs a full multi-TF sector scan every hour
      * Stores timestamped market alerts in a deque (in-memory ring buffer)
      * Exposes alerts via /api/alerts
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import datetime
import uuid
import yfinance as yf
import feedparser
import requests
from bs4 import BeautifulSoup
from collections import deque
import threading

from analyzer import generate_trade_ideas, run_ai_screener, generate_deep_analysis
from technical_engine import compute_indicators, detect_sr_zones, calculate_rr
from sector_scanner import rank_sectors

# ─────────────────────────────────────────────────────────────────────────────
# APP SETUP
# ─────────────────────────────────────────────────────────────────────────────

app = FastAPI(title="TradeAgent AI API — v2 Live Edition")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",           # local dev
        "http://localhost:3000",
        "https://trading-bot-production-d6f7.up.railway.app",  # Railway backend
        "https://*.vercel.app",            # Vercel frontend (any subdomain)
        "*"                                # fallback — tighten after frontend URL is known
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────────────────────────────────────
# GLOBAL ALERT STORE (ring buffer, max 100 alerts)
# ─────────────────────────────────────────────────────────────────────────────

_alerts_lock   = threading.Lock()
_market_alerts: deque = deque(maxlen=100)
_agent_status  = {
    "running":         True,
    "lastPriceScan":   None,
    "lastSectorScan":  None,
    "watchlistTickers": ["RELIANCE.NS", "HDFCBANK.NS", "^NSEI", "SBIN.NS", "TCS.NS", "INFY.NS"],
    "totalAlertsFired": 0,
}

# ─────────────────────────────────────────────────────────────────────────────
# PYDANTIC MODELS
# ─────────────────────────────────────────────────────────────────────────────

class TradeIdea(BaseModel):
    id: str
    ticker: str
    companyName: str
    type: str
    entryPrice: float
    targetPrice: float
    stopLoss: float
    conviction: str
    rationale: str
    timestamp: str

class ScanRequest(BaseModel):
    mode: str

class ScreenerRequest(BaseModel):
    prompt: str
    marketCap: str

class ScreenerResult(BaseModel):
    id: str
    ticker: str
    name: str
    sector: str
    marketCap: str
    score: int
    catalyst: str
    change: str

class AnalyzeRequest(BaseModel):
    ticker: str

class DeepAnalysisResult(BaseModel):
    ticker: str
    companyName: str
    currentPrice: float
    verdict: str
    entryPrice: float
    targetPrice: float
    stopLoss: float
    riskReward: str
    conviction: str
    technicalAnalysis: str
    fundamentalAnalysis: str
    dcfValuation: str
    concallAnalysis: str
    executiveSummary: str

class WatchlistUpdateRequest(BaseModel):
    tickers: List[str]

# ─────────────────────────────────────────────────────────────────────────────
# BACKGROUND AGENT TASKS
# ─────────────────────────────────────────────────────────────────────────────

def _push_alert(type_: str, ticker: str, message: str, severity: str = "info"):
    """Push a new alert into the ring buffer."""
    with _alerts_lock:
        _market_alerts.appendleft({
            "id":        str(uuid.uuid4()),
            "type":      type_,
            "ticker":    ticker,
            "message":   message,
            "severity":  severity,  # 'info' | 'warning' | 'critical'
            "timestamp": datetime.datetime.now().strftime("%H:%M:%S IST"),
        })
        _agent_status["totalAlertsFired"] += 1


def job_price_monitor():
    """
    Runs every 5 minutes.
    Checks the watchlist for:
      - RSI extremes (< 30 or > 70)
      - Price breaking through key S/R levels
      - Unusual volume spikes (> 2x avg)
    """
    print(f"[Agent] 🔍 Price monitor tick — {datetime.datetime.now().strftime('%H:%M:%S')}")
    watchlist = _agent_status.get("watchlistTickers", [])

    for ticker in watchlist:
        try:
            df = yf.Ticker(ticker).history(period="5d", interval="15m")
            if df.empty or len(df) < 14:
                continue

            df = compute_indicators(df)
            latest = df.iloc[-1]
            rsi    = latest.get("RSI", 50)
            close  = latest["Close"]
            vol    = latest["Volume"]
            vol_ma = latest.get("Vol_MA_20", vol)

            # RSI extremes
            if rsi < 30:
                _push_alert("RSI", ticker, f"RSI oversold at {rsi:.1f} — potential reversal long setup", "warning")
            elif rsi > 72:
                _push_alert("RSI", ticker, f"RSI overbought at {rsi:.1f} — watch for exhaustion", "warning")

            # Volume spike
            if vol_ma and vol > vol_ma * 2.2:
                _push_alert("Volume", ticker, f"Volume spike: {vol:,.0f} vs avg {vol_ma:,.0f} — unusual activity", "critical")

            # S/R breakout detection (daily S/R)
            df_daily = yf.Ticker(ticker).history(period="3mo", interval="1d")
            if len(df_daily) >= 10:
                sr = detect_sr_zones(df_daily)
                res = sr.get("resistance", 0)
                sup = sr.get("support", 0)
                if res and abs(close - res) / close < 0.005:
                    _push_alert("S/R Break", ticker, f"Price ₹{close:.2f} approaching key resistance ₹{res:.2f}", "critical")
                elif sup and abs(close - sup) / close < 0.005:
                    _push_alert("S/R Break", ticker, f"Price ₹{close:.2f} approaching key support ₹{sup:.2f}", "warning")

        except Exception as e:
            print(f"[Agent] Error monitoring {ticker}: {e}")

    _agent_status["lastPriceScan"] = datetime.datetime.now().strftime("%H:%M:%S")


def job_sector_scan():
    """
    Runs every 60 minutes.
    Re-ranks all sectors and fires an alert if momentum shifts (sector bias changes).
    """
    print(f"[Agent] 📊 Sector scan tick — {datetime.datetime.now().strftime('%H:%M:%S')}")
    try:
        ranks = rank_sectors()
        if not ranks:
            return

        top    = ranks[0]
        bottom = ranks[-1]

        _push_alert(
            "Sector Shift",
            top["sector"],
            f"Strongest sector: {top['sector']} ({top['change']:+.2f}% weekly, HTF={top['htf_bias']})",
            "info"
        )

        if bottom["htf_bias"] == "Bearish":
            _push_alert(
                "Sector Weak",
                bottom["sector"],
                f"Weakest sector: {bottom['sector']} ({bottom['change']:+.2f}% weekly) — potential short candidates",
                "warning"
            )

    except Exception as e:
        print(f"[Agent] Sector scan error: {e}")

    _agent_status["lastSectorScan"] = datetime.datetime.now().strftime("%H:%M:%S")


def job_news_monitor():
    """
    Runs every 15 minutes.
    Parses the Moneycontrol RSS. If a headline contains high-impact keywords, fires an alert.
    """
    HIGH_IMPACT_KEYWORDS = [
        "RBI", "rate cut", "rate hike", "crash", "circuit", "ban", "SEBI", "GDP",
        "CPI", "inflation", "FII", "Q4", "earnings", "profit", "loss", "downgrade",
        "upgrade", "merger", "acquisition", "stake sale", "IPO block", "halt"
    ]
    try:
        feed = feedparser.parse("https://www.moneycontrol.com/rss/MCtopnews.xml")
        for entry in feed.entries[:5]:
            title = entry.get("title", "")
            for kw in HIGH_IMPACT_KEYWORDS:
                if kw.lower() in title.lower():
                    _push_alert(
                        "Breaking News",
                        "NSE/BSE",
                        f"📰 {title}",
                        "critical" if kw in ["crash", "circuit", "ban"] else "warning"
                    )
                    break
    except Exception as e:
        print(f"[Agent] News monitor error: {e}")


def start_background_scheduler():
    """Starts the APScheduler background agent."""
    from apscheduler.schedulers.background import BackgroundScheduler

    scheduler = BackgroundScheduler(timezone="Asia/Kolkata")

    # Price & volume monitor every 5 minutes
    scheduler.add_job(job_price_monitor, "interval", minutes=5, id="price_monitor",
                      next_run_time=datetime.datetime.now())
    # Sector re-ranking every 60 minutes
    scheduler.add_job(job_sector_scan, "interval", minutes=60, id="sector_scan",
                      next_run_time=datetime.datetime.now())
    # News monitor every 15 minutes
    scheduler.add_job(job_news_monitor, "interval", minutes=15, id="news_monitor",
                      next_run_time=datetime.datetime.now())

    scheduler.start()
    print("[Agent] ✅ Background monitoring agent started (24x7)")
    return scheduler


# Start the scheduler when the module loads
_scheduler = start_background_scheduler()

# ─────────────────────────────────────────────────────────────────────────────
# ROUTES — Core API
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/")
def read_root():
    return {"status": "TradeAgent AI Backend is running — Agent Active 24x7"}


@app.post("/api/scan", response_model=List[TradeIdea])
def scan_markets(request: ScanRequest):
    ideas_data = generate_trade_ideas(request.mode)
    ideas = []
    now = datetime.datetime.now().strftime("%I:%M %p")

    for item in ideas_data:
        try:
            ideas.append(TradeIdea(
                id=str(uuid.uuid4()),
                ticker=item.get("ticker", "UNKNOWN"),
                companyName=item.get("companyName", item.get("ticker", "UNKNOWN")),
                type=item.get("type", "Long"),
                entryPrice=float(item.get("entryPrice", 0)),
                targetPrice=float(item.get("targetPrice", 0)),
                stopLoss=float(item.get("stopLoss", 0)),
                conviction=item.get("conviction", "Medium"),
                rationale=f"[Multi-TF] {item.get('rationale', '')}",
                timestamp=now
            ))
        except Exception as e:
            print(f"Error parsing trade idea: {e}")

    if not ideas:
        ideas = [TradeIdea(
            id=str(uuid.uuid4()), ticker="RELIANCE.NS", companyName="Reliance Industries",
            type="Long", entryPrice=2800.0, targetPrice=2980.0, stopLoss=2730.0,
            conviction="Medium", rationale="Fallback: AI returned invalid response. Check logs.",
            timestamp=now
        )]
    return ideas


@app.post("/api/screener", response_model=List[ScreenerResult])
def run_screener(request: ScreenerRequest):
    screener_data = run_ai_screener(request.prompt, request.marketCap)
    results = []
    for item in screener_data:
        try:
            results.append(ScreenerResult(
                id=str(uuid.uuid4()),
                ticker=item.get("ticker", "UNKNOWN"),
                name=item.get("name", "Unknown"),
                sector=item.get("sector", "Unknown"),
                marketCap=item.get("marketCap", "Unknown"),
                score=int(item.get("score", 50)),
                catalyst=item.get("catalyst", ""),
                change=item.get("change", "0.0%")
            ))
        except Exception as e:
            print(f"Error parsing screener result: {e}")

    if not results:
        results = [ScreenerResult(
            id=str(uuid.uuid4()), ticker="ERR", name="Error Fetching Data",
            sector="-", marketCap="-", score=0,
            catalyst="Ensure Gemini API key is valid in .env", change="0%"
        )]
    return results


@app.post("/api/analyze", response_model=DeepAnalysisResult)
def analyze_stock(request: AnalyzeRequest):
    try:
        data = generate_deep_analysis(request.ticker)
        return DeepAnalysisResult(**data)
    except Exception as e:
        print(f"Deep Analysis Error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate deep analysis: {str(e)}")


# ─────────────────────────────────────────────────────────────────────────────
# ROUTES — Live Agent
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/api/alerts")
def get_alerts(limit: int = 20):
    """Returns the latest market alerts generated by the 24x7 monitoring agent."""
    with _alerts_lock:
        return list(_market_alerts)[:limit]


@app.get("/api/agent-status")
def get_agent_status():
    """Returns the live agent's current status and watchlist."""
    return {
        **_agent_status,
        "scheduledJobs": ["Price Monitor (5m)", "Sector Scan (60m)", "News Monitor (15m)"],
        "currentTime":   datetime.datetime.now().strftime("%H:%M:%S IST"),
        "alertsInBuffer": len(_market_alerts),
    }


@app.post("/api/agent/watchlist")
def update_watchlist(request: WatchlistUpdateRequest):
    """Updates the agent's watchlist tickers."""
    _agent_status["watchlistTickers"] = request.tickers
    return {"message": f"Watchlist updated with {len(request.tickers)} tickers", "tickers": request.tickers}


# ─────────────────────────────────────────────────────────────────────────────
# ROUTES — Market Data
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/api/chart/{ticker}")
def get_chart_data(ticker: str, interval: str = "1d", period: str = "1mo"):
    try:
        data = yf.Ticker(ticker).history(period=period, interval=interval)
        if data.empty:
            return []
        chart_data = []
        for index, row in data.iterrows():
            time_val = index.strftime('%Y-%m-%d') if interval in ['1d', '1wk', '1mo'] else int(index.timestamp())
            chart_data.append({
                "time":  time_val,
                "open":  round(float(row['Open']),  2),
                "high":  round(float(row['High']),  2),
                "low":   round(float(row['Low']),   2),
                "close": round(float(row['Close']), 2)
            })
        return chart_data
    except Exception as e:
        print(f"Error fetching chart data for {ticker}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch chart data")


@app.get("/api/market-pulse")
def get_market_pulse():
    fii_net = 0
    dii_net = 0
    date_str = "Live Data"

    # Scrape FII/DII from Moneycontrol
    url = "https://www.moneycontrol.com/stocks/marketstats/fii_dii_activity/index.php"
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
    try:
        response = requests.get(url, headers=headers, timeout=10)
        soup = BeautifulSoup(response.content, 'html.parser')
        tables = soup.find_all('table', class_='mctable1')
        if tables:
            rows = tables[0].find('tbody').find_all('tr')
            for row in rows[1:3]:
                cols = row.find_all('td')
                if len(cols) >= 7:
                    try:
                        date_str = cols[0].text.strip()
                        fii_net = float(cols[3].text.strip().replace(',', ''))
                        dii_net = float(cols[6].text.strip().replace(',', ''))
                        break
                    except:
                        continue
    except Exception as e:
        print("FII/DII Scrape Error:", e)

    # Fetch Live Sectors using ETF Proxies
    sector_proxies = {
        "Nifty Bank":   "BANKBEES.NS",
        "Nifty IT":     "ITBEES.NS",
        "Nifty Auto":   "AUTOBEES.NS",
        "Nifty FMCG":   "NIFTYBEES.NS",
        "Nifty Pharma": "PHARMABEES.NS"
    }
    sectors = []
    for name, ticker in sector_proxies.items():
        try:
            t = yf.Ticker(ticker)
            data = t.history(period="5d")
            if len(data) >= 2:
                change = ((data['Close'].iloc[-1] - data['Close'].iloc[-2]) / data['Close'].iloc[-2]) * 100
            else:
                change = 0.0
            sectors.append({"name": name, "change": round(change, 2)})
        except Exception as e:
            print(f"Error fetching ETF {ticker}: {e}")
            sectors.append({"name": name, "change": 0.0})

    return {
        "fii": fii_net, "dii": dii_net, "date": date_str,
        "sectors": sorted(sectors, key=lambda x: x['change'], reverse=True)
    }


@app.get("/api/events")
def get_events():
    today     = datetime.datetime.now()
    events = [
        {"id": "1", "type": "Earnings", "title": "Reliance Industries Results",
         "date": (today + datetime.timedelta(days=1)).strftime("%A, 4:00 PM IST"), "impact": "High"},
        {"id": "2", "type": "Macro",    "title": "RBI Monetary Policy",
         "date": (today + datetime.timedelta(days=2)).strftime("%A, 10:00 AM IST"), "impact": "High"},
        {"id": "3", "type": "Earnings", "title": "TCS Q4 Results",
         "date": (today + datetime.timedelta(days=3)).strftime("%A, 4:30 PM IST"), "impact": "Medium"},
        {"id": "4", "type": "Macro",    "title": "India CPI Inflation Data",
         "date": (today + datetime.timedelta(days=4)).strftime("%A, 5:30 PM IST"), "impact": "High"},
        {"id": "5", "type": "Earnings", "title": "HDFC Bank Results",
         "date": (today + datetime.timedelta(days=5)).strftime("%A, 2:00 PM IST"), "impact": "High"},
    ]
    return events


@app.get("/api/news")
def get_news():
    url = "https://www.moneycontrol.com/rss/MCtopnews.xml"
    try:
        feed = feedparser.parse(url)
        return [
            {
                "id":       str(uuid.uuid4()),
                "headline": entry.get('title', 'Headline Unavailable'),
                "source":   "Moneycontrol",
                "time":     entry.get('published', 'Recently')
            }
            for entry in feed.entries[:8]
        ]
    except Exception as e:
        print(f"Error fetching RSS: {e}")
        return []


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=False)
allow_origins=["http://localhost:5173", "https://your-frontend.vercel.app"],
