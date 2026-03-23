import axios from 'axios';
import { getToken } from '../utils/storage';

const baseURL =
  import.meta.env.VITE_API_URL || 'http://localhost:9999/api';

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // FormData: để trình duyệt set multipart boundary (không dùng application/json mặc định)
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

export default api;
