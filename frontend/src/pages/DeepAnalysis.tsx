import React, { useState } from 'react';
import { Search, Activity, Target, ShieldAlert, Flag, TrendingUp, BarChart2, RefreshCw } from 'lucide-react';
import { ChartWidget } from '../components/ChartWidget';
import { API_BASE } from '../config';

interface DeepAnalysisResult {
    ticker: string;
    companyName: string;
    currentPrice: number;
    verdict: string;
    entryPrice: number;
    targetPrice: number;
    stopLoss: number;
    riskReward: string;
    conviction: string;
    technicalAnalysis: string;
    fundamentalAnalysis: string;
    dcfValuation: string;
    concallAnalysis: string;
    executiveSummary: string;
}

export const DeepAnalysis: React.FC = () => {
    const [ticker, setTicker] = useState('RELIANCE.NS');
    const [result, setResult] = useState<DeepAnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAnalyze = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ticker) return;

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_BASE}/api/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticker: ticker.toUpperCase() })
            });

            if (!response.ok) {
                throw new Error('Failed to fetch analysis');
            }

            const data = await response.json();
            setResult(data);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Error running deep analysis.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', height: '100%', paddingBottom: '2rem' }}>
            <header>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', fontWeight: 700, letterSpacing: '-1px' }}>Deep Analysis <span style={{ color: 'var(--accent-purple)' }}>AI Agent</span></h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Query specific NSE/BSE stocks for a comprehensive report incorporating fundamental health, technical setups, and strict risk management.</p>
            </header>

            <div className="card glass" style={{ padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <form onSubmit={handleAnalyze} style={{ display: 'flex', gap: '1rem', flex: 1 }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <Search size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Enter Indian Ticker (e.g. RELIANCE.NS, TCS.NS)"
                            value={ticker}
                            onChange={(e) => setTicker(e.target.value)}
                            style={{ width: '100%', paddingLeft: '3rem', fontSize: '1.1rem' }}
                        />
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isLoading || !ticker}
                        style={{ padding: '0 2rem', fontWeight: 600 }}
                    >
                        {isLoading ? <RefreshCw className="animate-spin" size={20} /> : <Activity size={20} />}
                        Analyze Stock
                    </button>
                </form>
            </div>

            {error && (
                <div style={{ padding: '1rem', backgroundColor: 'rgba(239, 83, 80, 0.1)', color: 'var(--bearish)', borderRadius: '8px', border: '1px solid rgba(239, 83, 80, 0.2)' }}>
                    {error}
                </div>
            )}

            {result ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem', flex: 1 }}>
                    {/* Left Column: Chart and Report */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div style={{ height: '400px' }}>
                            <ChartWidget ticker={result.ticker} interval="1D" />
                        </div>

                        <div className="card glass" style={{ padding: '2rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
                                Executive Summary
                            </h2>
                            <p style={{ fontSize: '1.1rem', lineHeight: 1.6, color: 'var(--text-primary)', marginBottom: '2rem' }}>{result.executiveSummary}</p>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <TrendingUp size={18} /> Technical Breakdown
                                    </h3>
                                    <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{result.technicalAnalysis}</p>
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Activity size={18} /> Fundamental Breakdown
                                    </h3>
                                    <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{result.fundamentalAnalysis}</p>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border-subtle)' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--bullish)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Target size={18} /> DCF Fair Value Model
                                    </h3>
                                    <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{result.dcfValuation}</p>
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--bearish)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Flag size={18} /> Recent Concall / News Sentiment
                                    </h3>
                                    <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{result.concallAnalysis}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Trading Plan */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="card glass" style={{ padding: '1.5rem' }}>
                            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '0.5rem' }}>AI Verdict</div>
                                <div style={{
                                    fontSize: '2rem',
                                    fontWeight: 800,
                                    color: result.verdict === 'Long' ? 'var(--bullish)' : result.verdict === 'Short' ? 'var(--bearish)' : 'var(--text-primary)'
                                }}>
                                    {result.verdict}
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}><Flag size={16} /> Entry Price</div>
                                    <div style={{ fontWeight: 600 }}>₹{result.entryPrice}</div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'rgba(38, 166, 154, 0.1)', border: '1px solid rgba(38,166,154,0.2)', borderRadius: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--bullish)' }}><Target size={16} /> Take Profit</div>
                                    <div style={{ fontWeight: 600, color: 'var(--bullish)' }}>₹{result.targetPrice}</div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'rgba(239, 83, 80, 0.1)', border: '1px solid rgba(239,83,80,0.2)', borderRadius: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--bearish)' }}><ShieldAlert size={16} /> Stop Loss</div>
                                    <div style={{ fontWeight: 600, color: 'var(--bearish)' }}>₹{result.stopLoss}</div>
                                </div>
                            </div>

                            <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Risk/Reward</div>
                                    <div style={{ fontWeight: 700 }}>{result.riskReward}</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Conviction</div>
                                    <div style={{ fontWeight: 700, color: result.conviction === 'High' ? 'var(--bullish)' : 'inherit' }}>{result.conviction}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : !isLoading && (
                <div style={{ padding: '6rem 2rem', textAlign: 'center', border: '1px dashed var(--border-subtle)', borderRadius: '12px', background: 'rgba(255,255,255,0.01)', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <BarChart2 size={48} style={{ margin: '0 auto 1rem', color: 'var(--text-muted)', opacity: 0.5 }} />
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Ready for Deep Analysis</h3>
                    <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto' }}>Enter a NSE/BSE ticker above. The AI will cross-reference its trading rulebook against live technicals and fundamentals to build a strictly typed trading plan.</p>
                </div>
            )}
        </div>
    );
};
