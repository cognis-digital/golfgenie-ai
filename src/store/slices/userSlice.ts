import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';

interface UserState {
  user: User | null;
  profile: {
    name: string;
    phone: string;
    preferences: {
      golfLevel: string;
      preferredAccommodation: string;
      preferredCuisine: string[];
      preferredActivities: string[];
    };
  } | null;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
}

const initialState: UserState = {
  user: null,
  profile: null,
  loading: false,
  error: null,
  isAdmin: false,
};

// Async thunks
export const fetchUserProfile = createAsyncThunk(
  'user/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return rejectWithValue('User not authenticated');
      }
      
      // Get user profile from the users table
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) {
        return rejectWithValue(error.message);
      }
      
      // Check if user is admin
      const isAdmin = user.email?.includes('@mbg.com') || user.email?.includes('@mbg');
      
      return {
        user,
        profile: data,
        isAdmin,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch user profile');
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'user/updateProfile',
  async (profileData: Partial<UserState['profile']>, { rejectWithValue }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return rejectWithValue('User not authenticated');
      }
      
      // Update user metadata in auth
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          name: profileData.name,
          phone: profileData.phone,
        },
      });
      
      if (authError) {
        return rejectWithValue(authError.message);
      }
      
      // Update user profile in the users table
      const { data, error } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          name: profileData.name,
          phone: profileData.phone,
          updated_at: new Date().toISOString(),
        })
        .select();
      
      if (error) {
        return rejectWithValue(error.message);
      }
      
      return {
        ...data[0],
        preferences: profileData.preferences,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update user profile');
    }
  }
);

export const updateUserPreferences = createAsyncThunk(
  'user/updatePreferences',
  async (preferences: UserState['profile']['preferences'], { rejectWithValue, getState }) => {
    try {
      const { user } = getState() as { user: UserState };
      
      if (!user.user) {
        return rejectWithValue('User not authenticated');
      }
      
      // Store preferences in user metadata
      const { error } = await supabase.auth.updateUser({
        data: {
          preferences,
        },
      });
      
      if (error) {
        return rejectWithValue(error.message);
      }
      
      return preferences;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update user preferences');
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      // Check if user is admin
      if (action.payload?.email) {
        state.isAdmin = action.payload.email.includes('@mbg.com') || action.payload.email.includes('@mbg');
      } else {
        state.isAdmin = false;
      }
    },
    clearUser: (state) => {
      state.user = null;
      state.profile = null;
      state.isAdmin = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch user profile
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.profile = action.payload.profile;
        state.isAdmin = action.payload.isAdmin;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Update user profile
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = {
          ...state.profile,
          ...action.payload,
        };
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Update user preferences
      .addCase(updateUserPreferences.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserPreferences.fulfilled, (state, action) => {
        state.loading = false;
        if (state.profile) {
          state.profile.preferences = action.payload;
        } else {
          state.profile = {
            name: state.user?.user_metadata?.name || '',
            phone: state.user?.user_metadata?.phone || '',
            preferences: action.payload,
          };
        }
      })
      .addCase(updateUserPreferences.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setUser, clearUser } = userSlice.actions;

export default userSlice.reducer;