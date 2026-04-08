import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import { createSelector } from '@reduxjs/toolkit';
import type { RootState, AppDispatch } from './store';

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Convenience selectors
export const useUI = () => useAppSelector((state) => state.ui);
export const useNotifications = () => useAppSelector((state) => state.notifications);
export const useLoading = () => useAppSelector((state) => state.loading);
export const useAuth = () => useAppSelector((state) => state.auth);

// Memoized selectors for complex objects
const selectSidebarData = createSelector(
  (state: RootState) => state.ui.sidebarCollapsed,
  (state: RootState) => state.ui.deviceType,
  (isCollapsed, deviceType) => ({
    isCollapsed,
    deviceType,
  })
);

const selectThemeData = createSelector(
  (state: RootState) => state.ui.theme,
  (state: RootState) => state.ui.animationsEnabled,
  (state: RootState) => state.ui.glassIntensity,
  (theme, animationsEnabled, glassIntensity) => ({
    theme,
    animationsEnabled,
    glassIntensity,
  })
);

const selectCurrentUserData = createSelector(
  (state: RootState) => state.auth.user,
  (state: RootState) => state.auth.isAuthenticated,
  (user, isAuthenticated) => ({
    user,
    isAuthenticated,
  })
);

const selectGlobalLoadingData = createSelector(
  (state: RootState) => state.loading.globalLoading,
  (state: RootState) => state.loading.operations,
  (isLoading, operations) => ({
    isLoading,
    operations,
  })
);

// Specific selectors for common use cases
export const useSidebar = () => useAppSelector(selectSidebarData);
export const useTheme = () => useAppSelector(selectThemeData);
export const useCurrentUser = () => useAppSelector(selectCurrentUserData);
export const useGlobalLoading = () => useAppSelector(selectGlobalLoadingData);