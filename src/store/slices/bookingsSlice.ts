import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '../../lib/supabase';

interface Booking {
  id: string;
  user_id: string;
  booking_type: 'golf' | 'hotel' | 'restaurant' | 'experience' | 'transportation' | 'package';
  item_id: string;
  booking_date: string;
  booking_time?: string;
  end_date?: string;
  party_size: number;
  status: 'confirmed' | 'pending' | 'cancelled';
  total_price: number;
  confirmation_code: string;
  customer_info: any;
  special_requests?: string;
  api_source?: string;
  external_booking_id?: string;
  created_at: string;
  updated_at?: string;
  item_details?: any; // Additional details about the booked item
}

interface BookingsState {
  bookings: Booking[];
  loading: boolean;
  error: string | null;
  currentBooking: Booking | null;
  filters: {
    type: string;
    status: string;
    dateRange: {
      start: string | null;
      end: string | null;
    };
  };
}

const initialState: BookingsState = {
  bookings: [],
  loading: false,
  error: null,
  currentBooking: null,
  filters: {
    type: 'all',
    status: 'all',
    dateRange: {
      start: null,
      end: null,
    },
  },
};

// Async thunks
export const fetchUserBookings = createAsyncThunk(
  'bookings/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return rejectWithValue('User not authenticated');
      }
      
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id)
        .order('booking_date', { ascending: true });
      
      if (error) {
        return rejectWithValue(error.message);
      }
      
      // Fetch item details for each booking
      const bookingsWithDetails = await Promise.all(data.map(async (booking) => {
        let itemDetails = null;
        
        try {
          const { data: itemData, error: itemError } = await supabase
            .from(getTableNameFromBookingType(booking.booking_type))
            .select('*')
            .eq('id', booking.item_id)
            .single();
          
          if (!itemError && itemData) {
            itemDetails = itemData;
          }
        } catch (err) {
          console.error(`Error fetching details for ${booking.booking_type} ${booking.item_id}:`, err);
        }
        
        return {
          ...booking,
          item_details: itemDetails,
        };
      }));
      
      return bookingsWithDetails;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch bookings');
    }
  }
);

export const createBooking = createAsyncThunk(
  'bookings/create',
  async (bookingData: Omit<Booking, 'id' | 'created_at'>, { rejectWithValue }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return rejectWithValue('User not authenticated');
      }
      
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          ...bookingData,
          user_id: user.id,
          created_at: new Date().toISOString(),
        })
        .select();
      
      if (error) {
        return rejectWithValue(error.message);
      }
      
      // Track booking activity
      await supabase
        .from('user_activity')
        .insert({
          user_id: user.id,
          activity_type: 'book_item',
          metadata: {
            item_type: bookingData.booking_type,
            item_id: bookingData.item_id,
            booking_id: data[0].id,
          },
          timestamp: new Date().toISOString(),
        });
      
      // Update item analytics
      await supabase
        .from('item_analytics')
        .upsert({
          item_type: bookingData.booking_type,
          item_id: bookingData.item_id,
          booking_count: 1,
          last_updated: new Date().toISOString(),
        }, {
          onConflict: 'item_type,item_id',
        });
      
      return data[0];
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create booking');
    }
  }
);

export const updateBookingStatus = createAsyncThunk(
  'bookings/updateStatus',
  async ({ bookingId, status }: { bookingId: string; status: 'confirmed' | 'pending' | 'cancelled' }, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', bookingId)
        .select();
      
      if (error) {
        return rejectWithValue(error.message);
      }
      
      return data[0];
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update booking status');
    }
  }
);

export const getBookingDetails = createAsyncThunk(
  'bookings/getDetails',
  async (bookingId: string, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();
      
      if (error) {
        return rejectWithValue(error.message);
      }
      
      // Fetch item details
      const { data: itemData, error: itemError } = await supabase
        .from(getTableNameFromBookingType(data.booking_type))
        .select('*')
        .eq('id', data.item_id)
        .single();
      
      if (itemError) {
        console.error('Error fetching item details:', itemError);
      }
      
      return {
        ...data,
        item_details: itemData || null,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to get booking details');
    }
  }
);

// Helper function to get table name from booking type
const getTableNameFromBookingType = (bookingType: string): string => {
  switch (bookingType) {
    case 'golf':
      return 'golf_courses';
    case 'hotel':
      return 'hotels';
    case 'restaurant':
      return 'restaurants';
    case 'experience':
      return 'experiences';
    case 'package':
      return 'packages';
    case 'transportation':
      return 'transportation'; // This table might not exist yet
    default:
      return 'bookings';
  }
};

const bookingsSlice = createSlice({
  name: 'bookings',
  initialState,
  reducers: {
    setCurrentBooking: (state, action: PayloadAction<Booking | null>) => {
      state.currentBooking = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<BookingsState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch user bookings
      .addCase(fetchUserBookings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.bookings = action.payload;
      })
      .addCase(fetchUserBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Create booking
      .addCase(createBooking.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.loading = false;
        state.bookings.push(action.payload);
        state.currentBooking = action.payload;
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Update booking status
      .addCase(updateBookingStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateBookingStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.bookings = state.bookings.map(booking => 
          booking.id === action.payload.id ? action.payload : booking
        );
        if (state.currentBooking?.id === action.payload.id) {
          state.currentBooking = action.payload;
        }
      })
      .addCase(updateBookingStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Get booking details
      .addCase(getBookingDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getBookingDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBooking = action.payload;
        // Update the booking in the bookings array if it exists
        const index = state.bookings.findIndex(booking => booking.id === action.payload.id);
        if (index !== -1) {
          state.bookings[index] = action.payload;
        }
      })
      .addCase(getBookingDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCurrentBooking, setFilters, clearFilters } = bookingsSlice.actions;

export default bookingsSlice.reducer;