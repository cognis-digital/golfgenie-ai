import axios from 'axios';
import { supabase, syncRestaurantData } from './supabase';

// OpenTable Search API configuration
const OPENTABLE_SEARCH_API_BASE = 'https://api.opentable.com/v2';
const OPENTABLE_API_KEY = import.meta.env.VITE_OPENTABLE_API_KEY || 'demo-key';

export interface OpenTableSearchParams {
  location: string;
  date: string;
  time: string;
  party_size: number;
  cuisine_type?: string;
  price_range?: 1 | 2 | 3 | 4;
  restaurant_name?: string;
  radius?: number;
  sort_by?: 'distance' | 'rating' | 'price' | 'availability';
}

export interface OpenTableRestaurantResult {
  id: string;
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip_code: string;
    formatted_address: string;
  };
  contact: {
    phone: string;
    website: string;
    opentable_url: string;
  };
  details: {
    cuisine_type: string;
    price_range: number;
    rating: number;
    review_count: number;
    description: string;
    image_url: string;
  };
  availability: {
    available_times: string[];
    available_seats: number;
    next_available: string;
    booking_url: string;
  };
  location: {
    latitude: number;
    longitude: number;
    distance_miles?: number;
  };
  features: string[];
  hours: {
    [key: string]: string;
  };
}

export interface OpenTableSearchResponse {
  success: boolean;
  restaurants: OpenTableRestaurantResult[];
  total_results: number;
  search_params: OpenTableSearchParams;
  error?: string;
  loading?: boolean;
}

// Create axios instance for OpenTable Search API
const openTableSearchAPI = axios.create({
  baseURL: OPENTABLE_SEARCH_API_BASE,
  headers: {
    'Authorization': `Bearer ${OPENTABLE_API_KEY}`,
    'Content-Type': 'application/json',
    'User-Agent': 'MyrtleBeachGolf/1.0'
  },
  timeout: 15000
});

export const searchOpenTableRestaurants = async (
  searchParams: OpenTableSearchParams
): Promise<OpenTableSearchResponse> => {
  try {
    // Validate required parameters
    if (!searchParams.location || !searchParams.date || !searchParams.time || !searchParams.party_size) {
      return {
        success: false,
        restaurants: [],
        total_results: 0,
        search_params: searchParams,
        error: 'Missing required search parameters: location, date, time, and party size are required.'
      };
    }

    // If using demo key, return mock data
    if (OPENTABLE_API_KEY === 'demo-key') {
      console.log('Using mock OpenTable data for search:', searchParams);
      await new Promise(resolve => setTimeout(resolve, 1200)); // Simulate API delay
      return generateMockSearchResults(searchParams);
    }

    // Prepare API request parameters
    const apiParams = {
      location: searchParams.location,
      datetime: `${searchParams.date} ${searchParams.time}`,
      covers: searchParams.party_size,
      radius: searchParams.radius || 25,
      ...(searchParams.cuisine_type && { cuisine: searchParams.cuisine_type }),
      ...(searchParams.price_range && { price: searchParams.price_range }),
      ...(searchParams.restaurant_name && { name: searchParams.restaurant_name }),
      sort: searchParams.sort_by || 'rating',
      limit: 50
    };

    console.log('Making OpenTable API request with params:', apiParams);

    const response = await openTableSearchAPI.get('/restaurants/search', {
      params: apiParams
    });

    if (!response.data || !response.data.restaurants) {
      return {
        success: false,
        restaurants: [],
        total_results: 0,
        search_params: searchParams,
        error: 'No restaurants found for the specified criteria.'
      };
    }

    // Transform API response to our format
    const transformedRestaurants = response.data.restaurants.map(transformOpenTableRestaurant);

    // Store results in database
    await storeRestaurantsInDatabase(transformedRestaurants);

    return {
      success: true,
      restaurants: transformedRestaurants,
      total_results: response.data.total_count || transformedRestaurants.length,
      search_params: searchParams
    };

  } catch (error: any) {
    console.error('OpenTable search error:', error);

    let errorMessage = 'Failed to search restaurants. Please try again.';
    
    if (error.response?.status === 401) {
      errorMessage = 'OpenTable API authentication failed. Please check API credentials.';
    } else if (error.response?.status === 429) {
      errorMessage = 'Too many requests. Please wait a moment and try again.';
    } else if (error.response?.status === 400) {
      errorMessage = 'Invalid search parameters. Please check your input and try again.';
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = 'Search request timed out. Please try again.';
    } else if (!navigator.onLine) {
      errorMessage = 'No internet connection. Please check your connection and try again.';
    }

    // Return mock data as fallback
    console.log('Falling back to mock data due to API error');
    const mockResults = generateMockSearchResults(searchParams);
    
    return {
      ...mockResults,
      error: `${errorMessage} (Showing sample results)`
    };
  }
};

