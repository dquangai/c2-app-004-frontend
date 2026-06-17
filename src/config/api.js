/** API base URL — empty string uses Vite dev proxy (/api → backend). */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

export const DEFAULT_USER_ID = import.meta.env.VITE_DEFAULT_USER_ID || 'user_demo';
