import axios from 'axios';
import { config } from '../config.js';

export class AIAnalyzer {
  constructor() {
    this.apiKey = config.openRouterApiKey;
    this.baseUrl = config.openRouterBaseUrl;
    this.model = config.freeModels[0]; // Default model
  }

  async analyzeIssues(scanResults, website) {
    const prompt = this.buildAnalysisPrompt(scanResults, website);
    
    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert web developer and bug analyzer. Analyze website issues and provide actionable fixes.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 2000
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const aiResponse = response.data.choices[0].message.content;
      return this.parseAIResponse(aiResponse);
      
    } catch (err) {
      console.error('AI Analysis failed:', err.message);
      // Fallback to next free model
      if (this.model === config.freeModels[0] && config.freeModels[1]) {
        this.model = config.freeModels[1];
        return this.analyzeIssues(scanResults, website);
      }
      return this.generateBasicAnalysis(scanResults);
    }
  }

  buildAnalysisPrompt(scanResults, website) {
    return `
Analyze this website for issues:

URL: ${website.url}
Framework: ${website.framework || 'Unknown'}
Last Scanned: ${scanResults.timestamp}

Errors Found:
${scanResults.errors.map((e, i) => `${i + 1}. ${e.type}: ${e.message}`).join('\n')}

Warnings:
${scanResults.warnings.map((w, i) => `${i + 1}. ${w.type}: ${w.message}`).join('\n')}

Performance Scores:
${JSON.stringify(scanResults.lighthouse?.scores || {}, null, 2)}

Please provide:
1. Critical issues list
2. Root cause analysis
3. Specific files that need fixes
4. Code patches for each issue
5. Priority order for fixes
6. Risk assessment for each fix

Format your response as JSON:
{
  "criticalIssues": [],
  "rootCauses": [],
  "affectedFiles": [],
  "patches": [{"file": "", "fix": "", "risk": ""}],
  "priority": "high/medium/low",
  "summary": ""
}`;
  }

  parseAIResponse(response) {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (err) {
      console.log('Failed to parse AI response as JSON, using text response');
    }
    
    return {
      criticalIssues: [],
      rootCauses: [],
      affectedFiles: [],
      patches: [],
      priority: 'medium',
      summary: response
    };
  }

  generateBasicAnalysis(scanResults) {
    // Basic fallback analysis without AI
    const analysis = {
      criticalIssues: [],
      rootCauses: [],
      patches: [],
      priority: 'medium',
      summary: 'Basic analysis (AI unavailable)'
    };

    // Analyze errors
    scanResults.errors.forEach(error => {
      analysis.criticalIssues.push({
        type: error.type,
        message: error.message,
        severity: 'error'
      });
    });

    // Generate basic patches for known issues
    if (scanResults.seo?.warnings?.some(w => w.message.includes('Missing: Title tag'))) {
      analysis.patches.push({
        file: 'index.html',
        fix: 'Add <title>Your Website Title</title> in <head> section',
        risk: 'low'
      });
    }

    if (scanResults.seo?.warnings?.some(w => w.message.includes('Missing: Meta description'))) {
      analysis.patches.push({
        file: 'index.html',
        fix: 'Add <meta name="description" content="Your description"> in <head>',
        risk: 'low'
      });
    }

    return analysis;
  }

  async generateFixCode(issue, websiteInfo) {
    const prompt = `
Generate a code fix for this issue:

Website: ${websiteInfo.url}
Framework: ${websiteInfo.framework}
Issue: ${JSON.stringify(issue)}

Provide the exact code changes needed.
Use diff format:
\`\`\`diff
- old code
+ new code
\`\`\`

Include:
1. File path
2. Line numbers
3. Risk level
4. Testing steps`;

    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
          max_tokens: 1500
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        fix: response.data.choices[0].message.content,
        model: this.model
      };
    } catch (err) {
      return { fix: '// AI fix generation failed', model: 'none' };
    }
  }
}
