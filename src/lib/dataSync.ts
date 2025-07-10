import { supabase, isSupabaseConfigured, syncGolfCourseData, syncHotelData, syncRestaurantData, syncExperienceData, syncBookingData, trackUserActivity, updateItemPopularity } from './supabase';
import { searchBusinesses as searchYelp, getBusinessDetails as getYelpDetails } from './yelp';
import { searchRestaurants as searchOpenTableRestaurants, getRestaurantDetails as getOpenTableDetails } from './opentable';
import { golfAPI, hotelAPI, restaurantAPI, experienceAPI } from './api';

// Data synchronization manager
export class DataSyncManager {
  private syncInterval: NodeJS.Timeout | null = null;
  private lastSyncTime: Date | null = null;

  constructor() {
    // Don't start automatic sync in constructor - let it be manually triggered
    // this.startPeriodicSync();
  }

  // Check if current user is an admin
  private async isAdminUser(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !user.email) {
        return false;
      }
      
      // Check if user has admin email domain
      return user.email.includes('@mbg.com') || user.email.includes('@mbg');
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  // Start periodic data synchronization (only for admin users)
  async startPeriodicSync(intervalMinutes: number = 30) {
    const isAdmin = await this.isAdminUser();
    if (!isAdmin) {
      console.log('Data sync requires admin privileges - skipping automatic sync');
      return;
    }

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      this.performFullSync();
    }, intervalMinutes * 60 * 1000);

    // Perform initial sync
    this.performFullSync();
  }

  // Stop periodic synchronization
  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Perform full data synchronization (admin only)
  async performFullSync() {
    if (!isSupabaseConfigured) {
      console.log('Supabase not configured - skipping data sync');
      return;
    }

    // Check if user is admin before proceeding
    const isAdmin = await this.isAdminUser();
    if (!isAdmin) {
      console.log('Data sync requires admin privileges - user not authorized');
      return;
    }

    console.log('🔄 Starting data synchronization...');
    this.lastSyncTime = new Date();

    try {
      await Promise.all([
        this.syncYelpData(),
        this.syncOpenTableData(),
        this.syncGoogleMapsData(),
        this.updateAnalytics()
      ]);

      console.log('✅ Data synchronization completed successfully');
    } catch (error) {
      console.error('❌ Data synchronization failed:', error);
    }
  }

  // Sync data from Yelp API (admin only)
  async syncYelpData() {
    const isAdmin = await this.isAdminUser();
    if (!isAdmin) {
      console.log('Yelp data sync requires admin privileges');
      return;
    }

    try {
      console.log('📊 Syncing Yelp data...');
      
      // Search for restaurants
      const restaurants = await searchYelp({
        location: 'Myrtle Beach, SC',
        categories: 'restaurants',
        limit: 50,
        sort_by: 'rating'
      });

      // Search for golf courses
      const golfCourses = await searchYelp({
        location: 'Myrtle Beach, SC',
        categories: 'golf',
        limit: 30,
        sort_by: 'rating'
      });

      // Search for hotels
      const hotels = await searchYelp({
        location: 'Myrtle Beach, SC',
        categories: 'hotels',
        limit: 40,
        sort_by: 'rating'
      });

      // Search for attractions
      const attractions = await searchYelp({
        location: 'Myrtle Beach, SC',
        categories: 'tours,amusementparks,museums',
        limit: 25,
        sort_by: 'rating'
      });

      // Sync restaurants to database
      for (const restaurant of restaurants) {
        const restaurantData = {
          id: `yelp_${restaurant.id}`,
          name: restaurant.name,
          description: restaurant.categories.map(c => c.title).join(', '),
          image: restaurant.image_url,
          rating: restaurant.rating,
          cuisine_type: restaurant.categories[0]?.title || 'Restaurant',
          price_range: restaurant.price || '$$',
          amenities: restaurant.transactions || [],
          address: restaurant.location.display_address.join(', '),
          phone: restaurant.display_phone,
          website: restaurant.url,
          hours: 'Check Yelp for hours',
          yelp_id: restaurant.id,
          latitude: restaurant.coordinates?.latitude,
          longitude: restaurant.coordinates?.longitude,
          api_source: 'yelp'
        };

        await syncRestaurantData(restaurantData);
      }

      // Sync golf courses to database
      for (const course of golfCourses) {
        const courseData = {
          id: `yelp_${course.id}`,
          name: course.name,
          description: `${course.categories.map(c => c.title).join(', ')} - ${course.review_count} reviews`,
          image: course.image_url,
          rating: course.rating,
          difficulty: 'Resort',
          holes: 18,
          yardage: 6500,
          par: 72,
          price: course.price === '$$$$' ? 200 : course.price === '$$$' ? 150 : course.price === '$$' ? 100 : 75,
          amenities: ['Pro Shop', 'Driving Range'],
          address: course.location.display_address.join(', '),
          phone: course.display_phone,
          website: course.url,
          available_times: ['7:00 AM', '9:00 AM', '11:00 AM', '1:00 PM', '3:00 PM'],
          latitude: course.coordinates?.latitude,
          longitude: course.coordinates?.longitude,
          api_source: 'yelp'
        };

        await syncGolfCourseData(courseData);
      }

      // Sync hotels to database
      for (const hotel of hotels) {
        const hotelData = {
          id: `yelp_${hotel.id}`,
          name: hotel.name,
          description: `${hotel.categories.map(c => c.title).join(', ')} - ${hotel.review_count} reviews`,
          image: hotel.image_url,
          rating: hotel.rating,
          price_per_night: hotel.price === '$$$$' ? 300 : hotel.price === '$$$' ? 200 : hotel.price === '$$' ? 120 : 80,
          amenities: hotel.transactions || [],
          address: hotel.location.display_address.join(', '),
          phone: hotel.display_phone,
          website: hotel.url,
          available_rooms: Math.floor(Math.random() * 20) + 5,
          latitude: hotel.coordinates?.latitude,
          longitude: hotel.coordinates?.longitude,
          api_source: 'yelp'
        };

        await syncHotelData(hotelData);
      }

      // Sync experiences to database
      for (const attraction of attractions) {
        const experienceData = {
          id: `yelp_${attraction.id}`,
          name: attraction.name,
          description: `${attraction.categories.map(c => c.title).join(', ')} - ${attraction.review_count} reviews`,
          image: attraction.image_url,
          rating: attraction.rating,
          category: attraction.categories[0]?.title || 'Attraction',
          duration: '2 hours',
          price: attraction.price === '$$$$' ? 75 : attraction.price === '$$$' ? 50 : attraction.price === '$$' ? 25 : 15,
          amenities: ['Family Friendly', 'Photo Opportunities'],
          address: attraction.location.display_address.join(', '),
          phone: attraction.display_phone,
          website: attraction.url,
          available_times: ['10:00 AM', '12:00 PM', '2:00 PM', '4:00 PM'],
          latitude: attraction.coordinates?.latitude,
          longitude: attraction.coordinates?.longitude,
          api_source: 'yelp'
        };

        await syncExperienceData(experienceData);
      }

      console.log('✅ Yelp data sync completed');
    } catch (error) {
      console.error('❌ Yelp data sync failed:', error);
    }
  }

  // Sync data from OpenTable API (admin only)
  async syncOpenTableData() {
    const isAdmin = await this.isAdminUser();
    if (!isAdmin) {
      console.log('OpenTable data sync requires admin privileges');
      return;
    }

    try {
      console.log('🍽️ Syncing OpenTable data...');
      
      const openTableRestaurants = await searchOpenTableRestaurants(
        'Myrtle Beach, SC',
        new Date().toISOString().split('T')[0],
        2
      );

      for (const restaurant of openTableRestaurants) {
        const restaurantData = {
          id: `opentable_${restaurant.id}`,
          name: restaurant.name,
          description: `${restaurant.cuisine} restaurant with OpenTable reservations`,
          image: restaurant.image_url,
          rating: restaurant.rating,
          cuisine_type: restaurant.cuisine,
          price_range: '$'.repeat(restaurant.price_range),
          amenities: ['OpenTable Reservations', 'Online Booking'],
          address: restaurant.address,
          phone: restaurant.phone,
          website: restaurant.opentable_url,
          hours: 'Check OpenTable for hours',
          opentable_id: restaurant.id,
          latitude: restaurant.location.latitude,
          longitude: restaurant.location.longitude,
          api_source: 'opentable'
        };

        await syncRestaurantData(restaurantData);
      }

      console.log('✅ OpenTable data sync completed');
    } catch (error) {
      console.error('❌ OpenTable data sync failed:', error);
    }
  }

  // Sync data from Google Maps API (admin only)
  async syncGoogleMapsData() {
    const isAdmin = await this.isAdminUser();
    if (!isAdmin) {
      console.log('Google Maps data sync requires admin privileges');
      return;
    }

    try {
      console.log('🗺️ Syncing Google Maps data...');
      
      // This would integrate with Google Places API to get updated business information
      // For now, we'll update location coordinates and details for existing businesses
      
      const { data: restaurants } = await supabase
        .from('restaurants')
        .select('*')
        .is('latitude', null);

      // Update missing coordinates for restaurants
      for (const restaurant of restaurants || []) {
        // In a real implementation, you would geocode the address
        const mockCoordinates = {
          latitude: 33.6891 + (Math.random() - 0.5) * 0.1,
          longitude: -78.8867 + (Math.random() - 0.5) * 0.1
        };

        await supabase
          .from('restaurants')
          .update(mockCoordinates)
          .eq('id', restaurant.id);
      }

      console.log('✅ Google Maps data sync completed');
    } catch (error) {
      console.error('❌ Google Maps data sync failed:', error);
    }
  }

  // Update analytics and popularity metrics (admin only)
  async updateAnalytics() {
    const isAdmin = await this.isAdminUser();
    if (!isAdmin) {
      console.log('Analytics update requires admin privileges');
      return;
    }

    try {
      console.log('📈 Updating analytics...');
      
      // Update item popularity based on recent activity
      const { data: activities } = await supabase
        .from('user_activity')
        .select('*')
        .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const popularityUpdates = new Map();

      for (const activity of activities || []) {
        if (activity.metadata?.item_id && activity.metadata?.item_type) {
          const key = `${activity.metadata.item_type}_${activity.metadata.item_id}`;
          if (!popularityUpdates.has(key)) {
            popularityUpdates.set(key, { views: 0, bookings: 0, itinerary_adds: 0 });
          }

          const stats = popularityUpdates.get(key);
          if (activity.activity_type === 'view_item') stats.views++;
          if (activity.activity_type === 'book_item') stats.bookings++;
          if (activity.activity_type === 'add_to_itinerary') stats.itinerary_adds++;
        }
      }

      // Update popularity scores
      for (const [key, stats] of popularityUpdates) {
        const [itemType, itemId] = key.split('_', 2);
        const popularityScore = stats.views + (stats.bookings * 5) + (stats.itinerary_adds * 2);

        await supabase
          .from('item_analytics')
          .upsert({
            item_type: itemType,
            item_id: itemId,
            view_count: stats.views,
            booking_count: stats.bookings,
            itinerary_count: stats.itinerary_adds,
            popularity_score: popularityScore,
            last_updated: new Date().toISOString()
          });
      }

      console.log('✅ Analytics update completed');
    } catch (error) {
      console.error('❌ Analytics update failed:', error);
    }
  }

  // Get sync status
  getSyncStatus() {
    return {
      isRunning: this.syncInterval !== null,
      lastSyncTime: this.lastSyncTime,
      nextSyncTime: this.syncInterval ? new Date(Date.now() + 30 * 60 * 1000) : null
    };
  }

  // Manual sync trigger for admin users
  async triggerManualSync() {
    const isAdmin = await this.isAdminUser();
    if (!isAdmin) {
      throw new Error('Data sync requires admin privileges');
    }
    
    return this.performFullSync();
  }
}

