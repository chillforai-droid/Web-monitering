import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config.js';
import { GitManager } from '../services/gitManager.js';
import { AIAnalyzer } from '../services/aiAnalyzer.js';

const router = Router();
const scansFile = path.join(config.dataDir, 'scans.json');

const aiAnalyzer = new AIAnalyzer();

// Approve and apply fix
router.post('/approve', async (req, res) => {
  try {
    const { scanId, issueIndex } = req.body;
    const scans = JSON.parse(await fs.readFile(scansFile, 'utf-8'));
    const scan = scans.find(s => s.id === scanId);
    
    if (!scan) return res.status(404).json({ error: 'Scan not found' });
    
    const websites = JSON.parse(await fs.readFile(
      path.join(config.dataDir, 'websites.json'), 
      'utf-8'
    ));
    const website = websites.find(w => w.id === scan.websiteId);
    
    if (!website) return res.status(404).json({ error: 'Website not found' });
    
    const gitManager = new GitManager(website.githubToken || config.githubToken);
    const issue = scan.aiAnalysis.criticalIssues?.[issueIndex];
    
    if (!issue) return res.status(404).json({ error: 'Issue not found' });
    
    // Generate fix code
    const fixResult = await aiAnalyzer.generateFixCode(issue, website);
    
    // Parse GitHub URL
    const { owner, repo } = gitManager.parseGitHubUrl(website.githubRepo);
    
    // Clone repo
    const { dir: repoDir, git } = await gitManager.cloneRepo(website.githubRepo);
    
    // Create fix branch
    const branchName = `fix/ai-auto-${uuidv4().split('-')[0]}`;
    await gitManager.createFixBranch(git, branchName);
    
    // Apply fixes
    const patches = scan.aiAnalysis.patches || [];
    for (const patch of patches) {
      await gitManager.applyFix(repoDir, patch.file, patch.fix);
    }
    
    // Verify build
    const buildResult = await gitManager.verifyBuild(repoDir, website.buildCommand);
    
    if (buildResult.success) {
      // Commit and push
      await gitManager.commitAndPush(
        git,
        `🤖 AI Auto-fix: ${issue.message}`,
        branchName
      );
      
      // Create PR
      const prUrl = await gitManager.createPullRequest(
        website.githubRepo,
        branchName,
        `[AI Fix] ${issue.message}`,
        `Auto-generated fix for issue: ${issue.message}\n\nAI Model: ${fixResult.model}`
      );
      
      // Update scan status
      scan.approved = true;
      scan.fixed = true;
      scan.fixBranch = branchName;
      scan.prUrl = prUrl;
      await fs.writeFile(scansFile, JSON.stringify(scans, null, 2));
      
      // Cleanup
      await fs.rm(repoDir, { recursive: true, force: true });
      
      res.json({
        success: true,
        branch: branchName,
        prUrl,
        buildResult
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Build verification failed',
        buildResult
      });
    }
    
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get diff
router.get('/diff/:scanId', async (req, res) => {
  try {
    const scans = JSON.parse(await fs.readFile(scansFile, 'utf-8'));
    const scan = scans.find(s => s.id === req.params.scanId);
    
    if (!scan?.fixBranch) {
      return res.status(404).json({ error: 'No fix branch found' });
    }
    
    const websites = JSON.parse(await fs.readFile(
      path.join(config.dataDir, 'websites.json'),
      'utf-8'
    ));
    const website = websites.find(w => w.id === scan.websiteId);
    
    const gitManager = new GitManager(website.githubToken || config.githubToken);
    const diff = await gitManager.getDiff(website.githubRepo, scan.fixBranch);
    
    res.json(diff);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rollback fix
router.post('/rollback/:scanId', async (req, res) => {
  try {
    const scans = JSON.parse(await fs.readFile(scansFile, 'utf-8'));
    const scan = scans.find(s => s.id === req.params.scanId);
    
    if (!scan?.fixBranch) {
      return res.status(404).json({ error: 'No fix to rollback' });
    }
    
    const websites = JSON.parse(await fs.readFile(
      path.join(config.dataDir, 'websites.json'),
      'utf-8'
    ));
    const website = websites.find(w => w.id === scan.websiteId);
    
    const gitManager = new GitManager(website.githubToken || config.githubToken);
    await gitManager.rollbackBranch(website.githubRepo, scan.fixBranch);
    
    // Update scan
    scan.fixed = false;
    scan.fixBranch = null;
    scan.prUrl = null;
    await fs.writeFile(scansFile, JSON.stringify(scans, null, 2));
    
    res.json({ success: true, message: 'Rollback successful' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
