/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
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
import { safeUrl } from './storage';
import { createProject, hideProject, isAdminUser, login, logout, observeUser, permanentlyDeleteProject, rateProject, restoreProject, seedInitialProjects, subscribeLikes, subscribeProjects, toggleProjectLike } from './firebase';
import { useModal } from './useModal';
import { AppProject, Category, ActiveTab } from './types';
import { INITIAL_APPS } from './data/initialApps';
import { X, LogOut } from 'lucide-react';

export default function App() {
  const [apps, setApps] = useState<AppProject[]>([]);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
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
  useEffect(() => observeUser(nextUser => {
    setUser(nextUser);
    void isAdminUser(nextUser).then(setIsAdmin).catch(() => setIsAdmin(false));
    if (nextUser) void seedInitialProjects(nextUser).catch(() => undefined);
  }), []);
  useEffect(() => {
    if (!user) { setLikedIds(new Set()); return; }
    return subscribeLikes(user.uid, setLikedIds, () => showToast('응원 정보를 불러오지 못했습니다.'));
  }, [user]);
  useEffect(() => subscribeProjects(user, isAdmin, likedIds, projects => {
    setApps(projects);
    setIsLoading(false);
  }, () => {
    setApps(INITIAL_APPS.map(item => ({ ...item, isLiked: likedIds.has(item.id) })));
    setIsLoading(false);
    showToast('공용 갤러리에 연결하지 못했습니다. 잠시 후 다시 시도해주세요.');
  }), [user, isAdmin, likedIds]);
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

  const requireLogin = async () => {
    if (user) return user;
    try { return (await login()).user; }
    catch (error: any) {
      if (error?.code !== 'auth/popup-closed-by-user') showToast('Google 로그인에 실패했습니다. 승인된 도메인 설정을 확인해주세요.');
      return null;
    }
  };
  const openRegister = async () => {
    const signedInUser = await requireLogin();
    if (signedInUser) setIsRegisterModalOpen(true);
  };
  const handleToggleLike = async (appId: string) => {
    const signedInUser = await requireLogin();
    if (!signedInUser) return false;
    try { await toggleProjectLike(appId, signedInUser); return true; }
    catch { showToast('응원을 저장하지 못했습니다. 다시 시도해주세요.'); return false; }
  };
  const handleRate = async (appId: string) => {
    const signedInUser = await requireLogin();
    if (!signedInUser) return false;
    try { await rateProject(appId, signedInUser); return true; }
    catch { showToast('별점을 저장하지 못했습니다. 다시 시도해주세요.'); return false; }
  };
  const handleHide = async (appId: string) => {
    if (!user || !window.confirm('이 작품을 갤러리에서 숨길까요?')) return;
    try { await hideProject(appId, user); showToast('작품을 숨겼습니다. 관리자만 복구할 수 있습니다.'); }
    catch { showToast('작품을 숨기지 못했습니다.'); }
  };
  const handleRestore = async (appId: string) => {
    if (!isAdmin || !window.confirm('이 작품을 갤러리에 복구할까요?')) return;
    try { await restoreProject(appId); showToast('작품을 복구했습니다.'); }
    catch { showToast('작품을 복구하지 못했습니다.'); }
  };
  const handlePermanentDelete = async (appId: string) => {
    if (!isAdmin || !window.confirm('영구 삭제하면 복구할 수 없습니다. 계속할까요?')) return;
    try { await permanentlyDeleteProject(appId); showToast('작품을 영구 삭제했습니다.'); }
    catch { showToast('작품을 영구 삭제하지 못했습니다.'); }
  };

  const handleQuickDeploy = (
    newApp: Omit<AppProject, 'id' | 'rating' | 'plays' | 'commentsCount' | 'likes'>
  ) => {
    if (!user) { showToast('작품을 등록하려면 Google 로그인이 필요합니다.'); return Promise.resolve(false); }
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
    return createProject(fullApp, user).then(() => {
      setActiveTab('gallery'); setSelectedCategory('all'); setSearchQuery('');
      showToast('작품을 공용 갤러리에 등록했습니다.');
      return true;
    }).catch(() => { showToast('작품을 등록하지 못했습니다. 입력값과 권한을 확인해주세요.'); return false; });
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
        user={user}
        onOpenRegister={() => void openRegister()}
        onOpenProfile={() => user ? setIsProfileModalOpen(true) : void requireLogin()}
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
              onOpenRegister={() => void openRegister()}
              onRandomPlay={handleRandomPlay}
            />

            {/* Sticky Search & Category Filter Pills */}
            <SearchAndFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />

            <p className="px-4 text-xs text-slate-500">작품과 응원은 공용 갤러리에 실시간으로 반영됩니다. 등록과 응원에는 Google 로그인이 필요합니다.</p>
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

              {isLoading ? (
                <div className="p-8 text-center text-sm text-[#464555]">공용 갤러리를 불러오는 중입니다…</div>
              ) : filteredApps.length === 0 ? (
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
                    canManage={!!user && (isAdmin || app.creatorId === user.uid)}
                    isAdmin={isAdmin}
                    onHide={handleHide}
                    onRestore={handleRestore}
                    onPermanentDelete={handlePermanentDelete}
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
                Google 로그인 후 작품을 등록하면 모든 방문자의 갤러리에 실시간으로 표시됩니다.
              </p>
              <button
                type="button"
                onClick={() => void openRegister()}
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
        <div id="profile-modal" role="dialog" aria-modal="true" aria-label="내 계정" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl border border-slate-200 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#3525cd] bg-[#e5eeff] px-2.5 py-1 rounded-full">
                내 계정
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
                alt="내 프로필"
                className="w-14 h-14 rounded-full object-cover ring-2 ring-indigo-200"
                src={user?.photoURL || `${import.meta.env.BASE_URL}fallback.svg`}
                referrerPolicy="no-referrer"
              />
              <div className="flex flex-col">
                <span className="text-base font-extrabold text-[#0b1c30]">
                  {user?.displayName || 'Google 사용자'}
                </span>
                <span className="text-xs text-[#464555]">
                  {user?.email || ''}
                </span>
                <span className="text-[11px] text-[#00687a] font-semibold mt-0.5">
                  공용 갤러리 사용자
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void logout().then(() => setIsProfileModalOpen(false))}
              className="w-full py-2.5 rounded-xl bg-slate-100 text-[#0b1c30] text-xs font-bold hover:bg-slate-200 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" /> 로그아웃
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
