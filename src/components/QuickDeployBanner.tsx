import React, { useState } from 'react';
import { Zap, Crown } from 'lucide-react';
import { AppProject } from '../types';

interface QuickDeployBannerProps {
  onQuickDeploy: (app: Omit<AppProject, 'id' | 'rating' | 'plays' | 'commentsCount' | 'likes'>) => Promise<boolean>;
}

export const QuickDeployBanner: React.FC<QuickDeployBannerProps> = ({ onQuickDeploy }) => {
  const [devName, setDevName] = useState('');
  const [category, setCategory] = useState<'game' | 'ai' | 'study' | 'fun'>('game');
  const [appTitle, setAppTitle] = useState('');
  const [appUrl, setAppUrl] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appTitle.trim() || !devName.trim()) return;

    // Pick appropriate image placeholder or generator
    const defaultImages = {
      game: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDiFjQoXQQ7HdA80sUpshK86Np528hLZdZdEqyThkbsTep0iRNTrLamnw2pu6R1jHbB_Oz9vIsQyzYKzvM7hjaEbR8r63yo_RwSROl0i738FBszQoFulVj594i1LfrdTGEhGgnnA6MvrC4t22mTXOD0JBn8Ws8-oAZmcWaldut5D1r9U8LSKZ402ftIIeyZdF1uGxWG-emXXwm3lZ19zAd2TpHTT3AT94YGakGVzB8iP__25aQeg5xa',
      ai: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDKvPLvgfoKuxFvzZ5fgVvgudakxOxyEAaIgtp6ktYs4l2VF7CKu86kTkDAE-RZlXxXzyHlBeEY2vATTMc_scHcSly7A9KRpBVx5-U6CO7Eo6X_2B6yRSWPF74tznX7HvwPSFIezn_L2_Ly_qvB7aaEMite6EVLBMNYhU7xz214HbSwjKQd715_7DcG3DmZ2efOQlLGE4NikWb7hlu6YYHcF-ggM9iELkO0_Qwt1R6fa_VgtX5hIqhq',
      study: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC7zWyT2xjuUZIB-q2oHa6RjH9MNsoa778h2iv1lcjPFyUtqwnovZB0zSdTQ6jFgBFrucMqPgXkonYqLnSpWWiu-SJt3M2SPW11SnNL7OOIJhGtVlm_19WrdCi9HIjwMlVG29JBdqTZD61RQRl_EoXCN2dgPIXk4qXT8A6eW2zitjy-4HBbZod68XEZJSGPcUhwITOE5U9ZyQyA7FE00yMjoIRwSPjmrt_fwWgITAJZdkavyW1yxzey',
      fun: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAnaQFCzMjweOt3xXah09unK-y5P7MYVYR3vzpEZTktA7FhbeClj_18rKHZM31SVQxfwwxaN-Qc5zOzZCF8-pFHJjUBP9WEFbZMiy8SqhXKsshYSrWMwAuzHioeodK_6k-YtOc3a4HEWaUIdXNMM_go3us9pcizc68fY3PxHYOPinZHFns4vHpvWGfHarZCae0QFjmw4zCvNZcrHT6tSg5yIoO27YUsz6dZYbLLts7uHCsXsiTZ31h-',
    };

    const saved = await onQuickDeploy({
      title: appTitle,
      description: `${devName} 친구가 동아리에서 갓 완성한 멋진 신작 프로젝트!`,
      category,
      tech: category === 'ai' ? 'Gemini API • React' : category === 'game' ? 'HTML5 Canvas' : 'JavaScript Web',
      badges: ['⚡ 실시간 배포', category === 'game' ? '🎮 게임' : category === 'ai' ? '🤖 AI' : '📚 유틸'],
      actionText: '👉 지금 바로 체험하기',
      actionIcon: 'play_arrow',
      actionBgColor: 'bg-[#4f46e5]',
      authorName: devName,
      authorRole: '앱팩토리 동아리원',
      authorInitial: devName.slice(-1) || '민',
      authorInitialBg: 'bg-[#4f46e5]',
      imageUrl: defaultImages[category],
      url: appUrl,
      simulatorType: 'generic',
    });
    if (!saved) return;

    setAppTitle('');
    setDevName('');
    setAppUrl('');
  };

  return (
    <section className="px-4 my-2">
      <div className="relative overflow-hidden p-4 rounded-2xl bg-gradient-to-br from-[#213145] via-[#1c293a] to-[#0b1c30] text-[#eaf1ff] shadow-md border border-slate-700/40">
        {/* Decorative blur */}
        <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-[#4f46e5]/20 blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-[#57dffe] text-[#006172] flex items-center justify-center text-xs font-bold shadow-sm">
              👑
            </span>
            <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              작품 빠른 등록
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-white/10 text-[#acedff] text-[11px] font-bold tracking-wider">
            공용 갤러리
          </span>
        </div>

        <p className="text-xs text-[#d3e4fe]/80 mb-3 leading-relaxed">
          Google 로그인 후 제목, 개발자, URL을 입력하면 모든 방문자에게 실시간으로 표시됩니다.
        </p>

        <form id="quick-admin-form" onSubmit={handleSubmit} className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              id="admin-dev-name"
              type="text"
              required
              value={devName}
              onChange={(e) => setDevName(e.target.value)}
              placeholder="예: 2학년 김민우"
              className="flex-1 h-10 px-3 rounded-lg bg-white/10 text-white placeholder:text-white/50 text-xs border border-white/10 focus:outline-none focus:ring-1 focus:ring-[#57dffe] transition-all"
            />
            <select
              id="admin-dev-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="h-10 px-2.5 rounded-lg bg-[#213145] text-white text-xs border border-white/10 focus:outline-none focus:ring-1 focus:ring-[#57dffe] cursor-pointer"
            >
              <option value="game">🎮 게임</option>
              <option value="ai">🤖 AI 도구</option>
              <option value="study">📚 공부도우미</option>
              <option value="fun">🎨 힐링/재미</option>
            </select>
          </div>

          <div className="flex gap-2">
            <input
              id="admin-app-title"
              type="text"
              required
              value={appTitle}
              onChange={(e) => setAppTitle(e.target.value)}
              placeholder="웹앱 제목 (예: 급식 타이쿤)"
              className="w-1/2 h-10 px-3 rounded-lg bg-white/10 text-white placeholder:text-white/50 text-xs border border-white/10 focus:outline-none focus:ring-1 focus:ring-[#57dffe] transition-all"
            />
            <input
              id="admin-app-url"
              type="url"
              required
              value={appUrl}
              onChange={(e) => setAppUrl(e.target.value)}
              placeholder="https://..."
              className="w-1/2 h-10 px-3 rounded-lg bg-white/10 text-white placeholder:text-white/50 text-xs border border-white/10 focus:outline-none focus:ring-1 focus:ring-[#57dffe] transition-all"
            />
          </div>

          <button
            type="submit"
            className="w-full mt-1 h-10 rounded-lg bg-[#57dffe] text-[#006172] font-bold text-xs flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all hover:bg-[#acedff] shadow-sm cursor-pointer"
          >
            <Zap className="w-4 h-4 fill-[#006172]" />
            <span>원클릭 갤러리 등록 & 즉시 반영</span>
          </button>
        </form>
      </div>
    </section>
  );
};
