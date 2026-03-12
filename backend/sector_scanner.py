"""
sector_scanner.py
=================
Scans Nifty Sectors by momentum and returns the top sector stocks for analysis.

Pipeline:
    1. Rank all tracked Nifty sector ETFs by weekly % change
    2. For the top 2 bullish sectors, return a curated list of liquid NSE stocks
    3. Also return the weakest sector for potential short-side setups
"""

import yfinance as yf
import pandas as pd
import numpy as np
from technical_engine import compute_indicators, score_higher_tf

# ---------------------------------------------------------------------------
# 1. SECTOR <-> ETF PROXY MAPPING
# ---------------------------------------------------------------------------

SECTOR_ETFS = {
    "Nifty Bank":    "BANKBEES.NS",
    "Nifty IT":      "ITBEES.NS",
    "Nifty Auto":    "AUTOBEES.NS",
    "Nifty FMCG":    "NIFTYBEES.NS",  # FMCGBEES delisted — using broad Nifty ETF as proxy
    "Nifty Pharma":  "PHARMABEES.NS",
}

# ---------------------------------------------------------------------------
# 2. SECTOR -> LIQUID STOCK CANDIDATES
# ---------------------------------------------------------------------------

SECTOR_STOCKS = {
    "Nifty Bank": [
        "HDFCBANK.NS", "ICICIBANK.NS", "KOTAKBANK.NS", "SBIN.NS", "AXISBANK.NS"
    ],
    "Nifty IT": [
        "TCS.NS", "INFY.NS", "HCLTECH.NS", "WIPRO.NS", "TECHM.NS"
    ],
    "Nifty Auto": [
        "MARUTI.NS", "TATAMOTORS.NS", "M&M.NS", "BAJAJ-AUTO.NS", "HEROMOTOCO.NS"
    ],
    "Nifty FMCG": [
        "HINDUNILVR.NS", "ITC.NS", "NESTLEIND.NS", "BRITANNIA.NS", "DABUR.NS"
    ],
    "Nifty Pharma": [
        "SUNPHARMA.NS", "DRREDDY.NS", "CIPLA.NS", "DIVISLAB.NS", "BIOCON.NS"
    ],
}

# ---------------------------------------------------------------------------
# 3. SECTOR MOMENTUM RANKING
# ---------------------------------------------------------------------------

def rank_sectors() -> list:
    """
    Fetches weekly price data for each sector ETF and ranks by recent momentum.

    Returns a list of dicts sorted best → worst:
        [{ 'sector': str, 'change': float, 'bias': str }, ...]
    """
    results = []

    for sector, etf in SECTOR_ETFS.items():
        try:
            df = yf.Ticker(etf).history(period="1mo", interval="1wk")
            if len(df) < 2:
                continue

            # Weekly change as the primary momentum signal
            prev_close = df['Close'].iloc[-2]
            curr_close = df['Close'].iloc[-1]
            weekly_chg = ((curr_close - prev_close) / prev_close) * 100

            # Quick higher-TF bias from the monthly weekly data
            htf = score_higher_tf(df)

            results.append({
                'sector':      sector,
                'etf':         etf,
                'change':      round(weekly_chg, 2),
                'htf_score':   htf.get('score', 50),
                'htf_bias':    htf.get('bias', 'Neutral'),
                'htf_reasons': htf.get('reasons', [])
            })
        except Exception as e:
            print(f"[SectorScanner] Error fetching {etf}: {e}")

    # Sort by combined score (weekly momentum + higher TF score)
    results.sort(key=lambda x: x['change'] + (x['htf_score'] - 50) * 0.5, reverse=True)
    return results


# ---------------------------------------------------------------------------
# 4. STOCK SCORING WITHIN A SECTOR
# ---------------------------------------------------------------------------

def score_stocks_in_sector(sector: str, mode: str = "swing") -> list:
    """
    Fetches and scores each candidate stock inside the given sector using
    both weekly (higher TF) and daily (mid TF) indicators.

    Returns a sorted list of stock dicts with their scores.
    """
    candidates = SECTOR_STOCKS.get(sector, [])
    if not candidates:
        return []

    scored = []

    for ticker in candidates:
        try:
            # --- Weekly data for higher TF ---
            df_weekly = yf.Ticker(ticker).history(period="6mo", interval="1wk")
            weekly_result = score_higher_tf(df_weekly) if len(df_weekly) >= 5 else {'bias': 'Neutral', 'score': 50}

            # --- Daily data for mid TF ---
            df_daily = yf.Ticker(ticker).history(period="3mo", interval="1d")
            daily_result = score_higher_tf(df_daily) if len(df_daily) >= 14 else {'bias': 'Neutral', 'score': 50}

            # Combined score (weekly weighted heavier for swing/positional)
            if mode in ["swing", "positional", "long-term"]:
                combined = weekly_result['score'] * 0.6 + daily_result['score'] * 0.4
            else:
                combined = weekly_result['score'] * 0.3 + daily_result['score'] * 0.7

            current_price = df_daily['Close'].iloc[-1] if not df_daily.empty else 0

            scored.append({
                'ticker':         ticker,
                'sector':         sector,
                'current_price':  round(current_price, 2),
                'combined_score': round(combined, 1),
                'weekly_bias':    weekly_result.get('bias', 'Neutral'),
                'daily_bias':     daily_result.get('bias', 'Neutral'),
                'weekly_reasons': weekly_result.get('reasons', []),
                'daily_reasons':  daily_result.get('reasons', [])
            })

        except Exception as e:
            print(f"[SectorScanner] Error scoring {ticker}: {e}")

    # Return sorted by combined score
    scored.sort(key=lambda x: x['combined_score'], reverse=True)
    return scored


# ---------------------------------------------------------------------------
# 5. MAIN PIPELINE: Sector → Stock → Candidates for Deep Analysis
# ---------------------------------------------------------------------------

def run_sector_pipeline(mode: str = "swing", top_n_sectors: int = 2, top_n_stocks: int = 2) -> list:
    """
    Full pipeline:
      1. Rank all sectors
      2. Pick top N sectors (for longs) and optionally bottom 1 (for shorts)
      3. Score stocks within those sectors
      4. Return flat list of top candidates with their full analysis context

    Returns: list of stock context dicts ready for AI narration
    """
    sector_ranks = rank_sectors()
    print(f"[SectorScanner] Sector rankings: {[(s['sector'], s['change']) for s in sector_ranks]}")

    if not sector_ranks:
        print("[SectorScanner] Failed to rank sectors, using default tickers")
        return []

    # Long candidates: top sectors
    long_sectors  = [s['sector'] for s in sector_ranks[:top_n_sectors] if s['htf_bias'] in ('Bullish', 'Neutral')]
    # Short candidates: weakest sector (optional)
    short_sectors = [s['sector'] for s in sector_ranks[-1:] if s['htf_bias'] == 'Bearish']

    candidates = []

    for sector in long_sectors:
        stocks = score_stocks_in_sector(sector, mode=mode)[:top_n_stocks]
        for s in stocks:
            s['trade_side'] = 'Long'
        candidates.extend(stocks)

    for sector in short_sectors:
        stocks = score_stocks_in_sector(sector, mode=mode)[:1]  # max 1 short idea
        for s in stocks:
            s['trade_side'] = 'Short'
        candidates.extend(stocks)

    print(f"[SectorScanner] Candidates: {[c['ticker'] for c in candidates]}")
    return candidates
