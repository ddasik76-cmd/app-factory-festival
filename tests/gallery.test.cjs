const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('@playwright/test');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
let server, browser, baseURL;
before(async () => {
  const root = path.resolve('dist');
  server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (!pathname.startsWith('/app-factory-festival/')) { res.writeHead(404).end(); return; }
    const relative = pathname.slice('/app-factory-festival/'.length) || 'index.html';
    const target = path.resolve(root, relative);
    if (!target.startsWith(root + path.sep) || !fs.existsSync(target)) { res.writeHead(404).end(); return; }
    res.setHeader('Content-Type', ({ '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.svg':'image/svg+xml' })[path.extname(target)] || 'application/octet-stream');
    res.end(fs.readFileSync(target));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  baseURL = `http://127.0.0.1:${server.address().port}/app-factory-festival/`;
  browser = await chromium.launch({ channel: 'chrome', headless: true });
});
after(async () => { await browser?.close(); server?.close(); });
async function pageFor(width = 390, height = 844) {
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.appErrors = errors;
  await page.route(/^https:\/\//, route => route.abort());
  await page.goto(baseURL);
  await page.locator('#item-count').waitFor();
  return page;
}
const cards = page => page.locator('#showcase-container article');
const play = (page, id) => page.locator(`[data-app-id="${id}"] button`).first().click();
test('offline fallback remains searchable and combines category filters', async () => {
  const page = await pageFor();
  await page.locator('button[data-category="study"]').click();
  assert.equal(await cards(page).count(), 3);
  await page.locator('#search-input').fill('이준서');
  assert.equal(await cards(page).count(), 0);
  await page.locator('#search-clear-btn').click();
  assert.equal(await cards(page).count(), 3);
  await page.locator('button[data-category="all"]').click();
  await page.locator('#search-input').fill('이준서');
  assert.equal(await cards(page).count(), 1);
  assert.deepEqual(page.appErrors, []);
  await page.context().close();
});
test('signed-out registration requests Google authentication', async () => {
  const page = await pageFor();
  await page.locator('#open-register-btn').click();
  await page.waitForTimeout(500);
  assert.equal(await page.locator('#full-register-modal').count(), 0);
  assert.equal(await page.locator('#toast-message').count() > 0, true);
  assert.deepEqual(page.appErrors, []);
  await page.context().close();
});
test('mobile and desktop layouts keep dialogs in viewport', async () => {
  for (const [width, height] of [[360, 640], [390, 844], [1440, 900]]) {
    const page = await pageFor(width, height);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await play(page, 'app-1');
    const runner = await page.locator('#webapp-runner-modal > div').boundingBox();
    assert.ok(runner.y >= 0 && runner.y + runner.height <= height + 1);
    await page.keyboard.press('Escape');
    assert.deepEqual(page.appErrors, []);
    if (width === 390) await page.screenshot({ path: 'test-results/mobile.png', fullPage: true });
    await page.context().close();
  }
});
test('timer audio is released when muted and when modal closes', async () => {
  const page = await pageFor();
  await page.evaluate(() => {
    window.createdAudio = [];
    const NativeAudio = window.AudioContext;
    window.AudioContext = class extends NativeAudio { constructor(...args) { super(...args); window.createdAudio.push(this); } };
  });
  await play(page, 'app-3');
  await page.getByRole('button', { name: /빗소리/ }).click();
  assert.equal(await page.evaluate(() => window.createdAudio.length), 1);
  await page.locator('#modal-sound-btn').click();
  await page.waitForFunction(() => window.createdAudio.every(ctx => ctx.state === 'closed'));
  await page.keyboard.press('Escape');
  assert.deepEqual(page.appErrors, []);
  await page.context().close();
});
test('public Firestore gallery is readable without signing in', async () => {
  const response = await fetch('https://firestore.googleapis.com/v1/projects/app-factory-festival/databases/(default)/documents/projects?pageSize=10');
  assert.equal(response.status, 200);
});
