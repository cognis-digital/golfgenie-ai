import axios from 'axios';
import { sampleRestaurants } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.golfgenie.ai';
const API_KEY = import.meta.env.VITE_API_KEY || 'demo-key';
const OPENTABLE_API_KEY = import.meta.env.VITE_OPENTABLE_API_KEY || 'demo-key';
const YELP_API_KEY = import.meta.env.VITE_YELP_API_KEY || 'demo-key';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
  },
  timeout: 10000
});

// OpenTable API integration
export interface Restaurant {
  id: string;
  name: string;
  description: string;
  image: string;
  rating: number;
  cuisine_type: string;
  price_range: string;
  amenities: string[];
  address: string;
  phone: string;
  website: string;
  hours: string;
  opentable_id?: string;
  yelp_id?: string;
  latitude: number;
  longitude: number;
  api_source: string;
  reservation_url?: string;
}

export interface Reservation {
  id: string;
  restaurant_id: string;
  date: string;
  time: string;
  party_size: number;
  status: string;
  confirmation_code: string;
  special_requests?: string;
  guest_details: {
    name: string;
    email: string;
    phone?: string;
  };
}

export interface RestaurantSearchParams {
  location: string;
  date?: string;
  time?: string;
  party_size?: number;
  cuisine?: string;
  price_range?: string;
  sort_by?: 'rating' | 'distance' | 'price';
  radius?: number;
}

export const searchRestaurants = async (
  location: string,
  date?: string,
  cuisine?: string,
  options: Partial<RestaurantSearchParams> = {}
): Promise<Restaurant[]> => {
  try {
    if (API_KEY === 'demo-key') {
      // Return mock data for demo
      await new Promise(resolve => setTimeout(resolve, 1000));
      return sampleRestaurants;
    }

    const response = await api.get('/restaurants/search', {
      params: {
        location,
        date,
        cuisine,
        ...options
      }
    });

    return response.data.restaurants || [];
  } catch (error) {
    console.error('Error searching restaurants:', error);
    return sampleRestaurants;
  }
};

export const getRestaurantDetails = async (restaurantId: string): Promise<Restaurant | null> => {
  try {
    if (API_KEY === 'demo-key') {
      // Return mock data for demo
      await new Promise(resolve => setTimeout(resolve, 800));
      const restaurant = sampleRestaurants.find(r => r.id === restaurantId);
      return restaurant || null;
    }

    const response = await api.get(`/restaurants/${restaurantId}`);
    return response.data.restaurant || null;
  } catch (error) {
    console.error('Error getting restaurant details:', error);
    return sampleRestaurants.find(r => r.id === restaurantId) || null;
  }
};

export const getAvailableReservationTimes = async (
  restaurantId: string,
  date: string,
  partySize: number
): Promise<string[]> => {
  try {
    if (API_KEY === 'demo-key') {
      // Generate mock reservation times
      await new Promise(resolve => setTimeout(resolve, 700));
      return generateMockReservationTimes();
    }

    const response = await api.get(`/restaurants/${restaurantId}/availability`, {
      params: {
        date,
        party_size: partySize
      }
    });

    return response.data.available_times || [];
  } catch (error) {
    console.error('Error getting available reservation times:', error);
    return generateMockReservationTimes();
  }
};

export const makeReservation = async (
  restaurantId: string,
  date: string,
  time: string,
  partySize: number,
  guestDetails: any,
  specialRequests?: string
): Promise<any> => {
  try {
    if (API_KEY === 'demo-key') {
      // Simulate reservation process
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      const restaurant = sampleRestaurants.find(r => r.id === restaurantId);
      
      return {
        success: true,
        reservation_id: `res_${Date.now()}`,
        confirmation_code: `OT${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        restaurant_id: restaurantId,
        restaurant_name: restaurant?.name,
        date,
        time,
        party_size: partySize,
        status: 'confirmed',
        special_requests: specialRequests,
        guest_details: guestDetails,
        reservation_url: restaurant?.opentable_id 
          ? `https://www.opentable.com/booking/confirmation?rid=${restaurant.opentable_id}&datetime=${date}T${time}&seats=${partySize}`
          : undefined
      };
    }

    const response = await api.post('/restaurants/reservations', {
      restaurant_id: restaurantId,
      date,
      time,
      party_size: partySize,
      guest_details: guestDetails,
      special_requests: specialRequests
    });

    return response.data;
  } catch (error) {
    console.error('Error making reservation:', error);
    throw error;
  }
};

