import apiClient from './apiClient';

export async function getMyProfileUpdate() {
  const { data } = await apiClient.get('/api/provider/profile-updates/me');
  return data;
}

export async function submitProfileUpdate(payload) {
  const { data } = await apiClient.post('/api/provider/profile-updates', payload);
  return data;
}
