import React, { useState, useEffect } from 'react';
import { Star, MapPin, Phone, Globe, Users, Wifi, Car, Coffee, Plus, Calendar, Map, ExternalLink } from 'lucide-react';
import { Hotel } from '../types';
import { sampleHotels } from '../lib/supabase';
import { hotelAPI } from '../lib/api';
import MapView from './MapView';
import { sampleLocations } from '../lib/maps';

interface HotelsProps {
  onAddToItinerary: (hotel: Hotel) => void;
}

const Hotels: React.FC<HotelsProps> = ({ onAddToItinerary }) => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [checkInDate, setCheckInDate] = useState<string>('');
  const [checkOutDate, setCheckOutDate] = useState<string>('');
  const [guests, setGuests] = useState<number>(2);
  const [showBooking, setShowBooking] = useState<boolean>(false);
  const [showMap, setShowMap] = useState<boolean>(false);
  const [availableRooms, setAvailableRooms] = useState<number>(0);
  const [isLoadingRooms, setIsLoadingRooms] = useState<boolean>(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    specialRequests: ''
  });
  const [filters, setFilters] = useState({
    priceRange: 'all',
    rating: 'all',
    sortBy: 'rating'
  });

  useEffect(() => {
    setHotels(sampleHotels);
  }, []);

  const filteredHotels = hotels
    .filter(hotel => {
      if (filters.priceRange === 'all') return true;
      if (filters.priceRange === 'budget') return hotel.price_per_night < 150;
      if (filters.priceRange === 'mid') return hotel.price_per_night >= 150 && hotel.price_per_night < 300;
      if (filters.priceRange === 'luxury') return hotel.price_per_night >= 300;
      return true;
    })
    .filter(hotel => 
      filters.rating === 'all' || hotel.rating >= Number(filters.rating)
    )
    .sort((a, b) => {
      if (filters.sortBy === 'rating') return b.rating - a.rating;
      if (filters.sortBy === 'price') return a.price_per_night - b.price_per_night;
      if (filters.sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });

  const handleBookHotel = async (hotel: Hotel) => {
    setSelectedHotel(hotel);
    setCheckInDate(new Date().toISOString().split('T')[0]);
    setCheckOutDate(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
    setShowBooking(true);
    
    // Load available rooms
    setIsLoadingRooms(true);
    try {
      const response = await hotelAPI.getAvailability(hotel.id, checkInDate, checkOutDate);
      if (response.success && response.available_rooms) {
        setAvailableRooms(response.available_rooms);
      } else {
        setAvailableRooms(hotel.available_rooms);
      }
    } catch (error) {
      setAvailableRooms(hotel.available_rooms);
    } finally {
      setIsLoadingRooms(false);
    }
  };

  const confirmBooking = async () => {
    if (!selectedHotel || !checkInDate || !checkOutDate || !customerInfo.name || !customerInfo.email) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const booking = {
        hotel_id: selectedHotel.id,
        check_in: checkInDate,
        check_out: checkOutDate,
        guests: guests,
        customer_info: {
          name: customerInfo.name,
          email: customerInfo.email,
          phone: customerInfo.phone
        },
        special_requests: customerInfo.specialRequests
      };

      const response = await hotelAPI.bookRoom(booking);
      
      if (response.success) {
        alert(`Hotel booked successfully! Confirmation: ${response.confirmation_code}`);
        onAddToItinerary(selectedHotel);
        setShowBooking(false);
        setSelectedHotel(null);
        setCustomerInfo({ name: '', email: '', phone: '', specialRequests: '' });
      } else {
        alert(`Booking failed: ${response.error}`);
      }
    } catch (error) {
      alert('Error booking hotel. Please try again.');
    }
  };

  const openBookingCom = (hotel: Hotel) => {
    // Construct Booking.com URL with hotel details
    const bookingUrl = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(hotel.address)}&checkin=${checkInDate}&checkout=${checkOutDate}&group_adults=${guests}`;
    window.open(bookingUrl, '_blank', 'noopener,noreferrer');
  };

  const handlePhoneCall = (phone: string) => {
    const cleanPhone = phone.replace(/[^\d]/g, '');
    window.location.href = `tel:+1${cleanPhone}`;
  };

  const handleWebsiteVisit = (website: string) => {
    if (website) {
      window.open(website, '_blank', 'noopener,noreferrer');
    }
  };

  const hotelLocations = Object.values(sampleLocations).filter(loc => loc.type === 'hotel');

  return (
    <div className="py-8 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Luxury Accommodations
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From oceanfront resorts to boutique hotels, find the perfect place to stay 
            during your Myrtle Beach golf getaway.
          </p>
        </div>

        {/* Map Toggle */}
        <div className="mb-8 text-center">
          <button
            onClick={() => setShowMap(!showMap)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center space-x-2 mx-auto"
          >
            <Map className="h-5 w-5" />
            <span>{showMap ? 'Hide Map' : 'Show Map'}</span>
          </button>
        </div>

        {/* Map View */}
        {showMap && (
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Hotel Locations</h2>
              <MapView 
                locations={hotelLocations}
                height="500px"
              />
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
              <select 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filters.priceRange}
                onChange={(e) => setFilters({...filters, priceRange: e.target.value})}
              >
                <option value="all">All Prices</option>
                <option value="budget">Under $150</option>
                <option value="mid">$150 - $300</option>
                <option value="luxury">$300+</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Rating</label>
              <select 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filters.sortBy}
                onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
              >
                <option value="rating">Rating</option>
                <option value="price">Price</option>
                <option value="name">Name</option>
              </select>
            </div>
            <div className="flex items-end">
              <div className="bg-blue-100 text-blue-700 px-4 py-3 rounded-lg text-sm font-medium">
                {filteredHotels.length} hotels available
              </div>
            </div>
          </div>
        </div>

        {/* Hotels Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredHotels.map((hotel) => (
            <div key={hotel.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <div className="relative">
                <img 
                  src={hotel.image} 
                  alt={hotel.name}
                  className="w-full h-64 object-cover"
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2">
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="font-semibold text-gray-800">{hotel.rating}</span>
                  </div>
                </div>
                <div className="absolute bottom-4 left-4">
                  <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {hotel.available_rooms} rooms available
                  </div>
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{hotel.name}</h3>
                <p className="text-gray-600 mb-4 line-clamp-3">{hotel.description}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {hotel.amenities.slice(0, 4).map((amenity, index) => (
                    <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs flex items-center space-x-1">
                      {amenity === 'Free Breakfast' && <Coffee className="h-3 w-3" />}
                      {amenity === 'Free Parking' && <Car className="h-3 w-3" />}
                      {amenity === 'Free WiFi' && <Wifi className="h-3 w-3" />}
                      <span>{amenity}</span>
                    </span>
                  ))}
                  {hotel.amenities.length > 4 && (
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs">
                      +{hotel.amenities.length - 4} more
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between mb-6">
                  <div className="text-3xl font-bold text-blue-600">
                    ${hotel.price_per_night}
                    <span className="text-lg text-gray-600 font-normal">/night</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => handleBookHotel(hotel)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Book Direct</span>
                  </button>
                  <button
                    onClick={() => openBookingCom(hotel)}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Book on Booking.com</span>
                  </button>
                  <button
                    onClick={() => onAddToItinerary(hotel)}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add to Itinerary</span>
                  </button>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span>{hotel.address}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4" />
                    <button 
                      onClick={() => handlePhoneCall(hotel.phone)}
                      className="text-blue-600 hover:underline"
                    >
                      {hotel.phone}
                    </button>
                  </div>
                  {hotel.website && (
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4" />
                      <button 
                        onClick={() => handleWebsiteVisit(hotel.website)}
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

        {/* Booking Modal */}
        {showBooking && selectedHotel && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Book Hotel</h3>
                  <button 
                    onClick={() => setShowBooking(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="mb-6">
                  <img 
                    src={selectedHotel.image} 
                    alt={selectedHotel.name}
                    className="w-full h-40 object-cover rounded-lg mb-4"
                  />
                  <h4 className="text-xl font-bold text-gray-900">{selectedHotel.name}</h4>
                  <p className="text-gray-600">${selectedHotel.price_per_night}/night</p>
                  {isLoadingRooms ? (
                    <p className="text-sm text-gray-500">Checking availability...</p>
                  ) : (
                    <p className="text-sm text-green-600">{availableRooms} rooms available</p>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Check-in</label>
                      <input
                        type="date"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={checkInDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setCheckInDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Check-out</label>
                      <input
                        type="date"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={checkOutDate}
                        min={checkInDate || new Date().toISOString().split('T')[0]}
                        onChange={(e) => setCheckOutDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Guests</label>
                    <select
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={guests}
                      onChange={(e) => setGuests(Number(e.target.value))}
                    >
                      {[1, 2, 3, 4, 5, 6].map((size) => (
                        <option key={size} value={size}>{size} Guest{size > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                    <input
                      type="text"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                      placeholder="Your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input
                      type="email"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Special Requests</label>
                    <textarea
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      value={customerInfo.specialRequests}
                      onChange={(e) => setCustomerInfo({...customerInfo, specialRequests: e.target.value})}
                      placeholder="Room preferences, accessibility needs, etc."
                    />
                  </div>

                  {checkInDate && checkOutDate && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600">Nights</span>
                        <span className="font-semibold">{Math.ceil((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24))}</span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600">Rate per night</span>
                        <span className="font-semibold">${selectedHotel.price_per_night}</span>
                      </div>
                      <div className="border-t pt-2 flex justify-between items-center">
                        <span className="font-bold text-lg">Total</span>
                        <span className="font-bold text-lg text-blue-600">
                          ${selectedHotel.price_per_night * Math.ceil((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24))}
                        </span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={confirmBooking}
                    disabled={!checkInDate || !checkOutDate || !customerInfo.name || !customerInfo.email}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-3 px-4 rounded-lg font-semibold transition-colors duration-200"
                  >
                    Confirm Booking
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Hotels;