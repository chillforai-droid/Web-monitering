import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config.js';
import { ScanEngine } from '../services/scanEngine.js';
import { AIAnalyzer } from '../services/aiAnalyzer.js';

const router = Router();
const scansFile = path.join(config.dataDir, 'scans.json');
const websitesFile = path.join(config.dataDir, 'websites.json');

const scanEngine = new ScanEngine();
const aiAnalyzer = new AIAnalyzer();

// Trigger scan for a website
router.post('/:websiteId', async (req, res) => {
  try {
    const websites = JSON.parse(await fs.readFile(websitesFile, 'utf-8'));
    const website = websites.find(w => w.id === req.params.websiteId);
    
    if (!website) return res.status(404).json({ error: 'Website not found' });
    
    // Perform scan
    const scanResults = await scanEngine.scanWebsite(website);
    
    // AI Analysis
    const aiAnalysis = await aiAnalyzer.analyzeIssues(scanResults, website);
    
    // Save scan
    const scans = JSON.parse(await fs.readFile(scansFile, 'utf-8'));
    const newScan = {
      id: uuidv4(),
      websiteId: website.id,
      ...scanResults,
      aiAnalysis,
      approved: false,
      fixed: false
    };
    
    scans.push(newScan);
    await fs.writeFile(scansFile, JSON.stringify(scans, null, 2));
    
    // Update website
    website.lastScanned = newScan.timestamp;
    website.issues = newScan.aiAnalysis.criticalIssues || [];
    website.status = website.issues.length > 0 ? 'issues_found' : 'healthy';
    
    await fs.writeFile(websitesFile, JSON.stringify(websites, null, 2));
    
    res.json(newScan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Scan all websites
router.post('/all', async (req, res) => {
  try {
    const websites = JSON.parse(await fs.readFile(websitesFile, 'utf-8'));
    const results = [];
    
    for (const website of websites) {
      try {
        const scanResults = await scanEngine.scanWebsite(website);
        const aiAnalysis = await aiAnalyzer.analyzeIssues(scanResults, website);
        
        const scans = JSON.parse(await fs.readFile(scansFile, 'utf-8'));
        const newScan = {
          id: uuidv4(),
          websiteId: website.id,
          ...scanResults,
          aiAnalysis,
          approved: false,
          fixed: false
        };
        
        scans.push(newScan);
        await fs.writeFile(scansFile, JSON.stringify(scans, null, 2));
        
        website.lastScanned = newScan.timestamp;
        website.issues = newScan.aiAnalysis.criticalIssues || [];
        website.status = website.issues.length > 0 ? 'issues_found' : 'healthy';
        
        results.push({ websiteId: website.id, status: 'completed' });
      } catch (err) {
        results.push({ websiteId: website.id, status: 'failed', error: err.message });
      }
    }
    
    await fs.writeFile(websitesFile, JSON.stringify(websites, null, 2));
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get scans for a website
router.get('/:websiteId', async (req, res) => {
  try {
    const scans = JSON.parse(await fs.readFile(scansFile, 'utf-8'));
    const websiteScans = scans
      .filter(s => s.websiteId === req.params.websiteId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);
    
    res.json(websiteScans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
