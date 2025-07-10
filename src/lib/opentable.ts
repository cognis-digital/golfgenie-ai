import axios from 'axios';

// OpenTable API configuration
const OPENTABLE_API_BASE = 'https://api.opentable.com/v2';
const OPENTABLE_API_KEY = import.meta.env.VITE_OPENTABLE_API_KEY || 'demo-key';

export interface OpenTableRestaurant {
  id: string;
  name: string;
  address: string;
  phone: string;
  cuisine: string;
  price_range: number;
  rating: number;
  image_url: string;
  availability: TimeSlot[];
  opentable_url: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  party_size_limit: number;
}

export interface SlotLockRequest {
  party_size: number;
  date_time: string;
  reservation_attribute?: string;
  experience?: {
    id: number;
    version: number;
    party_size_per_price_type?: Array<{
      id: number;
      count: number;
    }>;
    add_ons?: Array<{
      item_id: string;
      quantity: number;
    }>;
  };
  dining_area_id?: number;
  environment?: string;
}

export interface SlotLockResponse {
  expires_at: string;
  reservation_token: string;
}

export interface ReservationRequest {
  restaurant_id: string;
  date: string;
  time: string;
  party_size: number;
  customer_info: {
    name: string;
    email: string;
    phone: string;
  };
  special_requests?: string;
  reservation_token?: string;
}

export interface ReservationResponse {
  success: boolean;
  confirmation_id?: string;
  error?: string;
  opentable_url?: string;
  slot_expired?: boolean;
}

// Create axios instance for OpenTable API
const openTableAPI = axios.create({
  baseURL: OPENTABLE_API_BASE,
  headers: {
    'Authorization': `Bearer ${OPENTABLE_API_KEY}`,
    'Content-Type': 'application/json'
  },
  timeout: 15000
});

export const createSlotLock = async (
  restaurantId: string,
  slotLockData: SlotLockRequest
): Promise<SlotLockResponse | null> => {
  try {
    if (OPENTABLE_API_KEY === 'demo-key') {
      // Return mock slot lock for demo
      await new Promise(resolve => setTimeout(resolve, 800));
      return {
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes from now
        reservation_token: `mock_token_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`
      };
    }

    const response = await openTableAPI.post(`/booking/${restaurantId}/slot_locks`, slotLockData);
    return response.data;
  } catch (error) {
    console.error('OpenTable slot lock error:', error);
    // Return mock data as fallback
    return {
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      reservation_token: `fallback_token_${Date.now()}`
    };
  }
};

export const deleteSlotLock = async (
  restaurantId: string,
  reservationToken: string
): Promise<boolean> => {
  try {
    if (OPENTABLE_API_KEY === 'demo-key') {
      await new Promise(resolve => setTimeout(resolve, 300));
      return true;
    }

    await openTableAPI.delete(`/booking/${restaurantId}/slot_locks/${reservationToken}`);
    return true;
  } catch (error) {
    console.error('Error deleting slot lock:', error);
    return false;
  }
};

