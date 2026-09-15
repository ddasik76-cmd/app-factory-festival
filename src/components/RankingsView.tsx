import React from 'react';
import { Trophy, Star, Heart, Play, Flame, Award } from 'lucide-react';
import { AppProject } from '../types';

interface RankingsViewProps {
  apps: AppProject[];
  onOpenApp: (app: AppProject) => void;
  onToggleLike: (appId: string) => void;
}

export const RankingsView: React.FC<RankingsViewProps> = ({ apps, onOpenApp, onToggleLike }) => {
  // Sort by plays + likes
  const sortedApps = [...apps].sort((a, b) => (b.plays + b.likes * 2) - (a.plays + a.likes * 2));

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="w-7 h-7 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-white font-black text-sm flex items-center justify-center shadow-md shadow-amber-500/30 ring-2 ring-amber-200">
          1
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="w-7 h-7 rounded-full bg-gradient-to-r from-slate-300 to-slate-400 text-white font-black text-sm flex items-center justify-center shadow-md ring-2 ring-slate-200">
          2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="w-7 h-7 rounded-full bg-gradient-to-r from-amber-700 to-amber-800 text-white font-black text-sm flex items-center justify-center shadow-md ring-2 ring-amber-600/30">
          3
        </span>
      );
    }
    return (
      <span className="w-7 h-7 rounded-full bg-slate-100 text-[#464555] font-bold text-xs flex items-center justify-center">
        {rank}
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-4 px-4 py-4 max-w-lg mx-auto pb-24 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="w-6 h-6 text-rose-500 fill-rose-500" />
          <h2 className="text-xl font-extrabold text-[#0b1c30]">
            실시간 페스티벌 랭킹
          </h2>
        </div>
        <span className="text-xs text-[#464555] font-semibold bg-[#e5eeff] text-[#3525cd] px-2.5 py-1 rounded-full">
          플레이수 + 응원 합산
        </span>
      </div>

      <p className="text-xs text-[#464555] leading-relaxed">
        가장 많은 플레이와 응원을 받은 동아리 작품들입니다! 카드를 터치하여 바로 플레이할 수 있습니다.
      </p>

      {/* Top 3 Podium Highlights */}
      <div className="grid grid-cols-3 gap-2 pt-2">
        {sortedApps.slice(0, 3).map((app, idx) => {
          const rank = idx + 1;
          return (
            <div
              key={app.id}
              onClick={() => onOpenApp(app)}
              className={`p-3 rounded-2xl flex flex-col items-center text-center cursor-pointer transition-all hover:scale-105 ${
                rank === 1
                  ? 'bg-gradient-to-b from-amber-100/70 to-amber-50/50 border-2 border-amber-300 shadow-md order-2 -translate-y-2'
                  : rank === 2
                  ? 'bg-white border border-slate-200/80 shadow-sm order-1'
                  : 'bg-white border border-slate-200/80 shadow-sm order-3'
              }`}
            >
              <div className="mb-1">{getRankBadge(rank)}</div>
              <img
                src={app.imageUrl}
                alt={app.title}
                className="w-12 h-12 rounded-xl object-cover my-1 shadow-sm"
                referrerPolicy="no-referrer"
              />
              <span className="text-xs font-bold text-[#0b1c30] line-clamp-1 mt-1">
                {app.title}
              </span>
              <span className="text-[10px] text-[#464555] truncate">
                {app.authorName}
              </span>
              <span className="text-[11px] font-extrabold text-[#3525cd] mt-1">
                {app.plays}회 실행
              </span>
            </div>
          );
        })}
      </div>

      {/* Full Leaderboard List */}
      <div className="flex flex-col gap-2.5 mt-2">
        {sortedApps.map((app, idx) => {
          const rank = idx + 1;
          return (
            <div
              key={app.id}
              onClick={() => onOpenApp(app)}
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/70 shadow-sm hover:border-[#3525cd]/40 transition-all cursor-pointer group"
            >
              {getRankBadge(rank)}

              <img
                src={app.imageUrl}
                alt={app.title}
                className="w-14 h-14 rounded-xl object-cover shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform"
                referrerPolicy="no-referrer"
              />

              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-bold text-[#0b1c30] truncate group-hover:text-[#3525cd] transition-colors">
                    {app.title}
                  </h4>
                </div>
                <p className="text-xs text-[#464555] truncate">
                  {app.authorName} • {app.tech}
                </p>
                <div className="flex items-center gap-3 text-[11px] text-[#464555] mt-1">
                  <span className="flex items-center gap-1 text-[#3525cd] font-bold">
                    <Play className="w-3 h-3 fill-current" /> {app.plays.toLocaleString()}회
                  </span>
                  <span className="flex items-center gap-1 text-rose-600 font-bold">
                    <Heart className="w-3 h-3 fill-current" /> {app.likes}개
                  </span>
                  <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                    <Star className="w-3 h-3 fill-current" /> {app.rating.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
