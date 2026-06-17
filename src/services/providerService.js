import apiClient from './apiClient';

export async function getMyProviderApplication() {
  const { data } = await apiClient.get('/api/provider/applications/me');
  return data;
}

export async function submitProviderApplication(payload) {
  const { data } = await apiClient.post('/api/provider/applications', payload);
  return data;
}

export async function uploadProviderCredential(file) {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient.post('/api/provider/applications/me/credentials', formData);
  return data;
}