export const makeReservationWithToken = async (
  restaurantId: string,
  reservation: ReservationRequest
): Promise<ReservationResponse> => {
  try {
    if (OPENTABLE_API_KEY === 'demo-key') {
      // Simulate API processing time
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate slot expiry (10% chance)
      if (Math.random() < 0.1) {
        return {
          success: false,
          error: 'Your reservation slot has expired. Please select a new time.',
          slot_expired: true,
          opentable_url: generateOpenTableURL(reservation)
        };
      }
      
      // 90% success rate for demo
      if (Math.random() > 0.1) {
        return {
          success: true,
          confirmation_id: `OT${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
          opentable_url: generateOpenTableURL(reservation)
        };
      } else {
        return {
          success: false,
          error: 'Restaurant is fully booked for the selected time. Please try a different time.',
          opentable_url: generateOpenTableURL(reservation)
        };
      }
    }

    const response = await openTableAPI.post(`/booking/${restaurantId}/reservations`, {
      ...reservation,
      reservation_token: reservation.reservation_token
    });
    
    return {
      success: true,
      confirmation_id: response.data.confirmation_id,
      opentable_url: response.data.reservation_url || generateOpenTableURL(reservation)
    };
  } catch (error: any) {
    console.error('OpenTable reservation error:', error);
    
    // Handle specific error cases
    if (error.response?.status === 410) {
      return {
        success: false,
        error: 'Your reservation slot has expired. Please select a new time.',
        slot_expired: true,
        opentable_url: generateOpenTableURL(reservation)
      };
    }
    
    let errorMessage = 'Unable to complete reservation through our system.';
    if (error.response?.status === 409) {
      errorMessage = 'This time slot is no longer available. Please select a different time.';
    } else if (error.response?.status === 400) {
      errorMessage = 'Invalid reservation details. Please check your information and try again.';
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = 'Reservation request timed out. Please try again or book directly on OpenTable.';
    }
    
    return {
      success: false,
      error: errorMessage,
      opentable_url: generateOpenTableURL(reservation)
    };
  }
};

export const makeReservation = async (
  reservation: ReservationRequest
): Promise<ReservationResponse> => {
  try {
    // First, create a slot lock
    const slotLockData: SlotLockRequest = {
      party_size: reservation.party_size,
      date_time: `${reservation.date}T${convertTo24Hour(reservation.time)}`,
      reservation_attribute: 'default'
    };

    const slotLock = await createSlotLock(reservation.restaurant_id, slotLockData);
    
    if (!slotLock) {
      return {
        success: false,
        error: 'Unable to secure reservation slot. Please try again.',
        opentable_url: generateOpenTableURL(reservation)
      };
    }

    // Make reservation with the token
    const reservationWithToken = {
      ...reservation,
      reservation_token: slotLock.reservation_token
    };

    const result = await makeReservationWithToken(reservation.restaurant_id, reservationWithToken);
    
    // If reservation failed and slot didn't expire, clean up the slot lock
    if (!result.success && !result.slot_expired) {
      await deleteSlotLock(reservation.restaurant_id, slotLock.reservation_token);
    }
    
    return result;
  } catch (error) {
    console.error('Reservation process error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
      opentable_url: generateOpenTableURL(reservation)
    };
  }
};

export const searchRestaurants = async (
  location: string, 
  date: string, 
  party_size: number
): Promise<OpenTableRestaurant[]> => {
  try {
    if (OPENTABLE_API_KEY === 'demo-key') {
      // Return mock data for demo
      await new Promise(resolve => setTimeout(resolve, 1000));
      return getMockOpenTableRestaurants();
    }

    const response = await openTableAPI.get('/restaurants/search', {
      params: {
        location,
        date,
        party_size,
        limit: 20
      }
    });

    return response.data.restaurants || [];
  } catch (error) {
    console.error('OpenTable search error:', error);
    return getMockOpenTableRestaurants();
  }
};

export const getRestaurantAvailability = async (
  restaurant_id: string, 
  date: string,
  party_size: number = 2
): Promise<TimeSlot[]> => {
  try {
    // Simulate API processing time
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (OPENTABLE_API_KEY === 'demo-key') {
      return generateMockAvailability(party_size);
    }

    const response = await openTableAPI.get(`/restaurants/${restaurant_id}/availability`, {
      params: { date, party_size }
    });

    return response.data.time_slots || [];
  } catch (error) {
    console.error('OpenTable availability error:', error);
    return generateMockAvailability(party_size);
  }
};

export const getRestaurantDetails = async (restaurant_id: string) => {
  try {
    if (OPENTABLE_API_KEY === 'demo-key') {
      await new Promise(resolve => setTimeout(resolve, 600));
      const mockRestaurants = getMockOpenTableRestaurants();
      return mockRestaurants.find(r => r.id === restaurant_id) || null;
    }

    const response = await openTableAPI.get(`/restaurants/${restaurant_id}`);
    return response.data;
  } catch (error) {
    console.error('OpenTable restaurant details error:', error);
    return null;
  }
};

export const generateOpenTableURL = (reservation: ReservationRequest): string => {
  const baseUrl = 'https://www.opentable.com/booking/experiences-availability';
  
  // Format date and time for OpenTable URL
  const dateTime = `${reservation.date} ${reservation.time}`;
  
  const params = new URLSearchParams({
    rid: reservation.restaurant_id,
    restref: reservation.restaurant_id,
    datetime: dateTime,
    covers: reservation.party_size.toString(),
    searchdatetime: dateTime,
    // Add additional parameters for better booking experience
    lang: 'en-US',
    corrid: `web-${Date.now()}`,
    ...(reservation.customer_info.name && { 'guest-name': reservation.customer_info.name }),
    ...(reservation.special_requests && { 'special-requests': reservation.special_requests })
  });
  
  return `${baseUrl}?${params.toString()}`;
};

// Utility function to convert 12-hour time to 24-hour format
const convertTo24Hour = (time12h: string): string => {
  const [time, modifier] = time12h.split(' ');
  let [hours, minutes] = time.split(':');
  
  if (hours === '12') {
    hours = '00';
  }
  
  if (modifier === 'PM') {
    hours = (parseInt(hours, 10) + 12).toString();
  }
  
  return `${hours.padStart(2, '0')}:${minutes}`;
};

// Enhanced mock data functions for demo
const getMockOpenTableRestaurants = (): OpenTableRestaurant[] => [
  {
    id: 'ot_seacaptains',
    name: 'Sea Captain\'s House',
    address: '3002 N Ocean Blvd, Myrtle Beach, SC 29577',
    phone: '(843) 448-8082',
    cuisine: 'Seafood',
    price_range: 3,
    rating: 4.8,
    image_url: 'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg',
    opentable_url: 'https://www.opentable.com/r/sea-captains-house-myrtle-beach',
    availability: [
      { time: '5:30 PM', available: true, party_size_limit: 8 },
      { time: '6:00 PM', available: true, party_size_limit: 6 },
      { time: '6:30 PM', available: false, party_size_limit: 0 },
      { time: '7:00 PM', available: true, party_size_limit: 4 },
      { time: '7:30 PM', available: true, party_size_limit: 8 },
      { time: '8:00 PM', available: true, party_size_limit: 6 },
      { time: '8:30 PM', available: false, party_size_limit: 0 },
      { time: '9:00 PM', available: true, party_size_limit: 4 }
    ]
  },
  {
    id: 'ot_cypress',
    name: 'The Cypress Grill',
    address: '9911 N Kings Hwy, Myrtle Beach, SC 29572',
    phone: '(843) 497-0020',
    cuisine: 'Steakhouse',
    price_range: 4,
    rating: 4.7,
    image_url: 'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg',
    opentable_url: 'https://www.opentable.com/r/cypress-grill-myrtle-beach',
    availability: [
      { time: '5:00 PM', available: true, party_size_limit: 6 },
      { time: '5:30 PM', available: true, party_size_limit: 4 },
      { time: '6:00 PM', available: false, party_size_limit: 0 },
      { time: '6:30 PM', available: true, party_size_limit: 8 },
      { time: '7:00 PM', available: false, party_size_limit: 0 },
      { time: '7:30 PM', available: true, party_size_limit: 6 },
      { time: '8:00 PM', available: true, party_size_limit: 4 },
      { time: '8:30 PM', available: true, party_size_limit: 8 }
    ]
  },
  {
    id: 'ot_margaritaville',
    name: 'Jimmy Buffett\'s Margaritaville',
    address: '1114 Celebrity Cir, Myrtle Beach, SC 29577',
    phone: '(843) 448-5455',
    cuisine: 'American',
    price_range: 2,
    rating: 4.3,
    image_url: 'https://images.pexels.com/photos/941861/pexels-photo-941861.jpeg',
    opentable_url: 'https://www.opentable.com/r/margaritaville-myrtle-beach',
    availability: [
      { time: '11:30 AM', available: true, party_size_limit: 8 },
      { time: '12:00 PM', available: true, party_size_limit: 6 },
      { time: '12:30 PM', available: true, party_size_limit: 8 },
      { time: '1:00 PM', available: false, party_size_limit: 0 },
      { time: '6:00 PM', available: true, party_size_limit: 6 },
      { time: '6:30 PM', available: true, party_size_limit: 4 },
      { time: '7:00 PM', available: true, party_size_limit: 8 },
      { time: '7:30 PM', available: false, party_size_limit: 0 }
    ]
  }
];

const generateMockAvailability = (party_size: number): TimeSlot[] => {
  const times = [
    '5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', 
    '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM', 
    '9:00 PM', '9:30 PM'
  ];
  
  return times.map(time => {
    const isAvailable = Math.random() > 0.3; // 70% availability rate
    const maxPartySize = isAvailable ? Math.floor(Math.random() * 6) + 4 : 0; // 4-9 people max
    
    return {
      time,
      available: isAvailable && maxPartySize >= party_size,
      party_size_limit: maxPartySize
    };
  });
};

// Utility function to check if a restaurant supports OpenTable
export const isOpenTablePartner = (restaurant_id: string): boolean => {
  const openTablePartners = ['ot_seacaptains', 'ot_cypress', 'ot_margaritaville', '1', '2'];
  return openTablePartners.includes(restaurant_id);
};

// Function to get OpenTable widget embed code
export const getOpenTableWidget = (restaurant_id: string, options: {
  theme?: 'standard' | 'wide';
  color?: string;
  iframe?: boolean;
} = {}): string => {
  const { theme = 'standard', color = 'red', iframe = true } = options;
  
  if (iframe) {
    return `<iframe src="https://www.opentable.com/widget/reservation/canvas?rid=${restaurant_id}&theme=${theme}&color=${color}" width="100%" height="400" frameborder="0"></iframe>`;
  }
  
  return `<script type='text/javascript' src='//www.opentable.com/widget/reservation/loader?rid=${restaurant_id}&theme=${theme}&color=${color}'></script>`;
};