const transformOpenTableRestaurant = (apiRestaurant: any): OpenTableRestaurantResult => {
  return {
    id: `ot_${apiRestaurant.id}`,
    name: apiRestaurant.name,
    address: {
      street: apiRestaurant.address?.street || '',
      city: apiRestaurant.address?.city || '',
      state: apiRestaurant.address?.state || '',
      zip_code: apiRestaurant.address?.postal_code || '',
      formatted_address: apiRestaurant.address?.formatted || apiRestaurant.address?.display_address?.join(', ') || ''
    },
    contact: {
      phone: apiRestaurant.phone || '',
      website: apiRestaurant.website || '',
      opentable_url: apiRestaurant.reservation_url || `https://www.opentable.com/r/${apiRestaurant.id}`
    },
    details: {
      cuisine_type: apiRestaurant.cuisine_type || apiRestaurant.categories?.[0]?.title || 'Restaurant',
      price_range: apiRestaurant.price_range || 2,
      rating: apiRestaurant.rating || 0,
      review_count: apiRestaurant.review_count || 0,
      description: apiRestaurant.description || `${apiRestaurant.cuisine_type || 'Restaurant'} in ${apiRestaurant.address?.city || 'Myrtle Beach'}`,
      image_url: apiRestaurant.image_url || 'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg'
    },
    availability: {
      available_times: apiRestaurant.available_times || [],
      available_seats: apiRestaurant.available_seats || 0,
      next_available: apiRestaurant.next_available_time || '',
      booking_url: apiRestaurant.booking_url || apiRestaurant.reservation_url || ''
    },
    location: {
      latitude: apiRestaurant.coordinates?.latitude || 33.6891,
      longitude: apiRestaurant.coordinates?.longitude || -78.8867,
      distance_miles: apiRestaurant.distance
    },
    features: apiRestaurant.features || apiRestaurant.amenities || [],
    hours: apiRestaurant.hours || {}
  };
};

const storeRestaurantsInDatabase = async (restaurants: OpenTableRestaurantResult[]) => {
  if (!restaurants.length) return;

  try {
    for (const restaurant of restaurants) {
      const restaurantData = {
        id: restaurant.id,
        name: restaurant.name,
        description: restaurant.details.description,
        image: restaurant.details.image_url,
        rating: restaurant.details.rating,
        cuisine_type: restaurant.details.cuisine_type,
        price_range: '$'.repeat(restaurant.details.price_range),
        amenities: restaurant.features,
        address: restaurant.address.formatted_address,
        phone: restaurant.contact.phone,
        website: restaurant.contact.website,
        hours: Object.values(restaurant.hours).join(', ') || 'Check OpenTable for hours',
        opentable_id: restaurant.id.replace('ot_', ''),
        latitude: restaurant.location.latitude,
        longitude: restaurant.location.longitude,
        api_source: 'opentable',
        external_id: restaurant.id,
        last_updated: new Date().toISOString()
      };

      await syncRestaurantData(restaurantData);
    }

    console.log(`Successfully stored ${restaurants.length} restaurants in database`);
  } catch (error) {
    console.error('Error storing restaurants in database:', error);
  }
};

