import axios from 'axios';
import { sampleHotels } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.golfgenie.ai';
const API_KEY = import.meta.env.VITE_API_KEY || 'demo-key';
const BOOKING_API_KEY = import.meta.env.VITE_BOOKING_API_KEY || 'demo-key';
const BOOKING_API_BASE = import.meta.env.VITE_BOOKING_API_BASE || 'https://distribution-xml.booking.com/2.7/json';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
  },
  timeout: 10000
});

// Create Booking.com API instance
const bookingApi = axios.create({
  baseURL: BOOKING_API_BASE,
  headers: {
    'Authorization': `Basic ${btoa(BOOKING_API_KEY + ':')}`,
    'Content-Type': 'application/json',
    'User-Agent': 'GolfGenieAI/1.0'
  },
  timeout: 15000
});

// Booking.com API integration
export interface Hotel {
  id: string;
  name: string;
  description: string;
  image: string;
  rating: number;
  price_per_night: number;
  amenities: string[];
  address: string;
  phone: string;
  website: string;
  available_rooms: number;
  latitude: number;
  longitude: number;
  api_source: string;
  booking_url?: string;
}

export interface Room {
  id: string;
  hotel_id: string;
  name: string;
  description: string;
  max_occupancy: number;
  price_per_night: number;
  available: number;
  amenities: string[];
  images: string[];
  cancellation_policy: string;
  booking_url?: string;
}

export interface HotelSearchParams {
  location: string;
  check_in: string;
  check_out: string;
  guests: number;
  rooms?: number;
  min_rating?: number;
  max_price?: number;
  amenities?: string[];
  sort_by?: 'price' | 'rating' | 'distance';
  radius?: number;
}

export const searchHotels = async (
  location: string,
  checkIn: string,
  checkOut: string,
  guests: number,
  options: Partial<HotelSearchParams> = {}
): Promise<Hotel[]> => {
  try {
    if (API_KEY === 'demo-key') {
      // Return mock data for demo
      await new Promise(resolve => setTimeout(resolve, 1200));
      return sampleHotels;
    }

    const response = await api.get('/hotels/search', {
      params: {
        location,
        check_in: checkIn,
        check_out: checkOut,
        guests,
        rooms: options.rooms || 1,
        ...options
      }
    });

    return response.data.hotels || [];
  } catch (error) {
    console.error('Error searching hotels:', error);
    return sampleHotels;
  }
};

export const getHotelDetails = async (hotelId: string): Promise<Hotel | null> => {
  try {
    if (API_KEY === 'demo-key') {
      // Return mock data for demo
      await new Promise(resolve => setTimeout(resolve, 800));
      const hotel = sampleHotels.find(h => h.id === hotelId);
      return hotel || null;
    }

    const response = await api.get(`/hotels/${hotelId}`);
    return response.data.hotel || null;
  } catch (error) {
    console.error('Error getting hotel details:', error);
    return sampleHotels.find(h => h.id === hotelId) || null;
  }
};

export const getAvailableRooms = async (
  hotelId: string,
  checkIn: string,
  checkOut: string,
  guests: number,
  rooms: number = 1
): Promise<Room[]> => {
  try {
    if (API_KEY === 'demo-key') {
      // Generate mock rooms
      await new Promise(resolve => setTimeout(resolve, 900));
      return generateMockRooms(hotelId, checkIn, checkOut, guests, rooms);
    }

    const response = await api.get(`/hotels/${hotelId}/rooms`, {
      params: {
        check_in: checkIn,
        check_out: checkOut,
        guests,
        rooms
      }
    });

    return response.data.rooms || [];
  } catch (error) {
    console.error('Error getting available rooms:', error);
    return generateMockRooms(hotelId, checkIn, checkOut, guests, rooms);
  }
};

export const bookHotelRoom = async (
  hotelId: string,
  roomId: string,
  checkIn: string,
  checkOut: string,
  guests: number,
  guestDetails: any,
  paymentMethodId?: string
): Promise<any> => {
  try {
    if (API_KEY === 'demo-key') {
      // Simulate booking process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const hotel = sampleHotels.find(h => h.id === hotelId);
      const mockRooms = generateMockRooms(hotelId, checkIn, checkOut, guests, 1);
      const room = mockRooms.find(r => r.id === roomId) || mockRooms[0];
      
      // Calculate number of nights
      const startDate = new Date(checkIn);
      const endDate = new Date(checkOut);
      const nights = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        success: true,
        booking_id: `hotel_${Date.now()}`,
        confirmation_code: `HB${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        hotel_id: hotelId,
        room_id: roomId,
        check_in: checkIn,
        check_out: checkOut,
        guests,
        total_price: room.price_per_night * nights,
        booking_details: {
          hotel_name: hotel?.name,
          room_name: room.name,
          guest_name: guestDetails.name,
          nights,
          cancellation_policy: room.cancellation_policy
        }
      };
    }

    const response = await api.post('/hotels/bookings', {
      hotel_id: hotelId,
      room_id: roomId,
      check_in: checkIn,
      check_out: checkOut,
      guests,
      guest_details: guestDetails,
      payment_method_id: paymentMethodId
    });

    return response.data;
  } catch (error) {
    console.error('Error booking hotel room:', error);
    throw error;
  }
};

// Helper function to generate mock rooms
const generateMockRooms = (hotelId: string, checkIn: string, checkOut: string, guests: number, roomCount: number): Room[] => {
  const hotel = sampleHotels.find(h => h.id === hotelId);
  const basePrice = hotel?.price_per_night || 200;
  
  const roomTypes = [
    {
      name: 'Standard Room',
      description: 'Comfortable room with essential amenities',
      price_multiplier: 1,
      max_occupancy: 2,
      amenities: ['Free WiFi', 'TV', 'Air Conditioning', 'Coffee Maker']
    },
    {
      name: 'Deluxe Room',
      description: 'Spacious room with premium amenities and views',
      price_multiplier: 1.3,
      max_occupancy: 2,
      amenities: ['Free WiFi', 'TV', 'Air Conditioning', 'Mini Bar', 'Premium Bedding', 'Balcony']
    },
    {
      name: 'Junior Suite',
      description: 'Luxurious suite with separate living area',
      price_multiplier: 1.6,
      max_occupancy: 3,
      amenities: ['Free WiFi', 'TV', 'Air Conditioning', 'Mini Bar', 'Premium Bedding', 'Balcony', 'Sitting Area']
    },
    {
      name: 'Executive Suite',
      description: 'Premium suite with ocean views and luxury amenities',
      price_multiplier: 2,
      max_occupancy: 4,
      amenities: ['Free WiFi', 'TV', 'Air Conditioning', 'Mini Bar', 'Premium Bedding', 'Balcony', 'Separate Living Room', 'Ocean View']
    }
  ];
  
  // Filter room types by guest count
  const availableRoomTypes = roomTypes.filter(rt => rt.max_occupancy >= guests);
  
  // Generate rooms
  return availableRoomTypes.map((roomType, index) => ({
    id: `room_${hotelId}_${index}`,
    hotel_id: hotelId,
    name: roomType.name,
    description: roomType.description,
    max_occupancy: roomType.max_occupancy,
    price_per_night: Math.round(basePrice * roomType.price_multiplier),
    available: Math.floor(Math.random() * 5) + 1, // 1-5 rooms available
    amenities: roomType.amenities,
    images: [hotel?.image || 'https://images.pexels.com/photos/271618/pexels-photo-271618.jpeg'],
    cancellation_policy: 'Free cancellation up to 24 hours before check-in',
    booking_url: `https://booking.com/hotel?id=${hotelId}&room=${index}`
  }));
};