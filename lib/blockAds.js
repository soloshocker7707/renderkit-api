export async function blockAds(page) {
  // Enable request interception
  await page.setRequestInterception(true);
  const blockedResourceTypes = new Set([
    'image', // large images from ads
    'media', // videos/audio
    'font'
  ]);
  const blockedUrls = [
    // Common ad domains (partial matches)
    /.*doubleclick\.net.*/, /.*googlesyndication\.com.*/, /.*adservice\.google\.com.*/, /.*ads\.youtube\.com.*/, /.*adservice\.twitter\.com.*/, /.*pixel\.adsafeprotected\.com.*/, /.*adsystem\.com.*/, /.*adroll\.com.*/, /.*facebook\.net\/ad\/.*/, /.*partnerstack\.com.*/, /.*taboola\.com.*/, /.*outbrain\.com.*/, /.*criteo\.com.*/, /.*amazon-adsystem\.com.*/, /.*medianet\.com.*/, /.*adsafeprotected\.com.*/, /.*shopping\.adservice.*/
  ];

  page.on('request', (req) => {
    const url = req.url();
    const resourceType = req.resourceType();
    // Block by resource type
    if (blockedResourceTypes.has(resourceType)) {
      return req.abort();
    }
    // Block by URL pattern
    for (const pattern of blockedUrls) {
      if (pattern.test(url)) {
        return req.abort();
      }
    }
    // Otherwise continue
    req.continue();
  });
}
