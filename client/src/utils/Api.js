import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:3000/api' });

API.interceptors.request.use(config => {
  const token = sessionStorage.getItem('token'); 
  console.log("TOKEN:", sessionStorage.getItem("token"));

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default API;