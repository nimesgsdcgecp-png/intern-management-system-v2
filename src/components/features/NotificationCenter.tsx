"use client";

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppDispatch, useNotifications } from '@/lib/redux/hooks';
import { removeNotification, Notification } from '@/lib/redux/slices/notificationSlice';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const NotificationToast: React.FC<{ notification: Notification }> = ({ notification }) => {
  const dispatch = useAppDispatch();

  // Auto remove non-persistent notifications
  useEffect(() => {
    if (!notification.persistent && notification.duration && notification.duration > 0) {
      const timer = setTimeout(() => {
        dispatch(removeNotification(notification.id));
      }, notification.duration);

      return () => clearTimeout(timer);
    }
  }, [notification, dispatch]);

  const getStyles = () => {
    switch (notification.type) {
      case 'success':
        return {
          container: 'bg-emerald-50 border-emerald-100',
          icon: <CheckCircle className="w-5 h-5 text-emerald-600 fill-emerald-100" />,
          title: 'text-emerald-900',
          message: 'text-emerald-700'
        };
      case 'error':
        return {
          container: 'bg-red-50 border-red-100',
          icon: <AlertCircle className="w-5 h-5 text-red-600 fill-red-100" />,
          title: 'text-red-900',
          message: 'text-red-700'
        };
      case 'warning':
        return {
          container: 'bg-amber-50 border-amber-100',
          icon: <AlertTriangle className="w-5 h-5 text-amber-600 fill-amber-100" />,
          title: 'text-amber-900',
          message: 'text-amber-700'
        };
      case 'info':
      default:
        return {
          container: 'bg-blue-50 border-blue-100',
          icon: <Info className="w-5 h-5 text-blue-600 fill-blue-100" />,
          title: 'text-blue-900',
          message: 'text-blue-700'
        };
    }
  };

  const styles = getStyles();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.9 }}
      transition={{
        duration: 0.3,
        ease: [0.23, 1, 0.32, 1],
      }}
      className={`
        relative overflow-hidden max-w-sm w-full
        ${styles.container} border
        rounded-2xl shadow-xl shadow-slate-200/50
        transition-all duration-200
        group cursor-pointer
      `}
      onClick={() => dispatch(removeNotification(notification.id))}
    >
      <div className="p-4 flex items-center gap-4">
        <div className="shrink-0">
          {styles.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              {notification.title && (
                <h4 className={`text-sm font-black uppercase tracking-widest ${styles.title} mb-0.5`}>
                  {notification.title}
                </h4>
              )}
              <p className={`text-sm font-bold ${styles.message} leading-snug`}>
                {notification.message}
              </p>
            </div>

            <motion.button
              className="p-1 rounded-lg hover:bg-black/5 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                dispatch(removeNotification(notification.id));
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className={`w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity ${styles.message}`} />
            </motion.button>
          </div>
          
          {notification.action && (
            <motion.button
              className="mt-2 text-xs font-black uppercase tracking-widest bg-white/50 hover:bg-white px-3 py-1.5 rounded-lg border border-black/5 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                notification.action?.onClick();
                dispatch(removeNotification(notification.id));
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {notification.action.label}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const NotificationCenter: React.FC = () => {
  const notificationsState = useNotifications() as { items: Notification[] };
  const notifications = notificationsState.items;

  // Fixed position since position setting was removed during simplification
  const positionClasses = 'fixed top-4 right-4 z-50';

  return (
    <div className={positionClasses}>
      <AnimatePresence mode="popLayout">
        <div className="flex flex-col gap-3">
          {notifications.map((notification: Notification) => (
            <NotificationToast
              key={notification.id}
              notification={notification}
            />
          ))}
        </div>
      </AnimatePresence>
    </div>
  );
};