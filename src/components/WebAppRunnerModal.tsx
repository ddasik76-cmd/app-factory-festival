import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  RotateCcw,
  ExternalLink,
  Heart,
  Star,
  Share2,
  Sparkles,
  Play,
  Pause,
  CloudRain,
  Utensils,
  Trophy,
  CheckCircle2,
} from 'lucide-react';
import { AppProject } from '../types';
import { safeUrl } from '../storage';
import { useModal } from '../useModal';

interface WebAppRunnerModalProps {
  app: AppProject | null;
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
  onToggleLike: (appId: string) => boolean;
  onRate: (appId: string) => boolean;
}

export const WebAppRunnerModal: React.FC<WebAppRunnerModalProps> = ({
  app,
  isOpen,
  onClose,
  onShowToast,
  onToggleLike,
  onRate,
}) => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [score, setScore] = useState(2048);
  const [highScore, setHighScore] = useState(4096);
  useModal(isOpen, 'webapp-runner-modal', onClose);

  // 2048 game grid
  const [grid2048, setGrid2048] = useState<number[]>([2, 4, 8, 16, 32, 64, 128, 512, 2048]);

  // Pomodoro timer state
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isRaining, setIsRaining] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const noiseNodeRef = useRef<AudioNode | null>(null);

  // Tarot state
  const [flippedCards, setFlippedCards] = useState<boolean[]>([false, false, false]);
  const tarotCards = [
    { title: 'The Sun ☀️', desc: '오늘 발표나 퀴즈에서 빛을 발할 운명! 행운의 숫자: 7', luck: '학업운 99%' },
    { title: 'The Star ⭐', desc: '친구와의 관계에서 뜻밖의 기분 좋은 소식이 찾아옵니다!', luck: '대인운 95%' },
    { title: 'The Magician 🧙', desc: '평소 미뤄둔 코딩이나 과제를 시작하면 초집중 상태 돌입!', luck: '창의력 100%' },
  ];

  // Vocab Wars state
  const vocabQuestions = [
    { word: 'Algorithm', correct: '문제를 해결하기 위한 단계적 절차', options: ['컴퓨터의 전원 공급 장치', '문제를 해결하기 위한 단계적 절차', '데이터베이스 저장소', '화면 출력 해상도'] },
    { word: 'Variable', correct: '데이터를 저장할 수 있는 메모리 공간', options: ['프로그래밍 종료 명령어', '네트워크 통신 규약', '데이터를 저장할 수 있는 메모리 공간', '웹 브라우저의 일종'] },
    { word: 'Recursion', correct: '함수가 자기 자신을 다시 호출하는 기법', options: ['오류를 수정하는 도구', '함수가 자기 자신을 다시 호출하는 기법', '암호화 알고리즘', '인터넷 속도 측정기'] },
  ];
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [quizScore, setQuizScore] = useState(120);
  const [combo, setCombo] = useState(1);
  const [enemyHp, setEnemyHp] = useState(100);

  // Lunch menu state
  const lunchMenus = [
    {
      date: '오늘의 급식 (중등부)',
      dishes: ['흑미밥 🍚', '소고기 미역국 🥣', '수제 치즈 돈까스 🥩', '마카로니 콘샐러드 🌽', '배추김치 🥬', '상큼 청포도 푸딩 🍮'],
      calories: '745 kcal',
      score: '98점 (탄단지 황금비율)',
      eval: '단백질 34g, 칼슘 풍부! 시험 기간 집중력 향상에 최적화된 식단입니다.',
    },
    {
      date: '내일의 특별 식단',
      dishes: ['칼슘찹쌀밥 🍚', '얼큰 사골육개장 🍲', '바삭 치킨텐더 🍗', '골뱅이 야채무침 🥗', '깍두기 🥢', '친환경 감귤주스 🍊'],
      calories: '780 kcal',
      score: '96점 (활력 충전 식단)',
      eval: '비타민C와 무기질이 가득! 환절기 면역력 강화에 최고입니다.',
    },
  ];
  const [lunchIdx, setLunchIdx] = useState(0);



  // Pomodoro countdown effect
  useEffect(() => {
    let interval: any;
    if (isOpen && isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isOpen, isTimerRunning, timerSeconds]);

  // Handle ambient rain audio
  useEffect(() => {
    if (!isOpen || !isRaining || !soundEnabled) {
      if (noiseNodeRef.current) {
        try {
          (noiseNodeRef.current as any).stop?.();
          (noiseNodeRef.current as any).disconnect?.();
        } catch (e) {}
        noiseNodeRef.current = null;
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.04;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = buffer;
      whiteNoise.loop = true;

      // Filter for rain effect
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1000;

      whiteNoise.connect(filter);
      filter.connect(ctx.destination);
      whiteNoise.start(0);

      noiseNodeRef.current = whiteNoise;
    } catch (e) {
      console.log('Audio init skipped', e);
    }

    return () => {
      if (noiseNodeRef.current) {
        try {
          (noiseNodeRef.current as any).stop?.();
          noiseNodeRef.current.disconnect();
        } catch (e) {}
      }
      noiseNodeRef.current = null;
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') void audioContextRef.current.close();
      audioContextRef.current = null;
    };
  }, [isOpen, isRaining, soundEnabled]);

  if (!isOpen || !app) return null;

  const handleTileClick = (index: number) => {
    const newGrid = [...grid2048];
    const currentVal = newGrid[index];
    const nextVal = currentVal >= 2048 ? 2 : currentVal * 2;
    newGrid[index] = nextVal;
    setGrid2048(newGrid);

    const gained = currentVal;
    setScore((prev) => {
      const next = prev + gained;
      if (next > highScore) setHighScore(next);
      return next;
    });

    onShowToast(`🎯 콤보 히트! +${gained} 점수 획득`);
  };

  const handleFlipCard = (idx: number) => {
    const updated = [...flippedCards];
    updated[idx] = !updated[idx];
    setFlippedCards(updated);
    onShowToast('✨ 타로 카드가 열렸습니다!');
  };

  const handleQuizAnswer = (option: string) => {
    const q = vocabQuestions[currentQuestionIdx];
    if (option === q.correct) {
      setQuizScore((prev) => prev + 50 * combo);
      setCombo((prev) => prev + 1);
      setEnemyHp((prev) => Math.max(0, prev - 35));
      onShowToast(`⚔️ 정답 크리티컬! 콤보 x${combo + 1}`);

      if (enemyHp <= 35) {
        onShowToast('🏆 보스 몬스터 격파! 다음 배틀로 진행합니다.');
        setEnemyHp(100);
      }

      setCurrentQuestionIdx((prev) => (prev + 1) % vocabQuestions.length);
    } else {
      setCombo(1);
      onShowToast('❌ 오답입니다! 콤보가 초기화되었습니다.');
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleReload = () => {
    setScore(100);
    setTimerSeconds(25 * 60);
    setIsTimerRunning(false);
    setFlippedCards([false, false, false]);
    setQuizScore(120);
    setCurrentQuestionIdx(0);
    setCombo(1);
    setLunchIdx(0);
    setIsRaining(false);
    setEnemyHp(100);
    setGrid2048([2, 4, 8, 16, 32, 64, 128, 512, 2048]);
    onShowToast('🔄 가상 프레임과 게임 데이터를 초기화했습니다.');
  };

  const handleShare = async () => {
    try {
      if (!navigator.clipboard) throw new Error('Clipboard unavailable');
      const url = app.simulatorType === 'generic' ? safeUrl(app.url) : window.location.href;
      if (!url) throw new Error('Invalid URL');
      await navigator.clipboard.writeText(url);
      onShowToast('작품 링크를 복사했어요!');
    } catch { onShowToast('복사하지 못했습니다. 클립보드 권한을 확인해주세요.'); }
  };

  const handleStarRating = () => {
    if (onRate(app.id)) onShowToast('별점 5.0을 이 브라우저에 저장했습니다.');
  };

  const handleLocalLike = () => {
    if (onToggleLike(app.id)) onShowToast(app.isLiked ? '응원을 취소했어요.' : '이 브라우저에 응원을 저장했어요!');
  };

  return (
    <div
      id="webapp-runner-modal" role="dialog" aria-modal="true" aria-labelledby="modal-app-title"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center bg-black/60 backdrop-blur-sm transition-all duration-300 p-0 sm:p-4"
    >
      <div className="relative w-full max-w-lg h-[90vh] sm:h-[820px] max-h-[880px] rounded-t-3xl sm:rounded-3xl bg-[#f8f9ff] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300">
        
        {/* Modal App Header Bar */}
        <div className="h-14 px-4 bg-white flex items-center justify-between shadow-sm z-10 border-b border-slate-100">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#3525cd] text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
              {app.category === 'game' ? '🎮' : app.category === 'study' ? '📚' : app.category === 'ai' ? '🔮' : '✨'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-[#0b1c30] truncate" id="modal-app-title">
                {app.title}
              </span>
              <span className="text-[11px] text-[#464555] truncate font-medium" id="modal-app-dev">
                {app.authorName} 제작 · {app.simulatorType === 'generic' ? '등록 작품' : '예시 데모'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              id="modal-sound-btn"
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                onShowToast(soundEnabled ? '🔇 사운드 음소거' : '🔊 사운드 활성화');
              }}
              className="w-8 h-8 rounded-lg bg-slate-100 text-[#0b1c30] hover:bg-slate-200 flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
              title="소리 켜기/끄기"
              type="button"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>

            <button
              id="modal-reload-btn"
              onClick={handleReload}
              className="w-8 h-8 rounded-lg bg-slate-100 text-[#0b1c30] hover:bg-slate-200 flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
              title="새로고침"
              type="button"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <a
              id="modal-newtab-btn"
              aria-disabled={app.simulatorType !== 'generic'}
              href={app.simulatorType === 'generic' ? safeUrl(app.url) || undefined : undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-lg bg-slate-100 text-[#0b1c30] hover:bg-slate-200 flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
              title="새 탭으로 열기"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              id="close-modal-btn"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-200 text-[#0b1c30] hover:bg-slate-300 flex items-center justify-center ml-1 active:scale-90 transition-transform cursor-pointer"
              title="닫기"
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Viewport content */}
        <div className="relative flex-1 w-full bg-[#1c293a] text-white flex flex-col items-center justify-center overflow-y-auto p-4 select-none">
          
          {/* SIMULATOR 1: 2048 Runner */}
          {app.simulatorType === 'runner2048' && (
            <div className="w-full max-w-sm flex flex-col items-center gap-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between w-full px-2">
                <div className="px-3.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-md text-white text-xs font-bold flex items-center gap-2">
                  <span>SCORE</span>
                  <strong className="text-[#57dffe] text-base" id="sim-score">
                    {score}
                  </strong>
                </div>
                <div className="px-3.5 py-1.5 rounded-xl bg-white/10 backdrop-blur-md text-white text-xs font-bold flex items-center gap-2">
                  <span>HIGH</span>
                  <strong className="text-white text-base">{highScore}</strong>
                </div>
              </div>

              {/* 3x3 interactive click grid */}
              <div
                className="relative w-full aspect-square max-w-[280px] rounded-2xl bg-white/10 p-3 grid grid-cols-3 gap-2 backdrop-blur-md shadow-inner border border-white/15"
                id="sim-active-board"
              >
                {grid2048.map((num, i) => {
                  const getBg = (val: number) => {
                    if (val <= 4) return 'bg-[#4f46e5] text-white';
                    if (val <= 16) return 'bg-[#57dffe] text-[#006172]';
                    if (val <= 64) return 'bg-[#3525cd] text-white';
                    if (val <= 256) return 'bg-[#b03136] text-white';
                    if (val <= 1024) return 'bg-[#00687a] text-white';
                    return 'bg-gradient-to-tr from-[#57dffe] to-[#4f46e5] text-white animate-pulse';
                  };

                  return (
                    <button
                      key={i}
                      onClick={() => handleTileClick(i)}
                      className={`sim-cell rounded-xl ${getBg(
                        num
                      )} text-xl sm:text-2xl font-black flex items-center justify-center active:scale-90 transition-all cursor-pointer shadow-md`}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-white/5 border border-white/10">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <p className="text-xs text-white/85 text-center font-medium">
                  블록을 직접 터치해보세요! 숫자가 합체되며 점수가 올라갑니다.
                </p>
              </div>
            </div>
          )}

          {/* SIMULATOR 2: AI 급식 알리미 */}
          {app.simulatorType === 'lunchMenu' && (
            <div className="w-full max-w-sm flex flex-col items-center gap-3 animate-in fade-in duration-300">
              <div className="w-full bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-[#57dffe]" />
                    <span className="text-sm font-bold text-[#57dffe]">{lunchMenus[lunchIdx].date}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                    {lunchMenus[lunchIdx].calories}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 my-1">
                  {lunchMenus[lunchIdx].dishes.map((dish, i) => (
                    <div key={i} className="p-2.5 rounded-xl bg-white/10 text-xs font-medium flex items-center gap-1.5">
                      <span>{dish}</span>
                    </div>
                  ))}
                </div>

                <div className="p-3 rounded-xl bg-[#00687a]/40 border border-[#57dffe]/30 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#acedff] flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> AI 영양 평가
                    </span>
                    <span className="text-xs font-bold text-yellow-300">{lunchMenus[lunchIdx].score}</span>
                  </div>
                  <p className="text-[11px] text-white/80 leading-relaxed">{lunchMenus[lunchIdx].eval}</p>
                </div>

                <button
                  onClick={() => {
                    setLunchIdx((prev) => (prev + 1) % lunchMenus.length);
                    onShowToast('🍱 급식 식단을 새로 불러왔습니다.');
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#57dffe] text-[#006172] font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-[#acedff] active:scale-95 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>다른 날짜 식단 & AI 분석 보기</span>
                </button>
              </div>
            </div>
          )}

          {/* SIMULATOR 3: Lo-Fi Study Timer */}
          {app.simulatorType === 'lofiTimer' && (
            <div className="w-full max-w-sm flex flex-col items-center gap-4 animate-in fade-in duration-300">
              <div className="w-full bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 flex flex-col items-center gap-4">
                <span className="text-xs font-bold text-[#c3c0ff] tracking-wider uppercase">POMODORO FOCUS</span>
                
                {/* Big digital timer */}
                <div className="text-5xl font-extrabold tracking-widest text-white drop-shadow font-mono">
                  {formatTimer(timerSeconds)}
                </div>

                {/* Animated sound wave bars */}
                <div className="flex items-end gap-1 h-10 py-1">
                  {[40, 70, 30, 90, 60, 80, 45, 100, 50, 75, 35, 85].map((h, i) => (
                    <div
                      key={i}
                      className={`w-1.5 rounded-full transition-all duration-300 ${
                        isTimerRunning ? 'bg-[#57dffe]' : 'bg-white/30'
                      }`}
                      style={{
                        height: isTimerRunning ? `${(h * ((i % 3) + 1)) % 100}%` : '20%',
                        animation: isTimerRunning ? `pulse 1s infinite alternate ${i * 0.1}s` : 'none',
                      }}
                    />
                  ))}
                </div>

                {/* Timer controls */}
                <div className="flex items-center gap-3 w-full">
                  <button
                    onClick={() => {
                      setIsTimerRunning(!isTimerRunning);
                      onShowToast(isTimerRunning ? '⏸️ 타이머 일시정지' : '▶️ 뽀모도로 타이머 시작!');
                    }}
                    className="flex-1 py-3 rounded-xl bg-[#4f46e5] text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#3525cd] active:scale-95 transition-all cursor-pointer shadow-md shadow-indigo-600/30"
                  >
                    {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                    <span>{isTimerRunning ? '일시 정지' : '타이머 시작'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsRaining(!isRaining);
                      onShowToast(isRaining ? '🌧️ 빗소리 앰비언스 끄기' : '🌧️ 감성 빗소리 앰비언스 켜짐');
                    }}
                    className={`p-3 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                      isRaining
                        ? 'bg-[#57dffe] text-[#006172] border-[#57dffe]'
                        : 'bg-white/10 text-white border-white/20 hover:bg-white/15'
                    }`}
                    title="빗소리 효과음 켜기/끄기"
                  >
                    <CloudRain className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SIMULATOR 4: 오늘의 운세 & 타로봇 */}
          {app.simulatorType === 'tarot' && (
            <div className="w-full max-w-sm flex flex-col items-center gap-3 animate-in fade-in duration-300">
              <p className="text-xs text-[#d3e4fe] text-center font-medium">
                원하는 카드를 터치하여 오늘의 학교 운세를 열어보세요!
              </p>

              <div className="grid grid-cols-3 gap-2.5 w-full">
                {tarotCards.map((card, i) => (
                  <div
                    key={i}
                    onClick={() => handleFlipCard(i)}
                    className="aspect-[2/3] rounded-xl p-2 cursor-pointer transition-all duration-500 transform hover:scale-105 active:scale-95 flex flex-col items-center justify-center text-center border border-white/20 shadow-lg relative overflow-hidden"
                    style={{
                      background: flippedCards[i]
                        ? 'linear-gradient(135deg, #3525cd, #00687a)'
                        : 'linear-gradient(135deg, #213145, #111827)',
                    }}
                  >
                    {flippedCards[i] ? (
                      <div className="flex flex-col items-center justify-between h-full py-1">
                        <span className="text-xs font-bold text-yellow-300">{card.luck}</span>
                        <div className="text-xs font-black text-white">{card.title}</div>
                        <p className="text-[10px] text-white/90 leading-tight">{card.desc}</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5">
                        <Sparkles className="w-5 h-5 text-indigo-300 animate-pulse" />
                        <span className="text-xs font-bold text-white/70">TAROT</span>
                        <span className="text-[10px] text-white/50">카드 {i + 1}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SIMULATOR 5: Vocab Wars (영어 퀴즈 배틀) */}
          {app.simulatorType === 'vocabWars' && (
            <div className="w-full max-w-sm flex flex-col items-center gap-3 animate-in fade-in duration-300">
              {/* Battle status bar */}
              <div className="w-full bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#acedff] flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5 text-yellow-400" /> 점수: {quizScore}
                  </span>
                  <span className="font-bold text-rose-400">🔥 콤보 x{combo}</span>
                </div>

                {/* Boss HP Bar */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[11px] text-white/70">
                    <span>👾 단어 마왕 체력</span>
                    <span>{enemyHp}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-black/40 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-rose-500 to-amber-400 transition-all duration-300"
                      style={{ width: `${enemyHp}%` }}
                    />
                  </div>
                </div>

                {/* Question */}
                <div className="p-3 my-1 rounded-xl bg-black/30 text-center border border-white/10">
                  <span className="text-xs text-white/60">다음 영단어의 올바른 뜻은?</span>
                  <h4 className="text-xl font-black text-yellow-300 tracking-wide mt-0.5">
                    {vocabQuestions[currentQuestionIdx].word}
                  </h4>
                </div>

                {/* 4 Choices */}
                <div className="grid grid-cols-1 gap-1.5">
                  {vocabQuestions[currentQuestionIdx].options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleQuizAnswer(opt)}
                      className="w-full p-2.5 text-left rounded-xl bg-white/10 hover:bg-[#4f46e5]/80 text-xs font-semibold text-white border border-white/10 active:scale-98 transition-all cursor-pointer flex items-center gap-2"
                    >
                      <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">
                        {i + 1}
                      </span>
                      <span>{opt}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Generic view for custom user-submitted apps */}
          {app.simulatorType === 'generic' && (
            <div className="w-full max-w-sm flex flex-col items-center gap-4 text-center p-4 bg-white/10 rounded-2xl border border-white/15">
              <div className="w-16 h-16 rounded-2xl bg-[#4f46e5] flex items-center justify-center text-3xl shadow-lg">
                🚀
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">{app.title}</h4>
                <p className="text-xs text-[#d3e4fe] mt-1">{app.description}</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 px-3 py-1.5 rounded-full border border-emerald-500/30">
                <CheckCircle2 className="w-4 h-4" />
                <span>등록한 외부 웹사이트</span>
              </div>
              <a
                href={app.simulatorType === 'generic' ? safeUrl(app.url) || undefined : undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-xl bg-[#57dffe] text-[#006172] font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#acedff] transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                <span>웹앱 원본 사이트로 이동하기</span>
              </a>
            </div>
          )}

        </div>

        {/* Modal Bottom Actions & Social Reactions Bar */}
        <div className="px-4 py-3 bg-white flex items-center justify-between shadow-lg border-t border-slate-100">
          <div className="flex items-center gap-2">
            <button
              id="modal-like-btn" aria-pressed={!!app.isLiked}
              onClick={handleLocalLike}
              className="h-10 px-3.5 rounded-full bg-rose-50 text-[#8f1721] text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer hover:bg-rose-100"
              type="button"
            >
              <Heart className="w-4 h-4 fill-[#8f1721]" />
              <span id="modal-like-count">{app.likes}</span>
            </button>

            <button
              id="modal-star-rate"
              onClick={handleStarRating}
              className="h-10 px-3.5 rounded-full bg-slate-100 text-[#0b1c30] text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer hover:bg-slate-200"
              type="button"
            >
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-400" />
              <span>별점 5.0 주기</span>
            </button>
          </div>

          <button
            id="modal-share-btn"
            onClick={handleShare}
            className="h-10 px-4 rounded-full bg-[#3525cd] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#3525cd]/20 active:scale-95 transition-all cursor-pointer hover:bg-[#281ca3]"
            type="button"
          >
            <Share2 className="w-4 h-4" />
            <span>친구에게 공유</span>
          </button>
        </div>

      </div>
    </div>
  );
};
