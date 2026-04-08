import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationState {
  items: Notification[];
}

const initialState: NotificationState = {
  items: [],
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id'>>) => {
      const id = Math.random().toString(36).substring(2, 11);
      state.items.push({ ...action.payload, id });
    },
    addSuccess: (state, action: PayloadAction<string | { title?: string; message: string }>) => {
      const id = Math.random().toString(36).substring(2, 11);
      const payload = typeof action.payload === 'string' ? { message: action.payload } : action.payload;
      state.items.push({ id, type: 'success', ...payload });
    },
    addError: (state, action: PayloadAction<string | { title?: string; message: string }>) => {
      const id = Math.random().toString(36).substring(2, 11);
      const payload = typeof action.payload === 'string' ? { message: action.payload } : action.payload;
      state.items.push({ id, type: 'error', ...payload });
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    clearNotifications: (state) => {
      state.items = [];
    },
  },
});

export const {
  addNotification,
  addSuccess,
  addError,
  removeNotification,
  clearNotifications,
} = notificationSlice.actions;

export default notificationSlice.reducer;
