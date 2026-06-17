import apiClient from './apiClient';

export async function register({ email, password, full_name }) {
  const { data } = await apiClient.post('/api/auth/register', { email, password, full_name });
  return data;
}

export async function login({ email, password }) {
  const { data } = await apiClient.post('/api/auth/login', { email, password });
  return data;
}

export async function fetchCurrentUser() {
  const { data } = await apiClient.get('/api/auth/me');
  return data;
}

export async function updateProfile(payload) {
  const { data } = await apiClient.patch('/api/auth/me', payload);
  return data;
}

export async function uploadAvatar(file) {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient.post('/api/auth/me/avatar', formData);
  return data;
}

export async function changePassword({ current_password, new_password }) {
  const { data } = await apiClient.post('/api/auth/change-password', {
    current_password,
    new_password,
  });
  return data;
}

export async function verifyEmail({ email, otp }) {
  const { data } = await apiClient.post('/api/auth/verify-email', { email, otp });
  return data;
}

export async function resendVerification(email) {
  const { data } = await apiClient.post('/api/auth/resend-verification', { email });
  return data;
}

export async function forgotPassword(email) {
  const { data } = await apiClient.post('/api/auth/forgot-password', { email });
  return data;
}

export async function resetPassword({ token, new_password }) {
  const { data } = await apiClient.post('/api/auth/reset-password', { token, new_password });
  return data;
}
