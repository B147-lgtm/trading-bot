import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export const Layout: React.FC = () => {
    return (
        <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', overflow: 'hidden' }}>
            <Sidebar />
            <main style={{ flex: 1, padding: '2rem', overflowY: 'auto', position: 'relative' }}>
                {/* Subtle background glow effect */}
                <div style={{
                    position: 'fixed',
                    top: '-20%',
                    right: '-10%',
                    width: '60vw',
                    height: '60vw',
                    background: 'radial-gradient(circle, var(--accent-blue-glow) 0%, rgba(10, 10, 12, 0) 70%)',
                    zIndex: -1,
                    pointerEvents: 'none',
                    opacity: 0.5
                }} />
                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
