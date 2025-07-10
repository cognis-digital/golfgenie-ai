import axios from 'axios';
import { sampleExperiences } from './supabase';

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

// Viator/GetYourGuide API integration
export interface Experience {
  id: string;
  name: string;
  description: string;
  image: string;
  rating: number;
  category: string;
  duration: string;
  price: number;
  amenities: string[];
  address: string;
  phone: string;
  website?: string;
  available_times: string[];
  latitude: number;
  longitude: number;
  api_source: string;
  booking_url?: string;
}

export interface ExperienceSearchParams {
  location: string;
  date?: string;
  categories?: string;
  max_price?: number;
  duration?: string;
  sort_by?: 'price' | 'rating' | 'popularity';
  radius?: number;
}

export const searchExperiences = async (
  location: string,
  date?: string,
  categories?: string,
  options: Partial<ExperienceSearchParams> = {}
): Promise<Experience[]> => {
  try {
    if (API_KEY === 'demo-key') {
      // Return mock data for demo
      await new Promise(resolve => setTimeout(resolve, 1100));
      return sampleExperiences;
    }

    const response = await api.get('/experiences/search', {
      params: {
        location,
        date,
        categories,
        ...options
      }
    });

    return response.data.experiences || [];
  } catch (error) {
    console.error('Error searching experiences:', error);
    return sampleExperiences;
  }
};

export const getExperienceDetails = async (experienceId: string): Promise<Experience | null> => {
  try {
    if (API_KEY === 'demo-key') {
      // Return mock data for demo
      await new Promise(resolve => setTimeout(resolve, 800));
      const experience = sampleExperiences.find(e => e.id === experienceId);
      return experience || null;
    }

    const response = await api.get(`/experiences/${experienceId}`);
    return response.data.experience || null;
  } catch (error) {
    console.error('Error getting experience details:', error);
    return sampleExperiences.find(e => e.id === experienceId) || null;
  }
};

export const getAvailableExperienceTimes = async (
  experienceId: string,
  date: string,
  participants: number
): Promise<string[]> => {
  try {
    if (API_KEY === 'demo-key') {
      // Generate mock times
      await new Promise(resolve => setTimeout(resolve, 700));
      const experience = sampleExperiences.find(e => e.id === experienceId);
      return experience?.available_times || generateMockExperienceTimes();
    }

    const response = await api.get(`/experiences/${experienceId}/availability`, {
      params: {
        date,
        participants
      }
    });

    return response.data.available_times || [];
  } catch (error) {
    console.error('Error getting available experience times:', error);
    return generateMockExperienceTimes();
  }
};

export const bookExperience = async (
  experienceId: string,
  date: string,
  time: string,
  participants: number,
  participantDetails: any[],
  paymentMethodId?: string
): Promise<any> => {
  try {
    if (API_KEY === 'demo-key') {
      // Simulate booking process
      await new Promise(resolve => setTimeout(resolve, 1300));
      
      const experience = sampleExperiences.find(e => e.id === experienceId);
      
      return {
        success: true,
        booking_id: `exp_${Date.now()}`,
        confirmation_code: `EX${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        experience_id: experienceId,
        date,
        time,
        participants,
        total_price: participants * (experience?.price || 50),
        booking_details: {
          experience_name: experience?.name,
          participant_names: participantDetails.map(p => p.name),
          cancellation_policy: "Free cancellation up to 24 hours before experience"
        }
      };
    }

    const response = await api.post('/experiences/bookings', {
      experience_id: experienceId,
      date,
      time,
      participants,
      participant_details: participantDetails,
      payment_method_id: paymentMethodId
    });

    return response.data;
  } catch (error) {
    console.error('Error booking experience:', error);
    throw error;
  }
};

// Helper function to generate mock experience times
const generateMockExperienceTimes = (): string[] => {
  const times = [];
  
  // Generate times throughout the day
  for (let hour = 9; hour <= 17; hour += 2) {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    times.push(`${hour12}:00 ${ampm}`);
  }
  
  return times;
};