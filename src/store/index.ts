import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import itineraryReducer from './slices/itinerarySlice';
import bookingsReducer from './slices/bookingsSlice';
import userReducer from './slices/userSlice';
import apiReducer from './slices/apiSlice';
import uiReducer from './slices/uiSlice';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['itinerary', 'user'], // Only persist these reducers
};

const rootReducer = combineReducers({
  itinerary: itineraryReducer,
  bookings: bookingsReducer,
  user: userReducer,
  api: apiReducer,
  ui: uiReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;