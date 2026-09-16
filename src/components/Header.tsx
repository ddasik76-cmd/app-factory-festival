import React from 'react';
import { Plus } from 'lucide-react';
import type { User } from 'firebase/auth';

interface HeaderProps {
  onOpenRegister: () => void;
  onOpenProfile: () => void;
  user: User | null;
  canRegister?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onOpenRegister, onOpenProfile, user, canRegister }) => {
  return (
    <header className="fixed top-0 w-full z-40 bg-[#f8f9ff]/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] pt-safe">
      <div className="h-16 px-4 flex items-center justify-between gap-2 max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <img onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = `${import.meta.env.BASE_URL}fallback.svg`; }}
            alt="팔봉중학교 로고"
            className="h-9 w-9 object-contain rounded-full bg-white p-0.5 ring-1 ring-[#d3e4fe]"
            src={`${import.meta.env.BASE_URL}school-logo.jpg`}
            referrerPolicy="no-referrer"
          />
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-[17px] font-extrabold tracking-tight text-[#3525cd]">
                팔봉중 앱팩토리
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#57dffe] text-[#006172] text-[11px] font-bold">
                🚀 2026 페스티벌
              </span>
            </div>
            <span className="text-[11px] text-[#464555] font-semibold tracking-wide">
              Gallery
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canRegister && <button
            id="header-new-app-btn"
            onClick={onOpenRegister}
            className="h-9 px-3 rounded-full bg-[#4f46e5] text-white flex items-center gap-1.5 text-xs font-bold hover:bg-[#3525cd] transition-all active:scale-95 shadow-[0_4px_12px_rgba(79,70,229,0.25)]"
            type="button"
          >
            <Plus className="w-4 h-4" />
            <span>새 작품</span>
          </button>}
          
          <button
            id="header-profile-btn"
            onClick={onOpenProfile}
            className="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden ring-2 ring-indigo-100 hover:ring-indigo-300 active:scale-95 transition-all"
            type="button"
            title={user ? '내 계정' : 'Google 로그인'}
            aria-label={user ? '내 계정' : 'Google 로그인'}
          >
            {user?.photoURL ? <img onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = `${import.meta.env.BASE_URL}fallback.svg`; }}
              alt="내 프로필"
              className="w-8 h-8 rounded-full object-cover"
              src={user.photoURL}
              referrerPolicy="no-referrer"
            /> : <span className="text-[10px] font-bold text-[#3525cd]">로그인</span>}
          </button>
        </div>
      </div>
    </header>
  );
};
