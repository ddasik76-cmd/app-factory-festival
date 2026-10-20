// Operator-only migration using the operator's existing Firebase CLI login.
// Default is read-only. --enqueue explicitly writes jobs; no Firebase user is impersonated.
const { randomUUID } = require('node:crypto');
const path = require('node:path');

(async () => {
  const toolsPath = process.env.FIREBASE_TOOLS_AUTH_PATH;
  if (!toolsPath || !path.isAbsolute(toolsPath)) throw new Error('Set FIREBASE_TOOLS_AUTH_PATH to the installed firebase-tools/lib/auth.js.');
  const auth = require(toolsPath);
  const account = auth.getGlobalDefaultAccount();
  if (!account?.tokens?.refresh_token) throw new Error('Sign in with firebase login first.');
  const credential = await auth.getAccessToken(account.tokens.refresh_token, ['https://www.googleapis.com/auth/cloud-platform']);
  const headers = { Authorization: `Bearer ${credential.access_token}`, 'Content-Type': 'application/json' };
  const database = 'projects/app-factory-festival/databases/(default)';
  const base = `https://firestore.googleapis.com/v1/${database}/documents`;
  const options = new Set(process.argv.slice(2));
  const limit = Number(process.argv.find(value => value.startsWith('--limit='))?.split('=')[1]) || 500;
  const result = await fetch(`${base}:runQuery`, {
    method: 'POST', headers,
    body: JSON.stringify({ structuredQuery: {
      from: [{ collectionId: 'projects' }],
      where: { fieldFilter: { field: { fieldPath: 'hidden' }, op: 'EQUAL', value: { booleanValue: false } } },
      limit: 500,
    } }),
  });
  if (!result.ok) throw new Error(`Project list: HTTP ${result.status}`);
  const projects = (await result.json()).flatMap(item => item.document ? [item.document] : []);
  let queued = 0;
  for (const project of projects) {
    const id = project.name.split('/').pop();
    const status = project.fields.thumbnailStatus?.stringValue;
    const title = project.fields.title?.stringValue;
    if (status && !(options.has('--retry-failed') && status === 'failed')) {
      console.log(JSON.stringify({ id, title, status, skipped: true }));
      continue;
    }
    const url = project.fields.url.stringValue;
    if (!options.has('--enqueue')) {
      console.log(JSON.stringify({ id, title, status: 'not-migrated', url }));
      continue;
    }
    if (queued >= limit) break;
    const jobName = `${database}/documents/thumbnailJobs/${id}`;
    const oldResponse = await fetch(`https://firestore.googleapis.com/v1/${jobName}`, { headers });
    if (!oldResponse.ok && oldResponse.status !== 404) throw new Error(`Job read: HTTP ${oldResponse.status}`);
    const oldJob = oldResponse.ok ? await oldResponse.json() : null;
    const stringValue = value => ({ stringValue: value });
    const writes = [
      {
        update: { name: jobName, fields: {
          url: stringValue(url), revision: stringValue(randomUUID()),
          status: stringValue('pending'), leaseUntil: { integerValue: '0' },
        } },
        updateTransforms: [{ fieldPath: 'requestedAt', setToServerValue: 'REQUEST_TIME' }],
        currentDocument: oldJob ? { updateTime: oldJob.updateTime } : { exists: false },
      },
      {
        update: { name: project.name, fields: { thumbnailStatus: stringValue('pending'), thumbnailError: stringValue('') } },
        updateMask: { fieldPaths: ['thumbnailStatus', 'thumbnailError'] },
        currentDocument: { updateTime: project.updateTime },
      },
    ];
    const commit = await fetch(`${base}:commit`, { method: 'POST', headers, body: JSON.stringify({ writes }) });
    if (!commit.ok) {
      const error = await commit.json();
      throw new Error(`${id}: ${error.error?.message || commit.status}`);
    }
    queued++;
    console.log(JSON.stringify({ id, title, status: 'queued' }));
  }
  console.log(JSON.stringify({ checked: projects.length, queued }));
})().catch(error => { console.error(error.message); process.exitCode = 1; });
