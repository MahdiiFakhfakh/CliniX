import axios from "axios";

const API_URL = "http://localhost:5000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  register: (userData) => api.post("/auth/register", userData),
};

// Admin API
export const adminAPI = {
  getDashboardStats: () => api.get("/admin/dashboard/stats"),
};

// Patients API
export const patientsAPI = {
  getAll: (params) => api.get("/patients", { params }),
  getById: (id) => api.get(`/patients/${id}`),
  create: (data) => api.post("/patients", data),
  update: (id, data) => api.put(`/patients/${id}`, data),
  delete: (id) => api.delete(`/patients/${id}`),
  updateStatus: (id, status) => api.put(`/patients/${id}/status`, { status }),
  getStats: () => api.get("/patients/stats"),
};

// Doctors API
export const doctorsAPI = {
  getAll: (params) => api.get("/doctors", { params }),
  getById: (id) => api.get(`/doctors/${id}`),
  create: (data) => api.post("/doctors", data),
  update: (id, data) => api.put(`/doctors/${id}`, data),
  delete: (id) => api.delete(`/doctors/${id}`),
};

// Appointments API
export const appointmentsAPI = {
  getAll: (params) => api.get("/appointments", { params }),
  getById: (id) => api.get(`/appointments/${id}`),
  create: (data) => api.post("/appointments", data),
  update: (id, data) => api.put(`/appointments/${id}`, data),
  delete: (id) => api.delete(`/appointments/${id}`),
  updateStatus: (id, status) =>
    api.put(`/appointments/${id}/status`, { status }),
};

// Prescriptions API
export const prescriptionsAPI = {
  getAll: (params) => api.get("/prescriptions", { params }),
  getById: (id) => api.get(`/prescriptions/${id}`),
  create: (data) => api.post("/prescriptions", data),
  update: (id, data) => api.put(`/prescriptions/${id}`, data),
  delete: (id) => api.delete(`/prescriptions/${id}`),
  updateStatus: (id, status) =>
    api.put(`/prescriptions/${id}/status`, { status }),
};

export default api;
