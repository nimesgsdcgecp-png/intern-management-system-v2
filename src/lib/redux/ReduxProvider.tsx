"use client";

import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import { useAppDispatch } from './hooks';
import { setDeviceType } from './slices/uiSlice';

interface ReduxProviderProps {
  children: React.ReactNode;
}

// Internal component to handle initialization logic
function ReduxInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  // Initialize device type detection
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        dispatch(setDeviceType('mobile'));
      } else if (width < 1024) {
        dispatch(setDeviceType('tablet'));
      } else {
        dispatch(setDeviceType('desktop'));
      }
    };

    handleResize(); // Set initial value
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [dispatch]);

  // Initialize theme from system/localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      // Could dispatch theme change here if needed
    }

    const savedAnimations = localStorage.getItem('animationsEnabled');
    if (savedAnimations) {
      // Could dispatch animation preference here if needed
    }
  }, [dispatch]);

  return <>{children}</>;
}

export function ReduxProvider({ children }: ReduxProviderProps) {
  return (
    <Provider store={store}>
      <ReduxInitializer>
        {children}
      </ReduxInitializer>
    </Provider>
  );
}