"""
technical_engine.py
===================
Multi-Timeframe Technical Analysis Engine for Indian Markets.

Key Responsibilities:
    1. Compute a full indicator stack on any DataFrame (RSI, MACD, SMAs, EMAs, ATR, Volume MA)
    2. Detect S/R zones from swing highs/lows (price action based)
    3. Detect high-probability candlestick patterns at S/R zones
    4. Score the higher timeframe (Weekly / Daily) for trend bias
    5. Score the lower timeframe (1h / 15m) for precise entry
    6. Enforce a minimum 1:2 Risk/Reward ratio on every trade
"""

import pandas as pd
import numpy as np
import ta
from typing import Optional


# ---------------------------------------------------------------------------
# 1. INDICATOR COMPUTATION
# ---------------------------------------------------------------------------

def compute_indicators(df: pd.DataFrame) -> pd.DataFrame:
    """Computes a full TA indicator stack on the given OHLCV DataFrame."""
    if len(df) < 14:
        return df

    close = df['Close']
    high  = df['High']
    low   = df['Low']
    vol   = df['Volume']

    # --- Momentum ---
    df['RSI'] = ta.momentum.RSIIndicator(close, window=14).rsi()

    # --- Trend: MACD ---
    macd = ta.trend.MACD(close, window_slow=26, window_fast=12, window_sign=9)
    df['MACD']        = macd.macd()
    df['MACD_Signal'] = macd.macd_signal()
    df['MACD_Hist']   = macd.macd_diff()

    # --- Moving Averages ---
    for w in [20, 50]:
        df[f'SMA_{w}'] = ta.trend.SMAIndicator(close, window=min(w, len(df)-1)).sma_indicator()
    for w in [9, 20, 50]:
        df[f'EMA_{w}'] = ta.trend.EMAIndicator(close, window=min(w, len(df)-1)).ema_indicator()

    # 200 SMA only if enough data
    if len(df) >= 200:
        df['SMA_200'] = ta.trend.SMAIndicator(close, window=200).sma_indicator()
    else:
        df['SMA_200'] = np.nan

    # --- Volatility: ATR ---
    atr_period = min(14, len(df) - 1)
    df['ATR'] = ta.volatility.AverageTrueRange(high, low, close, window=atr_period).average_true_range()

    # --- Volume MA & Relative Volume ---
    vol_window = min(20, len(df) - 1)
    df['Vol_MA_20'] = vol.rolling(window=vol_window).mean()
    df['RVol']      = vol / df['Vol_MA_20']

    return df


# ---------------------------------------------------------------------------
# 2. SUPPORT & RESISTANCE ZONE DETECTION
# ---------------------------------------------------------------------------

def detect_sr_zones(df: pd.DataFrame, lookback: int = 20, tolerance: float = 0.005):
    """
    Detects significant Support and Resistance zones based on swing high/low pivots.

    Returns a dict:
        {
          'support': float,      # Nearest support below current price
          'resistance': float,   # Nearest resistance above current price
          'swing_lows': list,
          'swing_highs': list
        }
    """
    highs = df['High'].values
    lows  = df['Low'].values
    close = df['Close'].iloc[-1]

    swing_highs = []
    swing_lows  = []

    for i in range(2, len(highs) - 2):
        # Local high: higher than 2 candles on each side
        if highs[i] > highs[i-1] and highs[i] > highs[i-2] \
                and highs[i] > highs[i+1] and highs[i] > highs[i+2]:
            swing_highs.append(round(highs[i], 2))
        # Local low: lower than 2 candles on each side
        if lows[i] < lows[i-1] and lows[i] < lows[i-2] \
                and lows[i] < lows[i+1] and lows[i] < lows[i+2]:
            swing_lows.append(round(lows[i], 2))

    # Cluster close levels together (within tolerance %)
    def cluster(levels):
        if not levels:
            return []
        levels = sorted(set(levels))
        clusters = [levels[0]]
        for l in levels[1:]:
            if (l - clusters[-1]) / clusters[-1] < tolerance:
                clusters[-1] = round((clusters[-1] + l) / 2, 2)  # merge
            else:
                clusters.append(l)
        return clusters

    support_zones    = cluster([l for l in swing_lows  if l < close])
    resistance_zones = cluster([h for h in swing_highs if h > close])

    nearest_support    = max(support_zones)    if support_zones    else round(close * 0.97, 2)
    nearest_resistance = min(resistance_zones) if resistance_zones else round(close * 1.03, 2)

    return {
        'support':     nearest_support,
        'resistance':  nearest_resistance,
        'swing_lows':  sorted(swing_lows),
        'swing_highs': sorted(swing_highs)
    }


# ---------------------------------------------------------------------------
# 3. CANDLESTICK PATTERN DETECTION
# ---------------------------------------------------------------------------

