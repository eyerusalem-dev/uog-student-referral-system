import axios from 'axios';

// We removed the hardcoded 'Content-Type' header. 
// Axios will now automatically detect if you are sending JSON or a File.
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
});

// Add token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Student APIs
export const getStudents = () => api.get('/students/');
export const getStudent = (id) => api.get(`/students/${id}/`);
export const createStudent = (data) => api.post('/students/', data);
export const updateStudent = (id, data) => api.patch(`/students/${id}/`, data);

// Visit APIs
export const getVisits = () => api.get('/visits/');
export const createVisit = (data) => api.post('/visits/', data);
export const getVisit = (id) => api.get(`/visits/${id}/`);
export const updateVisit = (id, data) => api.patch(`/visits/${id}/`, data);

export default api;