// Real-time data hooks for React components
export const useRealTimeData = (tableName: string, filters?: any) => {
  const [data, setData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let query = supabase.from(tableName).select('*');
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    // Initial data fetch
    query.then(({ data, error }) => {
      if (error) {
        setError(error);
      } else {
        setData(data || []);
      }
      setLoading(false);
    });

    // Set up real-time subscription
    const subscription = supabase
      .channel(`${tableName}_changes`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: tableName },
        (payload) => {
          console.log(`Real-time update for ${tableName}:`, payload);
          
          if (payload.eventType === 'INSERT') {
            setData(prev => [...prev, payload.new]);
          } else if (payload.eventType === 'UPDATE') {
            setData(prev => prev.map(item => 
              item.id === payload.new.id ? payload.new : item
            ));
          } else if (payload.eventType === 'DELETE') {
            setData(prev => prev.filter(item => item.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [tableName, JSON.stringify(filters)]);

  return { data, loading, error };
};

// Booking synchronization functions
export const syncBookingToSupabase = async (bookingData: any) => {
  if (!isSupabaseConfigured) return null;

  try {
    const booking = {
      id: bookingData.booking_id || `booking_${Date.now()}`,
      user_id: bookingData.user_id,
      booking_type: bookingData.type, // 'golf', 'hotel', 'restaurant', 'experience', 'package'
      item_id: bookingData.item_id,
      booking_date: bookingData.date,
      booking_time: bookingData.time,
      party_size: bookingData.party_size,
      status: 'confirmed',
      total_price: bookingData.total_price,
      confirmation_code: bookingData.confirmation_code,
      customer_info: bookingData.customer_info,
      special_requests: bookingData.special_requests,
      api_source: bookingData.api_source,
      external_booking_id: bookingData.external_booking_id
    };

    const result = await syncBookingData(booking);
    
    // Track booking activity
    if (bookingData.user_id) {
      await trackUserActivity(bookingData.user_id, 'book_item', {
        item_type: bookingData.type,
        item_id: bookingData.item_id,
        booking_id: booking.id
      });

      await updateItemPopularity(bookingData.type, bookingData.item_id, 'book');
    }

    return result;
  } catch (error) {
    console.error('Error syncing booking to Supabase:', error);
    return null;
  }
};

// Activity tracking functions
export const trackItemView = async (userId: string, itemType: string, itemId: string) => {
  if (userId) {
    await trackUserActivity(userId, 'view_item', {
      item_type: itemType,
      item_id: itemId
    });
    await updateItemPopularity(itemType, itemId, 'view');
  }
};

export const trackItineraryAdd = async (userId: string, itemType: string, itemId: string) => {
  if (userId) {
    await trackUserActivity(userId, 'add_to_itinerary', {
      item_type: itemType,
      item_id: itemId
    });
    await updateItemPopularity(itemType, itemId, 'add_to_itinerary');
  }
};

// Initialize data sync manager (but don't auto-start sync)
export const dataSyncManager = new DataSyncManager();

// Export React hook
import React from 'react';