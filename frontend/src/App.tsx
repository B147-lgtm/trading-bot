import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { ResearchMode } from './pages/ResearchMode';
import { DeepAnalysis } from './pages/DeepAnalysis'; // Added DeepAnalysis import

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="research" element={<ResearchMode />} />
          <Route path="deep-analysis" element={<DeepAnalysis />} /> {/* Added DeepAnalysis route */}
          <Route path="portfolio" element={
            <div className="animate-fade-in" style={{ padding: '2rem' }}>
              <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Portfolio</h1>
              <div className="glass-panel" style={{ padding: '2rem' }}>Coming soon...</div>
            </div>
          } />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
