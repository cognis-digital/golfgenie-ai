import React, { useState, useEffect } from 'react';
import { Star, User, ThumbsUp, Calendar, MapPin, Trophy, Filter, Search, TrendingUp } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface Review {
  id: string;
  user_name: string;
  user_avatar?: string;
  item_type: 'golf' | 'hotel' | 'restaurant' | 'experience' | 'package';
  item_id: string;
  item_name: string;
  rating: number;
  title: string;
  content: string;
  helpful_count: number;
  verified_booking: boolean;
  created_at: string;
  photos?: string[];
}

const Reviews: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: 'all',
    rating: 'all',
    sortBy: 'recent'
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadReviews();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [reviews, filters, searchTerm]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would fetch from Supabase
      // For now, we'll use mock data
      const mockReviews = generateMockReviews();
      setReviews(mockReviews);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...reviews];

    // Filter by type
    if (filters.type !== 'all') {
      filtered = filtered.filter(review => review.item_type === filters.type);
    }

    // Filter by rating
    if (filters.rating !== 'all') {
      const minRating = parseInt(filters.rating);
      filtered = filtered.filter(review => review.rating >= minRating);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(review => 
        review.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'helpful':
          return b.helpful_count - a.helpful_count;
        case 'recent':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    setFilteredReviews(filtered);
  };

  const generateMockReviews = (): Review[] => [
    {
      id: '1',
      user_name: 'Michael Johnson',
      user_avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?w=100',
      item_type: 'golf',
      item_id: '1',
      item_name: 'TPC Myrtle Beach',
      rating: 5,
      title: 'Absolutely Incredible Championship Experience',
      content: 'TPC Myrtle Beach exceeded all expectations! The course conditions were pristine, the staff was incredibly professional, and the ocean views from several holes were breathtaking. The signature 18th hole is a masterpiece. Worth every penny for a once-in-a-lifetime golf experience.',
      helpful_count: 24,
      verified_booking: true,
      created_at: '2024-01-15T10:30:00Z',
      photos: ['https://images.pexels.com/photos/1325735/pexels-photo-1325735.jpeg']
    },
    {
      id: '2',
      user_name: 'Sarah Williams',
      user_avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?w=100',
      item_type: 'hotel',
      item_id: '1',
      item_name: 'The Ocean House',
      rating: 5,
      title: 'Luxury Oceanfront Paradise',
      content: 'The Ocean House is pure luxury! Our oceanfront suite had stunning views, the spa was world-class, and the golf concierge helped us book amazing tee times. The breakfast was exceptional and the staff went above and beyond. Perfect for a romantic golf getaway.',
      helpful_count: 18,
      verified_booking: true,
      created_at: '2024-01-12T14:20:00Z'
    },
    {
      id: '3',
      user_name: 'David Chen',
      user_avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?w=100',
      item_type: 'restaurant',
      item_id: '1',
      item_name: 'Sea Captain\'s House',
      rating: 5,
      title: 'Historic Charm with Outstanding Seafood',
      content: 'Sea Captain\'s House is a Myrtle Beach institution! The historic atmosphere, oceanfront location, and fresh seafood were incredible. The she-crab soup and grouper were perfection. Service was attentive and the sunset views made it magical. A must-visit!',
      helpful_count: 15,
      verified_booking: true,
      created_at: '2024-01-10T19:45:00Z'
    },
    {
      id: '4',
      user_name: 'Jennifer Martinez',
      user_avatar: 'https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?w=100',
      item_type: 'experience',
      item_id: '1',
      item_name: 'Myrtle Beach SkyWheel',
      rating: 4,
      title: 'Great Views and Family Fun',
      content: 'The SkyWheel offers amazing panoramic views of the coastline! Perfect for families and couples. The climate-controlled gondolas were comfortable and the 30-minute experience was just right. Great photo opportunities and a nice break from golf.',
      helpful_count: 12,
      verified_booking: true,
      created_at: '2024-01-08T16:15:00Z'
    },
    {
      id: '5',
      user_name: 'Robert Thompson',
      user_avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?w=100',
      item_type: 'golf',
      item_id: '2',
      item_name: 'Caledonia Golf & Fish Club',
      rating: 5,
      title: 'Historic Beauty and Challenging Play',
      content: 'Caledonia is a masterpiece! The historic plantation setting with moss-draped oaks creates an unforgettable atmosphere. The course is challenging but fair, with immaculate conditions. The clubhouse and dining exceeded expectations. A true gem of Myrtle Beach golf.',
      helpful_count: 21,
      verified_booking: true,
      created_at: '2024-01-05T11:00:00Z'
    },
    {
      id: '6',
      user_name: 'Lisa Anderson',
      user_avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?w=100',
      item_type: 'package',
      item_id: '1',
      item_name: 'Ultimate Golf Getaway',
      rating: 5,
      title: 'Perfect Golf Vacation Package',
      content: 'This package was incredible value! Three rounds at top courses, luxury hotel, amazing dinners, and seamless coordination. GolfGenie AI made everything effortless. The AI recommendations were spot-on and saved us so much planning time. Highly recommend!',
      helpful_count: 28,
      verified_booking: true,
      created_at: '2024-01-03T09:30:00Z'
    }
  ];

  const getItemTypeIcon = (type: string) => {
    switch (type) {
      case 'golf': return <Trophy className="h-4 w-4 text-emerald-600" />;
      case 'hotel': return <MapPin className="h-4 w-4 text-blue-600" />;
      case 'restaurant': return <Star className="h-4 w-4 text-amber-600" />;
      case 'experience': return <Calendar className="h-4 w-4 text-purple-600" />;
      case 'package': return <TrendingUp className="h-4 w-4 text-indigo-600" />;
      default: return <Star className="h-4 w-4 text-gray-600" />;
    }
  };

  const getItemTypeColor = (type: string) => {
    switch (type) {
      case 'golf': return 'bg-emerald-100 text-emerald-800';
      case 'hotel': return 'bg-blue-100 text-blue-800';
      case 'restaurant': return 'bg-amber-100 text-amber-800';
      case 'experience': return 'bg-purple-100 text-purple-800';
      case 'package': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="py-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading reviews...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-2xl">
              <Star className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
              Guest Reviews
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Real experiences from real golfers. Discover what makes Myrtle Beach 
            the ultimate golf destination through authentic guest reviews.
          </p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filters.type}
                onChange={(e) => setFilters({...filters, type: e.target.value})}
              >
                <option value="all">All Categories</option>
                <option value="golf">Golf Courses</option>
                <option value="hotel">Hotels</option>
                <option value="restaurant">Restaurants</option>
                <option value="experience">Experiences</option>
                <option value="package">Packages</option>
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
                <option value="5">5 Stars Only</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filters.sortBy}
                onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
              >
                <option value="recent">Most Recent</option>
                <option value="rating">Highest Rated</option>
                <option value="helpful">Most Helpful</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search reviews..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            Showing {filteredReviews.length} of {reviews.length} reviews
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="space-y-6">
          {filteredReviews.map((review) => (
            <div key={review.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-start space-x-4">
                {/* User Avatar */}
                <div className="flex-shrink-0">
                  {review.user_avatar ? (
                    <img
                      src={review.user_avatar}
                      alt={review.user_name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-gray-600" />
                    </div>
                  )}
                </div>

                {/* Review Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{review.user_name}</h3>
                        {review.verified_booking && (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                            Verified Booking
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {renderStars(review.rating)}
                        <span className="text-sm text-gray-500">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getItemTypeIcon(review.item_type)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getItemTypeColor(review.item_type)}`}>
                        {review.item_type.charAt(0).toUpperCase() + review.item_type.slice(1)}
                      </span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <h4 className="font-semibold text-gray-900 mb-1">{review.item_name}</h4>
                    <h5 className="font-medium text-gray-800 mb-2">{review.title}</h5>
                    <p className="text-gray-600 leading-relaxed">{review.content}</p>
                  </div>

                  {review.photos && review.photos.length > 0 && (
                    <div className="mb-4">
                      <div className="flex space-x-2">
                        {review.photos.map((photo, index) => (
                          <img
                            key={index}
                            src={photo}
                            alt={`Review photo ${index + 1}`}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-600 transition-colors">
                      <ThumbsUp className="h-4 w-4" />
                      <span className="text-sm">Helpful ({review.helpful_count})</span>
                    </button>
                    <div className="text-sm text-gray-500">
                      {review.rating}/5 stars
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredReviews.length === 0 && (
          <div className="text-center py-12">
            <Star className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No reviews found</h3>
            <p className="text-gray-600">Try adjusting your filters or search terms.</p>
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Share Your Golf Experience</h2>
          <p className="text-xl mb-6 text-blue-100">
            Help fellow golfers discover amazing experiences in Myrtle Beach
          </p>
          <button className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold transition-colors duration-200">
            Write a Review
          </button>
        </div>
      </div>
    </div>
  );
};

export default Reviews;