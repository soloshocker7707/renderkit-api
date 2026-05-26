import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
let idleTimer;
const IDLE_TIMEOUT = process.env.IDLE_TIMEOUT_MS ? parseInt(process.env.IDLE_TIMEOUT_MS) : 15 * 60 * 1000; // default 15 minutes


/**
 * Global variable to persist the browser instance across warm Lambda invocations.
 */
let cachedBrowser = null;

/**
 * getBrowser - SaaS-grade browser handler with pooling.
 * Supports local Chrome, Vercel-native Chromium, or Remote Browser Services (WebSocket).
 */
export async function getBrowser() {
  // 1. Check if we have a cached browser and it's still healthy
  if (cachedBrowser && cachedBrowser.isConnected()) {
    console.log('Reusing existing browser instance...');
    return cachedBrowser;
  }

  // 2. Production SaaS approach: Connect to a hosted browser service (Browserless, etc)
  if (process.env.BROWSER_WSE_ENDPOINT) {
    console.log('Connecting to remote browser service...');
    cachedBrowser = await puppeteer.connect({
      browserWSEndpoint: process.env.BROWSER_WSE_ENDPOINT,
    });
    return cachedBrowser;
  }

  const isLocal = process.env.NODE_ENV === 'development' || !!process.env.IS_LOCAL;
  
  // 3. Local Development approach
  if (isLocal) {
    console.log('Launching local Chrome...');
    cachedBrowser = await puppeteer.launch({
      executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    return cachedBrowser;
  }

  // 4. Fallback: Vercel-native Chromium
  console.log('Launching new Chromium instance (Vercel native)...');
  const executablePath = await chromium.executablePath();

  cachedBrowser = await puppeteer.launch({
    args: [
      ...chromium.args,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-zygote',
      '--single-process'
    ],
    defaultViewport: chromium.defaultViewport,
    executablePath,
    headless: chromium.headless,
    ignoreHTTPSErrors: true,
  });

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

