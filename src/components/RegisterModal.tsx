import React, { useEffect, useState } from 'react';
import { X, Sparkles, Send } from 'lucide-react';
import { AppProject } from '../types';
import { useModal } from '../useModal';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialApp?: AppProject | null;
  onSubmit: (app: Omit<AppProject, 'id' | 'rating' | 'plays' | 'commentsCount' | 'likes'>) => Promise<boolean>;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({ isOpen, onClose, initialApp, onSubmit }) => {
  const isEditing = !!initialApp;
  const [title, setTitle] = useState('');
  const [dev, setDev] = useState('');
  const [category, setCategory] = useState<'game' | 'ai' | 'study' | 'fun'>('game');
  const [url, setUrl] = useState('');
  const [desc, setDesc] = useState('');
  const [aiTools, setAiTools] = useState<string[]>([]);
  const aiOptions = ['ChatGPT', 'Claude', 'Gemini', 'Cursor', 'GitHub Copilot', 'Replit', 'v0'];

  useEffect(() => {
    if (!isOpen) return;
    setTitle(initialApp?.title || '');
    setDev(initialApp?.authorName || '');
    setCategory(initialApp?.category || 'game');
    setUrl(initialApp?.url || '');
    setDesc(initialApp?.description || '');
    setAiTools(initialApp?.aiTools || []);
  }, [isOpen, initialApp?.id]);

  useModal(isOpen, 'full-register-modal', onClose);
  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dev.trim()) return;

    const defaultImages = {
      game: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDiFjQoXQQ7HdA80sUpshK86Np528hLZdZdEqyThkbsTep0iRNTrLamnw2pu6R1jHbB_Oz9vIsQyzYKzvM7hjaEbR8r63yo_RwSROl0i738FBszQoFulVj594i1LfrdTGEhGgnnA6MvrC4t22mTXOD0JBn8Ws8-oAZmcWaldut5D1r9U8LSKZ402ftIIeyZdF1uGxWG-emXXwm3lZ19zAd2TpHTT3AT94YGakGVzB8iP__25aQeg5xa',
      ai: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDKvPLvgfoKuxFvzZ5fgVvgudakxOxyEAaIgtp6ktYs4l2VF7CKu86kTkDAE-RZlXxXzyHlBeEY2vATTMc_scHcSly7A9KRpBVx5-U6CO7Eo6X_2B6yRSWPF74tznX7HvwPSFIezn_L2_Ly_qvB7aaEMite6EVLBMNYhU7xz214HbSwjKQd715_7DcG3DmZ2efOQlLGE4NikWb7hlu6YYHcF-ggM9iELkO0_Qwt1R6fa_VgtX5hIqhq',
      study: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA7IDKF5dnxYbc5QWWoyq55utiLPjDCi_MPPsowlgVnGetK9sM8hQ4xCGdTdZTfggXEGhQqgGi3_PdmZ4U_JtBLWnDEcGc03odN7cVofTYPVBvx8w6Pc6J5ZoDOmQpJ8PsE0NG90jPSMudAueQu0mBR7z0duAyDPqzdnOT4_go21FAC3Huafvib6tS8Q9u2_vgN_1FOvRwakcpKduluE4dqezT8JTgh9aWjpXtyphd8vybkDVdu3kot',
      fun: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAnaQFCzMjweOt3xXah09unK-y5P7MYVYR3vzpEZTktA7FhbeClj_18rKHZM31SVQxfwwxaN-Qc5zOzZCF8-pFHJjUBP9WEFbZMiy8SqhXKsshYSrWMwAuzHioeodK_6k-YtOc3a4HEWaUIdXNMM_go3us9pcizc68fY3PxHYOPinZHFns4vHpvWGfHarZCae0QFjmw4zCvNZcrHT6tSg5yIoO27YUsz6dZYbLLts7uHCsXsiTZ31h-',
    };

    const categoryTech = category === 'ai' ? 'Gemini AI • Web' : category === 'game' ? 'HTML5 Canvas' : 'React • Web';
    const categoryBadge = category === 'game' ? '🎮 게임' : category === 'ai' ? '🤖 AI' : '📚 유틸';
    const saved = await onSubmit({
      title,
      description: isEditing ? desc : (desc || `${dev} 친구가 개발한 동아리 프로젝트입니다.`),
      category,
      tech: isEditing && initialApp?.category === category ? initialApp.tech : categoryTech,
      aiTools,
      aiUsage: initialApp?.aiUsage || [],
      aiNote: initialApp?.aiNote || '',
      badges: [initialApp?.badges?.[0] || '✨ 신규 등록', categoryBadge],
      actionText: initialApp?.actionText || '👉 지금 바로 체험하기',
      actionIcon: initialApp?.actionIcon || 'play_arrow',
      actionBgColor: initialApp?.actionBgColor || 'bg-[#3525cd]',
      authorName: dev,
      authorRole: initialApp?.authorRole || '동아리 크루',
      authorInitial: dev.slice(-1) || initialApp?.authorInitial || '크',
      authorInitialBg: initialApp?.authorInitialBg || 'bg-[#4f46e5]',
      imageUrl: initialApp?.imageUrl || defaultImages[category],
      url: url,
      simulatorType: initialApp?.simulatorType || 'generic',
    });
    if (!saved) return;

    setTitle('');
    setDev('');
    setUrl('');
    setDesc('');
    setAiTools([]);
    onClose();
  };

  return (
    <div
      id="full-register-modal" role="dialog" aria-modal="true" aria-label={isEditing ? '작품 수정' : '작품 등록'}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 transition-all duration-300"
    >
      <div className="w-full max-w-lg max-h-[90vh] sm:max-h-[795px] rounded-t-3xl sm:rounded-3xl bg-[#f8f9ff] p-5 sm:p-6 flex flex-col gap-4 overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-300 border border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-[#4f46e5] text-white flex items-center justify-center font-bold shadow-sm">
              ✨
            </span>
            <h3 className="text-lg font-bold text-[#0b1c30]">
              {isEditing ? '내 웹앱 프로젝트 수정하기' : '내 웹앱 프로젝트 등록하기'}
            </h3>
          </div>
          <button
            id="close-register-btn" aria-label="닫기"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-[#0b1c30] transition-colors cursor-pointer"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-[#464555] leading-relaxed">
          등록한 작품은 모든 방문자의 공용 갤러리에 표시됩니다. 실제 웹앱의 HTTP(S) 주소를 입력하세요.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5" id="submission-form">
          <div>
            <label className="text-xs text-[#0b1c30] font-bold mb-1.5 block">
              작품 제목 *
            </label>
            <input
              id="reg-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 냥이 타워 디펜스"
              className="w-full h-11 px-3.5 rounded-xl bg-white text-[#0b1c30] text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#3525cd]/40 focus:border-[#3525cd] shadow-sm transition-all"
            />
          </div>

          <div>
            <label className="text-xs text-[#0b1c30] font-bold mb-1.5 block">사용한 AI 도구 (선택)</label>
            <div className="flex flex-wrap gap-1.5">
              {aiOptions.map(tool => <label key={tool} className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold cursor-pointer ${aiTools.includes(tool) ? 'bg-[#e5eeff] border-[#4f46e5] text-[#3525cd]' : 'bg-white border-slate-200 text-[#464555]'}`}>
                <input type="checkbox" className="sr-only" checked={aiTools.includes(tool)} onChange={() => setAiTools(current => current.includes(tool) ? current.filter(item => item !== tool) : [...current, tool])} />
                {tool}
              </label>)}
            </div>
          </div>

          <div>
            <label className="text-xs text-[#0b1c30] font-bold mb-1.5 block">
              개발자 정보 *
            </label>
            <input
              id="reg-dev"
              type="text"
              required
              value={dev}
              onChange={(e) => setDev(e.target.value)}
              placeholder="예: 2학년 이채원 (프론트엔드)"
              className="w-full h-11 px-3.5 rounded-xl bg-white text-[#0b1c30] text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#3525cd]/40 focus:border-[#3525cd] shadow-sm transition-all"
            />
          </div>

          <div>
            <label className="text-xs text-[#0b1c30] font-bold mb-1.5 block">
              카테고리 *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'game', label: '🎮 게임' },
                { id: 'ai', label: '🤖 AI 도구' },
                { id: 'study', label: '📚 공부도우미' },
                { id: 'fun', label: '🎨 힐링/재미' },
              ].map((c) => (
                <label
                  key={c.id}
                  className={`flex items-center gap-2 p-2.5 rounded-xl cursor-pointer shadow-sm border transition-all ${
                    category === c.id
                      ? 'bg-indigo-50 border-[#4f46e5] text-[#3525cd] font-bold'
                      : 'bg-white border-slate-200 text-[#0b1c30]'
                  }`}
                >
                  <input
                    type="radio"
                    name="reg-cat"
                    value={c.id}
                    checked={category === c.id}
                    onChange={() => setCategory(c.id as any)}
                    className="accent-[#3525cd]"
                  />
                  <span className="text-xs">{c.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-[#0b1c30] font-bold mb-1.5 block">
              웹앱 주소 (URL) *
            </label>
            <input
              id="reg-url"
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://github.io/my-cool-app"
              className="w-full h-11 px-3.5 rounded-xl bg-white text-[#0b1c30] text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#3525cd]/40 focus:border-[#3525cd] shadow-sm transition-all"
            />
          </div>

          <div>
            <label className="text-xs text-[#0b1c30] font-bold mb-1.5 block">
              작품 한 줄 소개
            </label>
            <textarea
              id="reg-desc"
              rows={2}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="어떤 기능이 들어있는지 간단히 설명해주세요!"
              className="w-full p-3 rounded-xl bg-white text-[#0b1c30] text-sm border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#3525cd]/40 focus:border-[#3525cd] shadow-sm resize-none transition-all"
            />
          </div>

          <button
            type="submit"
            className="w-full mt-2 h-12 rounded-xl bg-[#3525cd] text-white text-sm font-bold shadow-md shadow-[#3525cd]/25 active:scale-98 transition-all hover:bg-[#281ca3] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>{isEditing ? '작품 수정 내용 저장' : '공용 갤러리에 작품 등록'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
