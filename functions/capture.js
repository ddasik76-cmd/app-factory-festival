import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { publicRequest, webUrl } from './safe-network.js';
import { fileURLToPath } from 'node:url';

export async function captureFirstScreen(url, executablePath) {
  webUrl(url);
  const browser = await puppeteer.launch({
    executablePath: executablePath || await chromium.executablePath(),
    args: [...chromium.args, '--proxy-server=http://127.0.0.1:9', '--proxy-bypass-list=<-loopback>',
      '--disable-quic', '--force-webrtc-ip-handling-policy=disable_non_proxied_udp'],
    headless: true,
    env: {
      ...process.env,
      ...(process.platform === 'linux' ? { FONTCONFIG_PATH: fileURLToPath(new URL('./fonts/', import.meta.url)) } : {}),
    },
    defaultViewport: { width: 1280, height: 720, deviceScaleFactor: 1 },
  });
  const deadline = setTimeout(() => void browser.close().catch(() => undefined), 55000);
  try {
    // Each job launches a fresh browser. Extra incognito contexts are unnecessary
    // and are not supported reliably by serverless Chromium's single-process mode.
    const page = await browser.newPage();
    await page.setBypassServiceWorker(true);
    await page.setRequestInterception(true);
    let requests = 0;
    let bytes = 0;
    page.on('request', async request => {
      try {
        if (++requests > 180 || bytes > 40 * 1024 * 1024) return void await request.abort();
        if (/^(data|blob):/.test(request.url())) return void await request.continue();
        const response = await publicRequest(request.url(), {
          method: request.method(), headers: request.headers(), body: request.postData(),
        });
        bytes += response.body.length;
        await request.respond(response);
      } catch { await request.abort().catch(() => undefined); }
    });
    page.on('popup', popup => void popup.close());
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    if (!response || response.status() >= 400) throw new Error('page-unavailable');
    await page.waitForNetworkIdle({ idleTime: 700, timeout: 8000 }).catch(() => undefined);
    await page.evaluate(async () => {
      await Promise.race([
        Promise.all([document.fonts.ready, ...Array.from(document.images, image => image.decode().catch(() => undefined))]),
        new Promise(resolve => setTimeout(resolve, 3000)),
      ]);
    });
    const text = await page.evaluate(() => document.body?.innerText || '');
    if (/just a moment|verify you are human|checking your browser|access denied|사이트에 연결할 수 없음/i.test(text.slice(0, 1500))) {
      throw new Error('capture-blocked');
    }
    if (!text.trim() && !await page.$('img, canvas, svg, video')) throw new Error('empty-page');
    return Buffer.from(await page.screenshot({ type: 'webp', quality: 82, fullPage: false }));
  } finally {
    clearTimeout(deadline);
    await browser.close();
  }
}
