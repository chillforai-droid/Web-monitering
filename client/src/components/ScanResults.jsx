import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function ScanResults({ website, onSelectScan, onBack }) {
  const [scans, setScans] = useState([]);

  useEffect(() => {
    fetchScans();
  }, [website.id]);

  const fetchScans = async () => {
    const res = await fetch(`${API_BASE}/api/scans/${website.id}`);
    const data = await res.json();
    setScans(data);
  };

  return (
    <div>
      <button onClick={onBack} className="mb-6 text-blue-400 hover:underline">
        ← Back to Dashboard
      </button>

      <div className="mb-8">
        <h2 className="text-2xl font-bold">{website.name || website.url}</h2>
        <div className="text-gray-400 mt-1">{website.url}</div>
      </div>

      {/* Latest Scan Summary */}
      {scans[0] && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-8">
          <h3 className="text-lg font-semibold mb-4">Latest Scan</h3>
          
          {scans[0].lighthouse?.scores && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {Object.entries(scans[0].lighthouse.scores).map(([key, value]) => (
                <div key={key} className="text-center">
                  <div className={`text-2xl font-bold ${
                    value > 80 ? 'text-green-400' : value > 50 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {Math.round(value)}%
                  </div>
                  <div className="text-xs text-gray-400 mt-1 capitalize">{key}</div>
                </div>
              ))}
            </div>
          )}

          {scans[0].errors?.length > 0 && (
            <div className="mb-4">
              <div className="text-red-400 font-medium mb-2">
                {scans[0].errors.length} Errors
              </div>
              <div className="space-y-2">
                {scans[0].errors.map((error, i) => (
                  <div key={i} className="bg-red-900/20 p-3 rounded-lg text-sm">
                    <span className="font-medium">{error.type}:</span> {error.message}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Scan History */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Scan History</h3>
        <div className="space-y-4">
          {scans.map(scan => (
            <div
              key={scan.id}
              className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 cursor-pointer"
              onClick={() => onSelectScan(scan)}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-400">
                  {new Date(scan.timestamp).toLocaleString()}
                </span>
                <div className="flex items-center gap-2">
                  {scan.errors?.length > 0 && (
                    <span className="px-2 py-1 bg-red-900/50 text-red-400 text-xs rounded">
                      {scan.errors.length} errors
                    </span>
                  )}
                  {scan.warnings?.length > 0 && (
                    <span className="px-2 py-1 bg-yellow-900/50 text-yellow-400 text-xs rounded">
                      {scan.warnings.length} warnings
                    </span>
                  )}
                  {scan.fixed && (
                    <span className="px-2 py-1 bg-green-900/50 text-green-400 text-xs rounded">
                      Fixed
                    </span>
                  )}
                </div>
              </div>

              {scan.aiAnalysis?.summary && (
                <p className="text-sm text-gray-300 line-clamp-2">
                  {scan.aiAnalysis.summary}
                </p>
              )}
            </div>
          ))}

          {scans.length === 0 && (
            <div className="text-center py-10 text-gray-400">
              No scans yet. Click "Scan Now" to start monitoring.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
