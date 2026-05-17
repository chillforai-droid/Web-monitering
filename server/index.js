import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import websitesRouter from './routes/websites.js';
import scansRouter from './routes/scans.js';
import fixesRouter from './routes/fixes.js';
import fs from 'fs/promises';
import path from 'path';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('client/dist'));

// Initialize data directory
async function initDataDir() {
  try {
    await fs.mkdir(config.dataDir, { recursive: true });
    const websitesPath = path.join(config.dataDir, 'websites.json');
    const scansPath = path.join(config.dataDir, 'scans.json');
    
    try { await fs.access(websitesPath); } 
    catch { await fs.writeFile(websitesPath, '[]'); }
    
    try { await fs.access(scansPath); } 
    catch { await fs.writeFile(scansPath, '[]'); }
    
  } catch (err) {
    console.error('Failed to init data dir:', err);
  }
}

// Routes
app.use('/api/websites', websitesRouter);
app.use('/api/scans', scansRouter);
app.use('/api/fixes', fixesRouter);

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.resolve('client/dist/index.html'));
});

// Start server
async function start() {
  await initDataDir();
  app.listen(config.port, () => {
    console.log(`🚀 AI Monitor running on http://localhost:${config.port}`);
  });
}

start();
