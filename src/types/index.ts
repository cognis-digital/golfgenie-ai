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
  latitude?: number;
  longitude?: number;
  created_at: string;
  api_source?: string;
}

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
  latitude?: number;
  longitude?: number;
  created_at: string;
  api_source?: string;
}

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
  latitude?: number;
  longitude?: number;
  created_at: string;
  api_source?: string;
}

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
  latitude?: number;
  longitude?: number;
  created_at: string;
  api_source?: string;
}

export interface Package {
  id: string;
  name: string;
  description: string;
  image: string;
  rating: number;
  duration: string;
  price: number;
  includes: string[];
  golf_courses: string[];
  hotels: string[];
  restaurants: string[];
  experiences: string[];
  created_at: string;
  api_source?: string;
}

export interface Booking {
  id: string;
  user_id: string;
  booking_type: 'golf' | 'hotel' | 'restaurant' | 'experience' | 'package';
  item_id: string;
  booking_date: string;
  booking_time?: string;
  end_date?: string;
  party_size: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  total_price: number;
  confirmation_code: string;
  customer_info: {
    name: string;
    email: string;
    phone?: string;
  };
  special_requests?: string;
  created_at: string;
  updated_at?: string;
}

export interface Itinerary {
  golfCourses: GolfCourse[];
  hotels: Hotel[];
  restaurants: Restaurant[];
  experiences: Experience[];
  packages: Package[];
  notes: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  created_at: string;
  preferences?: {
    golfLevel?: string;
    preferredAccommodation?: string;
    preferredCuisine?: string[];
    preferredActivities?: string[];
  };
}

export interface OpenTableReservation {
  restaurant_id: string;
  date: string;
  time: string;
  party_size: number;
  special_requests?: string;
}

export interface TripPlan {
  id?: string;
  user_id?: string;
  trip_data: any;
  plan_data: {
    days: TripDay[];
    golfCourses: GolfCourse[];
    hotels: Hotel[];
    restaurants: Restaurant[];
    experiences: Experience[];
    packages: Package[];
    transportation?: any;
    totalCost: number;
  };
  status: 'generated' | 'modified' | 'finalized';
  version: number;
  is_finalized: boolean;
  created_at: string;
  updated_at: string;
}

export interface TripDay {
  day: number;
  date: string;
  activities: TripActivity[];
}

export interface TripActivity {
  time: string;
  description: string;
  type: 'golf' | 'hotel' | 'restaurant' | 'experience' | 'transportation' | 'other';
  item_id?: string;
  item_name?: string;
  notes?: string;
}

export interface ApiSyncLog {
  id: string;
  api_source: string;
  sync_type: string;
  status: string;
  items_synced: number;
  errors_count: number;
  error_details?: any;
  duration_ms?: number;
  started_at: string;
  completed_at?: string;
}

export interface ItemAnalytics {
  id: string;
  item_type: string;
  item_id: string;
  view_count: number;
  booking_count: number;
  itinerary_count: number;
  popularity_score: number;
  last_updated: string;
}

export interface UserActivity {
  id: string;
  user_id: string;
  activity_type: string;
  metadata?: any;
  timestamp: string;
}