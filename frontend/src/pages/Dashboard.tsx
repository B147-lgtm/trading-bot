import React, { useState } from 'react';
import { TradingModeSelector } from '../components/TradingModeSelector';
import type { TradingMode } from '../components/TradingModeSelector';
import { TradeIdeaCard } from '../components/TradeIdeaCard';
import type { TradeIdea } from '../components/TradeIdeaCard';
import { ChartWidget } from '../components/ChartWidget';
import { Bot, RefreshCw, Terminal, Crosshair } from 'lucide-react';
import { FiiDiiWidget, SectorWidget, NewsWidget, EventsWidget, AlertsWidget, IndicesWidget } from '../components/DashboardWidgets';
import type { MarketPulse, NewsItem, EventItem, AlertItem } from '../components/DashboardWidgets';
import { API_BASE } from '../config';


// Fetching from backend now

export const Dashboard: React.FC = () => {
    const [mode, setMode] = useState<TradingMode>('intraday');
    const [selectedIdeaId, setSelectedIdeaId] = useState<string>('');
    const [selectedTicker, setSelectedTicker] = useState<string>('NSE:NIFTY'); // TradingView default
    const [isGenerating, setIsGenerating] = useState(false);
    const [currentIdeas, setCurrentIdeas] = useState<TradeIdea[]>([]);

    // Dashboard Data State
    const [marketPulse, setMarketPulse] = useState<MarketPulse | null>(null);
    const [news, setNews] = useState<NewsItem[]>([]);
    const [events, setEvents] = useState<EventItem[]>([]);
    const [alerts, setAlerts] = useState<AlertItem[]>([]);

    React.useEffect(() => {
        // Fetch background dashboard data on mount
        const fetchDashboardData = async () => {
            try {
                const [pulseRes, newsRes, eventsRes] = await Promise.all([
                    fetch(`${API_BASE}/api/market-pulse`),
                    fetch(`${API_BASE}/api/news`),
                    fetch(`${API_BASE}/api/events`)
                ]);

                if (pulseRes.ok) setMarketPulse(await pulseRes.json());
                if (newsRes.ok) setNews(await newsRes.json());
                if (eventsRes.ok) setEvents(await eventsRes.json());
            } catch (err) {
                console.error("Error fetching dashboard widgets:", err);
            }
        };
        fetchDashboardData();

        // Fetch live agent alerts, refresh every 30 seconds
        const fetchAlerts = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/alerts?limit=15`);
                if (res.ok) setAlerts(await res.json());
            } catch {}
        };
        fetchAlerts();
        const alertInterval = setInterval(fetchAlerts, 30000);
        return () => clearInterval(alertInterval);
    }, []);

    const selectedIdea = currentIdeas.find(i => i.id === selectedIdeaId) || currentIdeas[0];

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const response = await fetch(`${API_BASE}/api/scan`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ mode }),
            });

            if (!response.ok) throw new Error('Failed to fetch from backend');

            const data = await response.json();
            setCurrentIdeas(data);
            if (data.length > 0) {
                setSelectedIdeaId(data[0].id);
            } else {
                setSelectedIdeaId(''); // Clear selected idea if no data
            }
        } catch (error) {
            console.error('Error fetching trade ideas:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%', paddingBottom: '2rem' }}>

            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', fontWeight: 700, letterSpacing: '-1px' }}>Indian Markets Terminal</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Live NSE/BSE analysis and AI Indian market trade ideas.</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    style={{ padding: '0.75rem 1.5rem', opacity: isGenerating ? 0.7 : 1, fontSize: '1rem' }}
                >
                    {isGenerating ? <RefreshCw className="animate-spin" size={20} /> : <Bot size={20} />}
                    {isGenerating ? 'Analyzing NSE...' : 'Scan Markets'}
                </button>
            </header>

            {/* Market Pulse Summary */}
            <IndicesWidget data={marketPulse?.indices || null} onSelect={(t) => setSelectedTicker(t)} />

            {/* Top Command Center Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(350px, 1fr) 2fr', gap: '1.5rem' }}>
                <FiiDiiWidget data={marketPulse} />
                <SectorWidget data={marketPulse?.sectors || null} onSelect={(t) => setSelectedTicker(t)} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: '1.5rem', flex: 1 }}>

                {/* Main Content Area */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="card glass" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Terminal size={24} style={{ color: 'var(--accent-blue)' }} />
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>Strategy Scanner</h2>
                            </div>
                            <TradingModeSelector currentMode={mode} onModeChange={(m) => { setMode(m); setSelectedIdeaId(''); }} />
                        </div>

                        {currentIdeas.length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {currentIdeas.map(idea => (
                                        <TradeIdeaCard
                                            key={idea.id}
                                            idea={idea}
                                            isSelected={selectedIdeaId === idea.id || (!selectedIdeaId && idea.id === currentIdeas[0]?.id)}
                                            onClick={() => {
                                                setSelectedIdeaId(idea.id);
                                                setSelectedTicker(idea.ticker);
                                            }}
                                        />
                                    ))}
                                </div>
                                <div style={{ minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
                                    {selectedIdea ? (
                                        <>
                                            <div style={{ flex: 1, minHeight: 0 }}>
                                                <ChartWidget ticker={selectedTicker} interval={mode === 'intraday' ? '15' : 'D'} />
                                            </div>
                                            <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: '3px solid var(--accent-blue)' }}>
                                                <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>AI Rationale</div>
                                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{selectedIdea.rationale}</p>
                                            </div>
                                        </>
                                    ) : (
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                             <ChartWidget ticker={selectedTicker} interval={mode === 'intraday' ? '15' : 'D'} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 2fr', gap: '1.5rem', flex: 1 }}>
                                    <div style={{ padding: '2rem 1rem', textAlign: 'center', border: '1px dashed var(--border-subtle)', borderRadius: '12px', background: 'rgba(255,255,255,0.01)', alignSelf: 'center' }}>
                                        <Crosshair size={40} style={{ margin: '0 auto 1rem', color: 'var(--text-muted)', opacity: 0.5 }} />
                                        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No Active Scans</h3>
                                        <button className="btn btn-primary" onClick={handleGenerate} style={{ fontSize: '0.8rem' }}>Scan Now</button>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <ChartWidget ticker={selectedTicker} interval={mode === 'intraday' ? '15' : 'D'} />
                                    </div>
                                </div>
                        )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <EventsWidget events={events} />
                        <AlertsWidget alerts={alerts} />
                    </div>
                </div>

                {/* Right Sidebar - News Feed */}
                <div style={{ height: '100%', minHeight: '600px' }}>
                    <NewsWidget news={news} />
                </div>
            </div>
        </div>
    );
};
