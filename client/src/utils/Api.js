import axios from 'axios';
import {
  beginTrackedRequest,
  finishTrackedRequest,
} from './requestLoader.js';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
});

API.interceptors.request.use(config => {
  beginTrackedRequest(config);
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

API.interceptors.response.use(
  response => {
    finishTrackedRequest(response.config);
    return response;
  },
  error => {
    finishTrackedRequest(error?.config);
    return Promise.reject(error);
  },
);

export default API;
