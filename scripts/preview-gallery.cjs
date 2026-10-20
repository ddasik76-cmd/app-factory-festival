const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('@playwright/test');

(async () => {
  const root = path.resolve('dist');
  const server = http.createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const relative = pathname.replace(/^\/app-factory-festival\//, '') || 'index.html';
    const file = path.resolve(root, relative);
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) { response.writeHead(404).end(); return; }
    response.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webp': 'image/webp' })[path.extname(file)] || 'application/octet-stream');
    response.end(fs.readFileSync(file));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
    fs.mkdirSync('test-results', { recursive: true });
    for (const width of [1440, 900, 390]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(`http://127.0.0.1:${server.address().port}/app-factory-festival/`);
      await page.locator('[data-app-id="app-01e8f963-f385-444b-8406-0bf8bd292119"]').waitFor({ timeout: 30000 });
      // Load lazy thumbnails before taking the full-page screenshot.
      for (const card of await page.locator('#showcase-container article').all()) await card.scrollIntoViewIfNeeded();
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(800);
      const broken = await page.locator('#showcase-container img').evaluateAll(images => images.filter(image => image.complete && !image.naturalWidth).length);
      await page.screenshot({ path: `test-results/gallery-${width}.png`, fullPage: true });
      await page.screenshot({ path: `test-results/gallery-${width}-viewport.png` });
      console.log(JSON.stringify({
        width, cards: await page.locator('#showcase-container article').count(),
        overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        brokenImages: broken,
        firstScreenPreviews: await page.locator('#showcase-container img[src*="project-thumbnails/"]').count(),
        errors,
      }));
      await page.close();
    }
  } finally { await browser?.close(); server.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
