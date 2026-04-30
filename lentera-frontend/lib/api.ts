import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor: Otomatis masukin Bearer Token kalau user udah login
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export const setSudoHeader = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['X-Sudo-Token'] = token;
  } else {
    delete api.defaults.headers.common['X-Sudo-Token'];
  }
};

export default api;