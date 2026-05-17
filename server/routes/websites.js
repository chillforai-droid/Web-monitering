import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config.js';

const router = Router();
const websitesFile = path.join(config.dataDir, 'websites.json');

// Get all websites
router.get('/', async (req, res) => {
  try {
    const data = await fs.readFile(websitesFile, 'utf-8');
    res.json(JSON.parse(data));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add website
router.post('/', async (req, res) => {
  try {
    const websites = JSON.parse(await fs.readFile(websitesFile, 'utf-8'));
    const newWebsite = {
      id: uuidv4(),
      ...req.body,
      status: 'pending',
      createdAt: new Date().toISOString(),
      lastScanned: null,
      issues: [],
      apiKey: uuidv4().split('-')[0]
    };
    
    websites.push(newWebsite);
    await fs.writeFile(websitesFile, JSON.stringify(websites, null, 2));
    
    res.status(201).json(newWebsite);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update website
router.put('/:id', async (req, res) => {
  try {
    const websites = JSON.parse(await fs.readFile(websitesFile, 'utf-8'));
    const index = websites.findIndex(w => w.id === req.params.id);
    
    if (index === -1) return res.status(404).json({ error: 'Website not found' });
    
    websites[index] = { ...websites[index], ...req.body };
    await fs.writeFile(websitesFile, JSON.stringify(websites, null, 2));
    
    res.json(websites[index]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete website
router.delete('/:id', async (req, res) => {
  try {
    const websites = JSON.parse(await fs.readFile(websitesFile, 'utf-8'));
    const filtered = websites.filter(w => w.id !== req.params.id);
    await fs.writeFile(websitesFile, JSON.stringify(filtered, null, 2));
    
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify website
router.post('/verify', async (req, res) => {
  try {
    const { url } = req.body;
    const response = await fetch(url);
    res.json({ 
      accessible: response.ok,
      status: response.status,
      message: response.ok ? 'Website accessible' : 'Website not accessible'
    });
  } catch (err) {
    res.json({ accessible: false, error: err.message });
  }
});

export default router;
