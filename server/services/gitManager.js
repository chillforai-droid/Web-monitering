import { Octokit } from 'octokit';
import simpleGit from 'simple-git';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export class GitManager {
  constructor(token) {
    this.octokit = new Octokit({ auth: token });
    this.token = token;
  }

  parseGitHubUrl(url) {
    // Parse: https://github.com/owner/repo
    const match = url.match(/github\.com\/([^\/]+)\/([^\/\.]+)/);
    if (!match) throw new Error('Invalid GitHub URL');
    return { owner: match[1], repo: match[2] };
  }

  async cloneRepo(url, branch = 'main') {
    const cloneDir = path.join('/tmp', `repo-${uuidv4()}`);
    const git = simpleGit();
    
    // Create authenticated URL
    const { owner, repo } = this.parseGitHubUrl(url);
    const authUrl = `https://${this.token}@github.com/${owner}/${repo}.git`;
    
    await git.clone(authUrl, cloneDir, ['--branch', branch]);
    return { dir: cloneDir, git: simpleGit(cloneDir) };
  }

  async createFixBranch(git, branchName) {
    await git.checkoutLocalBranch(branchName);
    return branchName;
  }

  async applyFix(repoDir, filePath, content) {
    const fullPath = path.join(repoDir, filePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content, 'utf-8');
    return fullPath;
  }

  async commitAndPush(git, message, branch) {
    await git.add('.');
    await git.commit(message);
    await git.push('origin', branch, ['--set-upstream']);
  }

  async createPullRequest(githubUrl, branch, title, description) {
    const { owner, repo } = this.parseGitHubUrl(githubUrl);
    
    const pr = await this.octokit.rest.pulls.create({
      owner,
      repo,
      title,
      head: branch,
      base: 'main',
      body: description
    });
    
    return pr.data.html_url;
  }

  async rollbackBranch(githubUrl, branch) {
    const { owner, repo } = this.parseGitHubUrl(githubUrl);
    
    await this.octokit.rest.git.deleteRef({
      owner,
      repo,
      ref: `heads/${branch}`
    });
  }

  async getDiff(githubUrl, branch1, branch2 = 'main') {
    const { owner, repo } = this.parseGitHubUrl(githubUrl);
    
    const compare = await this.octokit.rest.repos.compareCommits({
      owner,
      repo,
      base: branch2,
      head: branch1
    });
    
    return {
      files: compare.data.files?.map(f => ({
        filename: f.filename,
        additions: f.additions,
        deletions: f.deletions,
        patch: f.patch
      })),
      totalCommits: compare.data.total_commits
    };
  }

  async verifyBuild(repoDir, buildCommand = 'npm run build') {
    try {
      const { exec } = await import('child_process');
      const util = await import('util');
      const execPromise = util.promisify(exec);
      
      await execPromise(`cd ${repoDir} && npm install && ${buildCommand}`);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}
