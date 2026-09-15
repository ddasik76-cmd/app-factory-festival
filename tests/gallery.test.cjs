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
async function fillRegistration(page, title = '테스트 프로젝트') {
  await page.locator('#open-register-btn').click();
  await page.locator('#reg-title').fill(title);
  await page.locator('#reg-dev').fill('테스트 학생');
  await page.locator('#reg-url').fill('https://example.com/project');
}
test('search intersects category and clearing retains selected category', async () => {
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
test('registered games persist and launch their own URL, likes stay synchronized', async () => {
  const page = await pageFor();
  await fillRegistration(page, '<img src=x onerror=alert(1)>');
  await page.locator('#submission-form button[type=submit]').click();
  assert.equal(await cards(page).count(), 6);
  assert.equal(await cards(page).first().locator('h3 img').count(), 0);
  await page.reload();
  await page.locator('#item-count').waitFor();
  assert.equal(await cards(page).count(), 6);
  await cards(page).first().locator('button').first().click();
  assert.equal(await page.locator('#modal-newtab-btn').getAttribute('href'), 'https://example.com/project');
  assert.equal(await page.locator('#sim-active-board').count(), 0);
  await page.locator('#modal-like-btn').click();
  assert.equal(await page.locator('#modal-like-count').textContent(), '1');
  await page.locator('#modal-like-btn').click();
  assert.equal(await page.locator('#modal-like-count').textContent(), '0');
  await page.locator('#modal-star-rate').click();
  await page.keyboard.press('Escape');
  await play(page, 'app-1');
  assert.equal(await page.locator('#modal-like-count').textContent(), '67');
  assert.deepEqual(page.appErrors, []);
  await page.context().close();
});
test('unsafe URLs, failed storage, clipboard denial, and corrupted storage are handled', async () => {
  const page = await pageFor();
  await page.locator('#admin-dev-name').fill('학생');
  await page.locator('#admin-app-title').fill('주소 테스트');
  await page.locator('#admin-app-url').fill('javascript:alert(1)');
  await page.locator('#quick-admin-form button').click();
  assert.equal(await cards(page).count(), 5);
  await fillRegistration(page);
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new Error('quota'); }; });
  await page.locator('#submission-form button[type=submit]').click();
  assert.equal(await page.locator('#full-register-modal').isVisible(), true);
  assert.equal(await page.locator('#reg-title').inputValue(), '테스트 프로젝트');
  assert.match(await page.locator('#toast-message').textContent(), /저장하지 못했습니다/);
  await page.keyboard.press('Escape');
  await play(page, 'app-1');
  await page.evaluate(() => { navigator.clipboard.writeText = () => Promise.reject(new Error('denied')); });
  await page.locator('#modal-share-btn').click();
  await page.waitForFunction(() => document.getElementById('toast-message').textContent.includes('복사하지 못했습니다'));
  await page.reload();
  await page.evaluate(() => localStorage.setItem('appfactory-projects-v1', '{broken'));
  await page.reload();
  await page.locator('#item-count').waitFor();
  assert.equal(await cards(page).count(), 5);
  assert.deepEqual(page.appErrors, []);
  await page.context().close();
});
test('mobile/desktop layouts and modal keyboard focus work with external services unavailable', async () => {
  for (const [width, height] of [[360, 640], [390, 844], [1440, 900]]) {
    const page = await pageFor(width, height);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.locator('#open-register-btn').click();
    const bounds = await page.locator('#full-register-modal > div').boundingBox();
    assert.ok(bounds.y >= 0 && bounds.y + bounds.height <= height + 1);
    await page.keyboard.press('Shift+Tab');
    assert.equal(await page.evaluate(() => document.activeElement.closest('#full-register-modal') !== null), true);
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'open-register-btn');
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
  await page.locator('#modal-sound-btn').click();
  assert.equal(await page.evaluate(() => window.createdAudio.length), 2);
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => window.createdAudio.every(ctx => ctx.state === 'closed'));
  assert.deepEqual(page.appErrors, []);
  await page.context().close();
});