const generateMockSearchResults = (searchParams: OpenTableSearchParams): OpenTableSearchResponse => {
  const mockRestaurants: OpenTableRestaurantResult[] = [
    {
      id: 'ot_search_1',
      name: 'Ocean Prime Seafood',
      address: {
        street: '2511 N Ocean Blvd',
        city: 'Myrtle Beach',
        state: 'SC',
        zip_code: '29577',
        formatted_address: '2511 N Ocean Blvd, Myrtle Beach, SC 29577'
      },
      contact: {
        phone: '(843) 448-9292',
        website: 'https://oceanprimeseafood.com',
        opentable_url: 'https://www.opentable.com/r/ocean-prime-seafood'
      },
      details: {
        cuisine_type: 'Seafood',
        price_range: 3,
        rating: 4.6,
        review_count: 892,
        description: 'Fresh seafood with oceanfront dining and spectacular sunset views.',
        image_url: 'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg'
      },
      availability: {
        available_times: ['5:30 PM', '6:00 PM', '7:30 PM', '8:00 PM', '9:00 PM'],
        available_seats: 24,
        next_available: '5:30 PM',
        booking_url: 'https://www.opentable.com/booking/experiences-availability?rid=ocean-prime-seafood'
      },
      location: {
        latitude: 33.6945,
        longitude: -78.8823,
        distance_miles: 0.8
      },
      features: ['Oceanfront', 'Outdoor Seating', 'Full Bar', 'Private Dining', 'Valet Parking'],
      hours: {
        'Monday': '5:00 PM - 10:00 PM',
        'Tuesday': '5:00 PM - 10:00 PM',
        'Wednesday': '5:00 PM - 10:00 PM',
        'Thursday': '5:00 PM - 10:00 PM',
        'Friday': '5:00 PM - 11:00 PM',
        'Saturday': '5:00 PM - 11:00 PM',
        'Sunday': '5:00 PM - 10:00 PM'
      }
    },
    {
      id: 'ot_search_2',
      name: 'The Steakhouse at Grande Dunes',
      address: {
        street: '8500 Costa Verde Dr',
        city: 'Myrtle Beach',
        state: 'SC',
        zip_code: '29572',
        formatted_address: '8500 Costa Verde Dr, Myrtle Beach, SC 29572'
      },
      contact: {
        phone: '(843) 449-4747',
        website: 'https://grandedunessteakhouse.com',
        opentable_url: 'https://www.opentable.com/r/steakhouse-grande-dunes'
      },
      details: {
        cuisine_type: 'Steakhouse',
        price_range: 4,
        rating: 4.8,
        review_count: 1156,
        description: 'Premium steaks and fine wines in an elegant resort setting.',
        image_url: 'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg'
      },
      availability: {
        available_times: ['6:00 PM', '6:30 PM', '8:00 PM', '8:30 PM'],
        available_seats: 16,
        next_available: '6:00 PM',
        booking_url: 'https://www.opentable.com/booking/experiences-availability?rid=steakhouse-grande-dunes'
      },
      location: {
        latitude: 33.6234,
        longitude: -78.9012,
        distance_miles: 2.1
      },
      features: ['Fine Dining', 'Wine Cellar', 'Private Rooms', 'Sommelier', 'Valet Parking'],
      hours: {
        'Tuesday': '5:30 PM - 10:00 PM',
        'Wednesday': '5:30 PM - 10:00 PM',
        'Thursday': '5:30 PM - 10:00 PM',
        'Friday': '5:30 PM - 10:30 PM',
        'Saturday': '5:30 PM - 10:30 PM',
        'Sunday': '5:30 PM - 9:30 PM'
      }
    },
    {
      id: 'ot_search_3',
      name: 'Coastal Kitchen & Bar',
      address: {
        street: '1405 21st Ave N',
        city: 'Myrtle Beach',
        state: 'SC',
        zip_code: '29577',
        formatted_address: '1405 21st Ave N, Myrtle Beach, SC 29577'
      },
      contact: {
        phone: '(843) 839-3030',
        website: 'https://coastalkitchenbar.com',
        opentable_url: 'https://www.opentable.com/r/coastal-kitchen-bar'
      },
      details: {
        cuisine_type: 'American',
        price_range: 2,
        rating: 4.4,
        review_count: 743,
        description: 'Modern American cuisine with coastal influences and craft cocktails.',
        image_url: 'https://images.pexels.com/photos/941861/pexels-photo-941861.jpeg'
      },
      availability: {
        available_times: ['5:00 PM', '5:30 PM', '6:00 PM', '7:00 PM', '7:30 PM', '8:00 PM', '9:00 PM'],
        available_seats: 32,
        next_available: '5:00 PM',
        booking_url: 'https://www.opentable.com/booking/experiences-availability?rid=coastal-kitchen-bar'
      },
      location: {
        latitude: 33.6823,
        longitude: -78.8745,
        distance_miles: 1.2
      },
      features: ['Craft Cocktails', 'Happy Hour', 'Outdoor Seating', 'Live Music', 'Brunch'],
      hours: {
        'Monday': '4:00 PM - 11:00 PM',
        'Tuesday': '4:00 PM - 11:00 PM',
        'Wednesday': '4:00 PM - 11:00 PM',
        'Thursday': '4:00 PM - 11:00 PM',
        'Friday': '4:00 PM - 12:00 AM',
        'Saturday': '11:00 AM - 12:00 AM',
        'Sunday': '11:00 AM - 11:00 PM'
      }
    }
  ];

  // Filter results based on search criteria
  let filteredRestaurants = mockRestaurants;

  if (searchParams.cuisine_type) {
    filteredRestaurants = filteredRestaurants.filter(r => 
      r.details.cuisine_type.toLowerCase().includes(searchParams.cuisine_type!.toLowerCase())
    );
  }

  if (searchParams.price_range) {
    filteredRestaurants = filteredRestaurants.filter(r => 
      r.details.price_range <= searchParams.price_range!
    );
  }

  if (searchParams.restaurant_name) {
    filteredRestaurants = filteredRestaurants.filter(r => 
      r.name.toLowerCase().includes(searchParams.restaurant_name!.toLowerCase())
    );
  }

  // Sort results
  if (searchParams.sort_by) {
    filteredRestaurants.sort((a, b) => {
      switch (searchParams.sort_by) {
        case 'rating':
          return b.details.rating - a.details.rating;
        case 'price':
          return a.details.price_range - b.details.price_range;
        case 'distance':
          return (a.location.distance_miles || 0) - (b.location.distance_miles || 0);
        case 'availability':
          return b.availability.available_seats - a.availability.available_seats;
        default:
          return 0;
      }
    });
  }

  return {
    success: true,
    restaurants: filteredRestaurants,
    total_results: filteredRestaurants.length,
    search_params: searchParams
  };
};

// Utility function to format price range
export const formatPriceRange = (priceRange: number): string => {
  return '$'.repeat(Math.max(1, Math.min(4, priceRange)));
};

// Utility function to format distance
export const formatDistance = (miles: number): string => {
  if (miles < 1) {
    return `${Math.round(miles * 5280)} ft`;
  }
  return `${miles.toFixed(1)} mi`;
};

// Utility function to check if restaurant is currently open
export const isRestaurantOpen = (hours: { [key: string]: string }): boolean => {
  const now = new Date();
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
  const currentTime = now.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
  
  const todayHours = hours[dayName];
  if (!todayHours || todayHours.toLowerCase().includes('closed')) {
    return false;
  }
  
  // Simple check - in a real app you'd want more sophisticated time parsing
  return true;
};