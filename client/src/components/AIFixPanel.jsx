import React, { useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function AIFixPanel({ scan, website, onBack }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [diff, setDiff] = useState(null);

  const approveFix = async (issueIndex) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/fixes/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scanId: scan.id, issueIndex })
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ success: false, error: err.message });
    }
    setLoading(false);
  };

  const viewDiff = async () => {
    const res = await fetch(`${API_BASE}/api/fixes/diff/${scan.id}`);
    const data = await res.json();
    setDiff(data);
  };

  const rollbackFix = async () => {
    const res = await fetch(`${API_BASE}/api/fixes/rollback/${scan.id}`, {
      method: 'POST'
    });
    const data = await res.json();
    setResult(data);
  };

  return (
    <div>
      <button onClick={onBack} className="mb-6 text-blue-400 hover:underline">
        ← Back to Scans
      </button>

      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-8">
        <h2 className="text-xl font-bold mb-4">AI Analysis & Fix</h2>
        
        {/* AI Summary */}
        <div className="bg-gray-900 rounded-lg p-4 mb-6">
          <div className="text-sm text-gray-400 mb-2">AI Analysis Summary</div>
          <p className="text-gray-200">{scan.aiAnalysis?.summary || 'No analysis available'}</p>
          {scan.aiAnalysis?.model && (
            <div className="text-xs text-gray-500 mt-2">
              Analyzed by: {scan.aiAnalysis.model}
            </div>
          )}
        </div>

        {/* Critical Issues */}
        {scan.aiAnalysis?.criticalIssues?.map((issue, i) => (
          <div key={i} className="bg-red-900/20 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="font-medium text-red-400">{issue.type}</span>
                <p className="text-sm mt-1">{issue.message}</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs ${
                issue.severity === 'error' ? 'bg-red-900 text-red-400' : 'bg-yellow-900 text-yellow-400'
              }`}>
                {issue.severity}
              </span>
            </div>

            {!scan.fixed && (
              <button
                onClick={() => approveFix(i)}
                disabled={loading}
                className="w-full py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Applying Fix...' : '✅ Approve & Fix'}
              </button>
            )}
          </div>
        ))}

        {/* Patches */}
        {scan.aiAnalysis?.patches?.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Suggested Patches</h3>
            {scan.aiAnalysis.patches.map((patch, i) => (
              <div key={i} className="bg-gray-900 rounded-lg p-4 mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-400">{patch.file}</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    patch.risk === 'low' ? 'bg-green-900 text-green-400' :
                    patch.risk === 'medium' ? 'bg-yellow-900 text-yellow-400' :
                    'bg-red-900 text-red-400'
                  }`}>
                    Risk: {patch.risk}
                  </span>
                </div>
                <pre className="text-xs text-gray-300 overflow-x-auto p-2 bg-black/50 rounded">
                  {patch.fix}
                </pre>
              </div>
            ))}
          </div>
        )}

        {/* Fix Result */}
        {result && (
          <div className={`p-4 rounded-lg mb-4 ${
            result.success ? 'bg-green-900/20' : 'bg-red-900/20'
          }`}>
            {result.success ? (
              <div>
                <div className="font-medium text-green-400 mb-2">✅ Fix Applied Successfully!</div>
                <div className="text-sm text-gray-300">
                  Branch: <code className="bg-gray-700 px-2 py-1 rounded">{result.branch}</code>
                </div>
                {result.prUrl && (
                  <a
                    href={result.prUrl}
                    target="_blank"
                    className="text-blue-400 hover:underline text-sm mt-2 inline-block"
                  >
                    View Pull Request →
                  </a>
                )}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={viewDiff}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm"
                  >
                    View Diff
                  </button>
                  <button
                    onClick={rollbackFix}
                    className="px-4 py-2 bg-red-700 hover:bg-red-600 rounded-lg text-sm"
                  >
                    Rollback
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-red-400">
                ❌ Fix failed: {result.error}
              </div>
            )}
          </div>
        )}

        {/* Diff Viewer */}
        {diff && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Code Changes</h3>
            <div className="space-y-4">
              {diff.files?.map((file, i) => (
                <div key={i} className="bg-gray-900 rounded-lg p-4">
                  <div className="text-sm font-medium text-blue-400 mb-2">{file.filename}</div>
                  <div className="text-xs text-gray-400 mb-2">
                    +{file.additions} -{file.deletions}
                  </div>
                  <pre className="text-xs overflow-x-auto">
                    <code>{file.patch}</code>
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
