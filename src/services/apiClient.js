import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    if (typeof config.headers?.delete === 'function') {
      config.headers.delete('Content-Type');
    } else if (config.headers) {
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
    (error) => {
    const detail = error.response?.data?.detail;
    let message = 'Không thể kết nối API V-Connect';
    if (typeof detail === 'string') {
      message = detail;
    } else if (Array.isArray(detail)) {
      message = detail.map((item) => item?.msg || JSON.stringify(item)).join('; ');
    } else if (detail && typeof detail === 'object') {
      message = JSON.stringify(detail);
    } else if (error.message) {
      message = error.message;
    }
    if (error.code === 'ECONNABORTED' || /timeout/i.test(message)) {
      message = 'Backend phản hồi quá chậm. Kiểm tra server port 8010 và thử lại.';
    }
    return Promise.reject(new Error(message));
  },
);

export default apiClient;
