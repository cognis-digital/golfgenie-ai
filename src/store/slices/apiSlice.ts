import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '../../lib/supabase';
import axios from 'axios';

interface ApiState {
  status: {
    supabase: 'connected' | 'disconnected' | 'error' | 'unknown';
    openai: 'connected' | 'disconnected' | 'error' | 'unknown';
    stripe: 'connected' | 'disconnected' | 'error' | 'unknown';
    maps: 'connected' | 'disconnected' | 'error' | 'unknown';
    opentable: 'connected' | 'disconnected' | 'error' | 'unknown';
    yelp: 'connected' | 'disconnected' | 'error' | 'unknown';
    booking: 'connected' | 'disconnected' | 'error' | 'unknown';
  };
  errors: Record<string, string>;
  syncing: boolean;
  lastSyncTime: string | null;
  syncStats: {
    golfCourses: number;
    hotels: number;
    restaurants: number;
    experiences: number;
    errors: number;
  };
}

const initialState: ApiState = {
  status: {
    supabase: 'unknown',
    openai: 'unknown',
    stripe: 'unknown',
    maps: 'unknown',
    opentable: 'unknown',
    yelp: 'unknown',
    booking: 'unknown',
  },
  errors: {},
  syncing: false,
  lastSyncTime: null,
  syncStats: {
    golfCourses: 0,
    hotels: 0,
    restaurants: 0,
    experiences: 0,
    errors: 0,
  },
};

// Async thunks
export const checkApiConnections = createAsyncThunk(
  'api/checkConnections',
  async (_, { rejectWithValue }) => {
    try {
      const results: Record<string, 'connected' | 'disconnected' | 'error'> = {};
      
      // Check Supabase connection
      try {
        const { data, error } = await supabase.from('golf_courses').select('count').limit(1);
        results.supabase = error ? 'error' : 'connected';
      } catch (error) {
        results.supabase = 'error';
      }
      
      // Check OpenAI connection (just check if API key is set)
      results.openai = import.meta.env.VITE_OPENAI_API_KEY ? 'connected' : 'disconnected';
      
      // Check Stripe connection (just check if API key is set)
      results.stripe = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ? 'connected' : 'disconnected';
      
      // Check Google Maps connection (just check if API key is set)
      results.maps = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? 'connected' : 'disconnected';
      
      // Check OpenTable connection (just check if API key is set)
      results.opentable = import.meta.env.VITE_OPENTABLE_API_KEY ? 'connected' : 'disconnected';
      
      // Check Yelp connection (just check if API key is set)
      results.yelp = import.meta.env.VITE_YELP_API_KEY ? 'connected' : 'disconnected';
      
      // Check Booking.com connection (just check if API key is set)
      results.booking = import.meta.env.VITE_BOOKING_API_KEY ? 'connected' : 'disconnected';
      
      return results;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to check API connections');
    }
  }
);

export const syncExternalData = createAsyncThunk(
  'api/syncData',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { user: userState } = getState() as { user: { isAdmin: boolean } };
      
      if (!user || !userState.isAdmin) {
        return rejectWithValue('Only admins can sync external data');
      }
      
      // Start sync log
      const { data: syncLog, error: syncLogError } = await supabase
        .from('api_sync_log')
        .insert({
          api_source: 'multiple',
          sync_type: 'manual',
          status: 'in_progress',
          started_at: new Date().toISOString(),
        })
        .select();
      
      if (syncLogError) {
        return rejectWithValue(syncLogError.message);
      }
      
      const syncId = syncLog[0].id;
      const stats = {
        golfCourses: 0,
        hotels: 0,
        restaurants: 0,
        experiences: 0,
        errors: 0,
      };
      
      // Sync Yelp data
      if (import.meta.env.VITE_YELP_API_KEY) {
        try {
          // This would be a real API call in production
          // For demo, we'll simulate success
          await new Promise(resolve => setTimeout(resolve, 1000));
          stats.restaurants += 15;
          stats.golfCourses += 5;
        } catch (error) {
          stats.errors++;
          console.error('Yelp sync error:', error);
        }
      }
      
      // Sync OpenTable data
      if (import.meta.env.VITE_OPENTABLE_API_KEY) {
        try {
          // This would be a real API call in production
          await new Promise(resolve => setTimeout(resolve, 1000));
          stats.restaurants += 10;
        } catch (error) {
          stats.errors++;
          console.error('OpenTable sync error:', error);
        }
      }
      
      // Sync Booking.com data
      if (import.meta.env.VITE_BOOKING_API_KEY) {
        try {
          // This would be a real API call in production
          await new Promise(resolve => setTimeout(resolve, 1000));
          stats.hotels += 20;
        } catch (error) {
          stats.errors++;
          console.error('Booking.com sync error:', error);
        }
      }
      
      // Update sync log
      await supabase
        .from('api_sync_log')
        .update({
          status: stats.errors > 0 ? 'partial' : 'success',
          items_synced: stats.golfCourses + stats.hotels + stats.restaurants + stats.experiences,
          errors_count: stats.errors,
          completed_at: new Date().toISOString(),
          duration_ms: Date.now() - new Date(syncLog[0].started_at).getTime(),
        })
        .eq('id', syncId);
      
      return {
        stats,
        lastSyncTime: new Date().toISOString(),
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to sync external data');
    }
  }
);

const apiSlice = createSlice({
  name: 'api',
  initialState,
  reducers: {
    setApiStatus: (state, action: PayloadAction<{ api: keyof ApiState['status']; status: ApiState['status'][keyof ApiState['status']] }>) => {
      state.status[action.payload.api] = action.payload.status;
    },
    setApiError: (state, action: PayloadAction<{ api: string; error: string }>) => {
      state.errors[action.payload.api] = action.payload.error;
    },
    clearApiError: (state, action: PayloadAction<string>) => {
      delete state.errors[action.payload];
    },
  },
  extraReducers: (builder) => {
    builder
      // Check API connections
      .addCase(checkApiConnections.fulfilled, (state, action) => {
        state.status = { ...state.status, ...action.payload };
      })
      
      // Sync external data
      .addCase(syncExternalData.pending, (state) => {
        state.syncing = true;
        state.syncStats = {
          golfCourses: 0,
          hotels: 0,
          restaurants: 0,
          experiences: 0,
          errors: 0,
        };
      })
      .addCase(syncExternalData.fulfilled, (state, action) => {
        state.syncing = false;
        state.lastSyncTime = action.payload.lastSyncTime;
        state.syncStats = action.payload.stats;
      })
      .addCase(syncExternalData.rejected, (state, action) => {
        state.syncing = false;
        state.errors.sync = action.payload as string;
      });
  },
});

export const { setApiStatus, setApiError, clearApiError } = apiSlice.actions;

export default apiSlice.reducer;