def detect_candlestick_patterns(df: pd.DataFrame) -> dict:
    """
    Detects high-probability candlestick reversal and continuation patterns
    on the last 3 candles of the DataFrame.

    Returns dict of detected patterns: {'pattern_name': bool}
    """
    if len(df) < 3:
        return {}

    patterns = {}
    c1, c2, c3 = df.iloc[-3], df.iloc[-2], df.iloc[-1]

    o3, h3, l3, cl3 = c3['Open'], c3['High'], c3['Low'], c3['Close']
    o2, h2, l2, cl2 = c2['Open'], c2['High'], c2['Low'], c2['Close']
    o1, h1, l1, cl1 = c1['Open'], c1['High'], c1['Low'], c1['Close']

    body3 = abs(cl3 - o3)
    range3 = h3 - l3 if h3 != l3 else 0.001
    lower_wick3 = o3 - l3 if cl3 >= o3 else cl3 - l3
    upper_wick3 = h3 - cl3 if cl3 >= o3 else h3 - o3

    # --- Bullish Hammer (at support) ---
    hammer = (
        lower_wick3 >= 2 * body3 and
        upper_wick3 <= body3 * 0.5 and
        cl3 > o3  # green candle preferred
    )
    patterns['Bullish Hammer'] = hammer

    # --- Shooting Star (at resistance) ---
    shooting_star = (
        upper_wick3 >= 2 * body3 and
        lower_wick3 <= body3 * 0.5 and
        cl3 < o3  # red candle preferred
    )
    patterns['Shooting Star'] = shooting_star

    # --- Bullish Engulfing ---
    bullish_engulfing = (
        cl2 < o2 and   # previous candle was bearish
        cl3 > o3 and   # current candle is bullish
        o3 <= cl2 and  # current open at or below prev close
        cl3 >= o2      # current close at or above prev open
    )
    patterns['Bullish Engulfing'] = bullish_engulfing

    # --- Bearish Engulfing ---
    bearish_engulfing = (
        cl2 > o2 and   # previous was bullish
        cl3 < o3 and   # current is bearish
        o3 >= cl2 and
        cl3 <= o2
    )
    patterns['Bearish Engulfing'] = bearish_engulfing

    # --- Doji (indecision) ---
    doji = body3 <= range3 * 0.1
    patterns['Doji'] = doji

    # --- Morning Star (3-candle bullish reversal) ---
    morning_star = (
        cl1 < o1 and                    # c1: big bearish
        abs(cl2 - o2) < (h2 - l2) * 0.3 and  # c2: small body (star)
        cl3 > o3 and cl3 > (o1 + cl1) / 2    # c3: bullish closing above c1's midpoint
    )
    patterns['Morning Star'] = morning_star

    # --- Evening Star (3-candle bearish reversal) ---
    evening_star = (
        cl1 > o1 and
        abs(cl2 - o2) < (h2 - l2) * 0.3 and
        cl3 < o3 and cl3 < (o1 + cl1) / 2
    )
    patterns['Evening Star'] = evening_star

    # Only return ones that are True
    return {k: v for k, v in patterns.items() if v}


# ---------------------------------------------------------------------------
# 4. HIGHER TIMEFRAME BIAS SCORING (Weekly / Daily)
# ---------------------------------------------------------------------------

def score_higher_tf(df: pd.DataFrame) -> dict:
    """
    Scores the market bias from a higher timeframe (weekly or daily) DataFrame.
    Returns:
        {
          'bias': 'Bullish' | 'Bearish' | 'Neutral',
          'score': int (0-100),
          'reasons': list[str]
        }
    """
    df = compute_indicators(df)
    if df.empty or len(df) < 5:
        return {'bias': 'Neutral', 'score': 50, 'reasons': ['Insufficient data']}

    latest = df.iloc[-1]
    score   = 50
    reasons = []

    close    = latest['Close']
    sma_20   = latest.get('SMA_20', np.nan)
    sma_50   = latest.get('SMA_50', np.nan)
    sma_200  = latest.get('SMA_200', np.nan)
    rsi      = latest.get('RSI', 50)
    macd     = latest.get('MACD', 0)
    macd_sig = latest.get('MACD_Signal', 0)

    # SMA structure
    if not np.isnan(sma_20) and close > sma_20:
        score += 8
        reasons.append('Price above SMA 20')
    else:
        score -= 8

    if not np.isnan(sma_50) and close > sma_50:
        score += 10
        reasons.append('Price above SMA 50 (mid-term uptrend)')
    elif not np.isnan(sma_50) and close < sma_50:
        score -= 10
        reasons.append('Price below SMA 50 (mid-term downtrend)')

    if not np.isnan(sma_200) and close > sma_200:
        score += 15
        reasons.append('Price above 200 SMA — long-term uptrend confirmed')
    elif not np.isnan(sma_200) and close < sma_200:
        score -= 15
        reasons.append('Price below 200 SMA — long-term downtrend')

    # Golden Cross / Death Cross (SMA 20 vs 50)
    if not np.isnan(sma_20) and not np.isnan(sma_50):
        if sma_20 > sma_50:
            score += 8
            reasons.append('SMA 20 > SMA 50 (Golden Cross context)')
        else:
            score -= 8
            reasons.append('SMA 20 < SMA 50 (Death Cross context)')

    # RSI
    if rsi > 55:
        score += 7
        reasons.append(f'RSI {rsi:.1f} — bullish momentum')
    elif rsi < 45:
        score -= 7
        reasons.append(f'RSI {rsi:.1f} — bearish momentum')
    else:
        reasons.append(f'RSI {rsi:.1f} — neutral zone')

    # MACD
    if not np.isnan(macd) and not np.isnan(macd_sig):
        if macd > macd_sig:
            score += 7
            reasons.append('MACD above Signal — bullish crossover')
        else:
            score -= 7
            reasons.append('MACD below Signal — bearish crossover')

    # Cap and classify
    score = max(0, min(100, score))
    if score >= 62:
        bias = 'Bullish'
    elif score <= 38:
        bias = 'Bearish'
    else:
        bias = 'Neutral'

    return {'bias': bias, 'score': score, 'reasons': reasons}


