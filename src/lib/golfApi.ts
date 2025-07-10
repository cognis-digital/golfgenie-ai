import axios from 'axios';
import { sampleGolfCourses } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.golfgenie.ai';
const API_KEY = import.meta.env.VITE_API_KEY || 'demo-key';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
  },
  timeout: 10000
});

// GolfNow/Supreme Golf API integration
export interface GolfCourse {
  id: string;
  name: string;
  description: string;
  image: string;
  rating: number;
  difficulty: string;
  holes: number;
  yardage: number;
  par: number;
  price: number;
  amenities: string[];
  address: string;
  phone: string;
  website: string;
  available_times: string[];
  latitude: number;
  longitude: number;
  api_source: string;
}

export interface TeeTime {
  id: string;
  course_id: string;
  date: string;
  time: string;
  price: number;
  available_spots: number;
  special_offer?: boolean;
  booking_url?: string;
  isReserved?: boolean;
}

export interface GolfSearchParams {
  location: string;
  start_date: string;
  end_date: string;
  players: number;
  max_price?: number;
  difficulty?: string;
  sort_by?: 'price' | 'rating' | 'distance';
  radius?: number;
}

export const searchGolfCourses = async (
  location: string,
  startDate: string,
  endDate: string,
  players: number,
  options: Partial<GolfSearchParams> = {}
): Promise<GolfCourse[]> => {
  try {
    if (API_KEY === 'demo-key') {
      // Return mock data for demo
      await new Promise(resolve => setTimeout(resolve, 1000));
      return sampleGolfCourses;
    }

    const response = await api.get('/golf/courses', {
      params: {
        location,
        start_date: startDate,
        end_date: endDate,
        players,
        ...options
      }
    });

    return response.data.courses || [];
  } catch (error) {
    console.error('Error searching golf courses:', error);
    return sampleGolfCourses;
  }
};

export const getGolfCourseDetails = async (courseId: string): Promise<GolfCourse | null> => {
  try {
    if (API_KEY === 'demo-key') {
      // Return mock data for demo
      await new Promise(resolve => setTimeout(resolve, 800));
      const course = sampleGolfCourses.find(c => c.id === courseId);
      return course || null;
    }

    const response = await api.get(`/golf/courses/${courseId}`);
    return response.data.course || null;
  } catch (error) {
    console.error('Error getting golf course details:', error);
    return sampleGolfCourses.find(c => c.id === courseId) || null;
  }
};

export const getAvailableTeeTimesByDate = async (
  courseId: string,
  date: string,
  players: number
): Promise<TeeTime[]> => {
  try {
    if (API_KEY === 'demo-key') {
      // Generate mock tee times
      await new Promise(resolve => setTimeout(resolve, 700));
      return generateMockTeeTimes(courseId, date, players);
    }

    const response = await api.get(`/golf/courses/${courseId}/tee-times`, {
      params: {
        date,
        players
      }
    });

    return response.data.tee_times || [];
  } catch (error) {
    console.error('Error getting tee times:', error);
    return generateMockTeeTimes(courseId, date, players);
  }
};

export const getReservedTeeTimes = async (
  courseId: string,
  date: string
): Promise<string[]> => {
  try {
    if (API_KEY === 'demo-key') {
      // Generate mock reserved times
      await new Promise(resolve => setTimeout(resolve, 500));
      const allTeeTimes = generateMockTeeTimes(courseId, date, 1);
      const reservedCount = Math.floor(allTeeTimes.length * 0.4); // 40% of times are reserved
      const shuffled = [...allTeeTimes].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, reservedCount).map(t => t.time);
    }

    const response = await api.get(`/golf/courses/${courseId}/reserved-times`, {
      params: { date }
    });

    return response.data.reserved_times || [];
  } catch (error) {
    console.error('Error getting reserved tee times:', error);
    return [];
  }
};

export const bookTeeTime = async (
  teeTimeId: string,
  courseId: string,
  date: string,
  time: string,
  players: number,
  playerDetails: any[],
  paymentMethodId?: string
): Promise<any> => {
  try {
    if (API_KEY === 'demo-key') {
      // Simulate booking process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return {
        success: true,
        booking_id: `golf_${Date.now()}`,
        confirmation_code: `GC${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        course_id: courseId,
        date,
        time,
        players,
        total_price: players * (sampleGolfCourses.find(c => c.id === courseId)?.price || 100),
        booking_details: {
          course_name: sampleGolfCourses.find(c => c.id === courseId)?.name,
          player_names: playerDetails.map(p => p.name),
          cancellation_policy: "Free cancellation up to 24 hours before tee time"
        }
      };
    }

    const response = await api.post('/golf/bookings', {
      tee_time_id: teeTimeId,
      course_id: courseId,
      date,
      time,
      players,
      player_details: playerDetails,
      payment_method_id: paymentMethodId
    });

    return response.data;
  } catch (error) {
    console.error('Error booking tee time:', error);
    throw error;
  }
};

// Helper function to generate mock tee times
const generateMockTeeTimes = (courseId: string, date: string, players: number): TeeTime[] => {
  const course = sampleGolfCourses.find(c => c.id === courseId);
  const basePrice = course?.price || 100;
  
  // Generate times from 7am to 4pm
  const times = [];
  for (let hour = 7; hour <= 16; hour++) {
    // Skip some times randomly to simulate unavailability
    if (Math.random() > 0.7) continue;
    
    const timeString = `${hour > 12 ? hour - 12 : hour}:${Math.random() > 0.5 ? '00' : '30'} ${hour >= 12 ? 'PM' : 'AM'}`;
    
    // Price varies by time of day
    let price = basePrice;
    if (hour < 9) price = basePrice * 0.8; // Early bird discount
    if (hour >= 12 && hour < 14) price = basePrice * 1.2; // Peak time premium
    if (hour >= 15) price = basePrice * 0.9; // Twilight discount
    
    // Some tee times are special offers
    const isSpecialOffer = Math.random() > 0.8;
    if (isSpecialOffer) {
      price = Math.round(price * 0.85); // 15% discount for special offers
    }
    
    times.push({
      id: `tt_${courseId}_${date}_${hour}`,
      course_id: courseId,
      date,
      time: timeString,
      price: Math.round(price),
      available_spots: Math.min(4, players + Math.floor(Math.random() * 2)),
      special_offer: isSpecialOffer,
      isReserved: Math.random() > 0.7 // 30% chance of being reserved
    });
  }
  
  return times;
};