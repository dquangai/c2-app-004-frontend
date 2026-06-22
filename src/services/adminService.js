import apiClient from './apiClient';
import { fetchMembers } from './catalogService';

const ADMIN_KEY_STORAGE = 'vconnect_admin_api_key';

export function getAdminApiKey() {
  return (
    import.meta.env.VITE_ADMIN_API_KEY ||
    localStorage.getItem(ADMIN_KEY_STORAGE) ||
    ''
  );
}

export function saveAdminApiKey(key) {
  const trimmed = (key || '').trim();
  if (trimmed) {
    localStorage.setItem(ADMIN_KEY_STORAGE, trimmed);
  } else {
    localStorage.removeItem(ADMIN_KEY_STORAGE);
  }
}

function adminHeaders(apiKey) {
  return { 'X-Admin-API-Key': apiKey };
}

export async function listMembers() {
  const page = await fetchMembers({ all: true });
  return page.items;
}

export async function fetchDashboardStats(apiKey = getAdminApiKey()) {
  const { data } = await apiClient.get('/api/admin/dashboard/stats', {
    headers: adminHeaders(apiKey),
  });
  return data;
}

export async function getMember(memberId, apiKey = getAdminApiKey()) {
  const { data } = await apiClient.get(`/api/admin/members/${memberId}`, {
    headers: adminHeaders(apiKey),
  });
  return data;
}

export async function upsertMember(member, apiKey = getAdminApiKey()) {
  const { data } = await apiClient.put(`/api/admin/members/${member.id}`, member, {
    headers: adminHeaders(apiKey),
  });
  return data;
}

export async function deleteMember(memberId, apiKey = getAdminApiKey()) {
  const { data } = await apiClient.delete(`/api/admin/members/${memberId}`, {
    headers: adminHeaders(apiKey),
  });
  return data;
}

export async function seedCatalog(force = false, apiKey = getAdminApiKey()) {
  const { data } = await apiClient.post(
    `/api/admin/catalog/seed${force ? '?force=true' : ''}`,
    null,
    { headers: adminHeaders(apiKey) },
  );
  return data;
}

export async function listProviderApplications(status = 'pending', apiKey = getAdminApiKey()) {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  const { data } = await apiClient.get(`/api/admin/applications${query}`, {
    headers: adminHeaders(apiKey),
  });
  return data;
}

export async function approveProviderApplication(applicationId, body = {}, apiKey = getAdminApiKey()) {
  const { data } = await apiClient.post(
    `/api/admin/applications/${applicationId}/approve`,
    body,
    { headers: adminHeaders(apiKey) },
  );
  return data;
}

export async function rejectProviderApplication(applicationId, reason, apiKey = getAdminApiKey()) {
  const { data } = await apiClient.post(
    `/api/admin/applications/${applicationId}/reject`,
    { reason },
    { headers: adminHeaders(apiKey) },
  );
  return data;
}

export async function updateApplicationChecklist(applicationId, checklist, apiKey = getAdminApiKey()) {
  const { data } = await apiClient.put(
    `/api/admin/applications/${applicationId}/checklist`,
    checklist,
    { headers: adminHeaders(apiKey) },
  );
  return data;
}

export async function fetchApplicationCredentialBlob(applicationId, fileId, apiKey = getAdminApiKey()) {
  const { data } = await apiClient.get(
    `/api/admin/applications/${applicationId}/credentials/${fileId}`,
    { headers: adminHeaders(apiKey), responseType: 'blob' },
  );
  return data;
}

export async function listProfileUpdates(status = 'pending', apiKey = getAdminApiKey()) {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  const { data } = await apiClient.get(`/api/admin/profile-updates${query}`, {
    headers: adminHeaders(apiKey),
  });
  return data;
}

export async function approveProfileUpdate(updateId, apiKey = getAdminApiKey()) {
  const { data } = await apiClient.post(
    `/api/admin/profile-updates/${updateId}/approve`,
    {},
    { headers: adminHeaders(apiKey) },
  );
  return data;
}

export async function rejectProfileUpdate(updateId, reason, apiKey = getAdminApiKey()) {
  const { data } = await apiClient.post(
    `/api/admin/profile-updates/${updateId}/reject`,
    { reason },
    { headers: adminHeaders(apiKey) },
  );
  return data;
}
