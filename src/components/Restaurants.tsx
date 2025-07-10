import React, { useState, useEffect } from 'react';
import { Star, MapPin, Phone, Globe, Clock, DollarSign, Plus, Calendar, Users, Map, Menu, ExternalLink, Shield, Timer } from 'lucide-react';
import { Restaurant } from '../types';
import { sampleRestaurants } from '../lib/supabase';
import { restaurantAPI } from '../lib/api';
import { makeReservation, getRestaurantAvailability, generateOpenTableURL, createSlotLock, deleteSlotLock, SlotLockResponse } from '../lib/opentable';
import { searchRestaurants as searchYelpRestaurants } from '../lib/yelp';
import MapView from './MapView';
import { sampleLocations } from '../lib/maps';
import MenuModal from './MenuModal';

interface RestaurantsProps {
  onAddToItinerary: (restaurant: Restaurant) => void;
}

const Restaurants: React.FC<RestaurantsProps> = ({ onAddToItinerary }) => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [partySize, setPartySize] = useState<number>(2);
  const [showReservation, setShowReservation] = useState<boolean>(false);
  const [showMap, setShowMap] = useState<boolean>(false);
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [isLoadingTimes, setIsLoadingTimes] = useState<boolean>(false);
  const [isBooking, setIsBooking] = useState<boolean>(false);
  const [slotLock, setSlotLock] = useState<SlotLockResponse | null>(null);
  const [slotExpiry, setSlotExpiry] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    specialRequests: ''
  });
  const [filters, setFilters] = useState({
    cuisine: 'all',
    priceRange: 'all',
    rating: 'all',
    sortBy: 'rating'
  });

  useEffect(() => {
    setRestaurants(sampleRestaurants);
  }, []);

  // Timer effect for slot lock countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (slotExpiry) {
      interval = setInterval(() => {
        const now = new Date().getTime();
        const expiry = slotExpiry.getTime();
        const remaining = Math.max(0, expiry - now);
        
        setTimeRemaining(remaining);
        
        if (remaining === 0) {
          // Slot expired
          setSlotLock(null);
          setSlotExpiry(null);
          alert('Your reservation slot has expired. Please select a new time.');
        }
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [slotExpiry]);

  const cuisineTypes = ['all', 'seafood', 'steakhouse', 'american', 'italian', 'asian'];

  const filteredRestaurants = restaurants
    .filter(restaurant => 
      filters.cuisine === 'all' || restaurant.cuisine_type.toLowerCase() === filters.cuisine
    )
    .filter(restaurant => 
      filters.priceRange === 'all' || restaurant.price_range === filters.priceRange
    )
    .filter(restaurant => 
      filters.rating === 'all' || restaurant.rating >= Number(filters.rating)
    )
    .sort((a, b) => {
      if (filters.sortBy === 'rating') return b.rating - a.rating;
      if (filters.sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });

  const handleMakeReservation = async (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setSelectedDate(new Date().toISOString().split('T')[0]);
    setShowReservation(true);
    
    // Load available times using OpenTable API
    setIsLoadingTimes(true);
    try {
      const availability = await getRestaurantAvailability(
        restaurant.opentable_id || restaurant.id, 
        selectedDate || new Date().toISOString().split('T')[0],
        partySize
      );
      
      const availableSlots = availability
        .filter(slot => slot.available && slot.party_size_limit >= partySize)
        .map(slot => slot.time);
      
      setAvailableTimes(availableSlots);
    } catch (error) {
      console.error('Error loading availability:', error);
      // Fallback times
      setAvailableTimes(['5:30 PM', '6:00 PM', '7:30 PM', '8:00 PM', '9:00 PM']);
    } finally {
      setIsLoadingTimes(false);
    }
  };

  const createReservationSlotLock = async () => {
    if (!selectedRestaurant || !selectedTime || !selectedDate) return;

    try {
      const slotLockData = {
        party_size: partySize,
        date_time: `${selectedDate}T${convertTo24Hour(selectedTime)}`,
        reservation_attribute: 'default'
      };

      const lockResponse = await createSlotLock(
        selectedRestaurant.opentable_id || selectedRestaurant.id,
        slotLockData
      );

      if (lockResponse) {
        setSlotLock(lockResponse);
        setSlotExpiry(new Date(lockResponse.expires_at));
        return lockResponse;
      }
    } catch (error) {
      console.error('Error creating slot lock:', error);
    }
    return null;
  };

  const confirmReservation = async () => {
    if (!selectedRestaurant || !selectedTime || !customerInfo.name || !customerInfo.email) {
      alert('Please fill in all required fields');
      return;
    }

    setIsBooking(true);
    
    try {
      // Create slot lock if we don't have one
      let currentSlotLock = slotLock;
      if (!currentSlotLock) {
        currentSlotLock = await createReservationSlotLock();
        if (!currentSlotLock) {
          alert('Unable to secure reservation slot. Please try again.');
          setIsBooking(false);
          return;
        }
      }

      const reservationData = {
        restaurant_id: selectedRestaurant.opentable_id || selectedRestaurant.id,
        date: selectedDate,
        time: selectedTime,
        party_size: partySize,
        customer_info: {
          name: customerInfo.name,
          email: customerInfo.email,
          phone: customerInfo.phone
        },
        special_requests: customerInfo.specialRequests,
        reservation_token: currentSlotLock.reservation_token
      };

      const response = await makeReservation(reservationData);
      
      if (response.success) {
        alert(`Reservation confirmed! Confirmation: ${response.confirmation_id}`);
        onAddToItinerary(selectedRestaurant);
        setShowReservation(false);
        setSelectedRestaurant(null);
        setSlotLock(null);
        setSlotExpiry(null);
        setCustomerInfo({ name: '', email: '', phone: '', specialRequests: '' });
      } else {
        if (response.slot_expired) {
          setSlotLock(null);
          setSlotExpiry(null);
        }
        
        // If API booking fails, redirect to OpenTable
        if (response.opentable_url) {
          const confirmRedirect = confirm(
            `${response.error || 'Booking through our system failed.'}\n\nWould you like to continue booking on OpenTable?`
          );
          if (confirmRedirect) {
            window.open(response.opentable_url, '_blank', 'noopener,noreferrer');
          }
        } else {
          alert(`Reservation failed: ${response.error}`);
        }
      }
    } catch (error) {
      console.error('Reservation error:', error);
      alert('Error making reservation. Please try calling the restaurant directly.');
    } finally {
      setIsBooking(false);
    }
  };

  const cancelReservation = async () => {
    if (slotLock && selectedRestaurant) {
      await deleteSlotLock(
        selectedRestaurant.opentable_id || selectedRestaurant.id,
        slotLock.reservation_token
      );
    }
    
    setShowReservation(false);
    setSelectedRestaurant(null);
    setSlotLock(null);
    setSlotExpiry(null);
    setCustomerInfo({ name: '', email: '', phone: '', specialRequests: '' });
  };

  const openOpenTable = (restaurant: Restaurant) => {
    const openTableUrl = generateOpenTableURL({
      restaurant_id: restaurant.opentable_id || restaurant.id,
      date: selectedDate || new Date().toISOString().split('T')[0],
      time: selectedTime || '7:00 PM',
      party_size: partySize,
      customer_info: { name: '', email: '', phone: '' }
    });
    window.open(openTableUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCallToReserve = (phone: string) => {
    // Create tel: link for phone calls
    const cleanPhone = phone.replace(/[^\d]/g, '');
    window.location.href = `tel:+1${cleanPhone}`;
  };

  const handleViewMenu = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setShowMenu(true);
  };

  const handleWebsiteVisit = (website: string) => {
    if (website) {
      window.open(website, '_blank', 'noopener,noreferrer');
    }
  };

  const getPriceRangeSymbol = (range: string) => {
    switch (range) {
      case '$': return '$';
      case '$$': return '$$';
      case '$$$': return '$$$';
      case '$$$$': return '$$$$';
      default: return range;
    }
  };

  const convertTo24Hour = (time12h: string): string => {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    
    if (hours === '12') {
      hours = '00';
    }
    
    if (modifier === 'PM') {
      hours = (parseInt(hours, 10) + 12).toString();
    }
    
    return `${hours.padStart(2, '0')}:${minutes}`;
  };

  const formatTimeRemaining = (milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const restaurantLocations = Object.values(sampleLocations).filter(loc => loc.type === 'restaurant');

  return (
    <div className="py-8 bg-gradient-to-br from-amber-50 to-orange-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Exceptional Dining
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From fresh seafood to fine steakhouses, discover the best culinary experiences 
            Myrtle Beach has to offer. Book your table through OpenTable integration with secure slot locks.
          </p>
          <div className="mt-4 flex justify-center space-x-4">
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center space-x-1">
              <Shield className="h-3 w-3" />
              <span>OpenTable Integration</span>
            </span>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center space-x-1">
              <Timer className="h-3 w-3" />
              <span>5-Minute Slot Locks</span>
            </span>
            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
              ✓ Digital Menus
            </span>
          </div>
        </div>

        {/* Map Toggle */}
        <div className="mb-8 text-center">
          <button
            onClick={() => setShowMap(!showMap)}
            className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center space-x-2 mx-auto"
          >
            <Map className="h-5 w-5" />
            <span>{showMap ? 'Hide Map' : 'Show Map'}</span>
          </button>
        </div>

        {/* Map View */}
        {showMap && (
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Restaurant Locations</h2>
              <MapView 
                locations={restaurantLocations}
                height="500px"
              />
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cuisine Type</label>
              <select 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                value={filters.cuisine}
                onChange={(e) => setFilters({...filters, cuisine: e.target.value})}
              >
                {cuisineTypes.map(cuisine => (
                  <option key={cuisine} value={cuisine}>
                    {cuisine === 'all' ? 'All Cuisines' : cuisine.charAt(0).toUpperCase() + cuisine.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
              <select 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                value={filters.priceRange}
                onChange={(e) => setFilters({...filters, priceRange: e.target.value})}
              >
                <option value="all">All Prices</option>
                <option value="$">$ - Budget</option>
                <option value="$$">$$ - Moderate</option>
                <option value="$$$">$$$ - Upscale</option>
                <option value="$$$$">$$$$ - Fine Dining</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Rating</label>
              <select 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                value={filters.rating}
                onChange={(e) => setFilters({...filters, rating: e.target.value})}
              >
                <option value="all">All Ratings</option>
                <option value="4">4+ Stars</option>
                <option value="4.5">4.5+ Stars</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                value={filters.sortBy}
                onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
              >
                <option value="rating">Rating</option>
                <option value="name">Name</option>
              </select>
            </div>
            <div className="flex items-end">
              <div className="bg-amber-100 text-amber-700 px-4 py-3 rounded-lg text-sm font-medium">
                {filteredRestaurants.length} restaurants
              </div>
            </div>
          </div>
        </div>

        {/* Restaurants Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredRestaurants.map((restaurant) => (
            <div key={restaurant.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <div className="relative">
                <img 
                  src={restaurant.image} 
                  alt={restaurant.name}
                  className="w-full h-64 object-cover"
                />
                <div className="absolute top-4 left-4">
                  <span className="bg-amber-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {restaurant.cuisine_type}
                  </span>
                </div>
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2">
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="font-semibold text-gray-800">{restaurant.rating}</span>
                  </div>
                </div>
                <div className="absolute bottom-4 left-4">
                  <div className="bg-white/90 backdrop-blur-sm text-gray-800 px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                    <DollarSign className="h-3 w-3" />
                    <span>{getPriceRangeSymbol(restaurant.price_range)}</span>
                  </div>
                </div>
                {restaurant.opentable_id && (
                  <div className="absolute bottom-4 right-4">
                    <div className="bg-green-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                      <Shield className="h-3 w-3" />
                      <span>OpenTable</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{restaurant.name}</h3>
                <p className="text-gray-600 mb-4 line-clamp-3">{restaurant.description}</p>

                <div className="flex items-center space-x-4 mb-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{restaurant.hours}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {restaurant.amenities.slice(0, 3).map((amenity, index) => (
                    <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs">
                      {amenity}
                    </span>
                  ))}
                  {restaurant.amenities.length > 3 && (
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs">
                      +{restaurant.amenities.length - 3} more
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => handleViewMenu(restaurant)}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    <Menu className="h-4 w-4" />
                    <span>View Menu</span>
                  </button>
                  
                  {restaurant.opentable_id ? (
                    <>
                      <button
                        onClick={() => handleMakeReservation(restaurant)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2"
                      >
                        <Shield className="h-4 w-4" />
                        <span>Reserve with Slot Lock</span>
                      </button>
                      <button
                        onClick={() => openOpenTable(restaurant)}
                        className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span>Book on OpenTable</span>
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => handleCallToReserve(restaurant.phone)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2"
                    >
                      <Phone className="h-4 w-4" />
                      <span>Call to Reserve</span>
                    </button>
                  )}
                  
                  <button
                    onClick={() => onAddToItinerary(restaurant)}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add to Itinerary</span>
                  </button>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span>{restaurant.address}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4" />
                    <button 
                      onClick={() => handleCallToReserve(restaurant.phone)}
                      className="text-blue-600 hover:underline"
                    >
                      {restaurant.phone}
                    </button>
                  </div>
                  {restaurant.website && (
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4" />
                      <button 
                        onClick={() => handleWebsiteVisit(restaurant.website)}
                        className="text-blue-600 hover:underline flex items-center space-x-1"
                      >
                        <span>Visit Website</span>
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Enhanced Reservation Modal with Slot Lock */}
        {showReservation && selectedRestaurant && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Make Reservation</h3>
                  <button 
                    onClick={cancelReservation}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Slot Lock Status */}
                {slotLock && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Shield className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-800">Slot Secured</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Timer className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-700">
                        Time remaining: {formatTimeRemaining(timeRemaining)}
                      </span>
                    </div>
                    <p className="text-xs text-green-600 mt-1">
                      Your table is reserved for 5 minutes while you complete your booking.
                    </p>
                  </div>
                )}

                <div className="mb-6">
                  <img 
                    src={selectedRestaurant.image} 
                    alt={selectedRestaurant.name}
                    className="w-full h-40 object-cover rounded-lg mb-4"
                  />
                  <h4 className="text-xl font-bold text-gray-900">{selectedRestaurant.name}</h4>
                  <p className="text-gray-600">{selectedRestaurant.cuisine_type} • {selectedRestaurant.price_range}</p>
                  {selectedRestaurant.opentable_id && (
                    <div className="mt-2">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 w-fit">
                        <Shield className="h-3 w-3" />
                        <span>OpenTable Partner</span>
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                      <input
                        type="date"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        value={selectedDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        disabled={!!slotLock}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Party Size</label>
                      <select
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        value={partySize}
                        onChange={(e) => setPartySize(Number(e.target.value))}
                        disabled={!!slotLock}
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((size) => (
                          <option key={size} value={size}>{size} Person{size > 1 ? 's' : ''}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Available Times</label>
                    {isLoadingTimes ? (
                      <div className="p-3 text-center text-gray-500">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto mb-2"></div>
                        Loading available times...
                      </div>
                    ) : (
                      <select
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                        disabled={!!slotLock}
                      >
                        <option value="">Select a time</option>
                        {availableTimes.map((time, index) => (
                          <option key={index} value={time}>{time}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  {!slotLock && selectedTime && (
                    <button
                      onClick={createReservationSlotLock}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2"
                    >
                      <Shield className="h-4 w-4" />
                      <span>Secure This Time Slot</span>
                    </button>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                    <input
                      type="text"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                      placeholder="Your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input
                      type="email"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Special Requests</label>
                    <textarea
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      rows={3}
                      value={customerInfo.specialRequests}
                      onChange={(e) => setCustomerInfo({...customerInfo, specialRequests: e.target.value})}
                      placeholder="Allergies, seating preferences, etc."
                    />
                  </div>

                  <button
                    onClick={confirmReservation}
                    disabled={!slotLock || !customerInfo.name || !customerInfo.email || isBooking}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-3 px-4 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    {isBooking ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Booking...</span>
                      </>
                    ) : (
                      <>
                        <Calendar className="h-4 w-4" />
                        <span>Confirm Reservation</span>
                      </>
                    )}
                  </button>

                  {selectedRestaurant.opentable_id && (
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-2">Or book directly on OpenTable</p>
                      <button
                        onClick={() => openOpenTable(selectedRestaurant)}
                        className="text-green-600 hover:text-green-700 text-sm font-medium"
                      >
                        Open in OpenTable →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Menu Modal */}
        {showMenu && selectedRestaurant && (
          <MenuModal
            restaurant={selectedRestaurant}
            isOpen={showMenu}
            onClose={() => setShowMenu(false)}
          />
        )}
      </div>
    </div>
  );
};

export default Restaurants;