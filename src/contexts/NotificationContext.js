'use client';

import React, { createContext, useContext, useCallback } from 'react';
import { useToast } from '@/hooks/useToast';

const NotificationContext = createContext({
  notifications: [],
  showNotification: () => {},
  hideNotification: () => {}
});

export function NotificationProvider({ children }) {
  return <>{children}</>;
}

export const useNotification = () => {
  const toast = useToast();
  const showNotification = useCallback((message, type = 'info') => {
    if (type === 'success') toast.success(message);
    else if (type === 'error') toast.error(message);
    else if (type === 'warning') toast.warning(message);
    else toast.info(message);
  }, [toast]);

  return {
    notifications: [],
    showNotification,
    hideNotification: () => {}
  };
};
