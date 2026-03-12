import React from 'react';
import { Target, ShieldAlert, Flag, TrendingUp, TrendingDown, Award } from 'lucide-react';

export interface TradeIdea {
    id: string;
    ticker: string;
    companyName: string;
    type: 'Long' | 'Short';
    entryPrice: number;
    targetPrice: number;
    stopLoss: number;
    conviction: 'High' | 'Medium' | 'Low';
    rationale: string;
    timestamp: string;
}

export const TradeIdeaCard: React.FC<{ idea: TradeIdea; onClick: () => void; isSelected: boolean }> = ({ idea, onClick, isSelected }) => {
    const isLong = idea.type === 'Long';
    const colorClass = isLong ? 'text-bullish' : 'text-bearish';
    const Icon = isLong ? TrendingUp : TrendingDown;

    const reward = Math.abs(idea.targetPrice - idea.entryPrice);
    const risk = Math.abs(idea.entryPrice - idea.stopLoss);
    const rrRatio = (reward / risk).toFixed(2);

    return (
        <div
            className="glass-panel"
            onClick={onClick}
            style={{
                padding: '1.5rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                border: isSelected ? '1px solid var(--accent-blue)' : 'var(--glass-border)',
                transform: isSelected ? 'translateY(-2px)' : 'none',
                boxShadow: isSelected ? 'var(--shadow-glow)' : 'var(--shadow-md)',
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{idea.ticker}</h3>
                        <span style={{ fontSize: '0.75rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }}>
                            {idea.type}
                        </span>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{idea.companyName}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }} className={colorClass}>
                    <Icon size={20} className={colorClass} />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.25rem', padding: '1rem', background: 'var(--bg-base)', borderRadius: 'var(--radius-sm)' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                        <Flag size={12} /> Entry
                    </div>
                    <p style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '1.1rem' }}>₹{idea.entryPrice.toFixed(2)}</p>
                </div>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                        <Target size={12} /> Target
                    </div>
                    <p style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '1.1rem', color: 'var(--bullish)' }}>₹{idea.targetPrice.toFixed(2)}</p>
                </div>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                        <ShieldAlert size={12} /> Stop
                    </div>
                    <p style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '1.1rem', color: 'var(--bearish)' }}>₹{idea.stopLoss.toFixed(2)}</p>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Award size={16} color="var(--accent-blue)" />
                    <span style={{ color: 'var(--text-secondary)' }}>Conviction: <strong style={{ color: 'var(--text-primary)' }}>{idea.conviction}</strong></span>
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>
                    R:R <strong>1:{rrRatio}</strong>
                </div>
            </div>
        </div>
    );
};
