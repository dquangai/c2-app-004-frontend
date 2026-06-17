import apiClient from './apiClient';

export async function fetchMembers(options = {}) {
  const params = {};
  if (options.all) {
    params.all = true;
  } else {
    params.limit = options.limit ?? 24;
    params.offset = options.offset ?? 0;
    if (options.verifiedOnly) params.verified_only = true;
  }
  const { data } = await apiClient.get('/api/members', { params });
  if (Array.isArray(data)) {
    return { items: data, total: data.length, limit: 0, offset: 0 };
  }
  return data;
}

export async function fetchMemberById(memberId) {
  const { data } = await apiClient.get(`/api/members/${memberId}`);
  return data;
}

export async function fetchMemberReviews(memberId) {
  const { data } = await apiClient.get(`/api/members/${memberId}/reviews`);
  return data;
}

export async function fetchGroups() {
  const { data } = await apiClient.get('/api/groups');
  return data;
}

export async function fetchEvents() {
  const { data } = await apiClient.get('/api/events');
  return data;
}

export async function fetchPosts() {
  const { data } = await apiClient.get('/api/posts');
  return data;
}

export async function fetchHonorLeaderboard(options = {}) {
  const params = {};
  if (options.period) params.period = options.period;
  if (options.refresh) params.refresh = true;
  const { data } = await apiClient.get('/api/honor-leaderboard', { params });
  return data;
}
