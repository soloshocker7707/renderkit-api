import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

let idleTimer;
const IDLE_TIMEOUT = process.env.IDLE_TIMEOUT_MS
  ? parseInt(process.env.IDLE_TIMEOUT_MS, 10)
  : 15 * 60 * 1000; // default 15 minutes

/**
 * Global variable to persist the browser instance across warm Lambda invocations.
 */
let cachedBrowser = null;

/**
 * Retry wrapper for browser launch/connect with exponential backoff.
 */
async function withRetry(fn, label, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      console.error(`Browser ${label} attempt ${attempt}/${maxRetries} failed:`, err.message);
      if (attempt === maxRetries) throw err;
      // Exponential backoff: 500ms, 1s, 2s
      await new Promise(r => setTimeout(r, 500 * Math.pow(2, attempt - 1)));
    }
  }
}

/**
 * getBrowser - SaaS-grade browser handler with pooling.
 * Supports:
 *   1. Remote Browser Service (BROWSER_WSE_ENDPOINT)
 *   2. Local Chrome (NODE_ENV=development or IS_LOCAL)
 *   3. Vercel-native Chromium via @sparticuz/chromium
 */
export async function getBrowser() {
  // 1. Check if we have a cached browser and it's still healthy
  if (cachedBrowser) {
    try {
      if (cachedBrowser.isConnected()) {
        console.log('Reusing existing browser instance...');
        return cachedBrowser;
      }
    } catch (e) {
      // Browser is in a bad state (e.g., process killed), discard it
      console.warn('Cached browser is in a bad state, discarding...');
      cachedBrowser = null;
    }
  }

  // 2. Production SaaS approach: Connect to a hosted browser service (Browserless, etc)
  if (process.env.BROWSER_WSE_ENDPOINT) {
    console.log('Connecting to remote browser service...');
    cachedBrowser = await withRetry(async () => {
      return await puppeteer.connect({
        browserWSEndpoint: process.env.BROWSER_WSE_ENDPOINT,
      });
    }, 'connect');
    return cachedBrowser;
  }

  const isLocal = process.env.NODE_ENV === 'development' || !!process.env.IS_LOCAL;

  // 3. Local Development approach
  if (isLocal) {
    console.log('Launching local Chrome...');
    cachedBrowser = await withRetry(async () => {
      return await puppeteer.launch({
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
        ],
      });
    }, 'launch');
    return cachedBrowser;
  }

  // 4. Vercel-native Chromium via @sparticuz/chromium
  console.log('Launching new Chromium instance (Vercel native)...');

  cachedBrowser = await withRetry(async () => {
    const executablePath = await chromium.executablePath();
    const vercelChromiumArgs = [
      ...chromium.args,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-zygote',
      '--single-process',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
    ];

    return await puppeteer.launch({
      args: vercelChromiumArgs,
      defaultViewport: { width: 1280, height: 800 },
      executablePath,
      headless: true,
      ignoreHTTPSErrors: true,
    });
  }, 'launch');

  return cachedBrowser;
}

/**
 * closeBrowser - Usually a no-op in the pooling model unless we want to force a restart.
 * @param {boolean} force - If true, closes the cached browser.
 */
export function setIdleTimeout(ms) {
  const newTimeout = parseInt(ms);
  if (!isNaN(newTimeout) && newTimeout > 0) {
    // Update constant by redefining variable (since const cannot be reassigned, we use a mutable wrapper)
    // We'll use a global mutable variable instead of const for flexibility
    global.__IDLE_TIMEOUT = newTimeout;
    console.log(`Idle timeout updated to ${newTimeout} ms`);
  }
}

// Use mutable global for timeout value
const getIdleTimeout = () => global.__IDLE_TIMEOUT || IDLE_TIMEOUT;

export function resetIdleTimer() {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    console.log('Idle timeout reached – closing browser');
    closeBrowser(true);
  }, getIdleTimeout());
}

export async function closeBrowser(force = false) {
  if (cachedBrowser && force) {
    console.log('Closing browser instance (forced)...');
    await cachedBrowser.close();
    cachedBrowser = null;
  }
}

// Export idle timer utilities (optional for testing)

