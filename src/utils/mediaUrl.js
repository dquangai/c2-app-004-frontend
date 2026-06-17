import { API_BASE_URL } from '../config/api';

/** Resolve backend-relative media paths (e.g. /uploads/avatars/...). */
export function resolveMediaUrl(path) {
  if (!path) return null;
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalized}`;
}
