import React from 'react';

export type TradingMode = 'intraday' | 'swing' | 'positional' | 'short-term' | 'long-term';

interface TradingModeSelectorProps {
    currentMode: TradingMode;
    onModeChange: (mode: TradingMode) => void;
}

export const TradingModeSelector: React.FC<TradingModeSelectorProps> = ({ currentMode, onModeChange }) => {
    const modes: { value: TradingMode; label: string; desc: string }[] = [
        { value: 'intraday', label: 'Intraday', desc: 'Same day trades' },
        { value: 'short-term', label: 'Short Term', desc: '1-3 days horizon' },
        { value: 'swing', label: 'Swing', desc: '3 days to 2 weeks' },
        { value: 'positional', label: 'Positional', desc: '2 weeks to 3 months' },
        { value: 'long-term', label: 'Long Term', desc: '3+ months horizon' },
    ];

    return (
        <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
            {modes.map((mode) => (
                <button
                    key={mode.value}
                    onClick={() => onModeChange(mode.value)}
                    className={`glass-panel ${currentMode === mode.value ? 'active' : ''}`}
                    style={{
                        flex: '0 0 auto',
                        minWidth: '150px',
                        padding: '1rem',
                        textAlign: 'left',
                        border: currentMode === mode.value ? '1px solid var(--accent-blue)' : 'var(--glass-border)',
                        background: currentMode === mode.value ? 'rgba(50, 130, 184, 0.1)' : 'var(--bg-surface)',
                        boxShadow: currentMode === mode.value ? 'var(--shadow-glow)' : 'var(--shadow-sm)',
                        cursor: 'pointer',
                        transition: 'all var(--transition-normal)'
                    }}
                >
                    <div style={{
                        fontWeight: 600,
                        color: currentMode === mode.value ? 'var(--text-primary)' : 'var(--text-secondary)',
                        marginBottom: '0.25rem'
                    }}>
                        {mode.label}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {mode.desc}
                    </div>
                </button>
            ))}
        </div>
    );
};
