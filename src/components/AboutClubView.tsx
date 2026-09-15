import React from 'react';
import { Users, Code, Calendar, Sparkles, Laptop, ShieldCheck, Heart } from 'lucide-react';

export const AboutClubView: React.FC = () => {
  const members = [
    { name: '이준서 (3학년)', role: '동아리 부장 & 게임 개발 리드', badge: 'JavaScript / Canvas', icon: '준' },
    { name: '강도윤 (3학년)', role: '네트워크 & 백엔드 엔지니어', badge: 'Socket.io / Node.js', icon: '도' },
    { name: '박서연 (2학년)', role: '부부장 & 프론트엔드 UI/UX', badge: 'React / Open API', icon: '서' },
    { name: '최유나 (2학년)', role: 'AI 프롬프트 & 모델 연동 리드', badge: 'Gemini AI / Vue', icon: '유' },
    { name: '정태현 (1학년)', role: '오디오 코딩 & 사운드 디자인', badge: 'Web Audio API', icon: '태' },
  ];

  return (
    <div className="flex flex-col gap-5 px-4 py-4 max-w-lg mx-auto pb-24 animate-in fade-in duration-300">
      {/* Club Intro Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-[#3525cd] to-[#4f46e5] text-white shadow-md">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-1 rounded-full bg-white/20 text-[#acedff] text-xs font-bold">
            🚀 2026 페스티벌
          </span>
          <span className="text-xs text-white/80">코딩 창작 동아리</span>
        </div>
        <h2 className="text-2xl font-black tracking-tight">
          앱팩토리 (AppFactory)
        </h2>
        <p className="text-xs text-[#d3e4fe] mt-1.5 leading-relaxed">
          &quot;상상을 코드로, 아이디어를 웹앱으로!&quot;<br />
          중학교 친구들이 자유롭게 모여 게임, AI 도구, 학사 편의 기능을 개발하고 공유하는 웹 개발 동아리입니다.
        </p>
      </div>

      {/* Festival Schedule */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#3525cd]" />
          <h3 className="text-base font-bold text-[#0b1c30]">2026 교내 페스티벌 일정</h3>
        </div>
        <div className="flex flex-col gap-2 text-xs text-[#464555]">
          <div className="flex items-start gap-2 p-2 rounded-xl bg-slate-50">
            <span className="px-2 py-0.5 rounded-md bg-[#e5eeff] text-[#3525cd] font-bold">전시</span>
            <span>1학기 교내 과학/정보 축전 웹앱 체험 부스 운영 (컴퓨터실 1)</span>
          </div>
          <div className="flex items-start gap-2 p-2 rounded-xl bg-slate-50">
            <span className="px-2 py-0.5 rounded-md bg-[#57dffe] text-[#006172] font-bold">투표</span>
            <span>전교생 인기 투표 진행 중! 마음에 드는 작품에 하트를 눌러주세요.</span>
          </div>
        </div>
      </div>

      {/* Tech Stack Chips */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <Code className="w-5 h-5 text-[#00687a]" />
          <h3 className="text-base font-bold text-[#0b1c30]">동아리 핵심 기술 스택</h3>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {['React', 'TypeScript', 'Tailwind CSS', 'HTML5 Canvas', 'Web Audio API', 'Gemini AI', 'Socket.io', 'Node.js', 'NEIS Open API'].map(
            (tech) => (
              <span
                key={tech}
                className="px-2.5 py-1 rounded-lg bg-[#eff4ff] text-[#3525cd] text-xs font-semibold"
              >
                {tech}
              </span>
            )
          )}
        </div>
      </div>

      {/* Member Cards */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-[#8f1721]" />
          <h3 className="text-base font-bold text-[#0b1c30]">동아리 핵심 멤버들</h3>
        </div>
        <div className="flex flex-col gap-2">
          {members.map((m, idx) => (
            <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#3525cd] text-white font-bold text-xs flex items-center justify-center">
                  {m.icon}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#0b1c30]">{m.name}</span>
                  <span className="text-[11px] text-[#464555]">{m.role}</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-[#dce9ff] text-[#3525cd] text-[10px] font-bold">
                {m.badge}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
