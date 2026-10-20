// Read public projects and prepare static first-screen previews. No production
// documents are changed. Re-run after URL changes; existing successes are reused.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { captureFirstScreen } from '../capture.js';
import { needsAppUrl } from '../safe-network.js';

const root = new URL('../../', import.meta.url);
const output = new URL('public/project-thumbnails/', root);
const manifestFile = new URL('src/data/projectThumbnails.json', root);
await mkdir(output, { recursive: true });
const manifest = JSON.parse(await readFile(manifestFile, 'utf8').catch(() => '{}'));
const response = await fetch('https://firestore.googleapis.com/v1/projects/app-factory-festival/databases/(default)/documents:runQuery', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ structuredQuery: {
    from: [{ collectionId: 'projects' }],
    where: { fieldFilter: { field: { fieldPath: 'hidden' }, op: 'EQUAL', value: { booleanValue: false } } },
    limit: 500,
  } }),
});
if (!response.ok) throw new Error(`Project list: HTTP ${response.status}`);
const docs = (await response.json()).flatMap(item => item.document ? [item.document] : []);
const limit = Number(process.env.CAPTURE_LIMIT) || docs.length;
let done = 0;
for (const doc of docs) {
  const id = doc.name.split('/').pop();
  if (!/^[\w-]{1,150}$/.test(id)) continue;
  const url = doc.fields.url?.stringValue;
  const title = doc.fields.title?.stringValue || id;
  if (manifest[id]?.url === url && manifest[id]?.status === 'ready' && !process.env.CAPTURE_FORCE) continue;
  if (++done > limit) break;
  try {
    if (needsAppUrl(url)) throw new Error('needs-live-app-url');
    const bytes = await captureFirstScreen(url, process.env.CHROME_PATH);
    const file = `${id}.webp`;
    await writeFile(new URL(file, output), bytes);
    manifest[id] = { url, file, status: 'ready', capturedAt: new Date().toISOString() };
    console.log(JSON.stringify({ title, status: 'ready', bytes: bytes.length }));
  } catch (error) {
    manifest[id] = { url, status: 'failed', reason: error.message };
    console.log(JSON.stringify({ title, status: 'failed', reason: error.message }));
  }
  await writeFile(manifestFile, JSON.stringify(manifest, null, 2) + '\n');
}
console.log(`Manifest: ${fileURLToPath(manifestFile)}`);
