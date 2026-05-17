import { chromium } from 'playwright';
import lighthouse from 'lighthouse';
import chromeLauncher from 'chrome-launcher';
import { config } from '../config.js';
import fs from 'fs/promises';
import path from 'path';

export class ScanEngine {
  async scanWebsite(website) {
    console.log(`🔍 Scanning: ${website.url}`);
    const results = {
      websiteId: website.id,
      timestamp: new Date().toISOString(),
      playwright: null,
      lighthouse: null,
      errors: [],
      warnings: [],
      performance: null,
      seo: null
    };

    try {
      // Playwright Scan
      results.playwright = await this.playwrightScan(website.url);
      
      // Lighthouse Scan
      results.lighthouse = await this.lighthouseScan(website.url);
      
      // SEO Check
      results.seo = await this.seoCheck(website.url);
      
      // Consolidate errors
      results.errors = [
        ...results.playwright.errors,
        ...(results.lighthouse?.errors || []),
        ...(results.seo?.errors || [])
      ];
      
      results.warnings = [
        ...results.playwright.warnings,
        ...(results.lighthouse?.warnings || []),
        ...(results.seo?.warnings || [])
      ];
      
    } catch (err) {
      results.errors.push({ type: 'SCAN_FAILURE', message: err.message });
    }

    return results;
  }

  async playwrightScan(url) {
    const browser = await chromium.launch(config.playwrightOptions);
    const context = await browser.newContext();
    const page = await context.newPage();
    
    const errors = [];
    const warnings = [];
    const networkErrors = [];
    let screenshot = null;

    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push({ type: 'CONSOLE_ERROR', message: msg.text() });
      } else if (msg.type() === 'warning') {
        warnings.push({ type: 'CONSOLE_WARNING', message: msg.text() });
      }
    });

    // Capture network failures
    page.on('requestfailed', request => {
      networkErrors.push({
        type: 'NETWORK_ERROR',
        url: request.url(),
        failure: request.failure()?.errorText
      });
    });

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      
      // Take screenshot
      screenshot = await page.screenshot({ 
        fullPage: true,
        type: 'jpeg',
        quality: 60
      });
      
      // Check for common issues
      const hasConsoleError = errors.length > 0;
      const hasNetworkError = networkErrors.length > 0;
      const title = await page.title();
      const metaDescription = await page.$eval('meta[name="description"]', el => el?.content).catch(() => null);
      
      if (!title) warnings.push({ type: 'MISSING_TITLE', message: 'Page has no title' });
      if (!metaDescription) warnings.push({ type: 'MISSING_META', message: 'Missing meta description' });
      
      // Check robots.txt
      const robotsResponse = await fetch(new URL('/robots.txt', url).href).catch(() => null);
      if (!robotsResponse || !robotsResponse.ok) {
        warnings.push({ type: 'NO_ROBOTS', message: 'robots.txt not found' });
      }
      
      // Check sitemap
      const sitemapResponse = await fetch(new URL('/sitemap.xml', url).href).catch(() => null);
      if (!sitemapResponse || !sitemapResponse.ok) {
        warnings.push({ type: 'NO_SITEMAP', message: 'sitemap.xml not found' });
      }

      // Check mobile responsiveness
      const viewport = page.viewportSize();
      await page.setViewportSize({ width: 375, height: 812 });
      await page.waitForTimeout(1000);
      const mobileScreenshot = await page.screenshot({ type: 'jpeg', quality: 50 });
      await page.setViewportSize(viewport);

    } catch (err) {
      errors.push({ type: 'PAGE_LOAD_ERROR', message: err.message });
    } finally {
      await browser.close();
    }

    return {
      errors: [...errors, ...networkErrors],
      warnings,
      screenshot: screenshot?.toString('base64'),
      mobileScreenshot: mobileScreenshot?.toString('base64')
    };
  }

  async lighthouseScan(url) {
    try {
      const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
      const options = {
        logLevel: 'error',
        output: 'json',
        port: chrome.port,
        onlyCategories: ['performance', 'accessibility', 'seo', 'best-practices']
      };
      
      const runnerResult = await lighthouse(url, options);
      await chrome.kill();
      
      const audits = runnerResult.lhr.audits;
      const errors = [];
      const warnings = [];
      
      // Check critical audits
      const criticalAudits = [
        'first-contentful-paint',
        'largest-contentful-paint',
        'cumulative-layout-shift',
        'total-blocking-time',
        'speed-index'
      ];
      
      for (const audit of criticalAudits) {
        const result = audits[audit];
        if (result && result.score < 0.5) {
          warnings.push({
            type: 'PERFORMANCE',
            audit,
            displayValue: result.displayValue,
            score: result.score
          });
        }
      }
      
      return {
        scores: {
          performance: runnerResult.lhr.categories.performance.score * 100,
          accessibility: runnerResult.lhr.categories.accessibility.score * 100,
          seo: runnerResult.lhr.categories.seo.score * 100,
          bestPractices: runnerResult.lhr.categories['best-practices'].score * 100
        },
        errors,
        warnings
      };
    } catch (err) {
      return {
        errors: [{ type: 'LIGHTHOUSE_ERROR', message: err.message }],
        warnings: []
      };
    }
  }

  async seoCheck(url) {
    const errors = [];
    const warnings = [];
    
    try {
      const response = await fetch(url);
      const html = await response.text();
      
      // Check meta tags
      const checks = [
        { regex: /<title[^>]*>(.*?)<\/title>/i, name: 'Title tag' },
        { regex: /<meta[^>]*name="description"[^>]*content="([^"]*)"/i, name: 'Meta description' },
        { regex: /<meta[^>]*name="viewport"[^>]*>/i, name: 'Viewport meta' },
        { regex: /<meta[^>]*property="og:title"[^>]*>/i, name: 'OG title' },
        { regex: /<meta[^>]*property="og:description"[^>]*>/i, name: 'OG description' },
        { regex: /<meta[^>]*name="twitter:card"[^>]*>/i, name: 'Twitter card' },
        { regex: /<link[^>]*rel="canonical"[^>]*>/i, name: 'Canonical URL' }
      ];
      
      for (const check of checks) {
        if (!check.regex.test(html)) {
          warnings.push({ 
            type: 'SEO_MISSING', 
            message: `Missing: ${check.name}` 
          });
        }
      }
      
      // Check heading structure
      const h1Count = (html.match(/<h1[^>]*>/gi) || []).length;
      if (h1Count === 0) warnings.push({ type: 'SEO', message: 'Missing H1 tag' });
      if (h1Count > 1) warnings.push({ type: 'SEO', message: 'Multiple H1 tags found' });
      
      // Check image alt tags
      const imgs = html.match(/<img[^>]*>/gi) || [];
      const imgsWithoutAlt = imgs.filter(img => !/alt=["'][^"']*["']/i.test(img));
      if (imgsWithoutAlt.length > 0) {
        warnings.push({ 
          type: 'SEO', 
          message: `${imgsWithoutAlt.length} images missing alt text` 
        });
      }
      
    } catch (err) {
      errors.push({ type: 'SEO_CHECK_ERROR', message: err.message });
    }
    
    return { errors, warnings };
  }
}
