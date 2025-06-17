// frontend/src/services/api.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instances
export const authAPI = axios.create({
  baseURL: `${API_BASE_URL}/api/auth`,
});

export const contractsAPI = axios.create({
  baseURL: `${API_BASE_URL}/api/contracts`,
});

export const documentsAPI = axios.create({
  baseURL: `${API_BASE_URL}/api/documents`,
});

export const notificationsAPI = axios.create({
  baseURL: `${API_BASE_URL}/api/notifications`,
});

// Add token to requests
const addAuthToken = (config: any) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

contractsAPI.interceptors.request.use(addAuthToken);
documentsAPI.interceptors.request.use(addAuthToken);
notificationsAPI.interceptors.request.use(addAuthToken);

// Response interceptor to handle 401 errors
const handle401 = (error: any) => {
  if (error.response?.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
  return Promise.reject(error);
};

authAPI.interceptors.response.use(
  (response) => response,
  handle401
);

contractsAPI.interceptors.response.use(
  (response) => response,
  handle401
);

documentsAPI.interceptors.response.use(
  (response) => response,
  handle401
);

notificationsAPI.interceptors.response.use(
  (response) => response,
  handle401
);

// Types
export interface Contract {
  id: number;
  contract_number: string;
  client_name: string;
  client_phone?: string;
  client_email?: string;
  property_address: string;
  property_type: string;
  rental_amount: number;
  deposit_amount: number;
  start_date: string;
  end_date: string;
  status: string;
  contract_file_path?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface ContractCreate {
  client_name: string;
  client_phone?: string;
  client_email?: string;
  property_address: string;
  property_type: string;
  rental_amount: number;
  deposit_amount: number;
  start_date: string;
  end_date: string;
}

export interface Document {
  id: number;
  title: string;
  description?: string;
  file_path: string;
  file_type: string;
  file_size?: number;
  contract_id?: number;
  uploaded_by: number;
  tags?: string[];
  expiry_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  related_contract_id?: number;
  related_document_id?: number;
  scheduled_date?: string;
  created_at: string;
}

// API Functions
export const contractService = {
  getAll: (params?: any) => contractsAPI.get('/', { params }),
  getById: (id: number) => contractsAPI.get(`/${id}`),
  create: (data: ContractCreate) => contractsAPI.post('/', data),
  update: (id: number, data: Partial<ContractCreate>) => contractsAPI.put(`/${id}`, data),
  delete: (id: number) => contractsAPI.delete(`/${id}`),
  download: (id: number) => contractsAPI.get(`/${id}/download`, { responseType: 'blob' }),
};

export const documentService = {
  getAll: (params?: any) => documentsAPI.get('/', { params }),
  getById: (id: number) => documentsAPI.get(`/${id}`),
  upload: (formData: FormData) => documentsAPI.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id: number, data: any) => documentsAPI.put(`/${id}`, data),
  delete: (id: number) => documentsAPI.delete(`/${id}`),
  download: (id: number) => documentsAPI.get(`/${id}/download`, { responseType: 'blob' }),
};

export const notificationService = {
  getAll: (params?: any) => notificationsAPI.get('/', { params }),
  getById: (id: number) => notificationsAPI.get(`/${id}`),
  create: (data: any) => notificationsAPI.post('/', data),
  update: (id: number, data: any) => notificationsAPI.put(`/${id}`, data),
  markAllRead: () => notificationsAPI.put('/mark-all-read'),
  delete: (id: number) => notificationsAPI.delete(`/${id}`),
};