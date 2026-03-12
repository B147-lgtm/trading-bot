// Central API configuration
// Change this one URL to switch between local dev and production
const isDev = import.meta.env.DEV;

export const API_BASE = isDev
    ? 'http://localhost:8000'
    : 'https://trading-bot-production-d6f7.up.railway.app';
