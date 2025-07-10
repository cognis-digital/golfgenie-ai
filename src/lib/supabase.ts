import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if we have valid Supabase credentials
const hasValidCredentials = supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-project-id.supabase.co' && 
  supabaseAnonKey !== 'your-anon-key-here' &&
  supabaseUrl !== '' &&
  supabaseAnonKey !== '' &&
  supabaseUrl.includes('supabase.co') &&
  supabaseAnonKey.startsWith('eyJ'); // JWT tokens start with eyJ

// Only log the error in development mode and if credentials are completely missing
if (!hasValidCredentials && import.meta.env.DEV) {
  console.warn('⚠️ Supabase configuration issue detected');
  console.log('📝 Current status:');
  console.log(`   URL: ${supabaseUrl ? '✓ Set' : '✗ Missing'}`);
  console.log(`   Key: ${supabaseAnonKey ? (supabaseAnonKey.startsWith('eyJ') ? '✓ Valid JWT format' : '✗ Invalid format') : '✗ Missing'}`);
  console.log('🔧 To fix:');
  console.log('1. Go to https://supabase.com/dashboard');
  console.log('2. Select your project');
  console.log('3. Go to Settings → API');
  console.log('4. Copy the Project URL and anon/public key');
  console.log('5. Update your .env file');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// Export a flag to check if Supabase is properly configured
export const isSupabaseConfigured = hasValidCredentials;

// Test connection function with improved error handling
export const testSupabaseConnection = async () => {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    // Use a simple query with timeout to test connection
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const { data, error } = await supabase
      .from('golf_courses')
      .select('count')
      .limit(1)
      .abortSignal(controller.signal);
    
    clearTimeout(timeoutId);
    
    if (error) {
      console.warn('Supabase connection test failed:', error.message);
      return { success: false, error: error.message };
    }
    
    return { success: true, message: 'Supabase connection successful' };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.warn('Supabase connection test timed out');
      return { success: false, error: 'Connection timeout' };
    }
    
    console.warn('Supabase connection test error:', error.message);
    return { success: false, error: error.message };
  }
};

// Database sync functions
export const syncGolfCourseData = async (courseData: any) => {
  if (!isSupabaseConfigured) return null;
  
  try {
    const { data, error } = await supabase
      .from('golf_courses')
      .upsert({
        id: courseData.id,
        name: courseData.name,
        description: courseData.description,
        image: courseData.image,
        rating: courseData.rating,
        difficulty: courseData.difficulty,
        holes: courseData.holes,
        yardage: courseData.yardage,
        par: courseData.par,
        price: courseData.price,
        amenities: courseData.amenities,
        address: courseData.address,
        phone: courseData.phone,
        website: courseData.website,
        available_times: courseData.available_times,
        latitude: courseData.latitude,
        longitude: courseData.longitude,
        last_updated: new Date().toISOString(),
        api_source: courseData.api_source || 'internal'
      })
      .select();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error syncing golf course data:', error);
    return null;
  }
};

export const syncHotelData = async (hotelData: any) => {
  if (!isSupabaseConfigured) return null;
  
  try {
    const { data, error } = await supabase
      .from('hotels')
      .upsert({
        id: hotelData.id,
        name: hotelData.name,
        description: hotelData.description,
        image: hotelData.image,
        rating: hotelData.rating,
        price_per_night: hotelData.price_per_night,
        amenities: hotelData.amenities,
        address: hotelData.address,
        phone: hotelData.phone,
        website: hotelData.website,
        available_rooms: hotelData.available_rooms,
        latitude: hotelData.latitude,
        longitude: hotelData.longitude,
        last_updated: new Date().toISOString(),
        api_source: hotelData.api_source || 'internal'
      })
      .select();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error syncing hotel data:', error);
    return null;
  }
};