# ---------------------------------------------------------------------------
# 5. LOWER TIMEFRAME ENTRY SCORING (1h / 15m)
# ---------------------------------------------------------------------------

def score_lower_tf_entry(df: pd.DataFrame, higher_bias: str, sr_zones: dict) -> dict:
    """
    Finds precise entry signals on lower TF (1h or 15m) that align with the
    higher TF bias.

    Returns entry context dict:
        {
          'entry_signal': bool,
          'entry_price': float,
          'stop_loss': float,
          'take_profit': float,
          'rr_ratio': str,
          'patterns': dict,
          'reasons': list[str]
        }
    """
    df = compute_indicators(df)
    patterns = detect_candlestick_patterns(df)

    if df.empty or len(df) < 10:
        return {'entry_signal': False, 'reasons': ['Insufficient lower TF data']}

    latest   = df.iloc[-1]
    close    = latest['Close']
    atr      = latest.get('ATR', close * 0.01)  # fallback to 1%
    ema_9    = latest.get('EMA_9', close)
    ema_20   = latest.get('EMA_20', close)
    rsi      = latest.get('RSI', 50)
    macd     = latest.get('MACD', 0)
    macd_sig = latest.get('MACD_Signal', 0)
    support  = sr_zones.get('support', close * 0.97)
    resist   = sr_zones.get('resistance', close * 1.03)
    reasons  = []

    entry_signal = False
    entry_price  = close
    stop_loss    = None
    take_profit  = None

    if higher_bias == 'Bullish':
        # Look for LONG entry
        near_support  = abs(close - support) / close < 0.015  # within 1.5% of support
        ema_stack_ok  = close > ema_9 > ema_20 if not np.isnan(ema_9) and not np.isnan(ema_20) else False
        bullish_candle = any(k in patterns for k in ['Bullish Hammer', 'Bullish Engulfing', 'Morning Star'])
        macd_bullish  = not np.isnan(macd) and macd > macd_sig
        rsi_ok        = 35 < rsi < 70

        confluence_count = sum([near_support, ema_stack_ok, bullish_candle, macd_bullish, rsi_ok])
        if confluence_count >= 3:
            entry_signal = True
            entry_price  = close
            stop_loss    = support - (atr * 0.5)   # half ATR below support
            take_profit  = resist

            if bullish_candle:
                reasons.append(f"Bullish pattern at support: {list(patterns.keys())}")
            if near_support:
                reasons.append(f"Price near key support ₹{support:.2f}")
            if ema_stack_ok:
                reasons.append("EMA 9 > EMA 20 — bullish EMA stack")
            if macd_bullish:
                reasons.append("MACD above Signal — lower TF bullish crossover")

    elif higher_bias == 'Bearish':
        # Look for SHORT entry
        near_resistance = abs(close - resist) / close < 0.015
        ema_stack_ok    = close < ema_9 < ema_20 if not np.isnan(ema_9) and not np.isnan(ema_20) else False
        bearish_candle  = any(k in patterns for k in ['Shooting Star', 'Bearish Engulfing', 'Evening Star'])
        macd_bearish    = not np.isnan(macd) and macd < macd_sig
        rsi_ok          = 30 < rsi < 65

        confluence_count = sum([near_resistance, ema_stack_ok, bearish_candle, macd_bearish, rsi_ok])
        if confluence_count >= 3:
            entry_signal = True
            entry_price  = close
            stop_loss    = resist + (atr * 0.5)   # half ATR above resistance
            take_profit  = support

            if bearish_candle:
                reasons.append(f"Bearish pattern at resistance: {list(patterns.keys())}")
            if near_resistance:
                reasons.append(f"Price near key resistance ₹{resist:.2f}")
            if ema_stack_ok:
                reasons.append("EMA 9 < EMA 20 — bearish EMA stack")
            if macd_bearish:
                reasons.append("MACD below Signal — lower TF bearish crossover")

    # Calculate R:R and enforce minimum 1:2
    rr_ratio   = "N/A"
    rr_ok      = False

    if entry_signal and stop_loss is not None and take_profit is not None:
        risk   = abs(entry_price - stop_loss)
        reward = abs(take_profit - entry_price)
        if risk > 0:
            rr_value = reward / risk
            rr_ratio = f"1:{rr_value:.1f}"
            rr_ok    = rr_value >= 2.0
            if not rr_ok:
                reasons.append(f"R:R {rr_ratio} below minimum 1:2 threshold — trade SKIPPED")
                entry_signal = False  # Disqualify
        else:
            entry_signal = False

    return {
        'entry_signal': entry_signal and rr_ok,
        'entry_price':  round(entry_price, 2)  if entry_price  else None,
        'stop_loss':    round(stop_loss,   2)  if stop_loss    else None,
        'take_profit':  round(take_profit, 2)  if take_profit  else None,
        'rr_ratio':     rr_ratio,
        'patterns':     patterns,
        'reasons':      reasons,
        'higher_bias':  higher_bias,
        'rvol':         round(latest.get('RVol', 1.0), 2)
    }


