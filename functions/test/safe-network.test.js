import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import dns from 'node:dns/promises';
import https from 'node:https';
import { EventEmitter } from 'node:events';
import { publicAddress, webUrl, needsAppUrl, publicRequest } from '../safe-network.js';

test('blocks loopback, metadata, private, mapped IPv6 and reserved networks', () => {
  for (const address of ['127.0.0.1', '10.0.0.8', '172.16.0.1', '192.168.1.1',
    '169.254.169.254', '100.64.0.1', '0.0.0.0', '::1', 'fc00::1', 'fe80::1', '::ffff:127.0.0.1']) {
    assert.equal(publicAddress(address), false, address);
  }
  assert.equal(publicAddress('93.184.216.34'), true);
});

test('rejects URL tricks, credentials and alternate service ports', () => {
  for (const url of ['file:///etc/passwd', 'ftp://example.com', 'http://2130706433',
    'http://0x7f000001', 'http://127.1', 'http://[::ffff:127.0.0.1]',
    'http://user:password@example.com', 'https://example.com:8443', 'http://metadata.google.internal',
    'http://localhost.', 'http://localhost']) {
    assert.throws(() => webUrl(url), undefined, url);
  }
  assert.equal(webUrl('https://school.github.io/app/?v=1').hostname, 'school.github.io');
  assert.equal(needsAppUrl('https://github.com/school/app'), true);
  assert.equal(needsAppUrl('https://school.github.io/app/'), false);
});

test('rejects a domain if any DNS answer points to a private network', async () => {
  const lookup = mock.method(dns, 'lookup', async () => [
    { address: '93.184.216.34', family: 4 }, { address: '127.0.0.1', family: 4 },
  ]);
  try { await assert.rejects(publicRequest('https://example.com'), /unsafe-address/); }
  finally { lookup.mock.restore(); }
});

test('pins transport DNS and does not forward credentials or follow redirects unchecked', async () => {
  const lookup = mock.method(dns, 'lookup', async () => [{ address: '93.184.216.34', family: 4 }]);
  const request = mock.method(https, 'request', (_url, options, callback) => {
    assert.equal(options.headers.authorization, undefined);
    assert.equal(options.headers.cookie, undefined);
    options.lookup('changed.example', {}, (error, address) => {
      assert.equal(error, null); assert.equal(address, '93.184.216.34');
    });
    const stream = new EventEmitter();
    stream.end = () => queueMicrotask(() => {
      const response = new EventEmitter();
      response.statusCode = 302;
      response.headers = { location: 'http://169.254.169.254/latest/meta-data/', 'set-cookie': 'secret=abc' };
      callback(response);
      response.emit('end');
      stream.emit('close');
    });
    stream.destroy = error => { stream.emit('error', error); stream.emit('close'); };
    return stream;
  });
  try {
    const response = await publicRequest('https://example.com', { headers: { authorization: 'secret', cookie: 'secret' } });
    assert.equal(response.status, 302);
    assert.equal(response.headers['set-cookie'], undefined);
    await assert.rejects(publicRequest(response.headers.location), /unsafe-url/);
  } finally { lookup.mock.restore(); request.mock.restore(); }
});
