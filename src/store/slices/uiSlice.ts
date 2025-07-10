import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  activeSection: string;
  modals: {
    auth: boolean;
    booking: boolean;
    itinerarySave: boolean;
    payment: boolean;
    confirmation: boolean;
    error: boolean;
  };
  notifications: {
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
    duration?: number;
  }[];
  loading: {
    global: boolean;
    sections: Record<string, boolean>;
  };
  theme: 'light' | 'dark' | 'system';
  sidebar: boolean;
  searchQuery: string;
  filters: Record<string, any>;
}

const initialState: UiState = {
  activeSection: 'home',
  modals: {
    auth: false,
    booking: false,
    itinerarySave: false,
    payment: false,
    confirmation: false,
    error: false,
  },
  notifications: [],
  loading: {
    global: false,
    sections: {},
  },
  theme: 'light',
  sidebar: false,
  searchQuery: '',
  filters: {},
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActiveSection: (state, action: PayloadAction<string>) => {
      state.activeSection = action.payload;
    },
    openModal: (state, action: PayloadAction<keyof UiState['modals']>) => {
      state.modals[action.payload] = true;
    },
    closeModal: (state, action: PayloadAction<keyof UiState['modals']>) => {
      state.modals[action.payload] = false;
    },
    addNotification: (state, action: PayloadAction<Omit<UiState['notifications'][0], 'id'>>) => {
      state.notifications.push({
        id: Date.now().toString(),
        ...action.payload,
      });
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    clearAllNotifications: (state) => {
      state.notifications = [];
    },
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.loading.global = action.payload;
    },
    setSectionLoading: (state, action: PayloadAction<{ section: string; loading: boolean }>) => {
      state.loading.sections[action.payload.section] = action.payload.loading;
    },
    setTheme: (state, action: PayloadAction<UiState['theme']>) => {
      state.theme = action.payload;
      if (action.payload !== 'system') {
        localStorage.setItem('theme', action.payload);
      } else {
        localStorage.removeItem('theme');
      }
    },
    toggleSidebar: (state) => {
      state.sidebar = !state.sidebar;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setFilters: (state, action: PayloadAction<Record<string, any>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
  },
});

export const {
  setActiveSection,
  openModal,
  closeModal,
  addNotification,
  removeNotification,
  clearAllNotifications,
  setGlobalLoading,
  setSectionLoading,
  setTheme,
  toggleSidebar,
  setSearchQuery,
  setFilters,
  clearFilters,
} = uiSlice.actions;

export default uiSlice.reducer;