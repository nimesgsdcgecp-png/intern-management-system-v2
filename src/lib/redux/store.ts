import { configureStore } from '@reduxjs/toolkit';
import uiSlice from './slices/uiSlice';
import notificationSlice from './slices/notificationSlice';
import loadingSlice from './slices/loadingSlice';
import authSlice from './slices/authSlice';

export const store = configureStore({
  reducer: {
    ui: uiSlice,
    notifications: notificationSlice,
    loading: loadingSlice,
    auth: authSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;