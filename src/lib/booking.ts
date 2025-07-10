import axios from 'axios';

// Booking.com API Configuration
const BOOKING_API_KEY = import.meta.env.VITE_BOOKING_API_KEY || 'demo-key';
const BOOKING_API_BASE = import.meta.env.VITE_BOOKING_API_BASE || 'https://distribution-xml.booking.com/2.7/json';

export interface BookingHotel {
  hotel_id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  rating: number;
  review_score: number;
  review_count: number;
  main_photo_url: string;
  description: string;
  facilities: string[];
  room_types: BookingRoom[];
  policies: {
    checkin_from: string;
    checkin_until: string;
    checkout_from: string;
    checkout_until: string;
    cancellation_policy: string;
  };
}

export interface BookingRoom {
  room_id: string;
  room_name: string;
  max_occupancy: number;
  bed_configurations: string[];
  room_facilities: string[];
  photos: string[];
  rates: BookingRate[];
}

export interface BookingRate {
  rate_id: string;
  room_id: string;
  meal_plan: string;
  cancellation_policy: string;
  total_price: number;
  currency: string;
  price_breakdown: {
    base_price: number;
    taxes: number;
    fees: number;
  };
  availability: number;
}

export interface BookingSearchParams {
  destination: string;
  checkin_date: string;
  checkout_date: string;
  adults: number;
  children?: number;
  rooms?: number;
  currency?: string;
  language?: string;
}

export interface BookingReservation {
  hotel_id: string;
  room_id: string;
  rate_id: string;
  checkin_date: string;
  checkout_date: string;
  guest_info: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    country: string;
  };
  payment_info: {
    card_type: string;
    card_number: string;
    expiry_month: string;
    expiry_year: string;
    cvv: string;
    cardholder_name: string;
  };
  special_requests?: string;
}

export interface BookingResponse {
  success: boolean;
  reservation_id?: string;
  confirmation_number?: string;
  total_price?: number;
  currency?: string;
  error?: string;
  booking_url?: string;
}

// Create axios instance for Booking.com API
const bookingAPI = axios.create({
  baseURL: BOOKING_API_BASE,
  headers: {
    'Authorization': `Basic ${btoa(BOOKING_API_KEY + ':')}`,
    'Content-Type': 'application/json',
    'User-Agent': 'MyrtleBeachGolf/1.0'
  },
  timeout: 15000
});

export const searchHotels = async (params: BookingSearchParams): Promise<BookingHotel[]> => {
  try {
    if (BOOKING_API_KEY === 'demo-key') {
      // Return mock data for demo
      await new Promise(resolve => setTimeout(resolve, 1000));
      return getMockBookingHotels();
    }

    const response = await bookingAPI.get('/hotels', {
      params: {
        destination: params.destination,
        checkin: params.checkin_date,
        checkout: params.checkout_date,
        adults: params.adults,
        children: params.children || 0,
        rooms: params.rooms || 1,
        currency: params.currency || 'USD',
        language: params.language || 'en'
      }
    });

    return response.data.hotels || [];
  } catch (error) {
    console.error('Booking.com search error:', error);
    return getMockBookingHotels();
  }
};

export const getHotelDetails = async (hotelId: string): Promise<BookingHotel | null> => {
  try {
    if (BOOKING_API_KEY === 'demo-key') {
      await new Promise(resolve => setTimeout(resolve, 800));
      const mockHotels = getMockBookingHotels();
      return mockHotels.find(h => h.hotel_id === hotelId) || null;
    }

    const response = await bookingAPI.get(`/hotels/${hotelId}`);
    return response.data;
  } catch (error) {
    console.error('Booking.com hotel details error:', error);
    return null;
  }
};

export const checkAvailability = async (
  hotelId: string,
  checkinDate: string,
  checkoutDate: string,
  adults: number = 2,
  rooms: number = 1
): Promise<BookingRoom[]> => {
  try {
    if (BOOKING_API_KEY === 'demo-key') {
      await new Promise(resolve => setTimeout(resolve, 1200));
      return getMockBookingRooms();
    }

    const response = await bookingAPI.get(`/hotels/${hotelId}/availability`, {
      params: {
        checkin: checkinDate,
        checkout: checkoutDate,
        adults,
        rooms
      }
    });

    return response.data.rooms || [];
  } catch (error) {
    console.error('Booking.com availability error:', error);
    return getMockBookingRooms();
  }
};

