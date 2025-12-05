import { useState } from 'react';
import type { Notification } from '../../types/ui.types';
import { useNotificationStore } from '../../store/notificationStore';
import { useUIStore } from '../../store/uiStore';
import './NotificationItem.css';

interface NotificationItemProps {
  notification: Notification;
}

export const NotificationItem = ({ notification }: NotificationItemProps) => {
  const { removeNotification } = useNotificationStore();
  const { mapStyleTheme } = useUIStore();
  const [isExiting, setIsExiting] = useState(false);
  
  const themeClass = mapStyleTheme === 'light' ? 'theme-light' : '';

  const handleClose = () => {
    setIsExiting(true);
    // Задержка для анимации slide-out
    setTimeout(() => {
      removeNotification(notification.id);
    }, 300); // Совпадает с CSS animation duration
  };

  // Иконки для разных типов
  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return (
          <svg className="notification-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" strokeWidth="2" />
            <path d="M9 12l2 2 4-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case 'error':
        return (
          <svg className="notification-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" strokeWidth="2" />
            <path d="M15 9l-6 6M9 9l6 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="notification-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 2l9.5 16.5H2.5L12 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 9v4M12 17h.01" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case 'info':
        return (
          <svg className="notification-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" strokeWidth="2" />
            <path d="M12 16v-4M12 8h.01" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
    }
  };

  return (
    <div 
      className={`notification-item notification-${notification.type} ${isExiting ? 'notification-exit' : ''} ${themeClass}`}
      role="alert"
    >
      <div className="notification-icon-wrapper">
        {getIcon()}
      </div>
      
      <div className="notification-content">
        <p className="notification-message">{notification.message}</p>
        
        {notification.action && (
          <button
            className="notification-action"
            onClick={notification.action.onClick}
          >
            {notification.action.label}
          </button>
        )}
      </div>

      <button
        className="notification-close"
        onClick={handleClose}
        aria-label="Close notification"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
};
