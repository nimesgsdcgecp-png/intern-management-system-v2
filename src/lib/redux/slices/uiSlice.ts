import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  sidebarCollapsed: boolean;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  theme: 'light' | 'dark';
  animationsEnabled: boolean;
  glassIntensity: number;
}

const initialState: UIState = {
  sidebarCollapsed: false,
  deviceType: 'desktop',
  theme: 'light',
  animationsEnabled: true,
  glassIntensity: 50,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
    setDeviceType: (state, action: PayloadAction<UIState['deviceType']>) => {
      state.deviceType = action.payload;
    },
    setTheme: (state, action: PayloadAction<UIState['theme']>) => {
      state.theme = action.payload;
    },
    toggleAnimations: (state) => {
      state.animationsEnabled = !state.animationsEnabled;
    },
    setGlassIntensity: (state, action: PayloadAction<number>) => {
      state.glassIntensity = Math.min(100, Math.max(0, action.payload));
    },
  },
});

export const {
  toggleSidebar,
  setSidebarCollapsed,
  setDeviceType,
  setTheme,
  toggleAnimations,
  setGlassIntensity,
} = uiSlice.actions;

export default uiSlice.reducer;
