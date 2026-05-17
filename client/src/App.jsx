import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import AddWebsite from './components/AddWebsite';
import ScanResults from './components/ScanResults';
import AIFixPanel from './components/AIFixPanel';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function App() {
  const [view, setView] = useState('dashboard');
  const [websites, setWebsites] = useState([]);
  const [selectedWebsite, setSelectedWebsite] = useState(null);
  const [selectedScan, setSelectedScan] = useState(null);

  useEffect(() => {
    fetchWebsites();
  }, []);

  const fetchWebsites = async () => {
    const res = await fetch(`${API_BASE}/api/websites`);
    const data = await res.json();
    setWebsites(data);
  };

  const triggerScan = async (websiteId) => {
    await fetch(`${API_BASE}/api/scans/${websiteId}`, { method: 'POST' });
    fetchWebsites();
  };

  const scanAll = async () => {
    await fetch(`${API_BASE}/api/scans/all`, { method: 'POST' });
    fetchWebsites();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            🤖 AI Website Monitor
          </h1>
          <nav className="flex gap-4">
            <button
              onClick={() => setView('dashboard')}
              className={`px-4 py-2 rounded-lg ${
                view === 'dashboard' ? 'bg-blue-600' : 'bg-gray-700'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => { setView('add'); setSelectedWebsite(null); }}
              className={`px-4 py-2 rounded-lg ${
                view === 'add' ? 'bg-blue-600' : 'bg-gray-700'
              }`}
            >
              + Add Website
            </button>
            <button
              onClick={scanAll}
              className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700"
            >
              🔍 Scan All
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {view === 'dashboard' && (
          <Dashboard
            websites={websites}
            onSelectWebsite={(w) => {
              setSelectedWebsite(w);
              setView('scans');
            }}
            onTriggerScan={triggerScan}
            onRefresh={fetchWebsites}
          />
        )}
        {view === 'add' && (
          <AddWebsite
            onAdd={() => {
              fetchWebsites();
              setView('dashboard');
            }}
          />
        )}
        {view === 'scans' && selectedWebsite && (
          <ScanResults
            website={selectedWebsite}
            onSelectScan={(scan) => {
              setSelectedScan(scan);
              setView('fix');
            }}
            onBack={() => setView('dashboard')}
          />
        )}
        {view === 'fix' && selectedScan && (
          <AIFixPanel
            scan={selectedScan}
            website={selectedWebsite}
            onBack={() => setView('scans')}
          />
        )}
      </main>
    </div>
  );
}

export default App;
