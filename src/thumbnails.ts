import manifest from './data/projectThumbnails.json';
import type { AppProject } from './types';

export const thumbnailServiceEnabled = import.meta.env.VITE_THUMBNAIL_SERVICE_ENABLED === 'true';

// Static migration previews work on GitHub Pages before the capture server is
// enabled. A changed URL or a server-generated/uploaded image takes precedence.
export function migratedThumbnail(project: AppProject): string | undefined {
  if (project.thumbnailSource) return undefined;
  const preview = (manifest as Record<string, { url: string; file?: string; status: string }>)[project.id];
  if (preview?.status !== 'ready' || preview.url !== project.url || !preview.file) return undefined;
  return new URL(`${import.meta.env.BASE_URL}project-thumbnails/${preview.file}`, window.location.href).href;
}
