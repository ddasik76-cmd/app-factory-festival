import React from 'react';
import { Search, X } from 'lucide-react';
import { Category } from '../types';

interface SearchAndFiltersProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: Category;
  onSelectCategory: (c: Category) => void;
}

const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'all', label: '전체보기 🔥' },
  { id: 'game', label: '🎮 게임' },
  { id: 'ai', label: '🤖 AI도구' },
  { id: 'study', label: '📚 공부도우미' },
  { id: 'fun', label: '🎨 힐링/재미' },
];

export const SearchAndFilters: React.FC<SearchAndFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <section className="px-4 pb-2 sticky top-16 z-30 bg-[#f8f9ff]/90 backdrop-blur-md">
      {/* Search Bar */}
      <div className="relative flex items-center w-full">
        <Search className="absolute left-3.5 text-[#464555]/70 w-4 h-4 pointer-events-none" />
        <input
          id="search-input" aria-label="작품 또는 개발자 검색"
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="작품 이름이나 개발자 친구 검색..."
          className="w-full h-11 pl-10 pr-10 rounded-xl bg-white text-[#0b1c30] text-sm placeholder:text-[#464555]/60 shadow-sm border border-slate-200/70 focus:outline-none focus:ring-2 focus:ring-[#3525cd]/40 focus:border-[#3525cd] transition-all"
        />
        {searchQuery && (
          <button
            id="search-clear-btn" aria-label="검색어 지우기"
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-3 w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs hover:bg-slate-300 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto py-2.5 no-scrollbar">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id} data-category={cat.id} aria-pressed={isActive}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shadow-sm transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#3525cd] text-white shadow-[#3525cd]/20'
                  : 'bg-white text-[#464555] hover:bg-slate-100/80 border border-slate-200/60'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
    </section>
  );
};