# ---------------------------------------------------------------------------
# 6. MULTI-TIMEFRAME TRIFECTA (1h -> 15m -> 5m)
# ---------------------------------------------------------------------------

def check_timeframe_confluence(df_1h: pd.DataFrame, df_15m: pd.DataFrame, df_5m: pd.DataFrame, side: str) -> dict:
    """
    Checks for price action alignment across 1h, 15m, and 5m.
    Requires at least 2 out of 3 to be aligned with the trade side.
    """
    confluence = {"1h": False, "15m": False, "5m": False, "score": 0}
    
    def is_aligned(df, side):
        if len(df) < 20: return False
        df = compute_indicators(df)
        last = df.iloc[-1]
        c = last['Close']
        e9 = last.get('EMA_9', c)
        e20 = last.get('EMA_20', c)
        if side == 'Long':
            return c > e9 and e9 > e20
        else:
            return c < e9 and e9 < e20

    confluence["1h"] = is_aligned(df_1h, side)
    confluence["15m"] = is_aligned(df_15m, side)
    confluence["5m"] = is_aligned(df_5m, side)
    
    confluence["score"] = sum([confluence["1h"], confluence["15m"], confluence["5m"]])
    return confluence


# ---------------------------------------------------------------------------
# 6. R:R CALCULATION UTILITY
# ---------------------------------------------------------------------------

def calculate_rr(entry: float, take_profit: float, stop_loss: float,
                 min_rr: float = 2.0) -> dict:
    """
    Calculates the Risk/Reward ratio and enforces the minimum threshold.

    Returns:
        {'ratio': float, 'ratio_str': str, 'valid': bool}
    """
    risk   = abs(entry - stop_loss)
    reward = abs(take_profit - entry)
    if risk == 0:
        return {'ratio': 0, 'ratio_str': 'N/A', 'valid': False}
    ratio = reward / risk
    return {
        'ratio':     round(ratio, 2),
        'ratio_str': f"1:{ratio:.1f}",
        'valid':     ratio >= min_rr
    }


# ---------------------------------------------------------------------------
# 7. HIGHER TF SUMMARY STRING (for AI prompt context)
# ---------------------------------------------------------------------------

def build_higher_tf_context(ticker: str, weekly_result: dict, daily_result: dict, sr_zones: dict) -> str:
    """Formats higher TF results into a readable string for the Gemini prompt."""
    ctx  = f"\n=== MULTI-TIMEFRAME ANALYSIS: {ticker} ===\n"
    ctx += f"[WEEKLY BIAS] {weekly_result.get('bias', 'N/A')} (Score: {weekly_result.get('score', 'N/A')}/100)\n"
    for r in weekly_result.get('reasons', []):
        ctx += f"  • {r}\n"
    ctx += f"[DAILY BIAS]  {daily_result.get('bias', 'N/A')} (Score: {daily_result.get('score', 'N/A')}/100)\n"
    for r in daily_result.get('reasons', []):
        ctx += f"  • {r}\n"
    ctx += f"[KEY S/R LEVELS]\n"
    ctx += f"  • Nearest Support:    ₹{sr_zones.get('support', 'N/A')}\n"
    ctx += f"  • Nearest Resistance: ₹{sr_zones.get('resistance', 'N/A')}\n"
    return ctx
