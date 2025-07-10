import axios from 'axios';

const YELP_API_KEY = import.meta.env.VITE_YELP_API_KEY || 'demo-key';
const YELP_API_BASE = 'https://api.yelp.com/v3';

export interface YelpBusiness {
  id: string;
  name: string;
  image_url: string;
  url: string;
  review_count: number;
  categories: Array<{ alias: string; title: string }>;
  rating: number;
  coordinates: { latitude: number; longitude: number };
  transactions: string[];
  price?: string;
  location: {
    address1: string;
    address2?: string;
    address3?: string;
    city: string;
    zip_code: string;
    country: string;
    state: string;
    display_address: string[];
  };
  phone: string;
  display_phone: string;
  distance: number;
}

export interface YelpSearchParams {
  term?: string;
  location: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  categories?: string;
  locale?: string;
  limit?: number;
  offset?: number;
  sort_by?: 'best_match' | 'rating' | 'review_count' | 'distance';
  price?: '1' | '2' | '3' | '4';
  open_now?: boolean;
  open_at?: number;
  attributes?: string[];
}

// Create axios instance for Yelp API
const yelpAPI = axios.create({
  baseURL: YELP_API_BASE,
  headers: {
    'Authorization': `Bearer ${YELP_API_KEY}`,
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

export const searchBusinesses = async (params: YelpSearchParams): Promise<YelpBusiness[]> => {
  try {
    if (YELP_API_KEY === 'demo-key') {
      // Return mock data for demo
      return getMockYelpBusinesses(params);
    }

    const response = await yelpAPI.get('/businesses/search', { params });
    return response.data.businesses || [];
  } catch (error) {
    console.error('Yelp search error:', error);
    return getMockYelpBusinesses(params);
  }
};

export const getBusinessDetails = async (businessId: string): Promise<YelpBusiness | null> => {
  try {
    if (YELP_API_KEY === 'demo-key') {
      // Return mock data for demo
      const mockBusinesses = getMockYelpBusinesses({ location: 'Myrtle Beach, SC' });
      return mockBusinesses.find(b => b.id === businessId) || null;
    }

    const response = await yelpAPI.get(`/businesses/${businessId}`);
    return response.data;
  } catch (error) {
    console.error('Yelp business details error:', error);
    return null;
  }
};

export const getBusinessReviews = async (businessId: string) => {
  try {
    if (YELP_API_KEY === 'demo-key') {
      // Return mock reviews for demo
      return getMockReviews();
    }

    const response = await yelpAPI.get(`/businesses/${businessId}/reviews`);
    return response.data.reviews || [];
  } catch (error) {
    console.error('Yelp reviews error:', error);
    return getMockReviews();
  }
};

// Enhanced search functions for specific categories
export const searchRestaurants = async (location: string, cuisine?: string): Promise<YelpBusiness[]> => {
  return searchBusinesses({
    location,
    categories: cuisine ? `restaurants,${cuisine}` : 'restaurants',
    sort_by: 'rating',
    limit: 20
  });
};

export const searchGolfCourses = async (location: string): Promise<YelpBusiness[]> => {
  return searchBusinesses({
    location,
    categories: 'golf',
    sort_by: 'rating',
    limit: 15
  });
};

export const searchHotels = async (location: string): Promise<YelpBusiness[]> => {
  return searchBusinesses({
    location,
    categories: 'hotels,bedbreakfast',
    sort_by: 'rating',
    limit: 20
  });
};

export const searchAttractions = async (location: string): Promise<YelpBusiness[]> => {
  return searchBusinesses({
    location,
    categories: 'tours,amusementparks,museums,aquariums',
    sort_by: 'rating',
    limit: 15
  });
};

// Mock data functions for demo
const getMockYelpBusinesses = (params: YelpSearchParams): YelpBusiness[] => {
  const mockBusinesses: YelpBusiness[] = [
    {
      id: 'yelp_seacaptains',
      name: 'Sea Captain\'s House',
      image_url: 'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg',
      url: 'https://www.yelp.com/biz/sea-captains-house-myrtle-beach',
      review_count: 1247,
      categories: [{ alias: 'seafood', title: 'Seafood' }],
      rating: 4.5,
      coordinates: { latitude: 33.7001, longitude: -78.8851 },
      transactions: ['restaurant_reservation'],
      price: '$$$',
      location: {
        address1: '3002 N Ocean Blvd',
        city: 'Myrtle Beach',
        zip_code: '29577',
        country: 'US',
        state: 'SC',
        display_address: ['3002 N Ocean Blvd', 'Myrtle Beach, SC 29577']
      },
      phone: '+18434488082',
      display_phone: '(843) 448-8082',
      distance: 1200.5
    },
    {
      id: 'yelp_tpc',
      name: 'TPC Myrtle Beach',
      image_url: 'https://images.pexels.com/photos/1325735/pexels-photo-1325735.jpeg',
      url: 'https://www.yelp.com/biz/tpc-myrtle-beach-murrells-inlet',
      review_count: 892,
      categories: [{ alias: 'golf', title: 'Golf Courses' }],
      rating: 4.8,
      coordinates: { latitude: 33.5707, longitude: -79.0728 },
      transactions: [],
      price: '$$$$',
      location: {
        address1: '1199 TPC Blvd',
        city: 'Murrells Inlet',
        zip_code: '29576',
        country: 'US',
        state: 'SC',
        display_address: ['1199 TPC Blvd', 'Murrells Inlet, SC 29576']
      },
      phone: '+18433573399',
      display_phone: '(843) 357-3399',
      distance: 2100.3
    },
    {
      id: 'yelp_oceanhouse',
      name: 'The Ocean House',
      image_url: 'https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg',
      url: 'https://www.yelp.com/biz/ocean-house-myrtle-beach',
      review_count: 567,
      categories: [{ alias: 'hotels', title: 'Hotels' }],
      rating: 4.7,
      coordinates: { latitude: 33.6891, longitude: -78.8867 },
      transactions: [],
      price: '$$$$',
      location: {
        address1: '1000 N Ocean Blvd',
        city: 'Myrtle Beach',
        zip_code: '29577',
        country: 'US',
        state: 'SC',
        display_address: ['1000 N Ocean Blvd', 'Myrtle Beach, SC 29577']
      },
      phone: '+18434488888',
      display_phone: '(843) 448-8888',
      distance: 800.2
    }
  ];

  // Filter based on search parameters
  if (params.categories) {
    return mockBusinesses.filter(business => 
      business.categories.some(cat => 
        params.categories!.includes(cat.alias)
      )
    );
  }

  return mockBusinesses;
};

const getMockReviews = () => [
  {
    id: 'review1',
    rating: 5,
    user: { name: 'John D.' },
    text: 'Excellent experience! The food was outstanding and the service was top-notch.',
    time_created: '2024-01-15T19:30:00Z'
  },
  {
    id: 'review2',
    rating: 4,
    user: { name: 'Sarah M.' },
    text: 'Great atmosphere and delicious food. Would definitely recommend!',
    time_created: '2024-01-10T18:45:00Z'
  },
  {
    id: 'review3',
    rating: 5,
    user: { name: 'Mike R.' },
    text: 'Perfect for a special occasion. The oceanfront location is beautiful.',
    time_created: '2024-01-08T20:15:00Z'
  }
];