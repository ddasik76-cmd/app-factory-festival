import React from 'react';
import { LayoutGrid, Flame, PlusCircle, Users } from 'lucide-react';
import { ActiveTab } from '../types';

interface BottomNavProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab }) => {
  const tabs = [
    { id: 'gallery' as ActiveTab, label: '전체 작품', icon: LayoutGrid },
    { id: 'rankings' as ActiveTab, label: '인기 랭킹', icon: Flame },
    { id: 'register' as ActiveTab, label: '작품 등록', icon: PlusCircle },
    { id: 'about' as ActiveTab, label: '동아리 소개', icon: Users },
  ];

  return (
    <nav className="fixed bottom-0 w-full z-40 pb-safe bg-[#f8f9ff]/90 backdrop-blur-xl shadow-[0_-2px_12px_rgba(0,0,0,0.06)] border-t border-slate-200/80">
      <div className="flex justify-around items-center h-16 px-2 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 min-h-[48px] transition-all cursor-pointer ${
                isActive
                  ? 'text-[#3525cd] font-extrabold scale-105'
                  : 'text-[#464555] hover:text-[#0b1c30] font-medium'
              }`}
              type="button"
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              <span className="text-[11px] tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
