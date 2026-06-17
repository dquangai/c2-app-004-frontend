import apiClient from './apiClient';
import { getAdminApiKey } from './adminService';

export async function calculateTrustScore(input, apiKey = getAdminApiKey()) {
  const { data } = await apiClient.post('/api/admin/trust-score/calculate', input, {
    headers: { 'X-Admin-API-Key': apiKey },
  });
  return data;
}

export async function refreshMemberTrustScore(memberId, apiKey = getAdminApiKey()) {
  const { data } = await apiClient.post(
    `/api/admin/trust-score/${memberId}/refresh`,
    null,
    { headers: { 'X-Admin-API-Key': apiKey } },
  );
  return data;
}

const FACTOR_LABELS = {
  identity: 'Identity (xác minh)',
  reputation: 'Reputation (đánh giá)',
  profile: 'Profile quality',
  responsiveness: 'Responsiveness',
  availability: 'Availability',
  behavior: 'Behavior',
};

export { FACTOR_LABELS };
