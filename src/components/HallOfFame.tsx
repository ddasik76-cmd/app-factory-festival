import React from 'react';
import { Trophy } from 'lucide-react';

interface HallOfFameProps {
  onSelectVocabWars?: () => void;
  plays?: number;
}

export const HallOfFame: React.FC<HallOfFameProps> = ({ onSelectVocabWars, plays = 0 }) => {
  return (
    <section className="px-4 py-2 mb-4">
      <div className="p-4 rounded-2xl bg-[#e5eeff] flex flex-col gap-2.5 border border-[#d3e4fe]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500 fill-amber-400" />
            <h3 className="text-base text-[#0b1c30] font-extrabold">
              이달의 MVP 동아리원
            </h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-[#4f46e5] text-white text-[11px] font-bold">
            3월 1위
          </span>
        </div>

        <div
          onClick={onSelectVocabWars}
          className="flex items-center gap-3 p-2.5 rounded-xl bg-white shadow-sm border border-slate-100 hover:border-indigo-200 transition-all cursor-pointer"
        >
          <div className="relative w-12 h-12 rounded-full overflow-hidden bg-[#c3c0ff] flex-shrink-0 ring-2 ring-amber-400">
            <img onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = `${import.meta.env.BASE_URL}fallback.svg`; }}
              alt="강도윤 MVP 동아리원"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuATVIav0jyzhlIlEuDjLMC7J-gefuJfpV5U7LxPSFmj84CWcUky3_J9SgY8Amc4l0zYlntejzl1KHjBj4sWJDIHct7rQkDu1leHzPzVsAT1T-2dZVlf9i0iFOKJZLyS3Xl3IggynyseshceLIDKRyYCuXsSkheHEZa8uf1WomKyKVITy3NhPWY2kqelL6I1H6IfEBAb6KHDZr-lwD20p26v-kdC8FzCyrbhzuRspOsrzuRvp3U-8Ofl"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-[#0b1c30] font-bold truncate">
                강도윤 (3학년 2반)
              </span>
              <span className="text-xs">👑</span>
            </div>
            <p className="text-xs text-[#464555] truncate mt-0.5 font-medium">
              &quot;Vocab Wars&quot;로 누적 {plays.toLocaleString()}회 플레이 달성!
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
