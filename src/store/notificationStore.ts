import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { Notification } from '../types/ui.types';

interface NotificationState {
  notifications: Notification[];
  
  // Добавить новое уведомление
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  
  // Удалить уведомление по ID
  removeNotification: (id: string) => void;
  
  // Очистить все уведомления
  clearAll: () => void;
  
  // Helper: показать success уведомление
  showSuccess: (message: string, duration?: number) => void;
  
  // Helper: показать error уведомление
  showError: (message: string, duration?: number) => void;
  
  // Helper: показать warning уведомление
  showWarning: (message: string, duration?: number) => void;
  
  // Helper: показать info уведомление
  showInfo: (message: string, duration?: number) => void;
}

const MAX_NOTIFICATIONS = 1; // Только одно уведомление

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],

  addNotification: (notification) => {
    const id = nanoid();
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration || 3000, // Default: 3 секунды
    };

    set((state) => {
      let notifications = [...state.notifications, newNotification];
      
      // Если больше MAX_NOTIFICATIONS, удаляем самое старое
      if (notifications.length > MAX_NOTIFICATIONS) {
        notifications = notifications.slice(-MAX_NOTIFICATIONS);
      }
      
      return { notifications };
    });

    // Автоматическое удаление через duration
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        get().removeNotification(id);
      }, newNotification.duration);
    }
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  clearAll: () => {
    set({ notifications: [] });
  },

  // Helper methods
  showSuccess: (message, duration) => {
    get().addNotification({ type: 'success', message, duration });
  },

  showError: (message, duration) => {
    get().addNotification({ type: 'error', message, duration });
  },

  showWarning: (message, duration) => {
    get().addNotification({ type: 'warning', message, duration });
  },

  showInfo: (message, duration) => {
    get().addNotification({ type: 'info', message, duration });
  },
}));
