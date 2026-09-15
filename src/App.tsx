/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
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
import { INITIAL_APPS } from './data/initialApps';
import { AppProject, Category, ActiveTab } from './types';
import { User, X, Laptop, Heart, Star, Sparkles } from 'lucide-react';

export default function App() {
  const [apps, setApps] = useState<AppProject[]>(INITIAL_APPS);
  const [activeTab, setActiveTab] = useState<ActiveTab>('gallery');
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState<AppProject | null>(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 2500);
  };

  const totalPlays = useMemo(() => {
    return apps.reduce((acc, cur) => acc + cur.plays, 3890);
  }, [apps]);

  const totalHearts = useMemo(() => {
    return apps.reduce((acc, cur) => acc + cur.likes, 1412);
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

  const handleToggleLike = (appId: string) => {
    setApps((prev) =>
      prev.map((item) => {
        if (item.id === appId) {
          const nextLiked = !item.isLiked;
          return {
            ...item,
            isLiked: nextLiked,
            likes: nextLiked ? item.likes + 1 : item.likes - 1,
          };
        }
        return item;
      })
    );
  };

  const handleQuickDeploy = (
    newApp: Omit<AppProject, 'id' | 'rating' | 'plays' | 'commentsCount' | 'likes'>
  ) => {
    const fullApp: AppProject = {
      ...newApp,
      id: `app-${Date.now()}`,
      rating: 5.0,
      plays: 1,
      commentsCount: 0,
      likes: 1,
      isLiked: true,
    };
    setApps((prev) => [fullApp, ...prev]);
    showToast(`⚡ '${fullApp.title}' (${fullApp.authorName}) 프로젝트가 즉시 배포되었습니다!`);
  };

  const handleRandomPlay = () => {
    if (apps.length === 0) return;
    const randomIndex = Math.floor(Math.random() * apps.length);
    setSelectedApp(apps[randomIndex]);
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
                  개 작동 중
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
                직접 개발한 프로젝트를 앱팩토리 갤러리에 공유해보세요! 친구들이 실시간으로 플레이하고 하트를 보낼 수 있습니다.
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
        app={selectedApp}
        isOpen={!!selectedApp}
        onClose={() => setSelectedApp(null)}
        onShowToast={showToast}
        onToggleLike={handleToggleLike}
      />

      {/* Registration Modal Drawer */}
      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSubmit={handleQuickDeploy}
      />

      {/* Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl border border-slate-200 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#3525cd] bg-[#e5eeff] px-2.5 py-1 rounded-full">
                학생 프로필
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
              <img
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
