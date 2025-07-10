import axios from 'axios';

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

// Transportation API integration (Uber, local services)
export interface Vehicle {
  id: string;
  type: string;
  name: string;
  description: string;
  capacity: number;
  price_per_day: number;
  image: string;
  features: string[];
  available: boolean;
}

export interface RentalSearchParams {
  location: string;
  pickup_date: string;
  return_date: string;
  vehicle_type?: string;
  min_capacity?: number;
}

export const searchRentalVehicles = async (
  location: string,
  pickupDate: string,
  returnDate: string,
  options: Partial<RentalSearchParams> = {}
): Promise<Vehicle[]> => {
  try {
    if (API_KEY === 'demo-key') {
      // Return mock data for demo
      await new Promise(resolve => setTimeout(resolve, 1000));
      return generateMockVehicles();
    }

    const response = await api.get('/transportation/rentals', {
      params: {
        location,
        pickup_date: pickupDate,
        return_date: returnDate,
        ...options
      }
    });

    return response.data.vehicles || [];
  } catch (error) {
    console.error('Error searching rental vehicles:', error);
    return generateMockVehicles();
  }
};

export const bookRentalVehicle = async (
  vehicleId: string,
  pickupDate: string,
  returnDate: string,
  driverDetails: any,
  paymentMethodId?: string
): Promise<any> => {
  try {
    if (API_KEY === 'demo-key') {
      // Simulate booking process
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      const vehicle = generateMockVehicles().find(v => v.id === vehicleId);
      
      // Calculate number of days
      const startDate = new Date(pickupDate);
      const endDate = new Date(returnDate);
      const days = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        success: true,
        booking_id: `car_${Date.now()}`,
        confirmation_code: `CR${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        vehicle_id: vehicleId,
        pickup_date: pickupDate,
        return_date: returnDate,
        total_price: (vehicle?.price_per_day || 50) * days,
        booking_details: {
          vehicle_name: vehicle?.name,
          driver_name: driverDetails.name,
          pickup_location: 'Myrtle Beach International Airport',
          return_location: 'Myrtle Beach International Airport',
          days
        }
      };
    }

    const response = await api.post('/transportation/bookings', {
      vehicle_id: vehicleId,
      pickup_date: pickupDate,
      return_date: returnDate,
      driver_details: driverDetails,
      payment_method_id: paymentMethodId
    });

    return response.data;
  } catch (error) {
    console.error('Error booking rental vehicle:', error);
    throw error;
  }
};

// Helper function to generate mock vehicles
const generateMockVehicles = (): Vehicle[] => [
  {
    id: 'car_1',
    type: 'car',
    name: 'Economy Car',
    description: 'Compact and fuel-efficient car, perfect for couples or solo travelers',
    capacity: 2,
    price_per_day: 45,
    image: 'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg',
    features: ['Air Conditioning', 'Automatic Transmission', 'Bluetooth', 'Cruise Control'],
    available: true
  },
  {
    id: 'car_2',
    type: 'suv',
    name: 'Midsize SUV',
    description: 'Spacious SUV with room for passengers and golf clubs',
    capacity: 5,
    price_per_day: 75,
    image: 'https://images.pexels.com/photos/116675/pexels-photo-116675.jpeg',
    features: ['Air Conditioning', 'Automatic Transmission', 'Bluetooth', 'Cruise Control', 'Backup Camera', 'Roof Rack'],
    available: true
  },
  {
    id: 'car_3',
    type: 'luxury',
    name: 'Luxury Sedan',
    description: 'Premium sedan with high-end features and comfort',
    capacity: 4,
    price_per_day: 120,
    image: 'https://images.pexels.com/photos/707046/pexels-photo-707046.jpeg',
    features: ['Leather Seats', 'Premium Sound System', 'GPS Navigation', 'Heated Seats', 'Sunroof'],
    available: true
  },
  {
    id: 'car_4',
    type: 'van',
    name: 'Passenger Van',
    description: 'Spacious van perfect for golf groups with plenty of luggage space',
    capacity: 8,
    price_per_day: 150,
    image: 'https://images.pexels.com/photos/2533092/pexels-photo-2533092.jpeg',
    features: ['Air Conditioning', 'Automatic Transmission', 'Bluetooth', 'Cruise Control', 'Luggage Space', 'Third Row Seating'],
    available: true
  }
];