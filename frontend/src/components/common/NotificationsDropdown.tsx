import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatRelativeTime } from '@/utils/helpers';
import { notificationAPI } from '@/services/api';
import type { Notification } from '@/services/api';
import toast from 'react-hot-toast';

const STORAGE_KEY = 'readNotifications';

// ✅ Helper functions for localStorage
const getStoredReadNotifications = (): Set<string> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return new Set(stored ? JSON.parse(stored) : []);
  } catch {
    return new Set();
  }
};

const saveReadNotifications = (ids: Set<string>) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch (error) {
    console.error('Failed to save read notifications:', error);
  }
};

export const NotificationsDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [readNotifications, setReadNotifications] = useState<Set<string>>(getStoredReadNotifications);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    saveReadNotifications(readNotifications);
  }, [readNotifications]);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationAPI.getAll,
    refetchInterval: 10000,
  });

  const unreadCount = notifications.filter(
    (n) => !n.read && !readNotifications.has(n.id)
  ).length;

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      setReadNotifications((prev) => new Set(prev).add(notificationId));
      return notificationAPI.markAsRead(notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error, notificationId) => {
      setReadNotifications((prev) => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
      toast.error('Failed to mark notification as read');
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const allIds = notifications.map(n => n.id);
      setReadNotifications(new Set(allIds));
      return notificationAPI.markAllAsRead();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All notifications marked as read');
    },
    onError: () => {
      setReadNotifications(getStoredReadNotifications());
      toast.error('Failed to mark all as read');
    },
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read && !readNotifications.has(notification.id)) {
      markAsReadMutation.mutate(notification.id);
    }

    if (notification.detection_id) {
      navigate(`/detections/${notification.detection_id}`);
      setIsOpen(false);
    }
  };

  const isNotificationRead = (notification: Notification) => {
    return notification.read || readNotifications.has(notification.id);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 dark:text-yellow-400" />;
      case 'danger':
        return <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 dark:text-red-400" />;
      default:
        return <Info className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 dark:text-orange-400" />;
    }
  };

  const getBackgroundColor = (notification: Notification) => {
    const isRead = isNotificationRead(notification);
    
    if (!isRead) {
      switch (notification.type) {
        case 'danger':
          return 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500';
        case 'warning':
          return 'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500';
        case 'success':
          return 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500';
        default:
          return 'bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500';
      }
    }
    return 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Mobile backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/20 z-40 md:hidden"
            />

            {/* Dropdown menu */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="fixed md:absolute left-0 right-0 md:right-0 md:left-auto mt-2 mx-2 md:mx-0 w-[calc(100%-1rem)] sm:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 max-h-[calc(100vh-8rem)] md:max-h-[600px] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-3 sm:p-4 rounded-2xl border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {unreadCount} unread
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllAsReadMutation.mutate()}
                      disabled={markAllAsReadMutation.isPending}
                      className="text-xs sm:text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium disabled:opacity-50"
                    >
                      {markAllAsReadMutation.isPending ? 'Marking...' : 'Mark all read'}
                    </button>
                  )}
                  {/* Close button for mobile */}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="md:hidden p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded"
                    aria-label="Close notifications"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Notifications list */}
              <div className="rounded-xl overflow-y-auto flex-1">
                {isLoading ? (
                  <div className="p-6 sm:p-8 text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-orange-600 border-t-transparent rounded-full mx-auto"></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Loading...</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-6 sm:p-8 text-center">
                    <Bell className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">No notifications</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      You'll see updates about detections and violations here
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {notifications.map((notification) => {
                      const isRead = isNotificationRead(notification);
                      return (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className={`p-3 sm:p-4 transition-colors cursor-pointer ${getBackgroundColor(notification)}`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex items-start gap-2 sm:gap-3">
                            <div className="flex-shrink-0 mt-0.5 sm:mt-1">
                              {getIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <h4 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                                    {notification.title}
                                  </h4>
                                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                                    {notification.message}
                                  </p>
                                </div>
                                {!isRead && (
                                  <span className="w-2 h-2 bg-orange-600 rounded-full flex-shrink-0 mt-1"></span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1.5 sm:mt-2">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatRelativeTime(notification.timestamp)}
                                </span>
                                {notification.detection_id && (
                                  <span className="text-xs text-orange-600 dark:text-orange-400 hover:underline">
                                    View details →
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
