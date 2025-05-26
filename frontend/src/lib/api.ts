import type { IError } from '@/types/generic.types';
import axios, { AxiosError } from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError<IError>) =>
    Promise.reject(error.response?.data?.message || error.message),
);

API.interceptors.response.use(
  (config) => config,
  (error: AxiosError<IError>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      return Promise.reject(error.response?.data?.message || error.message);
    }
    return Promise.reject(error.response?.data?.message || error.message)
  },
);

export default API;