import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { deleteApp, getApps } from 'firebase-admin/app';
import sharp from 'sharp';

if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_STORAGE_EMULATOR_HOST) {
  throw new Error('Run through firebase emulators:exec; production access is forbidden.');
}
process.env.GCLOUD_PROJECT = 'demo-app-factory';
process.env.FIREBASE_CONFIG = JSON.stringify({
  projectId: 'demo-app-factory', storageBucket: 'demo-app-factory.firebasestorage.app',
});
const api = await import('../index.js');
const db = getFirestore();
const auth = { uid: 'owner' };
const ref = id => db.doc(`projects/${id}`);
const job = id => db.doc(`thumbnailJobs/${id}`);
const seed = async (id, extra = {}) => ref(id).set({
  url: 'https://example.com', imageUrl: 'https://example.com/previous.webp',
  creatorId: 'owner', hidden: false, ...extra,
});
const event = (id, before, after) => ({
  params: { projectId: id }, data: { before: { data: () => before }, after: { data: () => after } },
});
before(async () => { await db.doc('admins/admin').set({ active: true }); });
after(async () => { await Promise.all(getApps().map(app => deleteApp(app))); });

test('manual refresh checks auth, owner and rate limit', async () => {
  await seed('permission');
  await assert.rejects(api.refreshThumbnail.run({ data: { projectId: 'permission' } }), { code: 'unauthenticated' });
  await assert.rejects(api.refreshThumbnail.run({ auth: { uid: 'stranger' }, data: { projectId: 'permission' } }), { code: 'permission-denied' });
  assert.equal((await api.refreshThumbnail.run({ auth, data: { projectId: 'permission' } })).queued, true);
  await assert.rejects(api.refreshThumbnail.run({ auth, data: { projectId: 'permission' } }), { code: 'resource-exhausted' });
  assert.equal((await ref('permission').get()).data().imageUrl, 'https://example.com/previous.webp');
});

test('URL change supersedes old revision and duplicate events do not enqueue twice', async () => {
  await seed('change');
  const initial = (await ref('change').get()).data();
  await api.queueProjectThumbnail.run(event('change', undefined, initial));
  const old = (await job('change').get()).data();
  await ref('change').update({ url: 'https://example.org' });
  const latest = (await ref('change').get()).data();
  await api.queueProjectThumbnail.run(event('change', initial, latest));
  const next = (await job('change').get()).data();
  assert.notEqual(next.revision, old.revision);
  await api.queueProjectThumbnail.run(event('change', initial, latest));
  assert.equal((await job('change').get()).data().revision, next.revision);
  await api.captureProjectThumbnail.run(event('change', undefined, old));
  assert.equal((await job('change').get()).data().revision, next.revision);
});

test('failed captures retain the previous thumbnail and report a recoverable error', async () => {
  await seed('failure', { url: 'http://127.0.0.1' });
  const incoming = { url: 'http://127.0.0.1', revision: 'failure-revision', status: 'pending', leaseUntil: 0 };
  await job('failure').set(incoming);
  await api.captureProjectThumbnail.run(event('failure', undefined, incoming));
  const data = (await ref('failure').get()).data();
  assert.equal(data.thumbnailStatus, 'failed');
  assert.equal(data.imageUrl, 'https://example.com/previous.webp');
});

test('manual uploads validate image content and save a real normalized 16:9 image', async () => {
  await seed('upload');
  await assert.rejects(api.uploadThumbnail.run({
    auth, data: { projectId: 'upload', image: Buffer.from('<script>invalid image</script>').toString('base64') },
  }), { code: 'invalid-argument' });
  const input = await sharp({ create: { width: 600, height: 800, channels: 3, background: '#e5eeff' } }).png().toBuffer();
  await api.uploadThumbnail.run({ auth, data: { projectId: 'upload', image: input.toString('base64') } });
  const data = (await ref('upload').get()).data();
  assert.equal(data.thumbnailStatus, 'ready');
  assert.equal(data.thumbnailSource, 'upload');
  const [bytes] = await getStorage().bucket().file(data.thumbnailStoragePath).download();
  const meta = await sharp(bytes).metadata();
  assert.equal(meta.width, 1280); assert.equal(meta.height, 720); assert.equal(meta.format, 'webp');
});

test('a stale URL event preserves a freshly uploaded thumbnail for the same URL', async () => {
  const data = (await ref('upload').get()).data();
  await api.queueProjectThumbnail.run(event('upload', undefined, data));
  assert.equal((await ref('upload').get()).data().thumbnailSource, 'upload');
  assert.equal((await job('upload').get()).data().status, 'ready');
});

test('repository links need a live URL and migration is admin-only and resumable', async () => {
  await seed('repository', { url: 'https://github.com/example/repo' });
  await seed('hidden', { hidden: true });
  await assert.rejects(api.migrateThumbnails.run({ auth, data: {} }), { code: 'permission-denied' });
  await api.migrateThumbnails.run({ auth: { uid: 'admin' }, data: {} });
  assert.equal((await ref('repository').get()).data().thumbnailStatus, 'needs-url');
  assert.equal((await ref('hidden').get()).data().thumbnailStatus, undefined);
  const revision = (await job('repository').get()).data().revision;
  await api.migrateThumbnails.run({ auth: { uid: 'admin' }, data: {} });
  assert.equal((await job('repository').get()).data().revision, revision);
});

test('expired worker lease can recover and active lease rejects duplicate execution', async () => {
  await seed('lease', { url: 'http://127.0.0.1' });
  const incoming = { url: 'http://127.0.0.1', revision: 'lease-revision', status: 'pending' };
  await job('lease').set({ ...incoming, status: 'processing', leaseUntil: Date.now() + 60000, requestedAt: Timestamp.now() });
  await assert.rejects(api.captureProjectThumbnail.run(event('lease', undefined, incoming)), /capture-lease-active/);
  await job('lease').update({ leaseUntil: 0 });
  await api.captureProjectThumbnail.run(event('lease', undefined, incoming));
  assert.equal((await job('lease').get()).data().status, 'failed');
});