// Helper function to generate mock reservation times
const generateMockReservationTimes = (): string[] => {
  const times = [];
  
  // Generate dinner times (5pm - 9pm)
  for (let hour = 17; hour <= 21; hour++) {
    // Skip some times randomly to simulate unavailability
    if (Math.random() > 0.7) continue;
    
    for (let minute of [0, 30]) {
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      times.push(`${hour12}:${minute === 0 ? '00' : minute} ${ampm}`);
    }
  }
  
  return times.sort();
};

// OpenTable specific functions
export const searchOpenTableRestaurants = async (
  location: string,
  date: string,
  partySize: number
): Promise<Restaurant[]> => {
  try {
    if (OPENTABLE_API_KEY === 'demo-key') {
      // Return mock data with OpenTable IDs
      await new Promise(resolve => setTimeout(resolve, 1100));
      return sampleRestaurants.filter(r => r.opentable_id).map(r => ({
        ...r,
        reservation_url: `https://www.opentable.com/restaurant/profile/${r.opentable_id}?dateTime=${date}T19:00&covers=${partySize}`
      }));
    }

    // In a real implementation, this would call the OpenTable API
    const response = await axios.get('https://api.opentable.com/v2/restaurants', {
      params: {
        location,
        date,
        party_size: partySize
      },
      headers: {
        'Authorization': `Bearer ${OPENTABLE_API_KEY}`
      }
    });

    // Transform OpenTable response to our format
    return response.data.restaurants.map((r: any) => ({
      id: `opentable_${r.id}`,
      name: r.name,
      description: r.description || `${r.cuisine} restaurant in ${r.location}`,
      image: r.image_url,
      rating: r.rating || 4.0,
      cuisine_type: r.cuisine,
      price_range: '$'.repeat(r.price_level || 2),
      amenities: r.amenities || [],
      address: r.address,
      phone: r.phone,
      website: r.website,
      hours: r.hours || 'Call for hours',
      opentable_id: r.id,
      latitude: r.latitude,
      longitude: r.longitude,
      api_source: 'opentable',
      reservation_url: r.reserve_url
    }));
  } catch (error) {
    console.error('Error searching OpenTable restaurants:', error);
    return sampleRestaurants.filter(r => r.opentable_id);
  }
};

// Yelp specific functions
export const searchYelpRestaurants = async (
  location: string,
  cuisine?: string,
  price?: string
): Promise<Restaurant[]> => {
  try {
    if (YELP_API_KEY === 'demo-key') {
      // Return mock data with Yelp IDs
      await new Promise(resolve => setTimeout(resolve, 1000));
      return sampleRestaurants.filter(r => r.yelp_id);
    }

    // In a real implementation, this would call the Yelp API
    const response = await axios.get('https://api.yelp.com/v3/businesses/search', {
      params: {
        location,
        categories: cuisine || 'restaurants',
        price: price,
        sort_by: 'rating',
        limit: 20
      },
      headers: {
        'Authorization': `Bearer ${YELP_API_KEY}`
      }
    });

    // Transform Yelp response to our format
    return response.data.businesses.map((b: any) => ({
      id: `yelp_${b.id}`,
      name: b.name,
      description: b.categories.map((c: any) => c.title).join(', '),
      image: b.image_url,
      rating: b.rating,
      cuisine_type: b.categories[0]?.title || 'Restaurant',
      price_range: b.price || '$$',
      amenities: b.transactions || [],
      address: b.location.display_address.join(', '),
      phone: b.display_phone,
      website: b.url,
      hours: 'Check Yelp for hours',
      yelp_id: b.id,
      latitude: b.coordinates.latitude,
      longitude: b.coordinates.longitude,
      api_source: 'yelp'
    }));
  } catch (error) {
    console.error('Error searching Yelp restaurants:', error);
    return sampleRestaurants.filter(r => r.yelp_id);
  }
};