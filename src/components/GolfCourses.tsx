import React, { useState, useEffect } from 'react';
import { Star, MapPin, Phone, Globe, Trophy, Users, Calendar, Plus, Map, ExternalLink, Loader, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { GolfCourse } from '../types';
import { fetchLiveGolfCourses } from '../lib/supabase';
import { syncBookingToSupabase, trackItemView, trackItineraryAdd } from '../lib/dataSync';
import { golfAPI } from '../lib/api';
import { getCurrentUser } from '../lib/auth';
import MapView from './MapView';
import { sampleLocations } from '../lib/maps';
import { getAvailableTeeTimesByDate } from '../lib/golfApi';

interface GolfCoursesProps {
  onAddToItinerary: (course: GolfCourse) => void;
}

interface TeeTime {
  id: string;
  course_id: string;
  date: string;
  time: string;
  price: number;
  available_spots: number;
  special_offer?: boolean;
  booking_url?: string;
  isReserved?: boolean;
}

const GolfCourses: React.FC<GolfCoursesProps> = ({ onAddToItinerary }) => {
  const [courses, setCourses] = useState<GolfCourse[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<GolfCourse | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [partySize, setPartySize] = useState<number>(4);
  const [showBooking, setShowBooking] = useState<boolean>(false);
  const [showMap, setShowMap] = useState<boolean>(false);
  const [availableTimes, setAvailableTimes] = useState<TeeTime[]>([]);
  const [isLoadingTimes, setIsLoadingTimes] = useState<boolean>(false);
  const [isLoadingCourses, setIsLoadingCourses] = useState<boolean>(true);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    specialRequests: ''
  });
  const [filters, setFilters] = useState({
    difficulty: 'all',
    priceRange: 'all',
    sortBy: 'rating'
  });
  const [reservedTimes, setReservedTimes] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadGolfCourses();
  }, []);

  const loadGolfCourses = async () => {
    setIsLoadingCourses(true);
    try {
      const liveData = await fetchLiveGolfCourses();
      setCourses(liveData);
    } catch (error) {
      console.error('Error loading golf courses:', error);
    } finally {
      setIsLoadingCourses(false);
    }
  };

  const filteredCourses = courses
    .filter(course => 
      filters.difficulty === 'all' || course.difficulty.toLowerCase() === filters.difficulty
    )
    .filter(course => {
      if (filters.priceRange === 'all') return true;
      if (filters.priceRange === 'budget') return course.price < 100;
      if (filters.priceRange === 'mid') return course.price >= 100 && course.price < 200;
      if (filters.priceRange === 'luxury') return course.price >= 200;
      return true;
    })
    .sort((a, b) => {
      if (filters.sortBy === 'rating') return b.rating - a.rating;
      if (filters.sortBy === 'price') return a.price - b.price;
      if (filters.sortBy === 'name') return a.name.localeCompare(b.name);
      if (filters.sortBy === 'popularity') {
        // Sort by API source priority and rating
        const aScore = (a.api_source === 'internal' ? 1000 : 0) + a.rating * 100;
        const bScore = (b.api_source === 'internal' ? 1000 : 0) + b.rating * 100;
        return bScore - aScore;
      }
      return 0;
    });

  const handleCourseView = async (course: GolfCourse) => {
    const user = await getCurrentUser();
    if (user) {
      await trackItemView(user.id, 'golf', course.id);
    }
  };

  const handleBookTeeTime = async (course: GolfCourse) => {
    await handleCourseView(course);
    setSelectedCourse(course);
    setSelectedTime('');
    setShowBooking(true);
    
    // Load available times
    await loadTeeTimes(course.id, selectedDate, partySize);
  };

  const loadTeeTimes = async (courseId: string, date: string, players: number) => {
    setIsLoadingTimes(true);
    try {
      // Get tee times from API
      const teeTimes = await getAvailableTeeTimesByDate(courseId, date, players);
      setAvailableTimes(teeTimes);
      
      // Get reserved times from API
      const response = await golfAPI.getReservedTimes(courseId, date);
      
      if (response.success && response.reserved_times) {
        // Create a map of reserved times
        const reservedMap: Record<string, boolean> = {};
        response.reserved_times.forEach(time => {
          reservedMap[time] = true;
        });
        setReservedTimes(reservedMap);
        
        // Mark tee times as reserved
        const updatedTeeTimes = teeTimes.map(teeTime => ({
          ...teeTime,
          isReserved: reservedMap[teeTime.time] || false,
          available_spots: reservedMap[teeTime.time] ? 0 : teeTime.available_spots
        }));
        
        setAvailableTimes(updatedTeeTimes);
      }
    } catch (error) {
      console.error('Error loading tee times:', error);
      // Fallback to course available times
      if (selectedCourse) {
        const mockTeeTimes = (selectedCourse.available_times || []).map(time => ({
          id: `mock_${time.replace(/\s/g, '')}`,
          course_id: courseId,
          date: date,
          time: time,
          price: selectedCourse.price,
          available_spots: 4,
          special_offer: false
        }));
        setAvailableTimes(mockTeeTimes);
      }
    } finally {
      setIsLoadingTimes(false);
    }
  };

  const handleDateChange = async (date: string) => {
    setSelectedDate(date);
    setSelectedTime('');
    
    if (selectedCourse) {
      await loadTeeTimes(selectedCourse.id, date, partySize);
    }
  };

  const confirmBooking = async () => {
    if (!selectedCourse || !selectedTime || !customerInfo.name || !customerInfo.email) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const user = await getCurrentUser();
      const booking = {
        course_id: selectedCourse.id,
        date: selectedDate,
        time: selectedTime,
        party_size: partySize,
        customer_info: {
          name: customerInfo.name,
          email: customerInfo.email,
          phone: customerInfo.phone
        },
        special_requests: customerInfo.specialRequests
      };

      const response = await golfAPI.bookTeeTime(booking);
      
      if (response.success) {
        // Sync booking to Supabase
        if (user) {
          await syncBookingToSupabase({
            booking_id: response.booking_id,
            user_id: user.id,
            type: 'golf',
            item_id: selectedCourse.id,
            date: booking.date,
            time: booking.time,
            party_size: partySize,
            total_price: selectedCourse.price * partySize,
            confirmation_code: response.confirmation_code,
            customer_info: booking.customer_info,
            special_requests: booking.special_requests,
            api_source: 'internal'
          });
        }

        // Update reserved times
        setReservedTimes(prev => ({
          ...prev,
          [selectedTime]: true
        }));

        alert(`Tee time booked successfully! Confirmation: ${response.confirmation_code}`);
        onAddToItinerary(selectedCourse);
        setShowBooking(false);
        setSelectedCourse(null);
        setCustomerInfo({ name: '', email: '', phone: '', specialRequests: '' });
      } else {
        alert(`Booking failed: ${response.error}`);
      }
    } catch (error) {
      alert('Error booking tee time. Please try again.');
    }
  };

  const handleAddToItinerary = async (course: GolfCourse) => {
    const user = await getCurrentUser();
    if (user) {
      await trackItineraryAdd(user.id, 'golf', course.id);
    }
    onAddToItinerary(course);
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

  const getApiSourceBadge = (apiSource: string) => {
    const badges = {
      'internal': { color: 'bg-emerald-100 text-emerald-800', label: 'Verified' },
      'yelp': { color: 'bg-red-100 text-red-800', label: 'Yelp' },
      'google': { color: 'bg-blue-100 text-blue-800', label: 'Google' },
      'external': { color: 'bg-gray-100 text-gray-800', label: 'Partner' }
    };
    
    const badge = badges[apiSource] || badges['external'];
    return (
      <span className={`${badge.color} px-2 py-1 rounded-full text-xs font-medium`}>
        {badge.label}
      </span>
    );
  };

  const golfLocations = Object.values(sampleLocations).filter(loc => loc.type === 'golf');

  if (isLoadingCourses) {
    return (
      <div className="py-8 bg-gradient-to-br from-emerald-50 to-blue-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Loader className="h-12 w-12 text-emerald-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading golf courses from multiple sources...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 bg-gradient-to-br from-emerald-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Championship Golf Courses
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover world-class golf courses with stunning ocean views, 
            challenging layouts, and premium amenities. Updated in real-time from multiple sources.
          </p>
          <div className="mt-4 flex justify-center space-x-4">
            <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm">
              ✓ Real-time Data
            </span>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              📊 Live Availability
            </span>
            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
              🔄 Auto-sync
            </span>
          </div>
        </div>

        {/* Map Toggle */}
        <div className="mb-8 text-center">
          <button
            onClick={() => setShowMap(!showMap)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center space-x-2 mx-auto"
          >
            <Map className="h-5 w-5" />
            <span>{showMap ? 'Hide Map' : 'Show Map'}</span>
          </button>
        </div>

        {/* Map View */}
        {showMap && (
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Golf Course Locations</h2>
              <MapView 
                locations={golfLocations}
                height="500px"
              />
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
              <select 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                value={filters.difficulty}
                onChange={(e) => setFilters({...filters, difficulty: e.target.value})}
              >
                <option value="all">All Levels</option>
                <option value="resort">Resort</option>
                <option value="championship">Championship</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
              <select 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                value={filters.priceRange}
                onChange={(e) => setFilters({...filters, priceRange: e.target.value})}
              >
                <option value="all">All Prices</option>
                <option value="budget">Under $100</option>
                <option value="mid">$100 - $200</option>
                <option value="luxury">$200+</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                value={filters.sortBy}
                onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
              >
                <option value="rating">Rating</option>
                <option value="price">Price</option>
                <option value="name">Name</option>
                <option value="popularity">Popularity</option>
              </select>
            </div>
            <div className="flex items-end">
              <div className="bg-emerald-100 text-emerald-700 px-4 py-3 rounded-lg text-sm font-medium">
                {filteredCourses.length} courses available
              </div>
            </div>
          </div>
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredCourses.map((course) => (
            <div key={course.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <div className="relative">
                <img 
                  src={course.image} 
                  alt={course.name}
                  className="w-full h-64 object-cover"
                />
                <div className="absolute top-4 left-4 flex space-x-2">
                  <span className="bg-emerald-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {course.difficulty}
                  </span>
                  {getApiSourceBadge(course.api_source || 'internal')}
                </div>
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2">
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="font-semibold text-gray-800">{course.rating}</span>
                  </div>
                </div>
                {course.api_source !== 'internal' && (
                  <div className="absolute bottom-4 right-4">
                    <div className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                      <TrendingUp className="h-3 w-3" />
                      <span>Live Data</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{course.name}</h3>
                <p className="text-gray-600 mb-4 line-clamp-2">{course.description}</p>

                <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-emerald-600">{course.holes}</div>
                    <div className="text-sm text-gray-600">Holes</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-emerald-600">{course.par}</div>
                    <div className="text-sm text-gray-600">Par</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-emerald-600">{course.yardage?.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Yards</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {course.amenities?.slice(0, 3).map((amenity, index) => (
                    <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs">
                      {amenity}
                    </span>
                  ))}
                  {course.amenities && course.amenities.length > 3 && (
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs">
                      +{course.amenities.length - 3} more
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="text-3xl font-bold text-emerald-600">
                    ${course.price}
                    <span className="text-lg text-gray-600 font-normal">/round</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {course.available_times?.length || 0} times available
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => handleBookTeeTime(course)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Book Tee Time</span>
                  </button>
                  <button
                    onClick={() => handleAddToItinerary(course)}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add to Itinerary</span>
                  </button>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span>{course.address}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4" />
                    <button 
                      onClick={() => handlePhoneCall(course.phone)}
                      className="text-blue-600 hover:underline"
                    >
                      {course.phone}
                    </button>
                  </div>
                  {course.website && (
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4" />
                      <button 
                        onClick={() => handleWebsiteVisit(course.website)}
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
        {showBooking && selectedCourse && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Book Tee Time</h3>
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
                    src={selectedCourse.image} 
                    alt={selectedCourse.name}
                    className="w-full h-40 object-cover rounded-lg mb-4"
                  />
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xl font-bold text-gray-900">{selectedCourse.name}</h4>
                      <p className="text-gray-600">${selectedCourse.price}/round</p>
                    </div>
                    {getApiSourceBadge(selectedCourse.api_source || 'internal')}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
                    <input
                      type="date"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      value={selectedDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => handleDateChange(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Time</label>
                    {isLoadingTimes ? (
                      <div className="p-3 text-center text-gray-500">
                        <Loader className="h-6 w-6 animate-spin mx-auto mb-2" />
                        Loading available times...
                      </div>
                    ) : availableTimes.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {availableTimes.map((teeTime) => (
                          <button
                            key={teeTime.id}
                            onClick={() => setSelectedTime(teeTime.time)}
                            disabled={teeTime.isReserved || teeTime.available_spots < partySize}
                            className={`p-2 rounded-lg text-center text-sm ${
                              selectedTime === teeTime.time
                                ? 'bg-emerald-600 text-white'
                                : teeTime.isReserved
                                  ? 'bg-red-100 text-red-800 cursor-not-allowed'
                                  : teeTime.available_spots < partySize
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : teeTime.special_offer
                                      ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                            }`}
                          >
                            <div className="flex flex-col items-center">
                              <span className="font-medium">{teeTime.time}</span>
                              {teeTime.isReserved ? (
                                <span className="flex items-center text-xs mt-1">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Reserved
                                </span>
                              ) : teeTime.available_spots < partySize ? (
                                <span className="text-xs mt-1">Not enough spots</span>
                              ) : (
                                <span className="text-xs mt-1">${teeTime.price}</span>
                              )}
                              {teeTime.special_offer && !teeTime.isReserved && teeTime.available_spots >= partySize && (
                                <span className="bg-amber-500 text-white text-xs px-1 rounded mt-1">Special</span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-center text-red-800">
                        <AlertCircle className="h-5 w-5 mx-auto mb-2" />
                        <p>No tee times available for this date</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Party Size</label>
                    <select
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      value={partySize}
                      onChange={(e) => {
                        const newSize = Number(e.target.value);
                        setPartySize(newSize);
                        // Reload tee times if course is selected
                        if (selectedCourse) {
                          loadTeeTimes(selectedCourse.id, selectedDate, newSize);
                        }
                      }}
                    >
                      {[1, 2, 3, 4].map((size) => (
                        <option key={size} value={size}>{size} Player{size > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                    <input
                      type="text"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                      placeholder="Your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input
                      type="email"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Special Requests</label>
                    <textarea
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      rows={3}
                      value={customerInfo.specialRequests}
                      onChange={(e) => setCustomerInfo({...customerInfo, specialRequests: e.target.value})}
                      placeholder="Cart preferences, accessibility needs, etc."
                    />
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Green Fee</span>
                      <span className="font-semibold">${selectedCourse.price}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Players</span>
                      <span className="font-semibold">x{partySize}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between items-center">
                      <span className="font-bold text-lg">Total</span>
                      <span className="font-bold text-lg text-emerald-600">
                        ${selectedCourse.price * partySize}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={confirmBooking}
                    disabled={!selectedTime || !customerInfo.name || !customerInfo.email}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white py-3 px-4 rounded-lg font-semibold transition-colors duration-200"
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

export default GolfCourses;