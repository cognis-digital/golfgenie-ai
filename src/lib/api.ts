import axios from 'axios';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.myrtlebeachgolf.com';
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

// Types for API responses
export interface BookingResponse {
  success: boolean;
  booking_id?: string;
  confirmation_code?: string;
  error?: string;
  message?: string;
}

export interface AvailabilityResponse {
  success: boolean;
  available_times?: string[];
  available_rooms?: number;
  available_tables?: string[];
  error?: string;
}

export interface ReservedTimesResponse {
  success: boolean;
  reserved_times?: string[];
  error?: string;
}

export interface MenuResponse {
  success: boolean;
  menu?: MenuSection[];
  error?: string;
}

export interface MenuSection {
  name: string;
  description?: string;
  items: MenuItem[];
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  dietary_restrictions?: string[];
  image_url?: string;
}

// Mock data generators for demo purposes
const generateMockTimes = (): string[] => {
  const times = ['7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM'];
  const availableCount = Math.floor(Math.random() * 8) + 5; // 5-12 available times
  const shuffled = times.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, availableCount).sort();
};

const generateMockReservedTimes = (allTimes: string[]): string[] => {
  // Randomly select 30-50% of times to be reserved
  const reservedCount = Math.floor(allTimes.length * (0.3 + Math.random() * 0.2));
  const shuffled = [...allTimes].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, reservedCount).sort();
};

