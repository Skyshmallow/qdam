import { useNotificationStore } from '../../store/notificationStore';
import { NotificationItem } from './NotificationItem';
import './NotificationContainer.css';

export const NotificationContainer = () => {
  const { notifications } = useNotificationStore();

  // Show only the latest notification
  const latestNotification = notifications[notifications.length - 1];

  if (!latestNotification) {
    return null;
  }

  return (
    <div className="notification-container">
      <NotificationItem key={latestNotification.id} notification={latestNotification} />
    </div>
  );
};
