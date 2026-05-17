# Deployment Guide

## Prerequisites

1. Node.js 18+
2. OpenRouter API key (free)
3. GitHub token with repo access

## Local Setup

\`\`\`bash
# Clone the repo
git clone <your-repo>
cd ai-website-monitor

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium

# Copy environment file
cp .env.example .env

# Edit .env with your keys
nano .env

# Run development
npm run dev

# Build for production
npm run build
npm start
\`\`\`

## Deploy to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Set environment variables
4. Deploy

## Deploy to Railway

1. Create new project
2. Connect GitHub repo
3. Set environment variables
4. Deploy

## Deploy to Render

1. Create Web Service
2. Connect repo
3. Build command: `npm run build`
4. Start command: `npm start`

## GitHub Actions Setup

1. Add secrets to repo:
   - `MONITOR_URL`: Your deployed URL
   - `MONITOR_API_KEY`: API key

2. Enable GitHub Actions in repo settings
