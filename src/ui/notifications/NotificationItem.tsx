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

  // Auto-dismiss on tap anywhere
  const handleDismiss = () => {
    if (isExiting) return;
    setIsExiting(true);
    setTimeout(() => {
      removeNotification(notification.id);
    }, 200);
  };

  // Get accent color based on type
  const getAccentColor = () => {
    switch (notification.type) {
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'info': return '#3b82f6';
      default: return '#3b82f6';
    }
  };

  return (
    <div 
      className={`notification-toast notification-${notification.type} ${isExiting ? 'notification-exit' : ''} ${themeClass}`}
      onClick={handleDismiss}
      role="alert"
      style={{ '--accent-color': getAccentColor() } as React.CSSProperties}
    >
      <div className="notification-indicator" />
      <span className="notification-text">{notification.message}</span>
    </div>
  );
};