export const syncRestaurantData = async (restaurantData: any) => {
  if (!isSupabaseConfigured) return null;
  
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .upsert({
        id: restaurantData.id,
        name: restaurantData.name,
        description: restaurantData.description,
        image: restaurantData.image,
        rating: restaurantData.rating,
        cuisine_type: restaurantData.cuisine_type,
        price_range: restaurantData.price_range,
        amenities: restaurantData.amenities,
        address: restaurantData.address,
        phone: restaurantData.phone,
        website: restaurantData.website,
        hours: restaurantData.hours,
        opentable_id: restaurantData.opentable_id,
        yelp_id: restaurantData.yelp_id,
        latitude: restaurantData.latitude,
        longitude: restaurantData.longitude,
        last_updated: new Date().toISOString(),
        api_source: restaurantData.api_source || 'internal'
      })
      .select();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error syncing restaurant data:', error);
    return null;
  }
};

export const syncExperienceData = async (experienceData: any) => {
  if (!isSupabaseConfigured) return null;
  
  try {
    const { data, error } = await supabase
      .from('experiences')
      .upsert({
        id: experienceData.id,
        name: experienceData.name,
        description: experienceData.description,
        image: experienceData.image,
        rating: experienceData.rating,
        category: experienceData.category,
        duration: experienceData.duration,
        price: experienceData.price,
        amenities: experienceData.amenities,
        address: experienceData.address,
        phone: experienceData.phone,
        website: experienceData.website,
        available_times: experienceData.available_times,
        latitude: experienceData.latitude,
        longitude: experienceData.longitude,
        last_updated: new Date().toISOString(),
        api_source: experienceData.api_source || 'internal'
      })
      .select();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error syncing experience data:', error);
    return null;
  }
};

export const syncBookingData = async (bookingData: any) => {
  if (!isSupabaseConfigured) return null;
  
  try {
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        id: bookingData.id,
        user_id: bookingData.user_id,
        booking_type: bookingData.booking_type,
        item_id: bookingData.item_id,
        booking_date: bookingData.booking_date,
        booking_time: bookingData.booking_time,
        party_size: bookingData.party_size,
        status: bookingData.status || 'confirmed',
        total_price: bookingData.total_price,
        confirmation_code: bookingData.confirmation_code,
        customer_info: bookingData.customer_info,
        special_requests: bookingData.special_requests,
        api_source: bookingData.api_source,
        external_booking_id: bookingData.external_booking_id
      })
      .select();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error syncing booking data:', error);
    return null;
  }
};

// Real-time data fetching functions with improved error handling
export const fetchLiveGolfCourses = async () => {
  if (!isSupabaseConfigured) {
    console.log('Using sample golf courses data (Supabase not configured)');
    return sampleGolfCourses;
  }
  
  try {
    const { data, error } = await supabase
      .from('golf_courses')
      .select('*')
      .order('rating', { ascending: false });
    
    if (error) {
      console.warn('Error fetching golf courses from Supabase:', error.message);
      return sampleGolfCourses;
    }
    
    return data && data.length > 0 ? data : sampleGolfCourses;
  } catch (error: any) {
    console.warn('Error fetching golf courses:', error.message);
    return sampleGolfCourses;
  }
};

export const fetchLiveHotels = async () => {
  if (!isSupabaseConfigured) {
    console.log('Using sample hotels data (Supabase not configured)');
    return sampleHotels;
  }
  
  try {
    const { data, error } = await supabase
      .from('hotels')
      .select('*')
      .order('rating', { ascending: false });
    
    if (error) {
      console.warn('Error fetching hotels from Supabase:', error.message);
      return sampleHotels;
    }
    
    return data && data.length > 0 ? data : sampleHotels;
  } catch (error: any) {
    console.warn('Error fetching hotels:', error.message);
    return sampleHotels;
  }
};

export const fetchLiveRestaurants = async () => {
  if (!isSupabaseConfigured) {
    console.log('Using sample restaurants data (Supabase not configured)');
    return sampleRestaurants;
  }
  
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .order('rating', { ascending: false });
    
    if (error) {
      console.warn('Error fetching restaurants from Supabase:', error.message);
      return sampleRestaurants;
    }
    
    return data && data.length > 0 ? data : sampleRestaurants;
  } catch (error: any) {
    console.warn('Error fetching restaurants:', error.message);
    return sampleRestaurants;
  }
};

