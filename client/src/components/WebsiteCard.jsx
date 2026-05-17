import React from 'react';

export default function WebsiteCard({ website, onSelect, onScan }) {
  const statusColors = {
    healthy: 'bg-green-500',
    issues_found: 'bg-red-500',
    pending: 'bg-yellow-500',
    scanning: 'bg-blue-500'
  };

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden hover:border-gray-600 transition-all">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${statusColors[website.status] || 'bg-gray-500'}`} />
            <h3 className="font-semibold text-lg">{website.name || website.url}</h3>
          </div>
          <span className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-300">
            {website.framework || 'Web'}
          </span>
        </div>

        <div className="text-sm text-gray-400 mb-4">
          <div className="truncate">{website.url}</div>
          {website.lastScanned && (
            <div className="mt-1">
              Last scan: {new Date(website.lastScanned).toLocaleString()}
            </div>
          )}
        </div>

        {website.issues?.length > 0 && (
          <div className="mb-4">
            <div className="text-sm text-red-400 font-medium mb-2">
              {website.issues.length} issues found
            </div>
            <div className="space-y-1">
              {website.issues.slice(0, 3).map((issue, i) => (
                <div key={i} className="text-xs text-red-300 truncate">
                  • {issue.message}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => onScan(website.id)}
            className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition-colors"
          >
            🔍 Scan Now
          </button>
          <button
            onClick={() => onSelect(website)}
            className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}
