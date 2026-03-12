# TradeAgent AI — Indian Market Trading Terminal

A full-stack AI-powered trading platform for NSE/BSE with 24×7 market monitoring.

## Architecture
- **Frontend**: Vite + React + TypeScript (see `frontend/`)
- **Backend**: FastAPI + Python with APScheduler (see `backend/`)

## Backend Features
- Multi-timeframe technical analysis (Weekly → Daily → 15m/1h)
- Sector ranking & stock screening via NSE ETF proxies
- 24×7 background agent: RSI extremes, S/R breakouts, volume spikes, news alerts
- Deep stock analysis with DCF valuation & concall sentiment
- Gemini 1.5 Flash AI narration

## Running Locally
```bash
# Backend
cd backend && pip install -r requirements.txt
cp .env.example .env  # Add your GEMINI_API_KEY
python app.py

# Frontend
cd frontend && npm install && npm run dev
```

## Environment Variables
| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Google Gemini API key |

## Deploy (Railway)
The `backend/Procfile` is configured for Railway auto-deploy.
Set `GEMINI_API_KEY` in the Railway environment variables panel.