export const makeReservation = async (reservation: BookingReservation): Promise<BookingResponse> => {
  try {
    if (BOOKING_API_KEY === 'demo-key') {
      // Simulate booking process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 90% success rate for demo
      if (Math.random() > 0.1) {
        return {
          success: true,
          reservation_id: `BK${Date.now()}`,
          confirmation_number: `MB${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
          total_price: 299.99,
          currency: 'USD',
          booking_url: generateBookingURL(reservation)
        };
      } else {
        return {
          success: false,
          error: 'Hotel is fully booked for the selected dates. Please try different dates.',
          booking_url: generateBookingURL(reservation)
        };
      }
    }

    const response = await bookingAPI.post('/reservations', reservation);
    
    return {
      success: true,
      reservation_id: response.data.reservation_id,
      confirmation_number: response.data.confirmation_number,
      total_price: response.data.total_price,
      currency: response.data.currency,
      booking_url: response.data.booking_url || generateBookingURL(reservation)
    };
  } catch (error: any) {
    console.error('Booking.com reservation error:', error);
    
    let errorMessage = 'Unable to complete reservation through our system.';
    if (error.response?.status === 409) {
      errorMessage = 'Selected room is no longer available. Please choose a different room or dates.';
    } else if (error.response?.status === 400) {
      errorMessage = 'Invalid reservation details. Please check your information and try again.';
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = 'Reservation request timed out. Please try again or book directly on Booking.com.';
    }
    
    return {
      success: false,
      error: errorMessage,
      booking_url: generateBookingURL(reservation)
    };
  }
};

export const generateBookingURL = (reservation: BookingReservation): string => {
  const baseUrl = 'https://www.booking.com/hotel/us';
  
  const params = new URLSearchParams({
    checkin: reservation.checkin_date,
    checkout: reservation.checkout_date,
    group_adults: '2',
    group_children: '0',
    no_rooms: '1',
    selected_currency: 'USD',
    // Add additional parameters for better booking experience
    lang: 'en-us',
    sb_price_type: 'total',
    type: 'total',
    ...(reservation.guest_info.first_name && { 'guest-name': `${reservation.guest_info.first_name} ${reservation.guest_info.last_name}` })
  });
  
  return `${baseUrl}/${reservation.hotel_id}.html?${params.toString()}`;
};

// Mock data functions for demo
const getMockBookingHotels = (): BookingHotel[] => [
  {
    hotel_id: 'booking_oceanhouse',
    name: 'The Ocean House',
    address: '1000 N Ocean Blvd',
    city: 'Myrtle Beach',
    country: 'United States',
    latitude: 33.6891,
    longitude: -78.8867,
    rating: 5,
    review_score: 9.2,
    review_count: 1247,
    main_photo_url: 'https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg',
    description: 'Luxury oceanfront resort with world-class amenities and stunning Atlantic views.',
    facilities: ['Ocean Views', 'Spa', 'Fine Dining', 'Pool', 'Golf Concierge', 'Beach Access', 'Fitness Center', 'Business Center'],
    room_types: getMockBookingRooms(),
    policies: {
      checkin_from: '15:00',
      checkin_until: '23:00',
      checkout_from: '07:00',
      checkout_until: '11:00',
      cancellation_policy: 'Free cancellation until 24 hours before check-in'
    }
  },
  {
    hotel_id: 'booking_marriott',
    name: 'Marriott Myrtle Beach Resort',
    address: '8400 Costa Verde Dr',
    city: 'Myrtle Beach',
    country: 'United States',
    latitude: 33.6234,
    longitude: -78.9012,
    rating: 4,
    review_score: 8.7,
    review_count: 892,
    main_photo_url: 'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg',
    description: 'Full-service resort with championship golf course and comprehensive amenities.',
    facilities: ['On-site Golf', 'Multiple Restaurants', 'Spa', 'Pool Complex', 'Tennis', 'Kids Club', 'Business Center'],
    room_types: getMockBookingRooms(),
    policies: {
      checkin_from: '16:00',
      checkin_until: '24:00',
      checkout_from: '06:00',
      checkout_until: '12:00',
      cancellation_policy: 'Free cancellation until 48 hours before check-in'
    }
  }
];

const getMockBookingRooms = (): BookingRoom[] => [
  {
    room_id: 'deluxe_ocean_view',
    room_name: 'Deluxe Ocean View Room',
    max_occupancy: 4,
    bed_configurations: ['1 King Bed', '2 Queen Beds'],
    room_facilities: ['Ocean View', 'Balcony', 'Mini Fridge', 'Coffee Maker', 'Free WiFi', 'Air Conditioning'],
    photos: ['https://images.pexels.com/photos/271618/pexels-photo-271618.jpeg'],
    rates: [
      {
        rate_id: 'standard_rate',
        room_id: 'deluxe_ocean_view',
        meal_plan: 'Room Only',
        cancellation_policy: 'Free cancellation until 24 hours before check-in',
        total_price: 299.99,
        currency: 'USD',
        price_breakdown: {
          base_price: 249.99,
          taxes: 37.50,
          fees: 12.50
        },
        availability: 5
      }
    ]
  },
  {
    room_id: 'suite_oceanfront',
    room_name: 'Oceanfront Suite',
    max_occupancy: 6,
    bed_configurations: ['1 King Bed + Sofa Bed'],
    room_facilities: ['Ocean View', 'Separate Living Area', 'Kitchenette', 'Balcony', 'Premium Amenities', 'Free WiFi'],
    photos: ['https://images.pexels.com/photos/271618/pexels-photo-271618.jpeg'],
    rates: [
      {
        rate_id: 'suite_rate',
        room_id: 'suite_oceanfront',
        meal_plan: 'Breakfast Included',
        cancellation_policy: 'Free cancellation until 48 hours before check-in',
        total_price: 499.99,
        currency: 'USD',
        price_breakdown: {
          base_price: 429.99,
          taxes: 52.50,
          fees: 17.50
        },
        availability: 2
      }
    ]
  }
];

// Utility function to check if a hotel supports Booking.com
export const isBookingPartner = (hotel_id: string): boolean => {
  const bookingPartners = ['booking_oceanhouse', 'booking_marriott', '1', '2', '3'];
  return bookingPartners.includes(hotel_id);
};