const generateConfirmationCode = (prefix: string): string => {
  return `${prefix}${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
};

// Golf Course API
export const golfAPI = {
  // Get tee time availability
  getAvailability: async (courseId: string, date: string): Promise<AvailabilityResponse> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Return mock data for demo
    return {
      success: true,
      available_times: generateMockTimes()
    };
  },

  // Get reserved tee times
  getReservedTimes: async (courseId: string, date: string): Promise<ReservedTimesResponse> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Generate mock reserved times
    const allTimes = generateMockTimes();
    const reservedTimes = generateMockReservedTimes(allTimes);
    
    return {
      success: true,
      reserved_times: reservedTimes
    };
  },

  // Book tee time
  bookTeeTime: async (booking: {
    course_id: string;
    date: string;
    time: string;
    party_size: number;
    customer_info: {
      name: string;
      email: string;
      phone: string;
    };
    special_requests?: string;
  }): Promise<BookingResponse> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // Return mock success for demo
    return {
      success: true,
      booking_id: `GOLF${Date.now()}`,
      confirmation_code: generateConfirmationCode('GT'),
      message: 'Tee time booked successfully!'
    };
  },

  // Get course details
  getCourseDetails: async (courseId: string) => {
    await new Promise(resolve => setTimeout(resolve, 600));
    return { 
      success: true, 
      message: 'Course details loaded successfully',
      course: { id: courseId, name: 'Sample Course' }
    };
  }
};

// Hotel API
export const hotelAPI = {
  // Get room availability
  getAvailability: async (hotelId: string, checkIn: string, checkOut: string): Promise<AvailabilityResponse> => {
    await new Promise(resolve => setTimeout(resolve, 700));
    
    // Return mock data for demo
    return {
      success: true,
      available_rooms: Math.floor(Math.random() * 20) + 5
    };
  },

  // Book hotel room
  bookRoom: async (booking: {
    hotel_id: string;
    check_in: string;
    check_out: string;
    guests: number;
    room_type?: string;
    customer_info: {
      name: string;
      email: string;
      phone: string;
    };
    special_requests?: string;
  }): Promise<BookingResponse> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return mock success for demo
    return {
      success: true,
      booking_id: `HOTEL${Date.now()}`,
      confirmation_code: generateConfirmationCode('HT'),
      message: 'Hotel room booked successfully!'
    };
  },

  // Get hotel amenities and details
  getHotelDetails: async (hotelId: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { 
      success: true, 
      message: 'Hotel details loaded successfully',
      hotel: { id: hotelId, name: 'Sample Hotel' }
    };
  }
};

// Restaurant API
export const restaurantAPI = {
  // Get table availability
  getAvailability: async (restaurantId: string, date: string, partySize: number): Promise<AvailabilityResponse> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Return mock data for demo
    const times = ['5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM', '9:00 PM', '9:30 PM'];
    const availableCount = Math.floor(Math.random() * 6) + 4; // 4-9 available times
    const shuffled = times.sort(() => 0.5 - Math.random());
    
    return {
      success: true,
      available_tables: shuffled.slice(0, availableCount).sort()
    };
  },

  // Make reservation
  makeReservation: async (reservation: {
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
  }): Promise<BookingResponse> => {
    await new Promise(resolve => setTimeout(resolve, 900));
    
    // Return mock success for demo
    return {
      success: true,
      booking_id: `REST${Date.now()}`,
      confirmation_code: generateConfirmationCode('RT'),
      message: 'Table reserved successfully!'
    };
  },

  // Get restaurant menu
  getMenu: async (restaurantId: string): Promise<MenuResponse> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    // Return mock menu for demo
    return {
      success: true,
      menu: [
        {
          name: 'Appetizers',
          items: [
            {
              id: '1',
              name: 'Shrimp Cocktail',
              description: 'Fresh Gulf shrimp with cocktail sauce',
              price: 16,
              category: 'appetizer'
            },
            {
              id: '2',
              name: 'Oysters Rockefeller',
              description: 'Baked oysters with spinach and herbs',
              price: 18,
              category: 'appetizer'
            }
          ]
        },
        {
          name: 'Main Courses',
          items: [
            {
              id: '3',
              name: 'Grilled Mahi Mahi',
              description: 'Fresh catch with seasonal vegetables',
              price: 28,
              category: 'entree'
            },
            {
              id: '4',
              name: 'Ribeye Steak',
              description: '12oz prime cut with garlic mashed potatoes',
              price: 42,
              category: 'entree'
            }
          ]
        }
      ]
    };
  }
};

// Experience API
export const experienceAPI = {
  // Get experience availability
  getAvailability: async (experienceId: string, date: string): Promise<AvailabilityResponse> => {
    await new Promise(resolve => setTimeout(resolve, 650));
    
    // Return mock data for demo
    const times = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'];
    const availableCount = Math.floor(Math.random() * 5) + 3; // 3-7 available times
    const shuffled = times.sort(() => 0.5 - Math.random());
    
    return {
      success: true,
      available_times: shuffled.slice(0, availableCount).sort()
    };
  },

  // Book experience
  bookExperience: async (booking: {
    experience_id: string;
    date: string;
    time: string;
    party_size: number;
    customer_info: {
      name: string;
      email: string;
      phone: string;
    };
    special_requests?: string;
  }): Promise<BookingResponse> => {
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    // Return mock success for demo
    return {
      success: true,
      booking_id: `EXP${Date.now()}`,
      confirmation_code: generateConfirmationCode('EX'),
      message: 'Experience booked successfully!'
    };
  },

  // Get experience details
  getExperienceDetails: async (experienceId: string) => {
    await new Promise(resolve => setTimeout(resolve, 550));
    return { 
      success: true, 
      message: 'Experience details loaded successfully',
      experience: { id: experienceId, name: 'Sample Experience' }
    };
  }
};

// Package API
export const packageAPI = {
  // Get package details
  getPackageDetails: async (packageId: string) => {
    await new Promise(resolve => setTimeout(resolve, 750));
    return { 
      success: true, 
      message: 'Package details loaded successfully',
      package: { id: packageId, name: 'Sample Package' }
    };
  },

  // Book package
  bookPackage: async (booking: {
    package_id: string;
    start_date: string;
    party_size: number;
    customer_info: {
      name: string;
      email: string;
      phone: string;
    };
    special_requests?: string;
    customizations?: any;
  }): Promise<BookingResponse> => {
    await new Promise(resolve => setTimeout(resolve, 1300));
    
    // Return mock success for demo
    return {
      success: true,
      booking_id: `PKG${Date.now()}`,
      confirmation_code: generateConfirmationCode('PK'),
      message: 'Package booked successfully!'
    };
  },

  // Get package availability
  getAvailability: async (packageId: string, startDate: string): Promise<AvailabilityResponse> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      available_times: ['Available']
    };
  }
};

// General booking management
export const bookingAPI = {
  // Get user bookings
  getUserBookings: async (userId: string) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    return { 
      success: true, 
      bookings: [],
      message: 'User bookings loaded successfully'
    };
  },

  // Cancel booking
  cancelBooking: async (bookingId: string, reason?: string): Promise<BookingResponse> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    return {
      success: true,
      message: 'Booking cancelled successfully'
    };
  },

  // Modify booking
  modifyBooking: async (bookingId: string, changes: any): Promise<BookingResponse> => {
    await new Promise(resolve => setTimeout(resolve, 900));
    
    return {
      success: true,
      message: 'Booking modified successfully'
    };
  }
};

// Error handling utility
export const handleAPIError = (error: any): string => {
  if (error.response) {
    return error.response.data?.message || 'Server error occurred';
  } else if (error.request) {
    return 'Network error - please check your connection';
  } else {
    return error.message || 'An unexpected error occurred';
  }
};