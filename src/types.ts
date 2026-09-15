export type Category = 'all' | 'game' | 'ai' | 'study' | 'fun';

export interface AppProject {
  id: string;
  title: string;
  description: string;
  category: 'game' | 'ai' | 'study' | 'fun';
  tech: string;
  badges: string[];
  actionText: string;
  actionIcon: string;
  actionBgColor: string;
  authorName: string;
  authorRole: string;
  authorInitial: string;
  authorInitialBg: string;
  imageUrl: string;
  rating: number;
  plays: number;
  commentsCount: number;
  likes: number;
  isLiked?: boolean;
  url: string;
  simulatorType: 'runner2048' | 'lunchMenu' | 'lofiTimer' | 'tarot' | 'vocabWars' | 'generic';
  hidden?: boolean;
  creatorId?: string;
  hiddenAt?: unknown;
}

export type ActiveTab = 'gallery' | 'rankings' | 'register' | 'about';
