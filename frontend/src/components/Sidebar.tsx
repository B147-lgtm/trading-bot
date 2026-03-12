import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, LineChart, Search, Settings, CandlestickChart } from 'lucide-react';

export const Sidebar: React.FC = () => {
  return (
    <aside className="glass-panel" style={{ width: '250px', height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 0, borderTop: 'none', borderBottom: 'none', borderLeft: 'none' }}>
      <div style={{ padding: '2rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CandlestickChart size={28} />
        </div>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 600, letterSpacing: '-0.5px' }}>
          TradeAgent <span style={{ color: 'var(--accent-blue)' }}>AI</span>
        </h1>
      </div>

      <nav style={{ flex: 1, padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, padding: '0 0.5rem', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>
          Main Menu
        </p>

        <NavLink
          to="/"
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
            background: isActive ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
            boxShadow: isActive ? 'inset 3px 0 0 var(--accent-blue)' : 'none',
            fontWeight: isActive ? 500 : 400,
          })}
        >
          <LayoutDashboard size={18} />
          Terminal
        </NavLink>

        <NavLink
          to="/deep-analysis"
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
            background: isActive ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
            boxShadow: isActive ? 'inset 3px 0 0 var(--accent-blue)' : 'none',
            fontWeight: isActive ? 500 : 400,
          })}
        >
          <CandlestickChart size={18} />
          Deep Analysis
        </NavLink>

        <NavLink
          to="/research"
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
            background: isActive ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
            boxShadow: isActive ? 'inset 3px 0 0 var(--accent-blue)' : 'none',
            fontWeight: isActive ? 500 : 400,
          })}
        >
          <Search size={18} />
          Research Mode
        </NavLink>

        <NavLink
          to="/portfolio"
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
            background: isActive ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
            boxShadow: isActive ? 'inset 3px 0 0 var(--accent-blue)' : 'none',
            fontWeight: isActive ? 500 : 400,
          })}
        >
          <LineChart size={18} />
          Portfolio
        </NavLink>
      </nav>

      <div style={{ padding: '1.5rem 1rem', borderTop: '1px solid var(--border-subtle)' }}>
        <button style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.75rem 1rem',
          width: '100%',
          background: 'transparent',
          border: 'none',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          borderRadius: 'var(--radius-md)',
          textAlign: 'left'
        }}>
          <Settings size={18} />
          Settings
        </button>
      </div>
    </aside>
  );
};
