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
  hiddenBy?: string;
  createdBy?: string;
  aiTools?: string[];
  aiUsage?: string[];
  aiNote?: string;
}

export type MemberStatus = 'pending' | 'approved' | 'rejected' | 'blocked';

export interface ClubProfile {
  id: 'main';
  name: string;
  tagline: string;
  description: string;
  festivalLabel: string;
  heroImageUrl?: string;
  updatedAt?: unknown;
  updatedBy?: string;
}

export interface ClubSchedule {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  order: number;
  hidden?: boolean;
}

export interface ClubMember {
  id: string;
  name: string;
  role: string;
  grade?: string;
  introduction?: string;
  photoUrl?: string;
  order: number;
  status: 'active' | 'hidden';
}

export interface MemberRequest {
  id: string;
  email: string;
  displayName: string;
  photoUrl?: string;
  status: MemberStatus;
  requestedAt?: unknown;
  reviewedAt?: unknown;
  reviewedBy?: string;
  reason?: string;
}

export type ActiveTab = 'gallery' | 'rankings' | 'register' | 'about';
