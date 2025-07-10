import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '../../lib/supabase';
import { GolfCourse, Hotel, Restaurant, Experience, Package } from '../../types';

interface ItineraryState {
  golfCourses: GolfCourse[];
  hotels: Hotel[];
  restaurants: Restaurant[];
  experiences: Experience[];
  packages: Package[];
  notes: string;
  savedItineraries: any[];
  loading: boolean;
  error: string | null;
  currentItineraryId: string | null;
}

const initialState: ItineraryState = {
  golfCourses: [],
  hotels: [],
  restaurants: [],
  experiences: [],
  packages: [],
  notes: '',
  savedItineraries: [],
  loading: false,
  error: null,
  currentItineraryId: null,
};

// Async thunks
export const saveItinerary = createAsyncThunk(
  'itinerary/save',
  async (name: string, { getState, rejectWithValue }) => {
    try {
      const { itinerary } = getState() as { itinerary: ItineraryState };
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return rejectWithValue('User not authenticated');
      }
      
      const { data, error } = await supabase
        .from('user_itineraries')
        .insert({
          user_id: user.id,
          name: name || 'My Itinerary',
          golf_courses: itinerary.golfCourses.map(course => course.id),
          hotels: itinerary.hotels.map(hotel => hotel.id),
          restaurants: itinerary.restaurants.map(restaurant => restaurant.id),
          experiences: itinerary.experiences.map(experience => experience.id),
          packages: itinerary.packages.map(pkg => pkg.id),
          notes: itinerary.notes,
          is_shared: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select();
      
      if (error) {
        return rejectWithValue(error.message);
      }
      
      return data[0];
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to save itinerary');
    }
  }
);

export const fetchItineraries = createAsyncThunk(
  'itinerary/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return rejectWithValue('User not authenticated');
      }
      
      const { data, error } = await supabase
        .from('user_itineraries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        return rejectWithValue(error.message);
      }
      
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch itineraries');
    }
  }
);

export const loadItinerary = createAsyncThunk(
  'itinerary/load',
  async (itineraryId: string, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('user_itineraries')
        .select('*')
        .eq('id', itineraryId)
        .single();
      
      if (error) {
        return rejectWithValue(error.message);
      }
      
      // Now fetch the actual items
      const [golfCoursesData, hotelsData, restaurantsData, experiencesData, packagesData] = await Promise.all([
        supabase.from('golf_courses').select('*').in('id', data.golf_courses || []),
        supabase.from('hotels').select('*').in('id', data.hotels || []),
        supabase.from('restaurants').select('*').in('id', data.restaurants || []),
        supabase.from('experiences').select('*').in('id', data.experiences || []),
        supabase.from('packages').select('*').in('id', data.packages || []),
      ]);
      
      return {
        ...data,
        golfCoursesData: golfCoursesData.data || [],
        hotelsData: hotelsData.data || [],
        restaurantsData: restaurantsData.data || [],
        experiencesData: experiencesData.data || [],
        packagesData: packagesData.data || [],
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to load itinerary');
    }
  }
);

export const deleteItinerary = createAsyncThunk(
  'itinerary/delete',
  async (itineraryId: string, { rejectWithValue }) => {
    try {
      const { error } = await supabase
        .from('user_itineraries')
        .delete()
        .eq('id', itineraryId);
      
      if (error) {
        return rejectWithValue(error.message);
      }
      
      return itineraryId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete itinerary');
    }
  }
);

