import axios from 'axios';
import type { User, LoginCredentials, RegisterData, AuthResponse } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const authAPI = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
export const logout = async (): Promise<void> => {
  try {
    // Try to call backend logout (will fail gracefully if endpoint doesn't exist)
    await api.post('/api/auth/logout/');
  } catch (error) {
    // Ignore 404 errors - we'll clear the token locally anyway
    console.log('Backend logout unavailable, clearing token locally');
  } finally {
    // Always clear local storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await authAPI.post<AuthResponse>('/api/auth/login/', credentials);
    return response.data;
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await authAPI.post<AuthResponse>('/api/auth/register/', data);
    return response.data;
  },

  logout: async (token: string): Promise<void> => {
    await authAPI.post(
      '/api/auth/logout/',
      {},
      {
        headers: {
          Authorization: `Token ${token}`,
        },
      }
    );
  },

  getProfile: async (token: string): Promise<User> => {
    const response = await authAPI.get<User>('/api/auth/profile/', {
      headers: {
        Authorization: `Token ${token}`,
      },
    });
    return response.data;
  },
};
