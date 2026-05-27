import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/* =========================
   AUTH
========================= */
export const getCurrentUser   = ()     => api.get('/auth/user/');
export const changePassword   = (data) => api.post('/auth/change-password/', data);

/* =========================
   USERS
========================= */
export const getUsers                  = ()              => api.get('/users/');
export const getUser                   = (id)            => api.get(`/users/${id}/`);
export const createUser                = (data)          => api.post('/users/', data);
export const updateUser                = (id, data)      => api.patch(`/users/${id}/`, data);
export const deleteUser                = (id)            => api.delete(`/users/${id}/`);
export const adminForcePasswordChange  = (id, newPwd)   =>
  api.post(`/users/${id}/force-password-change/`, { new_password: newPwd });

/* =========================
   DEPARTMENTS
========================= */
export const getDepartments    = ()         => api.get('/departments/');
export const getDepartment     = (id)       => api.get(`/departments/${id}/`);
export const createDepartment  = (data)     => api.post('/departments/', data);
export const updateDepartment  = (id, data) => api.patch(`/departments/${id}/`, data);
export const deleteDepartment  = (id)       => api.delete(`/departments/${id}/`);

/* =========================
   STUDENTS
========================= */
export const getStudents   = ()         => api.get('/students/');
export const getStudent    = (id)       => api.get(`/students/${id}/`);
export const createStudent = (data)     => api.post('/students/', data);
export const updateStudent = (id, data) => api.patch(`/students/${id}/`, data);

/* =========================
   VISITS
========================= */
export const getVisits    = (params = {}) => api.get('/visits/', { params });
export const getVisit     = (id)          => api.get(`/visits/${id}/`);
export const createVisit  = (data)        => api.post('/visits/', data);
export const updateVisit  = (id, data)    => api.patch(`/visits/${id}/`, data);

/* =========================
   REFERRALS
========================= */
export const getReferrals   = ()         => api.get('/referrals/');
export const getReferral    = (id)       => api.get(`/referrals/${id}/`);
export const createReferral = (data)     => api.post('/referrals/', data);
export const updateReferral = (id, data) => api.patch(`/referrals/${id}/`, data);

/* =========================
   LAB REQUESTS
========================= */
export const getLabRequests   = (params)     => api.get('/visits/lab-requests/', { params });
export const createLabRequest = (data)       => api.post('/visits/lab-requests/', data);
export const updateLabRequest = (id, data)   => api.patch(`/visits/lab-requests/${id}/`, data);

/* =========================
   PRESCRIPTIONS
========================= */
export const getPrescriptions   = (params = {}) => api.get('/visits/prescriptions/', { params });
export const createPrescription = (data)        => api.post('/visits/prescriptions/', data);
export const updatePrescription = (id, data)    => api.patch(`/visits/prescriptions/${id}/`, data);

/* =========================
    REPORTS
========================= */
export const getDashboardStats            = ()  => api.get('/reports/dashboard/');
export const getStudentsReferredThisMonth = ()  => api.get('/reports/students-this-month/');
export const getEnhancedDashboardStats    = (params = {}) => api.get('/reports/enhanced-dashboard/', { params });

/* =========================
   AUDIT LOGS
========================= */
export const getAuditLogs    = (params = {}) => api.get('/audit-logs/', { params });
export const getAuditLog     = (id)          => api.get(`/audit-logs/${id}/`);
export const getAuditMetrics = (params = {}) => api.get('/audit-logs/metrics/', { params });
export const getAuditEnums   = ()            => api.get('/audit-logs/enums/');
export const exportAuditCSV  = (params = {}) =>
  api.get('/audit-logs/export/', { params, responseType: 'blob' });

export default api;