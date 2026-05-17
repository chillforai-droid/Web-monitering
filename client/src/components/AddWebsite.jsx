import React, { useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function AddWebsite({ onAdd }) {
  const [form, setForm] = useState({
    name: '',
    url: '',
    githubRepo: '',
    githubToken: '',
    framework: 'react',
    buildCommand: 'npm run build',
    deployProvider: 'vercel'
  });
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_BASE}/api/websites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    if (res.ok) onAdd();
  };

  const verifyWebsite = async () => {
    setVerifying(true);
    const res = await fetch(`${API_BASE}/api/websites/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: form.url })
    });
    const data = await res.json();
    setVerified(data);
    setVerifying(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Add New Website</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Website Name</label>
          <input
            type="text"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="My Website"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Website URL</label>
          <div className="flex gap-2">
            <input
              type="url"
              value={form.url}
              onChange={e => setForm({ ...form, url: e.target.value })}
              className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com"
              required
            />
            <button
              type="button"
              onClick={verifyWebsite}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
            >
              {verifying ? 'Checking...' : 'Verify'}
            </button>
          </div>
          {verified && (
            <div className={`mt-2 text-sm ${verified.accessible ? 'text-green-400' : 'text-red-400'}`}>
              {verified.message}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">GitHub Repository URL</label>
          <input
            type="url"
            value={form.githubRepo}
            onChange={e => setForm({ ...form, githubRepo: e.target.value })}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="https://github.com/username/repo"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">GitHub Token</label>
          <input
            type="password"
            value={form.githubToken}
            onChange={e => setForm({ ...form, githubToken: e.target.value })}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="ghp_..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Token needs repo access for auto-fix feature
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Framework</label>
            <select
              value={form.framework}
              onChange={e => setForm({ ...form, framework: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
            >
              <option value="react">React</option>
              <option value="vite">Vite</option>
              <option value="nextjs">Next.js</option>
              <option value="nodejs">Node.js</option>
              <option value="express">Express</option>
              <option value="static">Static</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Deploy Provider</label>
            <select
              value={form.deployProvider}
              onChange={e => setForm({ ...form, deployProvider: e.target.value })}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
            >
              <option value="vercel">Vercel</option>
              <option value="netlify">Netlify</option>
              <option value="render">Render</option>
              <option value="railway">Railway</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Build Command</label>
          <input
            type="text"
            value={form.buildCommand}
            onChange={e => setForm({ ...form, buildCommand: e.target.value })}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
            placeholder="npm run build"
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
        >
          + Add Website
        </button>
      </form>
    </div>
  );
}
