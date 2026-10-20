import dns from 'node:dns/promises';
import http from 'node:http';
import https from 'node:https';
import ipaddr from 'ipaddr.js';

export function publicAddress(address) {
  try {
    let parsed = ipaddr.parse(address);
    if (parsed.kind() === 'ipv6' && parsed.isIPv4MappedAddress()) parsed = parsed.toIPv4Address();
    return parsed.range() === 'unicast';
  } catch { return false; }
}

export function webUrl(value) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
      (url.port && !['80', '443'].includes(url.port))) throw new Error('unsafe-url');
  const hostname = url.hostname.replace(/^\[|\]$/g, '').replace(/\.$/, '').toLowerCase();
  if (hostname === 'localhost' || hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') || hostname.endsWith('.internal') || !hostname.includes('.')) {
    throw new Error('unsafe-url');
  }
  if (ipaddr.isValid(hostname) && !publicAddress(hostname)) throw new Error('unsafe-url');
  return url;
}

export function needsAppUrl(value) {
  try {
    const url = webUrl(value);
    return ['github.com', 'www.github.com', 'gitlab.com'].includes(url.hostname);
  } catch { return true; }
}

// Pin the connection to the validated DNS answer. Every redirect and subresource
// passes through this function; Chromium itself has no usable network proxy.
export async function publicRequest(value, { method = 'GET', headers = {}, body } = {}) {
  const url = webUrl(value);
  const hostname = url.hostname.replace(/^\[|\]$/g, '');
  const answers = await dns.lookup(hostname, { all: true });
  if (!answers.length || answers.some(answer => !publicAddress(answer.address))) throw new Error('unsafe-address');
  const answer = answers[0];
  const safeHeaders = {};
  for (const name of ['accept', 'accept-language', 'content-type', 'origin', 'referer', 'user-agent']) {
    if (headers[name]) safeHeaders[name] = headers[name];
  }
  safeHeaders['accept-encoding'] = 'identity';
  if (!['GET', 'HEAD', 'OPTIONS', 'POST'].includes(method)) throw new Error('blocked-method');
  if (body && Buffer.byteLength(body) > 64 * 1024) throw new Error('request-too-large');
  return new Promise((resolve, reject) => {
    const request = (url.protocol === 'https:' ? https : http).request(url, {
      method, headers: safeHeaders, agent: false,
      lookup: (_host, options, callback) => {
        if (options?.all) callback(null, [answer]);
        else callback(null, answer.address, answer.family);
      },
    }, response => {
      const chunks = [];
      let size = 0;
      response.on('data', chunk => {
        size += chunk.length;
        if (size > 8 * 1024 * 1024) request.destroy(new Error('response-too-large'));
        else chunks.push(chunk);
      });
      response.on('error', reject);
      response.on('end', () => {
        const resultHeaders = {};
        for (const [name, value] of Object.entries(response.headers)) {
          if (value && !['set-cookie', 'connection', 'transfer-encoding', 'content-length'].includes(name)) {
            resultHeaders[name] = Array.isArray(value) ? value.join(', ') : value;
          }
        }
        resolve({ status: response.statusCode || 502, headers: resultHeaders, body: Buffer.concat(chunks) });
      });
    });
    const deadline = setTimeout(() => request.destroy(new Error('request-timeout')), 12000);
    request.on('close', () => clearTimeout(deadline));
    request.on('error', reject);
    request.end(body);
  });
}