export const shareItinerary = createAsyncThunk(
  'itinerary/share',
  async (itineraryId: string, { rejectWithValue }) => {
    try {
      // Generate a unique share token
      const shareToken = `share_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      
      const { data, error } = await supabase
        .from('user_itineraries')
        .update({
          is_shared: true,
          share_token: shareToken,
        })
        .eq('id', itineraryId)
        .select();
      
      if (error) {
        return rejectWithValue(error.message);
      }
      
      return data[0];
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to share itinerary');
    }
  }
);

const itinerarySlice = createSlice({
  name: 'itinerary',
  initialState,
  reducers: {
    addGolfCourse: (state, action: PayloadAction<GolfCourse>) => {
      // Check if already exists
      if (!state.golfCourses.some(course => course.id === action.payload.id)) {
        state.golfCourses.push(action.payload);
      }
    },
    removeGolfCourse: (state, action: PayloadAction<string>) => {
      state.golfCourses = state.golfCourses.filter(course => course.id !== action.payload);
    },
    addHotel: (state, action: PayloadAction<Hotel>) => {
      if (!state.hotels.some(hotel => hotel.id === action.payload.id)) {
        state.hotels.push(action.payload);
      }
    },
    removeHotel: (state, action: PayloadAction<string>) => {
      state.hotels = state.hotels.filter(hotel => hotel.id !== action.payload);
    },
    addRestaurant: (state, action: PayloadAction<Restaurant>) => {
      if (!state.restaurants.some(restaurant => restaurant.id === action.payload.id)) {
        state.restaurants.push(action.payload);
      }
    },
    removeRestaurant: (state, action: PayloadAction<string>) => {
      state.restaurants = state.restaurants.filter(restaurant => restaurant.id !== action.payload);
    },
    addExperience: (state, action: PayloadAction<Experience>) => {
      if (!state.experiences.some(experience => experience.id === action.payload.id)) {
        state.experiences.push(action.payload);
      }
    },
    removeExperience: (state, action: PayloadAction<string>) => {
      state.experiences = state.experiences.filter(experience => experience.id !== action.payload);
    },
    addPackage: (state, action: PayloadAction<Package>) => {
      if (!state.packages.some(pkg => pkg.id === action.payload.id)) {
        state.packages.push(action.payload);
      }
    },
    removePackage: (state, action: PayloadAction<string>) => {
      state.packages = state.packages.filter(pkg => pkg.id !== action.payload);
    },
    updateNotes: (state, action: PayloadAction<string>) => {
      state.notes = action.payload;
    },
    clearItinerary: (state) => {
      state.golfCourses = [];
      state.hotels = [];
      state.restaurants = [];
      state.experiences = [];
      state.packages = [];
      state.notes = '';
      state.currentItineraryId = null;
    },
    setItinerary: (state, action: PayloadAction<{
      golfCourses?: GolfCourse[];
      hotels?: Hotel[];
      restaurants?: Restaurant[];
      experiences?: Experience[];
      packages?: Package[];
      notes?: string;
    }>) => {
      if (action.payload.golfCourses) state.golfCourses = action.payload.golfCourses;
      if (action.payload.hotels) state.hotels = action.payload.hotels;
      if (action.payload.restaurants) state.restaurants = action.payload.restaurants;
      if (action.payload.experiences) state.experiences = action.payload.experiences;
      if (action.payload.packages) state.packages = action.payload.packages;
      if (action.payload.notes !== undefined) state.notes = action.payload.notes;
    },
  },
  extraReducers: (builder) => {
    builder
      // Save itinerary
      .addCase(saveItinerary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveItinerary.fulfilled, (state, action) => {
        state.loading = false;
        state.currentItineraryId = action.payload.id;
        state.savedItineraries.push(action.payload);
      })
      .addCase(saveItinerary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch itineraries
      .addCase(fetchItineraries.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchItineraries.fulfilled, (state, action) => {
        state.loading = false;
        state.savedItineraries = action.payload;
      })
      .addCase(fetchItineraries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Load itinerary
      .addCase(loadItinerary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadItinerary.fulfilled, (state, action) => {
        state.loading = false;
        state.currentItineraryId = action.payload.id;
        state.notes = action.payload.notes || '';
        state.golfCourses = action.payload.golfCoursesData || [];
        state.hotels = action.payload.hotelsData || [];
        state.restaurants = action.payload.restaurantsData || [];
        state.experiences = action.payload.experiencesData || [];
        state.packages = action.payload.packagesData || [];
      })
      .addCase(loadItinerary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Delete itinerary
      .addCase(deleteItinerary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteItinerary.fulfilled, (state, action) => {
        state.loading = false;
        state.savedItineraries = state.savedItineraries.filter(
          itinerary => itinerary.id !== action.payload
        );
        if (state.currentItineraryId === action.payload) {
          state.currentItineraryId = null;
        }
      })
      .addCase(deleteItinerary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Share itinerary
      .addCase(shareItinerary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(shareItinerary.fulfilled, (state, action) => {
        state.loading = false;
        // Update the itinerary in the savedItineraries array
        state.savedItineraries = state.savedItineraries.map(itinerary => 
          itinerary.id === action.payload.id ? action.payload : itinerary
        );
      })
      .addCase(shareItinerary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  addGolfCourse,
  removeGolfCourse,
  addHotel,
  removeHotel,
  addRestaurant,
  removeRestaurant,
  addExperience,
  removeExperience,
  addPackage,
  removePackage,
  updateNotes,
  clearItinerary,
  setItinerary,
} = itinerarySlice.actions;

export default itinerarySlice.reducer;