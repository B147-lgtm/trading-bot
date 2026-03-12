import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, CandlestickSeries } from 'lightweight-charts';
import type { IChartApi, UTCTimestamp } from 'lightweight-charts';
import { API_BASE } from '../config';

export interface ChartDataPoint {
    time: string | UTCTimestamp;
    open: number;
    high: number;
    low: number;
    close: number;
}

interface ChartWidgetProps {
    ticker: string;
    interval?: string;
}

export const ChartWidget: React.FC<ChartWidgetProps> = ({
    ticker,
    interval = '1D'
}) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        const fetchChartData = async () => {
            if (!ticker) return;
            setIsLoading(true);
            setErrorMsg(null); // Clear previous errors
            try {
                // Map frontend interval to backend yfinance interval
                const backendInterval = interval === '15' ? '15m' : '1d';
                const period = interval === '15' ? '5d' : '6mo';

                const response = await fetch(`${API_BASE}/api/chart/${ticker}?interval=${backendInterval}&period=${period}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setChartData(data);
            } catch (error: any) {
                console.error("Error fetching chart data:", error);
                setErrorMsg(error.message || "Failed to fetch chart data.");
                setChartData([]); // Clear data on error
            } finally {
                setIsLoading(false);
            }
        };
        fetchChartData();
    }, [ticker, interval]);

    useEffect(() => {
        if (!chartContainerRef.current) return;

        let chart: IChartApi | null = null;
        try {
            // Create chart
            chart = createChart(chartContainerRef.current, {
                layout: {
                    background: { type: ColorType.Solid, color: 'transparent' },
                    textColor: 'rgba(255, 255, 255, 0.6)',
                },
                grid: {
                    vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
                    horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
                },
                width: chartContainerRef.current.clientWidth,
                height: 400,
                crosshair: {
                    mode: 1, // Normal mode
                },
                rightPriceScale: {
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                },
                timeScale: {
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                },
            });

            // Add candlestick series
            const series = chart.addSeries(CandlestickSeries, {
                upColor: '#26a69a',
                downColor: '#ef5350',
                borderVisible: false,
                wickUpColor: '#26a69a',
                wickDownColor: '#ef5350',
            });

            if (chartData.length > 0) {
                series.setData(chartData);
            }

            chart.timeScale().fitContent();

            chartRef.current = chart;
        } catch (err: any) {
            console.error("ChartInitError:", err);
            setErrorMsg(err.message || String(err));
        }

        // Handle resize
        const handleResize = () => {
            if (chartContainerRef.current && chartRef.current) {
                chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (chart) chart.remove();
        };
    }, [chartData]);

    return (
        <div className="card glass" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {ticker} Chart
                        {isLoading && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(Loading live data...)</span>}
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{interval === '15' ? '15-Minute' : 'Daily'} Analysis</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {['1D', '1W', '1M'].map((tf) => (
                        <button
                            key={tf}
                            className="btn btn-secondary"
                            // onClick={() => setTimeframe(tf)} // In a real app, this would refetch data with new interval
                            style={{
                                padding: '0.25rem 0.75rem',
                                fontSize: '0.875rem',
                                // background: tf === timeframe ? 'rgba(255,255,255,0.1)' : 'transparent',
                                // color: tf === timeframe ? 'var(--text-primary)' : 'var(--text-muted)'
                            }}
                        >
                            {tf}
                        </button>
                    ))}
                </div>
            </div>
            {errorMsg ? (
                <div style={{ width: '100%', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'red', padding: '2rem', textAlign: 'center', border: '1px dashed red' }}>
                    Chart Error: {errorMsg}
                </div>
            ) : (
                <div ref={chartContainerRef} style={{ width: '100%', height: '400px' }} />
            )}
        </div>
    );
};
