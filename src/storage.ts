import { AppProject } from './types';
import { INITIAL_APPS } from './data/initialApps';

export const STORAGE_KEY = 'appfactory-projects-v1';
export function safeUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

function validApp(value: unknown): value is AppProject {
  if (!value || typeof value !== 'object') return false;
  const app = value as AppProject;
  const strings = ['id', 'title', 'description', 'tech', 'actionText', 'actionIcon', 'actionBgColor', 'authorName', 'authorRole', 'authorInitial', 'authorInitialBg', 'imageUrl', 'url'] as const;
  return strings.every(key => typeof app[key] === 'string') && !!app.title.trim() && !!app.authorName.trim()
    && !!safeUrl(app.url) && !!safeUrl(app.imageUrl)
    && ['game', 'study', 'ai', 'fun'].includes(app.category)
    && ['runner2048', 'lunchMenu', 'lofiTimer', 'tarot', 'vocabWars', 'generic'].includes(app.simulatorType)
    && ['rating', 'plays', 'commentsCount', 'likes'].every(key => Number.isFinite(app[key as keyof AppProject]) && Number(app[key as keyof AppProject]) >= 0)
    && Array.isArray(app.badges) && app.badges.every(badge => typeof badge === 'string')
    && (app.isLiked === undefined || typeof app.isLiked === 'boolean');
}

export function loadApps(): AppProject[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!Array.isArray(saved)) return INITIAL_APPS;
    const ids = new Set<string>();
    const apps = saved.filter(validApp).filter(app => !ids.has(app.id) && ids.add(app.id));
    return apps.length ? apps : INITIAL_APPS;
  } catch { return INITIAL_APPS; }
}

export function saveApps(apps: AppProject[]): boolean {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(apps)); return true; }
  catch { return false; }
}
