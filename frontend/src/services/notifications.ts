import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from './api';

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

export const notificationAPI = {
  getAll: async () => {
    // Replace with real API endpoint when ready
    const response = await api.get<Notification[]>('/api/notifications/');
    return response.data;
  },

  markAsRead: async (id: string) => {
    const response = await api.post(`/api/notifications/${id}/read/`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.post('/api/notifications/mark-all-read/');
    return response.data;
  },

  delete: async (id: string) => {
    await api.delete(`/api/notifications/${id}/`);
  },
};

// Custom hook for notifications
export const useNotifications = () => {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationAPI.getAll,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const markAsRead = async (id: string) => {
    await notificationAPI.markAsRead(id);
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  const markAllAsRead = async () => {
    await notificationAPI.markAllAsRead();
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  const deleteNotification = async (id: string) => {
    await notificationAPI.delete(id);
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    isLoading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
};