export const fetchLiveExperiences = async () => {
  if (!isSupabaseConfigured) {
    console.log('Using sample experiences data (Supabase not configured)');
    return sampleExperiences;
  }
  
  try {
    const { data, error } = await supabase
      .from('experiences')
      .select('*')
      .order('rating', { ascending: false });
    
    if (error) {
      console.warn('Error fetching experiences from Supabase:', error.message);
      return sampleExperiences;
    }
    
    return data && data.length > 0 ? data : sampleExperiences;
  } catch (error: any) {
    console.warn('Error fetching experiences:', error.message);
    return sampleExperiences;
  }
};

export const fetchLivePackages = async () => {
  if (!isSupabaseConfigured) {
    console.log('Using sample packages data (Supabase not configured)');
    return samplePackages;
  }
  
  try {
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .order('rating', { ascending: false });
    
    if (error) {
      console.warn('Error fetching packages from Supabase:', error.message);
      return samplePackages;
    }
    
    return data && data.length > 0 ? data : samplePackages;
  } catch (error: any) {
    console.warn('Error fetching packages:', error.message);
    return samplePackages;
  }
};

export const fetchUserBookings = async (userId: string) => {
  if (!isSupabaseConfigured) return [];
  
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    return [];
  }
};

// Analytics and tracking functions
export const trackUserActivity = async (userId: string, activity: string, metadata?: any) => {
  if (!isSupabaseConfigured) return null;
  
  try {
    const { data, error } = await supabase
      .from('user_activity')
      .insert({
        user_id: userId,
        activity_type: activity,
        metadata: metadata,
        timestamp: new Date().toISOString()
      });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error tracking user activity:', error);
    return null;
  }
};

