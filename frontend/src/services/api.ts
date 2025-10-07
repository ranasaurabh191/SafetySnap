import axios from 'axios';
import type { Detection, DetectionStats, PPEPolicy, Site, UploadData, Violation } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
// Add these helper functions at the top of the file
const STORAGE_KEY = 'readNotifications';

const getReadNotifications = (): Set<string> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return new Set(stored ? JSON.parse(stored) : []);
  } catch {
    return new Set();
  }
};

const saveReadNotification = (id: string) => {
  const read = getReadNotifications();
  read.add(id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...read]));
};

const saveAllReadNotifications = (ids: string[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
};

// Update the notifications object
export const notifications = {
  getAll: async () => {
    const response = await api.get('/notifications/');
    const readIds = getReadNotifications();
    
    // Mark as read if in localStorage
    const data = response.data.map((notif: any) => ({
      ...notif,
      read: readIds.has(notif.id) || notif.read
    }));
    
    return { ...response, data };
  },

  markRead: async (notificationId: string) => {
    saveReadNotification(notificationId);
    try {
      await api.post(`/notifications/mark-read/${notificationId}/`);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  },

  markAllRead: async () => {
    try {
      const allNotifs = await api.get('/notifications/');
      const allIds = allNotifs.data.map((n: any) => n.id);
      saveAllReadNotifications(allIds);
      await api.post('/notifications/mark-all-read/');
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});
// Add these interfaces at the top with other types
export interface Notification {
  id: string;
  type: 'success' | 'warning' | 'danger' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  detection_id?: string;
  violation_id?: number;
}

// Add this at the end of the file
export const notificationAPI = {
  getAll: async () => {
    const response = await api.get<Notification[]>('/api/ppe/notifications/');
    return response.data;
  },

  markAsRead: async (notificationId: string) => {
    const response = await api.post(`/api/ppe/notifications/${notificationId}/read/`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.post('/api/ppe/notifications/mark-all-read/');
    return response.data;
  },
};

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Detection APIs
export const detectionAPI = {
  getAll: async (params?: {
    site?: number;
    status?: string;
    compliance_status?: string;
  }) => {
    const response = await api.get('/api/ppe/detections/', { params });
    console.log('Full API response:', response.data);
    
    // Check if response is paginated (has 'results' key)
    if (response.data && typeof response.data === 'object' && 'results' in response.data) {
      console.log('Paginated response, returning results:', response.data.results);
      return response.data.results;
    }
    
    // Otherwise return data as-is
    console.log('Direct response:', response.data);
    return Array.isArray(response.data) ? response.data : [];
  },

  getById: async (id: string) => {
    const response = await api.get<Detection>(`/api/ppe/detections/${id}/`);
    return response.data;
  },

  create: async (data: UploadData) => {
    const formData = new FormData();
    formData.append('original_image', data.original_image);
    if (data.site) formData.append('site', data.site.toString());
    if (data.policy) formData.append('policy', data.policy.toString());
    if (data.notes) formData.append('notes', data.notes);
    if (data.location_lat) formData.append('location_lat', data.location_lat.toString());
    if (data.location_lng) formData.append('location_lng', data.location_lng.toString());

    const response = await api.post<Detection>('/api/ppe/detections/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  reanalyze: async (id: string, policyId: number) => {
    const response = await api.post<Detection>(`/api/ppe/detections/${id}/reanalyze/`, {
      policy_id: policyId,
    });
    return response.data;
  },

  getStatistics: async () => {
    const response = await api.get<DetectionStats>('/api/ppe/detections/statistics/');
    return response.data;
  },
};
// Get read notification IDs from localStorage





// Policy APIs
export const policyAPI = {
  getAll: async (siteId?: number) => {
    const response = await api.get<PPEPolicy[]>('/api/ppe/policies/', {
      params: siteId ? { site: siteId } : undefined,
    });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get<PPEPolicy>(`/api/ppe/policies/${id}/`);
    return response.data;
  },

  create: async (data: Partial<PPEPolicy>) => {
    const response = await api.post<PPEPolicy>('/api/ppe/policies/', data);
    return response.data;
  },

  update: async (id: number, data: Partial<PPEPolicy>) => {
    const response = await api.put<PPEPolicy>(`/api/ppe/policies/${id}/`, data);
    return response.data;
  },

  delete: async (id: number) => {
    await api.delete(`/api/ppe/policies/${id}/`);
  },
};

// Violation APIs
export const violationAPI = {
  getAll: async (params?: { status?: string; severity?: string }) => {
    const response = await api.get<Violation[]>('/api/ppe/violations/', { params });
    return response.data;
  },

  acknowledge: async (id: number) => {
    const response = await api.post<Violation>(`/api/ppe/violations/${id}/acknowledge/`);
    return response.data;
  },

  resolve: async (id: number) => {
    const response = await api.post<Violation>(`/api/ppe/violations/${id}/resolve/`);
    return response.data;
  },
};

export default api;
