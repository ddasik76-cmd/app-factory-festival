/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { SearchAndFilters } from './components/SearchAndFilters';
import { QuickDeployBanner } from './components/QuickDeployBanner';
import { AppCard } from './components/AppCard';
import { HallOfFame } from './components/HallOfFame';
import { WebAppRunnerModal } from './components/WebAppRunnerModal';
import { RegisterModal } from './components/RegisterModal';
import { BottomNav } from './components/BottomNav';
import { RankingsView } from './components/RankingsView';
import { AboutClubView } from './components/AboutClubView';
import { Toast } from './components/Toast';
import { loadApps, saveApps, safeUrl } from './storage';
import { useModal } from './useModal';
import { AppProject, Category, ActiveTab } from './types';
import { User, X, Laptop, Heart, Star, Sparkles } from 'lucide-react';

export default function App() {
  const [apps, setApps] = useState<AppProject[]>(loadApps);
  const [activeTab, setActiveTab] = useState<ActiveTab>('gallery');
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState<AppProject | null>(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useModal(isProfileModalOpen, 'profile-modal', () => setIsProfileModalOpen(false));
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);
  const currentApp = apps.find(app => app.id === selectedApp?.id) || null;
  const showToast = (msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMessage(msg);
    toastTimer.current = setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 2500);
  };

  const totalPlays = useMemo(() => {
    return apps.reduce((acc, cur) => acc + cur.plays, 0);
  }, [apps]);

  const totalHearts = useMemo(() => {
    return apps.reduce((acc, cur) => acc + cur.likes, 0);
  }, [apps]);

  const filteredApps = useMemo(() => {
    return apps.filter((app) => {
      const matchCat = selectedCategory === 'all' || app.category === selectedCategory;
      const query = searchQuery.toLowerCase().trim();
      const matchQuery =
        !query ||
        app.title.toLowerCase().includes(query) ||
        app.description.toLowerCase().includes(query) ||
        app.authorName.toLowerCase().includes(query) ||
        app.tech.toLowerCase().includes(query);
      return matchCat && matchQuery;
    });
  }, [apps, selectedCategory, searchQuery]);

  const updateApps = (next: AppProject[]) => {
    if (!saveApps(next)) { showToast('저장하지 못했습니다. 브라우저 저장 공간과 설정을 확인해주세요.'); return false; }
    setApps(next);
    return true;
  };
  const handleToggleLike = (appId: string) => updateApps(apps.map(item => item.id === appId ? {
    ...item, isLiked: !item.isLiked, likes: Math.max(0, item.likes + (item.isLiked ? -1 : 1)),
  } : item));
  const handleRate = (appId: string) => updateApps(apps.map(item => item.id === appId ? { ...item, rating: 5 } : item));

  const handleQuickDeploy = (
    newApp: Omit<AppProject, 'id' | 'rating' | 'plays' | 'commentsCount' | 'likes'>
  ) => {
    const url = safeUrl(newApp.url);
    if (!url || !newApp.title.trim() || !newApp.authorName.trim()) { showToast('제목, 개발자와 올바른 HTTP(S) 주소를 입력해주세요.'); return false; }
    const fullApp: AppProject = {
      ...newApp, url, title: newApp.title.trim(), authorName: newApp.authorName.trim(), simulatorType: 'generic',
      id: `app-${crypto.randomUUID()}`,
      rating: 5.0,
      plays: 0,
      commentsCount: 0,
      likes: 0,
      isLiked: false,
    };
    if (!updateApps([fullApp, ...apps])) return false;
    setActiveTab('gallery'); setSelectedCategory('all'); setSearchQuery('');
    showToast('작품을 이 브라우저에 저장했습니다. 다른 기기와 공유되지 않습니다.');
    return true;
  };

  const handleRandomPlay = () => {
    if (filteredApps.length === 0) { showToast('조건에 맞는 작품이 없습니다.'); return; }
    const randomIndex = Math.floor(Math.random() * filteredApps.length);
    setSelectedApp(filteredApps[randomIndex]);
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] flex flex-col antialiased">
      {/* Fixed Header */}
      <Header
        onOpenRegister={() => setIsRegisterModalOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-lg mx-auto pt-16 pb-20">
        {activeTab === 'gallery' && (
          <div className="flex flex-col w-full">
            {/* Creative Hero Banner */}
            <HeroSection
              totalApps={apps.length}
              totalPlays={totalPlays}
              totalHearts={totalHearts}
              onOpenRegister={() => setIsRegisterModalOpen(true)}
              onRandomPlay={handleRandomPlay}
            />

            {/* Sticky Search & Category Filter Pills */}
            <SearchAndFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />

            <p className="px-4 text-xs text-slate-500">기본 5개 작품·실적은 예시이며, 등록과 응원은 이 브라우저에만 저장됩니다.</p>
            {/* Quick Admin Deployment Card */}
            <QuickDeployBanner onQuickDeploy={handleQuickDeploy} />

            {/* Project Cards Feed */}
            <section className="px-4 py-3 flex flex-col gap-4" id="showcase-container">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">👾</span>
                  <h2 className="text-lg text-[#0b1c30] font-extrabold">
                    인기 배포 프로젝트
                  </h2>
                </div>
                <span className="text-xs text-[#464555] font-medium">
                  총{' '}
                  <strong className="text-[#3525cd] font-bold" id="item-count">
                    {filteredApps.length}
                  </strong>
                  개 표시 중
                </span>
              </div>

              {filteredApps.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 flex flex-col items-center gap-2 my-4">
                  <span className="text-3xl">🔍</span>
                  <p className="text-sm font-bold text-[#0b1c30]">
                    검색 결과가 없습니다
                  </p>
                  <p className="text-xs text-[#464555]">
                    다른 검색어를 입력하거나 카테고리 필터를 변경해보세요!
                  </p>
                </div>
              ) : (
                filteredApps.map((app) => (
                  <AppCard
                    key={app.id}
                    app={app}
                    onOpenApp={(selected) => setSelectedApp(selected)}
                    onToggleLike={handleToggleLike}
                  />
                ))
              )}
            </section>

            {/* Community Hall of Fame Mini Section */}
            <HallOfFame
              onSelectVocabWars={() => {
                const vocabApp = apps.find((a) => a.id === 'app-5');
                if (vocabApp) setSelectedApp(vocabApp);
              }}
            />
          </div>
        )}

        {/* Tab 2: Rankings Leaderboard */}
        {activeTab === 'rankings' && (
          <RankingsView
            apps={apps}
            onOpenApp={(app) => setSelectedApp(app)}
            onToggleLike={handleToggleLike}
          />
        )}

        {/* Tab 3: Registration View */}
        {activeTab === 'register' && (
          <div className="p-4">
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-[#3525cd] text-white flex items-center justify-center font-bold">
                  ✨
                </span>
                <h2 className="text-lg font-bold text-[#0b1c30]">새 웹앱 등록</h2>
              </div>
              <p className="text-xs text-[#464555] leading-relaxed">
                등록한 프로젝트와 응원은 이 브라우저에 저장됩니다. 다른 기기와 자동으로 공유되지 않으며, 브라우저 데이터를 삭제하면 사라집니다.
              </p>
              <button
                type="button"
                onClick={() => setIsRegisterModalOpen(true)}
                className="w-full py-3.5 rounded-xl bg-[#3525cd] text-white text-sm font-bold shadow-md hover:bg-[#281ca3] transition-all cursor-pointer"
              >
                작품 등록 양식 열기
              </button>
            </div>
          </div>
        )}

        {/* Tab 4: About Club */}
        {activeTab === 'about' && <AboutClubView />}
      </main>

      {/* Interactive WebApp Simulation Runner Modal */}
      <WebAppRunnerModal
        app={currentApp}
        key={currentApp?.id || "closed"}
        isOpen={!!selectedApp}
        onClose={() => setSelectedApp(null)}
        onShowToast={showToast}
        onToggleLike={handleToggleLike}
        onRate={handleRate}
      />

      {/* Registration Modal Drawer */}
      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSubmit={handleQuickDeploy}
      />

      {/* Profile Modal */}
      {isProfileModalOpen && (
        <div id="profile-modal" role="dialog" aria-modal="true" aria-label="예시 학생 프로필" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl border border-slate-200 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#3525cd] bg-[#e5eeff] px-2.5 py-1 rounded-full">
                예시 학생 프로필
              </span>
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-[#0b1c30] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <img onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = `${import.meta.env.BASE_URL}fallback.svg`; }}
                alt="My Profile"
                className="w-14 h-14 rounded-full object-cover ring-2 ring-indigo-200"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuA31yKR6uTmarlFLPTLbx65iZErPCHGkeWprDjJojBeZpyq72Wa58HxoIGwfsJnVDWWtmb7srQt1N-myqbkffYNPGZGwRYBKKRrv2ePF5Xt4VqHq_7jPFED3nN_XXuTbnNV1CusHEPdXcrvEeR1xhhyG3Rb0RDZTOufxkNUE_u84FPkU5TRbv1F2oMULi0hAK9_lnV7K9KqvfDUt854Wu1l_1yB7TjiFT0nvdHIHxIbTgmNeVOq1df9"
                referrerPolicy="no-referrer"
              />
              <div className="flex flex-col">
                <span className="text-base font-extrabold text-[#0b1c30]">
                  동아리 크루 학생
                </span>
                <span className="text-xs text-[#464555]">
                  ddasik76@gmail.com
                </span>
                <span className="text-[11px] text-[#00687a] font-semibold mt-0.5">
                  코딩 동아리 정회원 (Lv.4)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] text-[#464555] block">내 작품</span>
                <strong className="text-sm text-[#3525cd]">2개</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] text-[#464555] block">보낸 하트</span>
                <strong className="text-sm text-rose-500">18개</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] text-[#464555] block">플레이 타임</span>
                <strong className="text-sm text-emerald-600">4.2h</strong>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsProfileModalOpen(false);
                setIsRegisterModalOpen(true);
              }}
              className="w-full py-2.5 rounded-xl bg-[#3525cd] text-white text-xs font-bold hover:bg-[#281ca3] transition-all cursor-pointer"
            >
              내 새 프로젝트 등록하기
            </button>
          </div>
        </div>
      )}

      {/* Floating Notification Toast */}
      <Toast message={toastMessage} />

      {/* Bottom Sticky Navigation */}
      <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />
    </div>
  );
}
