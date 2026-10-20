import React, { useRef, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { thumbnailFunctions } from '../firebase';
import type { AppProject } from '../types';
import { thumbnailServiceEnabled } from '../thumbnails';

function message(error: unknown) {
  const code = (error as { code?: string })?.code;
  if (code === 'functions/resource-exhausted') return '요청이 많습니다. 1분 뒤 다시 시도해주세요.';
  if (code === 'functions/permission-denied' || code === 'functions/unauthenticated') return '작품 등록자 또는 관리자 로그인이 필요합니다.';
  if (code === 'functions/invalid-argument') return '3MB 이하의 PNG, JPEG, WebP 이미지인지 확인해주세요.';
  return '썸네일 서비스에 연결하지 못했습니다. 잠시 후 다시 시도해주세요.';
}

export function ThumbnailControls({ app }: { app: AppProject }) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const generating = ['pending', 'processing'].includes(app.thumbnailStatus || '');
  async function refresh() {
    setBusy(true); setNotice('');
    try {
      const result = await httpsCallable<{ projectId: string }, { queued: boolean }>(thumbnailFunctions, 'refreshThumbnail')({ projectId: app.id });
      setNotice(result.data.queued ? '첫 화면을 새로 가져오고 있습니다.' : '작품 수정에서 실제 웹앱 주소를 입력하거나 이미지를 등록해주세요.');
    } catch (error) { setNotice(message(error)); }
    finally { setBusy(false); }
  }
  async function upload(file?: File) {
    if (!file) return;
    if (file.size > 3 * 1024 * 1024 || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setNotice('3MB 이하의 PNG, JPEG, WebP 이미지를 선택해주세요.'); return;
    }
    setBusy(true); setNotice('');
    try {
      const encoded = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      await httpsCallable(thumbnailFunctions, 'uploadThumbnail')({ projectId: app.id, image: encoded });
      setNotice('첫 화면 이미지를 등록했습니다.');
    } catch (error) { setNotice(message(error)); }
    finally { setBusy(false); }
  }
  if (!thumbnailServiceEnabled) return null;
  return <div className="border-t border-slate-100 pt-2 text-xs">
    <div className="flex flex-wrap gap-2">
      <button type="button" disabled={busy || generating} onClick={() => void refresh()}
        className="rounded-lg bg-slate-100 px-3 py-2 font-semibold disabled:opacity-50">
        {generating ? '미리보기 준비 중' : '썸네일 새로고침'}
      </button>
      <button type="button" disabled={busy} onClick={() => input.current?.click()}
        className="rounded-lg bg-slate-100 px-3 py-2 font-semibold disabled:opacity-50">첫 화면 이미지 등록</button>
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
        aria-label={`${app.title} 첫 화면 이미지`}
        onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; void upload(file); }} />
    </div>
    <p role="status" className="mt-2 text-slate-600 leading-relaxed">
      {busy ? '처리 중입니다…' : notice || app.thumbnailError || '자동 캡처는 로그아웃 상태의 첫 화면을 사용합니다. 로그인 후 화면은 공개 가능한 이미지로 직접 등록해주세요.'}
    </p>
  </div>;
}

export function ThumbnailMigration() {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  async function migrate() {
    setBusy(true);
    let cursor: string | null = null, checked = 0, queued = 0;
    try {
      do {
        const result = await httpsCallable<{ cursor?: string }, { cursor: string | null; checked: number; queued: number }>(
          thumbnailFunctions, 'migrateThumbnails')({ ...(cursor ? { cursor } : {}) });
        cursor = result.data.cursor;
        checked += result.data.checked;
        queued += result.data.queued;
        setNotice(`${checked}개 확인 · ${queued}개 캡처 요청 완료`);
      } while (cursor);
      setNotice(`${checked}개 확인 · ${queued}개 캡처 요청 완료. 저장소 주소인 작품은 실제 웹앱 주소 또는 이미지 등록이 필요합니다.`);
    } catch (error) { setNotice(`${checked}개 확인 후 중단. ${message(error)} 다시 실행하면 미처리 작품부터 확인합니다.`); }
    finally { setBusy(false); }
  }
  if (!thumbnailServiceEnabled) return null;
  return <div className="mx-4 my-2 rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-xs">
    <button type="button" disabled={busy} onClick={() => void migrate()}
      className="font-bold text-indigo-800 disabled:opacity-50">{busy ? '기존 작품 확인 중…' : '기존 작품 썸네일 전환'}</button>
    <p role="status" className="mt-1 text-slate-600">{notice || '아직 전환하지 않은 공개 작품의 첫 화면을 순차적으로 준비합니다.'}</p>
  </div>;
}