export const updateItemPopularity = async (itemType: string, itemId: string, action: 'view' | 'book' | 'add_to_itinerary') => {
  if (!isSupabaseConfigured) return null;
  
  try {
    // Map actions to correct column names based on the database schema
    const columnMapping = {
      'view': 'view_count',
      'book': 'booking_count',
      'add_to_itinerary': 'itinerary_count'
    };
    
    const columnName = columnMapping[action];
    if (!columnName) {
      console.error('Invalid action for updateItemPopularity:', action);
      return null;
    }
    
    // Use upsert with proper conflict resolution
    const updateData = {
      item_type: itemType,
      item_id: itemId,
      [columnName]: 1,
      last_updated: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('item_analytics')
      .upsert(updateData, {
        onConflict: 'item_type,item_id'
      })
      .select();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating item popularity:', error);
    return null;
  }
};

// Enhanced sample data for GolfGenie AI
export const sampleGolfCourses = [
  {
    id: '1',
    name: 'TPC Myrtle Beach',
    description: 'Championship course designed by Tom Fazio with stunning ocean views and challenging play for all skill levels. Home to PGA Tour events.',
    image: 'https://images.pexels.com/photos/1325735/pexels-photo-1325735.jpeg',
    rating: 4.8,
    difficulty: 'Championship',
    holes: 18,
    yardage: 6950,
    par: 72,
    price: 189,
    amenities: ['Pro Shop', 'Driving Range', 'Putting Green', 'Cart Included', 'Restaurant', 'PGA Tour Venue'],
    address: '1199 TPC Blvd, Murrells Inlet, SC 29576',
    phone: '(843) 357-3399',
    website: 'https://tpc.com/myrtle-beach',
    available_times: ['7:00 AM', '8:30 AM', '10:00 AM', '1:30 PM', '3:00 PM'],
    latitude: 33.5707,
    longitude: -79.0728,
    created_at: new Date().toISOString(),
    api_source: 'internal'
  },
  {
    id: '2',
    name: 'Caledonia Golf & Fish Club',
    description: 'Historic plantation-style course with moss-draped oaks and pristine conditions. A true Southern golf experience.',
    image: 'https://images.pexels.com/photos/914682/pexels-photo-914682.jpeg',
    rating: 4.7,
    difficulty: 'Resort',
    holes: 18,
    yardage: 6526,
    par: 70,
    price: 159,
    amenities: ['Historic Clubhouse', 'Practice Facility', 'Caddies Available', 'Fine Dining', 'Plantation Setting'],
    address: '369 Caledonia Dr, Pawleys Island, SC 29585',
    phone: '(843) 237-3675',
    website: 'https://fishclub.com',
    available_times: ['6:30 AM', '8:00 AM', '9:30 AM', '11:00 AM', '2:00 PM'],
    latitude: 33.4321,
    longitude: -79.1234,
    created_at: new Date().toISOString(),
    api_source: 'internal'
  },
  {
    id: '3',
    name: 'Dunes Golf & Beach Club',
    description: 'Robert Trent Jones Sr. masterpiece featuring oceanfront holes and classic design. Exclusive beach club access included.',
    image: 'https://images.pexels.com/photos/1409999/pexels-photo-1409999.jpeg',
    rating: 4.6,
    difficulty: 'Championship',
    holes: 18,
    yardage: 6834,
    par: 72,
    price: 175,
    amenities: ['Ocean Views', 'Beach Club Access', 'Swimming Pool', 'Tennis Court', 'Fine Dining'],
    address: '9000 N Ocean Blvd, Myrtle Beach, SC 29572',
    phone: '(843) 449-5914',
    website: 'https://dunesgolfandbeachclub.com',
    available_times: ['6:00 AM', '7:30 AM', '9:00 AM', '12:30 PM', '2:30 PM'],
    latitude: 33.7123,
    longitude: -78.8456,
    created_at: new Date().toISOString(),
    api_source: 'internal'
  }
];

export const sampleHotels = [
  {
    id: '1',
    name: 'The Ocean House',
    description: 'Luxury oceanfront resort with world-class amenities and stunning Atlantic views. Perfect for golf getaways.',
    image: 'https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg',
    rating: 4.9,
    price_per_night: 389,
    amenities: ['Ocean Views', 'Spa', 'Fine Dining', 'Pool', 'Golf Concierge', 'Beach Access', 'Valet Parking'],
    address: '1000 N Ocean Blvd, Myrtle Beach, SC 29577',
    phone: '(843) 448-8888',
    website: 'https://oceanhouse.com',
    available_rooms: 12,
    latitude: 33.6891,
    longitude: -78.8867,
    created_at: new Date().toISOString(),
    api_source: 'internal'
  },
  {
    id: '2',
    name: 'Hampton Inn & Suites Myrtle Beach',
    description: 'Comfortable accommodation with complimentary breakfast and golf packages. Great value for golf groups.',
    image: 'https://images.pexels.com/photos/271618/pexels-photo-271618.jpeg',
    rating: 4.4,
    price_per_night: 159,
    amenities: ['Free Breakfast', 'Pool', 'Fitness Center', 'Business Center', 'Golf Packages', 'Free WiFi'],
    address: '2100 N Kings Hwy, Myrtle Beach, SC 29577',
    phone: '(843) 946-6400',
    website: 'https://hamptoninn.com',
    available_rooms: 8,
    latitude: 33.6945,
    longitude: -78.8923,
    created_at: new Date().toISOString(),
    api_source: 'internal'
  },
  {
    id: '3',
    name: 'Marriott Myrtle Beach Resort',
    description: 'Full-service resort with championship golf course and comprehensive amenities. Perfect for golf and family.',
    image: 'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg',
    rating: 4.6,
    price_per_night: 249,
    amenities: ['On-site Golf', 'Multiple Restaurants', 'Spa', 'Pool Complex', 'Tennis', 'Kids Club'],
    address: '8400 Costa Verde Dr, Myrtle Beach, SC 29572',
    phone: '(843) 449-8880',
    website: 'https://marriott.com/myrtlebeach',
    available_rooms: 15,
    latitude: 33.6234,
    longitude: -78.9012,
    created_at: new Date().toISOString(),
    api_source: 'internal'
  }
];

export const sampleRestaurants = [
  {
    id: '1',
    name: 'Sea Captain\'s House',
    description: 'Historic oceanfront dining featuring fresh seafood and Low Country specialties. A Myrtle Beach institution since 1962.',
    image: 'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg',
    rating: 4.8,
    cuisine_type: 'Seafood',
    price_range: '$$$',
    amenities: ['Ocean Views', 'Private Dining', 'Wine Cellar', 'Historic Setting', 'OpenTable'],
    address: '3002 N Ocean Blvd, Myrtle Beach, SC 29577',
    phone: '(843) 448-8082',
    website: 'https://seacaptainshouse.com',
    hours: '5:00 PM - 10:00 PM',
    opentable_id: 'ot_1',
    latitude: 33.7001,
    longitude: -78.8851,
    created_at: new Date().toISOString(),
    api_source: 'internal'
  },
  {
    id: '2',
    name: 'The Cypress Grill',
    description: 'Upscale steakhouse with premium cuts and extensive wine selection. Perfect for celebrating great golf rounds.',
    image: 'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg',
    rating: 4.7,
    cuisine_type: 'Steakhouse',
    price_range: '$$$$',
    amenities: ['Prime Steaks', 'Wine Pairing', 'Private Rooms', 'Sommelier', 'OpenTable'],
    address: '9911 N Kings Hwy, Myrtle Beach, SC 29572',
    phone: '(843) 497-0020',
    website: 'https://cypressgrill.com',
    hours: '5:30 PM - 10:30 PM',
    opentable_id: 'ot_2',
    latitude: 33.7234,
    longitude: -78.8567,
    created_at: new Date().toISOString(),
    api_source: 'internal'
  },
  {
    id: '3',
    name: 'Jimmy Buffett\'s Margaritaville',
    description: 'Tropical-themed restaurant with live music and casual beachside atmosphere. Great for groups and families.',
    image: 'https://images.pexels.com/photos/941861/pexels-photo-941861.jpeg',
    rating: 4.3,
    cuisine_type: 'American',
    price_range: '$$',
    amenities: ['Live Music', 'Outdoor Seating', 'Tropical Drinks', 'Entertainment', 'Family Friendly'],
    address: '1114 Celebrity Cir, Myrtle Beach, SC 29577',
    phone: '(843) 448-5455',
    website: 'https://margaritaville.com',
    hours: '11:00 AM - 11:00 PM',
    latitude: 33.6912,
    longitude: -78.8834,
    created_at: new Date().toISOString(),
    api_source: 'internal'
  }
];

export const sampleExperiences = [
  {
    id: '1',
    name: 'Myrtle Beach SkyWheel',
    description: 'Iconic 187-foot tall Ferris wheel offering breathtaking views of the coastline and golf courses.',
    image: 'https://images.pexels.com/photos/1386604/pexels-photo-1386604.jpeg',
    rating: 4.5,
    category: 'Attraction',
    duration: '30 minutes',
    price: 16,
    amenities: ['Climate Controlled', 'Ocean Views', 'Photo Opportunities', 'Gift Shop', 'Family Friendly'],
    address: '1110 N Ocean Blvd, Myrtle Beach, SC 29577',
    phone: '(843) 839-9200',
    website: 'https://skywheel.com',
    available_times: ['10:00 AM', '12:00 PM', '2:00 PM', '4:00 PM', '6:00 PM', '8:00 PM'],
    latitude: 33.6901,
    longitude: -78.8831,
    created_at: new Date().toISOString(),
    api_source: 'internal'
  },
  {
    id: '2',
    name: 'Deep Sea Fishing Charter',
    description: 'Full-day fishing adventure targeting marlin, tuna, and other deep-sea species. Perfect for golf groups.',
    image: 'https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg',
    rating: 4.7,
    category: 'Adventure',
    duration: '8 hours',
    price: 150,
    amenities: ['Equipment Included', 'Bait Provided', 'Fish Cleaning', 'Experienced Captain', 'Group Friendly'],
    address: '1398 21st Ave N, Myrtle Beach, SC 29577',
    phone: '(843) 626-2424',
    website: 'https://myrtlebeachfishing.com',
    available_times: ['6:00 AM', '7:00 AM'],
    latitude: 33.6823,
    longitude: -78.8745,
    created_at: new Date().toISOString(),
    api_source: 'internal'
  },
  {
    id: '3',
    name: 'Helicopter Tours',
    description: 'Scenic helicopter tours showcasing the Grand Strand and golf courses from above.',
    image: 'https://images.pexels.com/photos/723240/pexels-photo-723240.jpeg',
    rating: 4.9,
    category: 'Tours',
    duration: '20 minutes',
    price: 89,
    amenities: ['Professional Pilot', 'Safety Briefing', 'Photo Opportunities', 'Multiple Routes', 'Golf Course Views'],
    address: '1100 Jetport Rd, Myrtle Beach, SC 29577',
    phone: '(843) 497-8200',
    website: 'https://helicoptertours.com',
    available_times: ['9:00 AM', '11:00 AM', '1:00 PM', '3:00 PM', '5:00 PM'],
    latitude: 33.6789,
    longitude: -78.9234,
    created_at: new Date().toISOString(),
    api_source: 'internal'
  }
];

export const samplePackages = [
  {
    id: '1',
    name: 'Ultimate Golf Getaway',
    description: 'Complete 3-day golf experience with premium accommodations and dining. Perfect for serious golfers.',
    image: 'https://images.pexels.com/photos/1325735/pexels-photo-1325735.jpeg',
    rating: 4.8,
    duration: '3 days / 2 nights',
    price: 899,
    includes: ['2 Nights Luxury Hotel', '3 Rounds of Golf', '2 Fine Dining Experiences', 'Golf Cart & Equipment', 'Concierge Service', 'Airport Transfer'],
    golf_courses: ['TPC Myrtle Beach', 'Caledonia Golf & Fish Club'],
    hotels: ['The Ocean House'],
    restaurants: ['Sea Captain\'s House', 'The Cypress Grill'],
    experiences: [],
    created_at: new Date().toISOString(),
    api_source: 'internal'
  },
  {
    id: '2',
    name: 'Family Fun Package',
    description: 'Perfect family vacation combining golf, attractions, and beach activities for all ages.',
    image: 'https://images.pexels.com/photos/1386604/pexels-photo-1386604.jpeg',
    rating: 4.6,
    duration: '4 days / 3 nights',
    price: 1299,
    includes: ['3 Nights Hotel Stay', '2 Rounds of Golf', 'SkyWheel Tickets', 'Family Dining', 'Beach Activities', 'Kids Club Access'],
    golf_courses: ['Dunes Golf & Beach Club'],
    hotels: ['Marriott Myrtle Beach Resort'],
    restaurants: ['Jimmy Buffett\'s Margaritaville'],
    experiences: ['Myrtle Beach SkyWheel'],
    created_at: new Date().toISOString(),
    api_source: 'internal'
  },
  {
    id: '3',
    name: 'Adventure & Golf Combo',
    description: 'Thrilling combination of championship golf and exciting adventures for the ultimate experience.',
    image: 'https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg',
    rating: 4.7,
    duration: '5 days / 4 nights',
    price: 1599,
    includes: ['4 Nights Accommodation', '3 Rounds of Golf', 'Deep Sea Fishing', 'Helicopter Tour', 'All Meals', 'Adventure Gear'],
    golf_courses: ['TPC Myrtle Beach', 'Caledonia Golf & Fish Club', 'Dunes Golf & Beach Club'],
    hotels: ['The Ocean House'],
    restaurants: ['Sea Captain\'s House'],
    experiences: ['Deep Sea Fishing Charter', 'Helicopter Tours'],
    created_at: new Date().toISOString(),
    api_source: 'internal'
  }
];