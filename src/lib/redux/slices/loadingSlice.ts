import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface LoadingState {
  globalLoading: boolean;
  operations: Record<string, boolean>;
}

const initialState: LoadingState = {
  globalLoading: false,
  operations: {},
};

const loadingSlice = createSlice({
  name: 'loading',
  initialState,
  reducers: {
    startGlobalLoading: (state) => {
      state.globalLoading = true;
    },
    stopGlobalLoading: (state) => {
      state.globalLoading = false;
    },
    startOperation: (state, action: PayloadAction<string>) => {
      state.operations[action.payload] = true;
      state.globalLoading = Object.values(state.operations).some((val) => val);
    },
    stopOperation: (state, action: PayloadAction<string>) => {
      delete state.operations[action.payload];
      state.globalLoading = Object.values(state.operations).some((val) => val);
    },
    clearOperations: (state) => {
      state.operations = {};
      state.globalLoading = false;
    },
  },
});

export const {
  startGlobalLoading,
  stopGlobalLoading,
  startOperation,
  stopOperation,
  clearOperations,
} = loadingSlice.actions;

export default loadingSlice.reducer;
