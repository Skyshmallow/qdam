import { useNotificationStore } from '../../store/notificationStore';
import { NotificationItem } from './NotificationItem';
import './NotificationContainer.css';

export const NotificationContainer = () => {
  const { notifications } = useNotificationStore();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="notification-container">
      {notifications.map((notification) => (
        <NotificationItem key={notification.id} notification={notification} />
      ))}
    </div>
  );
};
