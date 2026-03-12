import React, { useState } from 'react';
import { Search, Filter, TrendingUp } from 'lucide-react';

interface ScreenerResult {
    id: string;
    ticker: string;
    name: string;
    sector: string;
    marketCap: string;
    score: number;
    catalyst: string;
    change: string;
}

export const ResearchMode: React.FC = () => {
    const [marketCap, setMarketCap] = useState('All');
    const [prompt, setPrompt] = useState('');
    const [results, setResults] = useState<ScreenerResult[]>([]);
    const [isScanning, setIsScanning] = useState(false);

    const handleScreener = async () => {
        setIsScanning(true);
        try {
            const response = await fetch('http://localhost:8000/api/screener', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt, marketCap }),
            });
            if (!response.ok) throw new Error('Failed to fetch screener results');
            const data = await response.json();
            setResults(data);
        } catch (error) {
            console.error('Error fetching screener:', error);
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <header>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', fontWeight: 700, letterSpacing: '-1px' }}>Research Mode</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Discover multi-baggers and fundamental analysis across different market caps.</p>
            </header>

            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>AI Scanner Prompt</label>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g. Find small-cap tech stocks with increasing cash flow and breakout volume..."
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem 0.75rem 2.5rem',
                                background: 'rgba(0, 0, 0, 0.2)',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: 'var(--radius-sm)',
                                color: 'var(--text-primary)',
                                outline: 'none',
                                fontFamily: 'var(--font-sans)',
                            }}
                        />
                    </div>
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Market Cap</label>
                    <select
                        value={marketCap}
                        onChange={(e) => setMarketCap(e.target.value)}
                        style={{
                            padding: '0.75rem 1rem',
                            background: 'rgba(0, 0, 0, 0.2)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-sm)',
                            color: 'var(--text-primary)',
                            outline: 'none',
                            cursor: 'pointer',
                            minWidth: '150px'
                        }}
                    >
                        <option value="All">All Caps</option>
                        <option value="Large">Large Cap</option>
                        <option value="Mid">Mid Cap</option>
                        <option value="Small">Small Cap</option>
                        <option value="Micro">Micro Cap</option>
                    </select>
                </div>

                <button
                    className="btn btn-primary"
                    onClick={handleScreener}
                    disabled={isScanning}
                    style={{ padding: '0.75rem 1.5rem', height: '42px', opacity: isScanning ? 0.7 : 1 }}
                >
                    {isScanning ? 'Running...' : 'Run Screener'}
                </button>
            </div>

            <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Filter size={20} color="var(--accent-blue)" /> Screener Results
                </h2>

                <div className="glass-panel" style={{ overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: 'rgba(0, 0, 0, 0.2)', borderBottom: '1px solid var(--border-subtle)' }}>
                                <th style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>Ticker</th>
                                <th style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>Sector</th>
                                <th style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>Market Cap</th>
                                <th style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>AI Score</th>
                                <th style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>Daily Change</th>
                                <th style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>Key Catalyst</th>
                                <th style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.map((item, index) => (
                                <tr key={item.id} style={{ borderBottom: index < results.length - 1 ? '1px solid var(--border-subtle)' : 'none', transition: 'background 0.2s', cursor: 'pointer' }} className="hover:bg-[rgba(255,255,255,0.02)]">
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: 600 }}>{item.ticker}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.name}</div>
                                    </td>
                                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{item.sector}</td>
                                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{item.marketCap}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', background: 'rgba(50, 130, 184, 0.1)', color: 'var(--accent-blue)', borderRadius: '4px', fontWeight: 600, fontSize: '0.875rem' }}>
                                            <TrendingUp size={14} /> {item.score}/100
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem', color: 'var(--bullish)', fontWeight: 500 }}>{item.change}</td>
                                    <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{item.catalyst}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <button className="btn btn-glass" style={{ padding: '0.5rem 1rem' }}>Analyze</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {results.length === 0 && !isScanning && (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            No results found. Adjust your screener prompt or click Run Screener.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
