import { API_BASE_URL } from '../config/api';

/** Health URL — uses Vite proxy in dev when API_BASE_URL is empty. */
export function getBackendHealthUrl() {
  const base = (API_BASE_URL || '').replace(/\/$/, '');
  return base ? `${base}/health` : '/health';
}

export async function fetchBackendHealth() {
  const res = await fetch(getBackendHealthUrl());
  if (!res.ok) {
    throw new Error(`Health check failed (${res.status})`);
  }
  return res.json();
}
