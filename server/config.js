import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  openRouterApiKey: process.env.OPENROUTER_API_KEY || '',
  openRouterBaseUrl: 'https://openrouter.ai/api/v1',
  freeModels: [
    'deepseek/deepseek-chat:free',
    'deepseek/deepseek-r1:free',
    'google/gemini-2.0-flash-exp:free'
  ],
  githubToken: process.env.GITHUB_TOKEN || '',
  dataDir: './server/data',
  scanInterval: '0 * * * *', // Every hour
  maxRetries: 3,
  playwrightOptions: {
    headless: true,
    timeout: 30000
  }
};
