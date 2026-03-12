import React from 'react';
import { ArrowUpRight, ArrowDownRight, Newspaper, Calendar as CalendarIcon, Activity } from 'lucide-react';

// --- Types ---
export interface MarketPulse {
    fii: number;
    dii: number;
    date?: string;
    sectors: { name: string; change: number }[];
}

export interface NewsItem {
    id: string;
    headline: string;
    source: string;
    time: string;
}

export interface EventItem {
    id: string;
    type: string;
    title: string;
    date: string;
    impact: string;
}

// --- FII / DII Widget ---
export const FiiDiiWidget: React.FC<{ data: MarketPulse | null }> = ({ data }) => {
    if (!data) return <div className="card glass skeleton" style={{ height: '100px' }}></div>;

    const renderValue = (val: number) => {
        const isPositive = val >= 0;
        const color = isPositive ? 'var(--bullish)' : 'var(--bearish)';
        const Icon = isPositive ? ArrowUpRight : ArrowDownRight;
        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color, fontWeight: 700, fontSize: '1.25rem' }}>
                <Icon size={20} />
                ₹{Math.abs(val).toLocaleString()} Cr
            </div>
        );
    };

    return (
        <div className="card glass animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 2rem' }}>
            <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Institutional Flow</h3>
                    {data.date && <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.1)', fontSize: '0.7rem' }}>{data.date}</span>}
                </div>
                <div style={{ display: 'flex', gap: '3rem' }}>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>FII Net</div>
                        {renderValue(data.fii)}
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>DII Net</div>
                        {renderValue(data.dii)}
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- Sector Heatmap Widget ---
export const SectorWidget: React.FC<{ data: MarketPulse['sectors'] | null }> = ({ data }) => {
    if (!data) return <div className="card glass skeleton" style={{ height: '150px' }}></div>;

    return (
        <div className="card glass animate-fade-in" style={{ padding: '1.5rem', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
                <Activity size={18} style={{ color: 'var(--accent-blue)' }} />
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Sector Momentum</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                {data.map((sector, idx) => {
                    const isPositive = sector.change >= 0;
                    const bgOpacity = Math.min(Math.abs(sector.change) * 0.15, 0.4);
                    const bgColor = isPositive ? `rgba(38, 166, 154, ${bgOpacity})` : `rgba(239, 83, 80, ${bgOpacity})`;
                    const color = isPositive ? 'var(--bullish)' : 'var(--bearish)';

                    return (
                        <div key={idx} style={{ background: bgColor, borderRadius: '8px', padding: '0.75rem', border: `1px solid ${isPositive ? 'rgba(38, 166, 154, 0.2)' : 'rgba(239, 83, 80, 0.2)'}` }}>
                            <div style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>{sector.name}</div>
                            <div style={{ color, fontWeight: 700, fontSize: '1.125rem' }}>{isPositive ? '+' : ''}{sector.change}%</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// --- 24h News Ticker Widget ---
export const NewsWidget: React.FC<{ news: NewsItem[] }> = ({ news }) => {
    return (
        <div className="card glass animate-fade-in" style={{ padding: '1.5rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
                <Newspaper size={18} style={{ color: 'var(--accent-purple)' }} />
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Live Market News</h3>
                <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--bearish)' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--bearish)', animation: 'pulse 2s infinite' }}></span> LIVE
                </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', flex: 1, paddingRight: '0.5rem' }}>
                {news.length === 0 ? <div className="skeleton" style={{ height: '300px' }}></div> : news.map((item) => (
                    <div key={item.id} className="hover:bg-[rgba(255,255,255,0.03)] cursor-pointer" style={{ padding: '0.75rem', borderRadius: '8px', borderLeft: '2px solid var(--accent-purple)', background: 'rgba(255,255,255,0.01)' }}>
                        <p style={{ fontSize: '0.9rem', fontWeight: 500, lineHeight: 1.4, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{item.headline}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            <span>{item.source}</span>
                            <span>{item.time}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// --- Events Calendar Widget ---
export const EventsWidget: React.FC<{ events: EventItem[] }> = ({ events }) => {
    return (
        <div className="card glass animate-fade-in" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
                <CalendarIcon size={18} style={{ color: 'var(--bullish)' }} />
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Upcoming Volatility Events</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {events.length === 0 ? <div className="skeleton" style={{ height: '200px' }}></div> : events.map((event) => (
                    <div key={event.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{event.title}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{event.date}</div>
                        </div>
                        <div style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            backgroundColor: event.impact === 'High' ? 'rgba(239, 83, 80, 0.1)' : 'rgba(50, 130, 184, 0.1)',
                            color: event.impact === 'High' ? 'var(--bearish)' : 'var(--accent-blue)'
                        }}>
                            {event.impact} Impact
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// --- Live Agent Alerts Widget ---
export interface AlertItem {
    id: string;
    type: string;
    ticker: string;
    message: string;
    severity: 'info' | 'warning' | 'critical';
    timestamp: string;
}

export const AlertsWidget: React.FC<{ alerts: AlertItem[] }> = ({ alerts }) => {
    const severityColor = (s: string) => {
        if (s === 'critical') return { bg: 'rgba(239,83,80,0.1)', border: 'rgba(239,83,80,0.35)', dot: '#ef5350' };
        if (s === 'warning')  return { bg: 'rgba(255,200,0,0.08)', border: 'rgba(255,200,0,0.3)',  dot: '#ffca28' };
        return                       { bg: 'rgba(50,130,184,0.07)', border: 'rgba(50,130,184,0.25)', dot: '#4fc3f7' };
    };

    return (
        <div className="card glass animate-fade-in" style={{ padding: '1.5rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
                <span style={{ fontSize: '1rem' }}>🤖</span>
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Live Agent Alerts</h3>
                <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', color: '#4fc3f7', fontWeight: 600, letterSpacing: '0.05em' }}>
                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#4fc3f7', display: 'inline-block', animation: 'pulse 2s infinite' }}></span>
                    24×7 ACTIVE
                </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', overflowY: 'auto', flex: 1 }}>
                {alerts.length === 0
                    ? <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '2rem' }}>Agent is monitoring — no alerts yet.</div>
                    : alerts.map((alert) => {
                        const c = severityColor(alert.severity);
                        return (
                            <div key={alert.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', padding: '0.7rem 0.85rem', borderRadius: '8px', background: c.bg, border: `1px solid ${c.border}` }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: c.dot, marginTop: '5px', flexShrink: 0 }}></span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.15rem' }}>
                                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: c.dot, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{alert.type} · {alert.ticker}</span>
                                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{alert.timestamp}</span>
                                    </div>
                                    <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>{alert.message}</div>
                                </div>
                            </div>
                        );
                    })
                }
            </div>
        </div>
    );
}
