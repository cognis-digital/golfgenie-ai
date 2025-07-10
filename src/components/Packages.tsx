import React, { useState, useEffect } from 'react';
import { Star, Calendar, DollarSign, Plus, Package as PackageIcon, Users, Clock, CheckCircle } from 'lucide-react';
import { Package } from '../types';
import { samplePackages } from '../lib/supabase';
import { packageAPI } from '../lib/api';

interface PackagesProps {
  onAddToItinerary: (packageItem: Package) => void;
}

const Packages: React.FC<PackagesProps> = ({ onAddToItinerary }) => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [showBooking, setShowBooking] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<string>('');
  const [partySize, setPartySize] = useState<number>(2);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    specialRequests: ''
  });
  const [filters, setFilters] = useState({
    priceRange: 'all',
    duration: 'all',
    sortBy: 'rating'
  });

  useEffect(() => {
    setPackages(samplePackages);
  }, []);

  const filteredPackages = packages
    .filter(pkg => {
      if (filters.priceRange === 'all') return true;
      if (filters.priceRange === 'budget') return pkg.price < 1000;
      if (filters.priceRange === 'mid') return pkg.price >= 1000 && pkg.price < 1500;
      if (filters.priceRange === 'luxury') return pkg.price >= 1500;
      return true;
    })
    .filter(pkg => {
      if (filters.duration === 'all') return true;
      if (filters.duration === 'short') return pkg.duration.includes('2') || pkg.duration.includes('3');
      if (filters.duration === 'medium') return pkg.duration.includes('4') || pkg.duration.includes('5');
      if (filters.duration === 'long') return pkg.duration.includes('6') || pkg.duration.includes('7');
      return true;
    })
    .sort((a, b) => {
      if (filters.sortBy === 'rating') return b.rating - a.rating;
      if (filters.sortBy === 'price') return a.price - b.price;
      if (filters.sortBy === 'name') return a.name.localeCompare(b.name);
      return 0;
    });

  const handleBookPackage = (pkg: Package) => {
    setSelectedPackage(pkg);
    setStartDate(new Date().toISOString().split('T')[0]);
    setShowBooking(true);
  };

  const confirmBooking = async () => {
    if (!selectedPackage || !startDate || !customerInfo.name || !customerInfo.email) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const booking = {
        package_id: selectedPackage.id,
        start_date: startDate,
        party_size: partySize,
        customer_info: {
          name: customerInfo.name,
          email: customerInfo.email,
          phone: customerInfo.phone
        },
        special_requests: customerInfo.specialRequests
      };

      const response = await packageAPI.bookPackage(booking);
      
      if (response.success) {
        alert(`Package booked successfully! Confirmation: ${response.confirmation_code}`);
        onAddToItinerary(selectedPackage);
        setShowBooking(false);
        setSelectedPackage(null);
        setCustomerInfo({ name: '', email: '', phone: '', specialRequests: '' });
      } else {
        alert(`Booking failed: ${response.error}`);
      }
    } catch (error) {
      alert('Error booking package. Please try again.');
    }
  };

  return (
    <div className="py-8 bg-gradient-to-br from-indigo-50 to-cyan-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Complete Golf Packages
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Carefully curated packages that combine the best golf courses, luxury accommodations, 
            fine dining, and exciting experiences for the ultimate Myrtle Beach getaway.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
              <select 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={filters.priceRange}
                onChange={(e) => setFilters({...filters, priceRange: e.target.value})}
              >
                <option value="all">All Prices</option>
                <option value="budget">Under $1,000</option>
                <option value="mid">$1,000 - $1,500</option>
                <option value="luxury">$1,500+</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
              <select 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={filters.duration}
                onChange={(e) => setFilters({...filters, duration: e.target.value})}
              >
                <option value="all">All Durations</option>
                <option value="short">2-3 Days</option>
                <option value="medium">4-5 Days</option>
                <option value="long">6+ Days</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={filters.sortBy}
                onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
              >
                <option value="rating">Rating</option>
                <option value="price">Price</option>
                <option value="name">Name</option>
              </select>
            </div>
            <div className="flex items-end">
              <div className="bg-indigo-100 text-indigo-700 px-4 py-3 rounded-lg text-sm font-medium">
                {filteredPackages.length} packages
              </div>
            </div>
          </div>
        </div>

        {/* Packages Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredPackages.map((pkg) => (
            <div key={pkg.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <div className="relative">
                <img 
                  src={pkg.image} 
                  alt={pkg.name}
                  className="w-full h-64 object-cover"
                />
                <div className="absolute top-4 left-4">
                  <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {pkg.duration}
                  </span>
                </div>
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2">
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="font-semibold text-gray-800">{pkg.rating}</span>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
                <p className="text-gray-600 mb-4 line-clamp-3">{pkg.description}</p>

                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Package Includes:</h4>
                  <div className="space-y-1">
                    {pkg.includes.slice(0, 4).map((item, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                    {pkg.includes.length > 4 && (
                      <div className="text-sm text-indigo-600 font-medium">
                        +{pkg.includes.length - 4} more inclusions
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 text-center">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-lg font-bold text-indigo-600">{pkg.golf_courses.length}</div>
                    <div className="text-xs text-gray-600">Golf Courses</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-lg font-bold text-indigo-600">{pkg.hotels.length}</div>
                    <div className="text-xs text-gray-600">Hotels</div>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-6">
                  <div className="text-3xl font-bold text-indigo-600">
                    ${pkg.price.toLocaleString()}
                    <span className="text-lg text-gray-600 font-normal">/package</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => handleBookPackage(pkg)}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Book Package</span>
                  </button>
                  <button
                    onClick={() => onAddToItinerary(pkg)}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add to Itinerary</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Package Benefits */}
        <div className="mt-16 bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Our Packages?</h2>
            <p className="text-xl text-gray-600">Save time and money with our expertly curated golf vacation packages</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-indigo-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Best Value</h3>
              <p className="text-gray-600">Save up to 30% compared to booking individually</p>
            </div>
            <div className="text-center">
              <div className="bg-indigo-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Hassle-Free</h3>
              <p className="text-gray-600">Everything planned and coordinated for you</p>
            </div>
            <div className="text-center">
              <div className="bg-indigo-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Premium Experience</h3>
              <p className="text-gray-600">Access to exclusive courses and amenities</p>
            </div>
          </div>
        </div>

        {/* Booking Modal */}
        {showBooking && selectedPackage && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Book Package</h3>
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
                    src={selectedPackage.image} 
                    alt={selectedPackage.name}
                    className="w-full h-40 object-cover rounded-lg mb-4"
                  />
                  <h4 className="text-xl font-bold text-gray-900">{selectedPackage.name}</h4>
                  <p className="text-gray-600">{selectedPackage.duration} • ${selectedPackage.price.toLocaleString()}</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      value={startDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Party Size</label>
                    <select
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                      placeholder="Your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input
                      type="email"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Special Requests</label>
                    <textarea
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      rows={3}
                      value={customerInfo.specialRequests}
                      onChange={(e) => setCustomerInfo({...customerInfo, specialRequests: e.target.value})}
                      placeholder="Customizations, preferences, etc."
                    />
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Package Price</span>
                      <span className="font-semibold">${selectedPackage.price.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Party Size</span>
                      <span className="font-semibold">x{partySize}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between items-center">
                      <span className="font-bold text-lg">Total</span>
                      <span className="font-bold text-lg text-indigo-600">
                        ${(selectedPackage.price * partySize).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={confirmBooking}
                    disabled={!startDate || !customerInfo.name || !customerInfo.email}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white py-3 px-4 rounded-lg font-semibold transition-colors duration-200"
                  >
                    Confirm Package Booking
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

export default Packages;