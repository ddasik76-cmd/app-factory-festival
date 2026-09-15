import React from 'react';
import { Star, MessageSquare, Heart, Play, Utensils, Sparkles, Swords, BookOpen } from 'lucide-react';
import { AppProject } from '../types';

interface AppCardProps {
  app: AppProject;
  onOpenApp: (app: AppProject) => void;
  onToggleLike: (appId: string) => void;
}

export const AppCard: React.FC<AppCardProps> = ({ app, onOpenApp, onToggleLike }) => {
  const getActionIcon = () => {
    switch (app.actionIcon) {
      case 'restaurant':
        return <Utensils className="w-4 h-4" />;
      case 'auto_awesome':
        return <Sparkles className="w-4 h-4" />;
      case 'sports_esports':
      case 'swords':
        return <Swords className="w-4 h-4" />;
      case 'book':
        return <BookOpen className="w-4 h-4" />;
      default:
        return <Play className="w-4 h-4 fill-current" />;
    }
  };

  return (
    <article
      className="group relative flex flex-col rounded-2xl bg-white shadow-sm border border-slate-200/70 overflow-hidden transition-all duration-300 hover:shadow-md"
      data-category={app.category}
    >
      {/* Thumbnail Area */}
      <div className="relative w-full aspect-video overflow-hidden bg-slate-100">
        <img
          src={app.imageUrl}
          alt={app.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        
        {/* Gradient shadow overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10 pointer-events-none">
          {app.badges.map((badge, idx) => (
            <span
              key={idx}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold shadow-sm backdrop-blur-sm ${
                idx === 0
                  ? 'bg-[#b03136]/90 text-white'
                  : 'bg-black/50 text-white'
              }`}
            >
              {badge}
            </span>
          ))}
        </div>

        {/* Big Center Play Trigger Button */}
        <button
          type="button"
          onClick={() => onOpenApp(app)}
          className="absolute inset-0 flex items-center justify-center z-10 cursor-pointer"
          title={`${app.title} 실행하기`}
        >
          <span
            className={`px-4 py-2.5 rounded-full ${app.actionBgColor} text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-black/30 backdrop-blur-sm transform active:scale-95 transition-all group-hover:scale-105`}
          >
            {getActionIcon()}
            <span>{app.actionText}</span>
          </span>
        </button>

        {/* Bottom stats overlay on image */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-xs font-medium pointer-events-none z-10">
          <span className="flex items-center gap-1 drop-shadow-sm font-semibold">
            <Star className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
            <span>{app.rating.toFixed(1)}</span>
            <span className="text-white/80 font-normal">
              (플레이 {app.plays.toLocaleString()}회)
            </span>
          </span>
          <span className="flex items-center gap-1 drop-shadow-sm text-white/90">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{app.commentsCount}</span>
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3
              onClick={() => onOpenApp(app)}
              className="text-base font-bold text-[#0b1c30] leading-snug cursor-pointer hover:text-[#3525cd] transition-colors line-clamp-1"
            >
              {app.title}
            </h3>
            <p className="text-xs text-[#464555] mt-1 line-clamp-2 leading-relaxed">
              {app.description}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onToggleLike(app.id)}
            className={`p-2 rounded-xl transition-all active:scale-90 cursor-pointer flex-shrink-0 ${
              app.isLiked
                ? 'bg-rose-50 text-rose-600'
                : 'bg-slate-100 text-[#8f1721] hover:bg-rose-50 hover:text-rose-600'
            }`}
            title="응원 하트 보내기"
          >
            <Heart
              className={`w-5 h-5 ${app.isLiked ? 'fill-rose-600' : 'fill-current'}`}
            />
          </button>
        </div>

        {/* Author & Tech Info */}
        <div className="flex items-center justify-between pt-2 mt-1 border-t border-slate-100">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={`w-7 h-7 rounded-full ${app.authorInitialBg} text-white flex items-center justify-center text-xs font-bold flex-shrink-0`}
            >
              {app.authorInitial}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs text-[#0b1c30] font-bold truncate">
                {app.authorName}
              </span>
              <span className="text-[10px] text-[#464555]/80 truncate">
                {app.authorRole}
              </span>
            </div>
          </div>

          <span className="px-2 py-0.5 rounded-md bg-[#e5eeff] text-[#3525cd] text-[11px] font-semibold whitespace-nowrap">
            {app.tech}
          </span>
        </div>
      </div>
    </article>
  );
};
