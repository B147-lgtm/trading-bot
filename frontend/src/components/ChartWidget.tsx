import React, { useEffect, useRef } from 'react';

interface ChartWidgetProps {
    ticker: string;
    interval?: string;
}

declare global {
    interface Window {
        TradingView: any;
    }
}

export const ChartWidget: React.FC<ChartWidgetProps> = ({
    ticker,
    interval = 'D'
}) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const scriptId = 'tradingview-widget-script';
        let script = document.getElementById(scriptId) as HTMLScriptElement;

        const createWidget = () => {
            if (containerRef.current && window.TradingView) {
                // Clear previous widget if any
                containerRef.current.innerHTML = '';

                // Robust Ticker normalization for TradingView
                let tvSymbol = ticker;
                if (ticker === '^NSEI') tvSymbol = 'NSE:NIFTY';
                else if (ticker === '^NSEBANK') tvSymbol = 'NSE:BANKNIFTY';
                else if (ticker === '^INDIAVIX') tvSymbol = 'NSE:INDIAVIX';
                else if (ticker === 'NSE:GIFTNIFTY' || ticker === 'GIFTNIFTY') tvSymbol = 'NSE:GIFTNIFTY';
                else if (ticker.includes(':')) {
                    tvSymbol = ticker;
                } else if (ticker.endsWith('.NS')) {
                    tvSymbol = `NSE:${ticker.replace('.NS', '')}`;
                } else if (ticker.endsWith('.BO')) {
                    tvSymbol = `BSE:${ticker.replace('.BO', '')}`;
                } else {
                    tvSymbol = `NSE:${ticker}`;
                }
                
                new window.TradingView.widget({
                    "autosize": true,
                    "symbol": tvSymbol,
                    "interval": interval === '15' ? '15' : 'D',
                    "timezone": "Asia/Kolkata",
                    "theme": "dark",
                    "style": "1",
                    "locale": "en",
                    "toolbar_bg": "#f1f3f6",
                    "enable_publishing": false,
                    "hide_top_toolbar": false,
                    "hide_legend": false,
                    "save_image": false,
                    "container_id": containerRef.current.id,
                    "backgroundColor": "#000000",
                    "gridColor": "rgba(255, 255, 255, 0.05)",
                    "allow_symbol_change": true,
                    "details": true,
                    "hotlist": true,
                    "calendar": true,
                    "show_popup_button": true,
                    "popup_width": "1000",
                    "popup_height": "650"
                });
            }
        };

        if (!script) {
            script = document.createElement('script');
            script.id = scriptId;
            script.src = 'https://s3.tradingview.com/tv.js';
            script.async = true;
            script.onload = createWidget;
            document.head.appendChild(script);
        } else {
            createWidget();
        }
    }, [ticker, interval]);

    return (
        <div className="card glass" style={{ height: '600px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div id={`tv-chart-${ticker.replace(/\W/g, '')}`} ref={containerRef} style={{ flex: 1, width: '100%' }} />
        </div>
    );
};
