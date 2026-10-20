import { randomUUID } from 'node:crypto';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue, FieldPath } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import sharp from 'sharp';
import { captureFirstScreen } from './capture.js';
import { needsAppUrl } from './safe-network.js';

initializeApp();
const db = getFirestore();
const region = 'asia-northeast3';
const callOptions = { region, timeoutSeconds: 120, maxInstances: 3, concurrency: 4, memory: '512MiB' };
const stamp = () => FieldValue.serverTimestamp();
const projectRef = id => db.collection('projects').doc(id);
const jobRef = id => db.collection('thumbnailJobs').doc(id);
function idFrom(data) {
  if (typeof data?.projectId !== 'string' || !/^[\w-]{1,150}$/.test(data.projectId)) {
    throw new HttpsError('invalid-argument', '올바른 작품을 선택해주세요.');
  }
  return data.projectId;
}
async function isAdmin(auth) {
  return !!auth && (await db.doc(`admins/${auth.uid}`).get()).exists;
}
async function authorize(auth, id) {
  if (!auth) throw new HttpsError('unauthenticated', '로그인이 필요합니다.');
  const snapshot = await projectRef(id).get();
  if (!snapshot.exists) throw new HttpsError('not-found', '작품을 찾을 수 없습니다.');
  if (snapshot.data().creatorId !== auth.uid && !await isAdmin(auth)) {
    throw new HttpsError('permission-denied', '작품 등록자 또는 관리자만 사용할 수 있습니다.');
  }
  return snapshot.data();
}

// All queue writers use a transaction so URL changes and old capture results
// cannot overwrite one another. Jobs and capture fields are server-owned.
async function enqueue(id, { force = false, onlyMissing = false } = {}) {
  return db.runTransaction(async tx => {
    const [project, job] = await Promise.all([tx.get(projectRef(id)), tx.get(jobRef(id))]);
    if (!project.exists) return false;
    const data = project.data();
    if (onlyMissing && (data.thumbnailStatus || data.hidden)) return false;
    if (!force && job.exists && job.data().url === data.url) return false;
    if (force && job.exists && Date.now() - (job.data().requestedAt?.toMillis() || 0) < 60000) {
      throw new HttpsError('resource-exhausted', '1분 뒤 다시 요청해주세요.');
    }
    const status = needsAppUrl(data.url) ? 'needs-url' : 'pending';
    const revision = randomUUID();
    tx.set(jobRef(id), { url: data.url, revision, status, requestedAt: stamp(), leaseUntil: 0 });
    tx.update(projectRef(id), {
      thumbnailStatus: status,
      thumbnailError: status === 'needs-url' ? '실행 가능한 웹앱 주소를 입력하거나 첫 화면 이미지를 등록해주세요.' : '',
    });
    return status === 'pending';
  });
}

export const queueProjectThumbnail = onDocumentWritten({
  document: 'projects/{projectId}', region, retry: true, maxInstances: 3,
}, async event => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  if (!after) {
    const id = event.params.projectId;
    if ((await projectRef(id).get()).exists) return;
    await jobRef(id).delete();
    if (before?.thumbnailStoragePath?.startsWith(`project-thumbnails/${id}/`)) {
      await getStorage().bucket().file(before.thumbnailStoragePath).delete().catch(() => undefined);
    }
    return;
  }
  if (!before || before.url !== after.url) await enqueue(event.params.projectId);
});

export const refreshThumbnail = onCall(callOptions, async request => {
  const id = idFrom(request.data);
  await authorize(request.auth, id);
  return { queued: await enqueue(id, { force: true }) };
});

async function storeImage(id, revision, bytes) {
  const bucket = getStorage().bucket();
  const path = `project-thumbnails/${id}/${revision}.webp`;
  const file = bucket.file(path);
  const token = randomUUID();
  await file.save(bytes, {
    resumable: false,
    metadata: { contentType: 'image/webp', cacheControl: 'public,max-age=31536000,immutable',
      metadata: { firebaseStorageDownloadTokens: token } },
  });
  return { file, path, url: `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media&token=${token}` };
}

async function finish(id, revision, sourceUrl, image, source) {
  const result = await db.runTransaction(async tx => {
    const [job, project] = await Promise.all([tx.get(jobRef(id)), tx.get(projectRef(id))]);
    if (!job.exists || !project.exists || job.data().revision !== revision || project.data().url !== sourceUrl) {
      return { saved: false };
    }
    const oldPath = project.data().thumbnailStoragePath;
    tx.update(projectRef(id), {
      imageUrl: image.url, thumbnailStatus: 'ready', thumbnailSource: source,
      thumbnailSourceUrl: sourceUrl, thumbnailStoragePath: image.path,
      thumbnailUpdatedAt: stamp(), thumbnailError: '',
    });
    tx.update(jobRef(id), { status: 'ready', completedAt: stamp() });
    return { saved: true, oldPath };
  });
  if (!result.saved) await image.file.delete().catch(() => undefined);
  if (result.oldPath?.startsWith(`project-thumbnails/${id}/`) && result.oldPath !== image.path) {
    await getStorage().bucket().file(result.oldPath).delete().catch(() => undefined);
  }
  return result.saved;
}

