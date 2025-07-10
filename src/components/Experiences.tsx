import React, { useState, useEffect } from 'react';
import { Star, MapPin, Phone, Globe, Clock, DollarSign, Plus, Calendar, Map } from 'lucide-react';
import { Experience } from '../types';
import { sampleExperiences } from '../lib/supabase';
import { experienceAPI } from '../lib/api';
import MapView from './MapView';
import { sampleLocations } from '../lib/maps';

interface ExperiencesProps {
  onAddToItinerary: (experience: Experience) => void;
}

const Experiences: React.FC<ExperiencesProps> = ({ onAddToItinerary }) => {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [partySize, setPartySize] = useState<number>(2);
  const [showBooking, setShowBooking] = useState<boolean>(false);
  const [showMap, setShowMap] = useState<boolean>(false);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [isLoadingTimes, setIsLoadingTimes] = useState<boolean>(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    specialRequests: ''
  });
  const [filters, setFilters] = useState({
    category: 'all',
    priceRange: 'all',
    sortBy: 'rating'
  });

  useEffect(() => {
    setExperiences(sampleExperiences);
  }, []);

  const categories = ['all', 'attraction', 'adventure', 'tours', 'entertainment'];

  const filteredExperiences = experiences
    .filter(experience => 
      filters.category === 'all' || experience.category.toLowerCase() === filters.category
    )
    .filter(experience => {
      if (filters.priceRange === 'all') return true;
      if (filters.priceRange === 'budget') return experience.price < 50;
      if (filters.priceRange === 'mid') return experience.price >= 50 && experience.price < 100;
      if (filters.priceRange === 'premium') return experience.price >= 100;
      return true;
    })
    .sort((a, b) => {
      if (filters.sortBy === 'rating') return b.rating - a.rating;
      if (filters.sortBy === 'price') return a.price - b.price;
      if (filters.sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });

  const handleBookExperience = async (experience: Experience) => {
    setSelectedExperience(experience);
    setShowBooking(true);
    
    // Load available times
    setIsLoadingTimes(true);
    try {
      const response = await experienceAPI.getAvailability(experience.id, new Date().toISOString().split('T')[0]);
      if (response.success && response.available_times) {
        setAvailableTimes(response.available_times);
      } else {
        setAvailableTimes(experience.available_times);
      }
    } catch (error) {
      setAvailableTimes(experience.available_times);
    } finally {
      setIsLoadingTimes(false);
    }
  };

  const confirmBooking = async () => {
    if (!selectedExperience || !selectedTime || !customerInfo.name || !customerInfo.email) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const booking = {
        experience_id: selectedExperience.id,
        date: new Date().toISOString().split('T')[0],
        time: selectedTime,
        party_size: partySize,
        customer_info: {
          name: customerInfo.name,
          email: customerInfo.email,
          phone: customerInfo.phone
        },
        special_requests: customerInfo.specialRequests
      };

      const response = await experienceAPI.bookExperience(booking);
      
      if (response.success) {
        alert(`Experience booked successfully! Confirmation: ${response.confirmation_code}`);
        onAddToItinerary(selectedExperience);
        setShowBooking(false);
        setSelectedExperience(null);
        setCustomerInfo({ name: '', email: '', phone: '', specialRequests: '' });
      } else {
        alert(`Booking failed: ${response.error}`);
      }
    } catch (error) {
      alert('Error booking experience. Please try again.');
    }
  };

  const experienceLocations = Object.values(sampleLocations).filter(loc => loc.type === 'experience');

  return (
    <div className="py-8 bg-gradient-to-br from-purple-50 to-pink-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Unforgettable Experiences
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover exciting adventures, attractions, and tours that make your 
            Myrtle Beach vacation truly memorable.
          </p>
        </div>

        {/* Map Toggle */}
        <div className="mb-8 text-center">
          <button
            onClick={() => setShowMap(!showMap)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center space-x-2 mx-auto"
          >
            <Map className="h-5 w-5" />
            <span>{showMap ? 'Hide Map' : 'Show Map'}</span>
          </button>
        </div>

        {/* Map View */}
        {showMap && (
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Experience Locations</h2>
              <MapView 
                locations={experienceLocations}
                height="500px"
              />
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                value={filters.category}
                onChange={(e) => setFilters({...filters, category: e.target.value})}
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
              <select 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                value={filters.priceRange}
                onChange={(e) => setFilters({...filters, priceRange: e.target.value})}
              >
                <option value="all">All Prices</option>
                <option value="budget">Under $50</option>
                <option value="mid">$50 - $100</option>
                <option value="premium">$100+</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                value={filters.sortBy}
                onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
              >
                <option value="rating">Rating</option>
                <option value="price">Price</option>
                <option value="name">Name</option>
              </select>
            </div>
            <div className="flex items-end">
              <div className="bg-purple-100 text-purple-700 px-4 py-3 rounded-lg text-sm font-medium">
                {filteredExperiences.length} experiences
              </div>
            </div>
          </div>
        </div>

        {/* Experiences Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredExperiences.map((experience) => (
            <div key={experience.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <div className="relative">
                <img 
                  src={experience.image} 
                  alt={experience.name}
                  className="w-full h-64 object-cover"
                />
                <div className="absolute top-4 left-4">
                  <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {experience.category}
                  </span>
                </div>
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2">
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="font-semibold text-gray-800">{experience.rating}</span>
                  </div>
                </div>
                <div className="absolute bottom-4 left-4">
                  <div className="bg-white/90 backdrop-blur-sm text-gray-800 px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{experience.duration}</span>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{experience.name}</h3>
                <p className="text-gray-600 mb-4 line-clamp-3">{experience.description}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {experience.amenities.slice(0, 3).map((amenity, index) => (
                    <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs">
                      {amenity}
                    </span>
                  ))}
                  {experience.amenities.length > 3 && (
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs">
                      +{experience.amenities.length - 3} more
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="text-3xl font-bold text-purple-600">
                    ${experience.price}
                    <span className="text-lg text-gray-600 font-normal">/person</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {experience.available_times.length} times available
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => handleBookExperience(experience)}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Book Experience</span>
                  </button>
                  <button
                    onClick={() => onAddToItinerary(experience)}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add to Itinerary</span>
                  </button>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span>{experience.address}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4" />
                    <span>{experience.phone}</span>
                  </div>
                  {experience.website && (
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4" />
                      <a href={experience.website} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                        Visit Website
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Booking Modal */}
        {showBooking && selectedExperience && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Book Experience</h3>
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
                    src={selectedExperience.image} 
                    alt={selectedExperience.name}
                    className="w-full h-40 object-cover rounded-lg mb-4"
                  />
                  <h4 className="text-xl font-bold text-gray-900">{selectedExperience.name}</h4>
                  <p className="text-gray-600">${selectedExperience.price}/person • {selectedExperience.duration}</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Time</label>
                    {isLoadingTimes ? (
                      <div className="p-3 text-center text-gray-500">Loading available times...</div>
                    ) : (
                      <select
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                      >
                        <option value="">Choose a time</option>
                        {availableTimes.map((time, index) => (
                          <option key={index} value={time}>{time}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Party Size</label>
                    <select
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      value={partySize}
                      onChange={(e) => setPartySize(Number(e.target.value))}
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((size) => (
                        <option key={size} value={size}>{size} Person{size > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                    <input
                      type="text"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                      placeholder="Your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input
                      type="email"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Special Requests</label>
                    <textarea
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      rows={3}
                      value={customerInfo.specialRequests}
                      onChange={(e) => setCustomerInfo({...customerInfo, specialRequests: e.target.value})}
                      placeholder="Accessibility needs, preferences, etc."
                    />
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Price per person</span>
                      <span className="font-semibold">${selectedExperience.price}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">People</span>
                      <span className="font-semibold">x{partySize}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between items-center">
                      <span className="font-bold text-lg">Total</span>
                      <span className="font-bold text-lg text-purple-600">
                        ${selectedExperience.price * partySize}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={confirmBooking}
                    disabled={!selectedTime || !customerInfo.name || !customerInfo.email}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white py-3 px-4 rounded-lg font-semibold transition-colors duration-200"
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

export default Experiences;