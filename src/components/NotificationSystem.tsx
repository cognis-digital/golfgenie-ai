import React, { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../hooks/useReduxState';
import { removeNotification } from '../store/slices/uiSlice';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

const NotificationSystem: React.FC = () => {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector(state => state.ui.notifications);
  
  useEffect(() => {
    // Auto-remove notifications after their duration
    notifications.forEach(notification => {
      if (notification.duration) {
        const timer = setTimeout(() => {
          dispatch(removeNotification(notification.id));
        }, notification.duration);
        
        return () => clearTimeout(timer);
      }
    });
  }, [notifications, dispatch]);
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };
  
  const getNotificationStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-amber-50 border-amber-200 text-amber-800';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };
  
  if (notifications.length === 0) {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map(notification => (
        <div 
          key={notification.id}
          className={`p-4 rounded-lg shadow-lg border ${getNotificationStyles(notification.type)} animate-fade-in-up`}
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              {getNotificationIcon(notification.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{notification.message}</p>
            </div>
            <div className="flex-shrink-0">
              <button
                onClick={() => dispatch(removeNotification(notification.id))}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationSystem;