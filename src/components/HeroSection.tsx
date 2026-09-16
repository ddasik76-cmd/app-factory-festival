import React from 'react';
import { Rocket, Dices, Laptop, Touchpad, Heart } from 'lucide-react';

interface HeroSectionProps {
  totalApps: number;
  totalPlays: number;
  totalHearts: number;
  onOpenRegister: () => void;
  onRandomPlay: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  totalApps,
  totalPlays,
  totalHearts,
  onOpenRegister,
  onRandomPlay,
}) => {
  return (
    <section className="relative px-4 pt-4 pb-6 overflow-hidden">
      {/* Glow effects */}
      <div className="absolute -top-12 -right-10 w-48 h-48 rounded-full bg-[#57dffe]/30 blur-3xl pointer-events-none" />
      <div className="absolute top-20 -left-12 w-52 h-52 rounded-full bg-[#c3c0ff]/30 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-3">
        {/* Pill banner */}
        <div className="inline-flex items-center gap-2 self-start px-3 py-1 rounded-full bg-[#dce9ff] text-[#3525cd] text-xs font-bold shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3525cd] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3525cd]"></span>
          </span>
          <span>2026 팔봉중 앱팩토리 신작 대공개</span>
        </div>

        {/* Headline */}
        <h1 className="text-[26px] leading-[34px] sm:text-[32px] sm:leading-[40px] text-[#0b1c30] tracking-tight font-extrabold">
          ✨ 우리들이 만든
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3525cd] via-[#4f46e5] to-[#00687a]">
            멋진 웹앱 놀이터
          </span>
        </h1>

        <p className="text-sm text-[#464555] leading-relaxed">
          팔봉중 앱팩토리 코딩 동아리 친구들이 직접 개발한 프로젝트를 바로 플레이해보세요!
        </p>

        {/* Fast Action Row */}
        <div className="flex items-center gap-2.5 pt-1">
          <button
            id="open-register-btn"
            onClick={onOpenRegister}
            className="flex-1 h-12 px-4 rounded-xl bg-[#3525cd] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#3525cd]/25 hover:bg-[#281ca3] active:scale-[0.98] transition-all cursor-pointer"
            type="button"
          >
            <Rocket className="w-4 h-4" />
            <span>내 작품 등록하기</span>
          </button>
          
          <button
            id="quick-random-play"
            onClick={onRandomPlay}
            className="h-12 px-4 rounded-xl bg-white text-[#0b1c30] text-sm font-bold flex items-center justify-center gap-2 shadow-sm border border-slate-200/80 hover:bg-slate-50 active:scale-[0.98] transition-all cursor-pointer"
            type="button"
          >
            <Dices className="w-4 h-4 text-[#8f1721]" />
            <span>랜덤 플레이</span>
          </button>
        </div>

        {/* Club Stat Ticker */}
        <div className="flex items-center justify-between px-3.5 py-2.5 mt-1 rounded-xl bg-[#eff4ff] text-[#464555] text-xs">
          <div className="flex items-center gap-1.5">
            <Laptop className="w-3.5 h-3.5 text-[#3525cd]" />
            <span>
              전시된 웹앱: <strong className="text-[#0b1c30] font-bold">{totalApps}개</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Touchpad className="w-3.5 h-3.5 text-[#00687a]" />
            <span>
              누적 실행: <strong className="text-[#0b1c30] font-bold">{totalPlays.toLocaleString()}회</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-[#ba1a1a] fill-[#ba1a1a]" />
            <span>
              응원 하트: <strong className="text-[#0b1c30] font-bold">{totalHearts.toLocaleString()}개</strong>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
