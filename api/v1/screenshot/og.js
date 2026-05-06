import { getBrowser, closeBrowser } from '../../../lib/browser.js';
import { validateZuploSecret, setCorsHeaders } from '../../../lib/auth.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Authentication check
  if (!validateZuploSecret(req, res)) return;

  const { 
    title, 
    description = '', 
    theme = 'light', 
    background_color, 
    logo_url 
  } = req.body;

  if (!title) {
    return res.status(400).json({ 
      status: 'error', 
      message: 'title is required' 
    });
  }

  // Constraints
  const displayTitle = title.substring(0, 80);
  const displayDescription = description.substring(0, 120);

  // Theme Styles
  const themes = {
    light: { bg: '#ffffff', text: '#1a1a1a', secondary: '#4a4a4a' },
    dark: { bg: '#0F0F1A', text: '#ffffff', secondary: '#a0a0a0' },
    brand: { bg: '#00FF41', text: '#000000', secondary: '#333333' } // Updated to Neo-Brutalist Green
  };

  const currentTheme = themes[theme] || themes.light;
  const bgColor = background_color || currentTheme.bg;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@700;900&display=swap" rel="stylesheet">
      <style>
        body {
          margin: 0;
          padding: 0;
          width: 1200px;
          height: 630px;
          background-color: ${bgColor};
          color: ${currentTheme.text};
          font-family: 'Inter', sans-serif;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 0 80px;
          box-sizing: border-box;
          position: relative;
          overflow: hidden;
          border: 20px solid ${currentTheme.text === '#ffffff' ? '#000' : '#fff'};
        }

        .logo {
          position: absolute;
          top: 60px;
          left: 80px;
          max-height: 60px;
          max-width: 250px;
          object-fit: contain;
        }

        .content {
          margin-top: 40px;
        }

        h1 {
          font-size: 90px;
          font-weight: 900;
          line-height: 1.0;
          margin: 0;
          letter-spacing: -0.04em;
          max-width: 1000px;
          text-transform: uppercase;
        }

        p {
          font-size: 38px;
          line-height: 1.3;
          margin-top: 30px;
          color: ${currentTheme.secondary};
          max-width: 900px;
          font-weight: 700;
        }
      </style>
    </head>
    <body>
      ${logo_url ? `<img src="${logo_url}" class="logo" />` : ''}
      <div class="content">
        <h1>${displayTitle}</h1>
        ${displayDescription ? `<p>${displayDescription}</p>` : ''}
      </div>
    </body>
    </html>
  `;

  let lastError = null;
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    let browser = null;
    let page = null;

    try {
      browser = await getBrowser();
      page = await browser.newPage();
      
      await page.setViewport({ width: 1200, height: 630 });
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const screenshot = await page.screenshot({
        type: 'png',
        encoding: 'base64'
      });

      await page.close();

      if (process.env.DEBUG_PREVIEW === 'true') {
        const buffer = Buffer.from(screenshot, 'base64');
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Length', buffer.length);
        return res.end(buffer, 'binary');
      }

      return res.status(200).json({
        success: true,
        image_base64: screenshot,
        width: 1200,
        height: 630,
        theme,
        attempt,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      lastError = error;
      console.error(`OG Attempt ${attempt} failed:`, error.message);
      if (page) await page.close().catch(() => {});
      
      if (error.message.includes('Target closed') || error.message.includes('Session closed')) {
        await closeBrowser(true); 
      }

      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 500));
        continue;
      }
    }
  }

  return res.status(500).json({ 
    status: 'error', 
    message: `All ${maxRetries} OG attempts failed. Last error: ${lastError.message}` 
  });
}
