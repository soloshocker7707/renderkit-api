// lib/pagePool.js
// Simple page pool and concurrency limiter for Puppeteer pages.
// Utilizes the shared browser instance from lib/browser.js.

import { getBrowser } from "./browser.js";

// Maximum concurrent pages (default 5). Can be overridden via env.
const MAX_CONCURRENT_PAGES = process.env.MAX_CONCURRENT_PAGES ? parseInt(process.env.MAX_CONCURRENT_PAGES) : 5;

// Simple semaphore counter.
let activePages = 0;

/**
 * Acquire a new page from the shared browser.
 * If the number of active pages reaches the limit, we wait until a slot frees.
 */
export async function getPage() {
  // Wait if limit reached
  while (activePages >= MAX_CONCURRENT_PAGES) {
    // Small delay before rechecking
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  const browser = await getBrowser();
  const page = await browser.newPage();
  activePages++;
  return page;
}

/**
 * Release a page back to the pool.
 * Currently we simply close the page and decrement the counter.
 * In a more advanced implementation we could keep pages alive for reuse.
 */
export async function releasePage(page) {
  if (!page) return;
  try {
    await page.close();
  } catch (e) {
    console.warn("Error closing page:", e);
  }
  activePages = Math.max(activePages - 1, 0);
}