async function fail(id, revision) {
  await db.runTransaction(async tx => {
    const [job, project] = await Promise.all([tx.get(jobRef(id)), tx.get(projectRef(id))]);
    if (!job.exists || job.data().revision !== revision) return;
    tx.update(jobRef(id), { status: 'failed', completedAt: stamp() });
    if (project.exists && project.data().url === job.data().url) tx.update(projectRef(id), {
      thumbnailStatus: 'failed',
      thumbnailError: '첫 화면을 가져오지 못했습니다. 주소를 확인한 뒤 재시도하거나 이미지를 직접 등록해주세요.',
    });
  });
}

export const captureProjectThumbnail = onDocumentWritten({
  document: 'thumbnailJobs/{projectId}', region, retry: true,
  memory: '2GiB', timeoutSeconds: 120, maxInstances: 2, concurrency: 1,
}, async event => {
  const incoming = event.data?.after.data();
  if (incoming?.status !== 'pending') return;
  const id = event.params.projectId;
  const claimed = await db.runTransaction(async tx => {
    const [job, project] = await Promise.all([tx.get(jobRef(id)), tx.get(projectRef(id))]);
    if (!job.exists || !project.exists || job.data().revision !== incoming.revision ||
        project.data().url !== incoming.url || !['pending', 'processing'].includes(job.data().status)) return false;
    if (job.data().leaseUntil > Date.now()) throw new Error('capture-lease-active');
    tx.update(jobRef(id), { status: 'processing', leaseUntil: Date.now() + 150000 });
    tx.update(projectRef(id), { thumbnailStatus: 'processing' });
    return true;
  });
  if (!claimed) return;
  try {
    const bytes = await captureFirstScreen(incoming.url);
    const image = await storeImage(id, incoming.revision, bytes);
    await finish(id, incoming.revision, incoming.url, image, 'capture');
  } catch (error) {
    console.warn('Thumbnail capture failed', { projectId: id, reason: error?.message });
    await fail(id, incoming.revision);
  }
});

export const uploadThumbnail = onCall(callOptions, async request => {
  const id = idFrom(request.data);
  await authorize(request.auth, id);
  const encoded = request.data.image;
  if (typeof encoded !== 'string' || encoded.length > 4200000 || !/^[A-Za-z0-9+/]*={0,2}$/.test(encoded)) {
    throw new HttpsError('invalid-argument', '3MB 이하의 PNG, JPEG, WebP 이미지를 선택해주세요.');
  }
  let bytes;
  try {
    const input = Buffer.from(encoded, 'base64');
    if (input.length > 3 * 1024 * 1024) throw new Error('image-too-large');
    const metadata = await sharp(input, { limitInputPixels: 16000000 }).metadata();
    if (!['png', 'jpeg', 'webp'].includes(metadata.format)) throw new Error('invalid-image');
    bytes = await sharp(input, { limitInputPixels: 16000000 }).rotate()
      .resize(1280, 720, { fit: 'contain', background: '#f1f5f9' }).webp({ quality: 82 }).toBuffer();
  } catch {
    throw new HttpsError('invalid-argument', '이미지를 읽을 수 없습니다. PNG, JPEG, WebP 파일을 확인해주세요.');
  }
  const revision = randomUUID();
  const sourceUrl = await db.runTransaction(async tx => {
    const [project, job] = await Promise.all([tx.get(projectRef(id)), tx.get(jobRef(id))]);
    if (!project.exists) throw new HttpsError('not-found', '작품을 찾을 수 없습니다.');
    if (job.exists && Date.now() - (job.data().requestedAt?.toMillis() || 0) < 60000) {
      throw new HttpsError('resource-exhausted', '1분 뒤 다시 요청해주세요.');
    }
    const url = project.data().url;
    tx.set(jobRef(id), { revision, url, status: 'uploading', requestedAt: stamp(), leaseUntil: 0 });
    return url;
  });
  try {
    const image = await storeImage(id, revision, bytes);
    const saved = await finish(id, revision, sourceUrl, image, 'upload');
    if (!saved) throw new HttpsError('aborted', '작품 주소가 변경되었습니다. 다시 등록해주세요.');
    return { saved };
  } catch (error) {
    await fail(id, revision);
    throw error;
  }
});

// Small pages keep migration resumable and avoid an unbounded capture burst.
export const migrateThumbnails = onCall(callOptions, async request => {
  if (!await isAdmin(request.auth)) throw new HttpsError('permission-denied', '관리자만 사용할 수 있습니다.');
  let query = db.collection('projects').orderBy(FieldPath.documentId()).limit(20);
  const cursor = request.data?.cursor;
  if (cursor !== undefined && (typeof cursor !== 'string' || !/^[\w-]{1,150}$/.test(cursor))) {
    throw new HttpsError('invalid-argument', '잘못된 이어하기 위치입니다.');
  }
  if (cursor) query = query.startAfter(cursor);
  const page = await query.get();
  let queued = 0;
  for (const project of page.docs) if (await enqueue(project.id, { onlyMissing: true })) queued++;
  return { queued, checked: page.size, cursor: page.size === 20 ? page.docs.at(-1).id : null };
});
