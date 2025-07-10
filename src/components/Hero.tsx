import React, { useState } from 'react';
import { Calendar, MapPin, Star, Users, Trophy, Compass, Package, Utensils, ArrowRight, Play, Zap, Bot, Search, CalendarDays, UserPlus } from 'lucide-react';
import BookingFilters from './BookingFilters';

interface HeroProps {
  onNavigate: (section: string) => void;
}

const Hero: React.FC<HeroProps> = ({ onNavigate }) => {
  const [bookingData, setBookingData] = useState({
    dates: { start: '', end: '', flexible: false },
    golfers: 2,
    rounds: 2
  });

  const features = [
    {
      icon: Bot,
      title: 'AI-Powered Planning',
      description: 'Smart recommendations tailored to your preferences',
      color: 'emerald'
    },
    {
      icon: Calendar,
      title: 'Real-Time Booking',
      description: 'Instant tee times and reservations',
      color: 'blue'
    },
    {
      icon: MapPin,
      title: 'Local Expertise',
      description: 'Insider knowledge from golf professionals',
      color: 'amber'
    },
    {
      icon: Users,
      title: 'Group-Friendly',
      description: 'Perfect for golf buddies and corporate events',
      color: 'rose'
    }
  ];

  const quickActions = [
    { label: 'Explore Golf Courses', action: () => onNavigate('golf'), icon: Trophy, description: 'Discover championship courses' },
    { label: 'Find Luxury Hotels', action: () => onNavigate('hotels'), icon: MapPin, description: 'Oceanfront accommodations' },
    { label: 'Reserve Fine Dining', action: () => onNavigate('restaurants'), icon: Utensils, description: 'Award-winning restaurants' },
    { label: 'Book Experiences', action: () => onNavigate('experiences'), icon: Compass, description: 'Unforgettable adventures' },
    { label: 'View Packages', action: () => onNavigate('packages'), icon: Package, description: 'Complete vacation deals' },
    { label: 'AI Trip Planner', action: () => onNavigate('assistant'), icon: Bot, description: 'Personalized recommendations' }
  ];

  const handlePlanTrip = () => {
    console.log('Planning trip with:', bookingData);
    onNavigate('assistant');
  };

  return (
    <div className="relative">
      {/* Hero Section with Ocean Golf Course Background */}
      <div 
        className="relative h-[600px] sm:h-[700px] lg:h-[800px] bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.5)), url(https://images.pexels.com/photos/1325735/pexels-photo-1325735.jpeg)'
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center px-4">
          <div className="text-center text-white max-w-6xl">
            <div className="mb-6">
              <span className="inline-block bg-emerald-500/20 backdrop-blur-sm text-emerald-300 px-4 py-2 rounded-full text-sm md:text-base font-semibold">
                🏆 America's #1 Golf Destination • 🤖 AI-Powered • ✨ Free Service
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-bold mb-6 leading-tight">
              <span className="block bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                GolfGenie AI
              </span>
              <span className="block text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-gray-200 mt-2">
                Your Myrtle Beach Golf Genie
              </span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl mb-8 text-gray-200 leading-relaxed max-w-4xl mx-auto px-4">
              Let our AI genie plan your perfect Myrtle Beach golf vacation. Free personalized recommendations, 
              instant bookings, and insider access to 100+ championship courses.
            </p>

            {/* Booking Filters */}
            <div className="mb-8">
              <BookingFilters 
                bookingData={bookingData}
                onBookingDataChange={setBookingData}
                onPlanTrip={handlePlanTrip}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
              <button
                onClick={handlePlanTrip}
                className="group bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl flex items-center justify-center space-x-2 touch-target"
              >
                <Bot className="h-5 w-5" />
                <span>Start AI Planning</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => onNavigate('inspiration')}
                className="group bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 border border-white/30 flex items-center justify-center space-x-2 touch-target"
              >
                <Star className="h-5 w-5" />
                <span>Get Inspired</span>
                <Play className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Features Section */}
      <div className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="bg-gradient-to-r from-emerald-500 to-blue-500 p-3 rounded-2xl">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
                Why Choose GolfGenie AI?
              </h2>
            </div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-4">
              Our AI-powered platform combines cutting-edge technology with local expertise to create 
              the perfect Myrtle Beach golf experience, completely free of charge.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index}
                  className="group bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-3 border border-gray-100"
                >
                  <div className={`w-16 h-16 bg-gradient-to-br from-${feature.color}-400 to-${feature.color}-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="py-16 md:py-24 bg-gradient-to-br from-emerald-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Start Planning Your Perfect Trip
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto px-4">
              Everything you need for an unforgettable golf vacation, all in one place
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  onClick={action.action}
                  className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 text-left w-full border border-gray-100 touch-target"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg flex-shrink-0">
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-emerald-600 transition-colors duration-300 mb-2">
                        {action.label}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {action.description}
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all duration-300 flex-shrink-0 mt-1" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 md:py-24 bg-gradient-to-r from-emerald-600 to-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Trusted by Golf Enthusiasts Worldwide
            </h2>
            <p className="text-emerald-100 text-lg max-w-2xl mx-auto px-4">
              Join thousands of golfers who have discovered their perfect Myrtle Beach experience with GolfGenie AI
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 text-center text-white">
            <div className="group">
              <div className="text-4xl md:text-6xl font-bold mb-2 group-hover:scale-110 transition-transform duration-300">100+</div>
              <div className="text-emerald-200 text-lg font-medium">Championship Courses</div>
            </div>
            <div className="group">
              <div className="text-4xl md:text-6xl font-bold mb-2 group-hover:scale-110 transition-transform duration-300">50+</div>
              <div className="text-emerald-200 text-lg font-medium">Luxury Resorts</div>
            </div>
            <div className="group">
              <div className="text-4xl md:text-6xl font-bold mb-2 group-hover:scale-110 transition-transform duration-300">200+</div>
              <div className="text-emerald-200 text-lg font-medium">Fine Restaurants</div>
            </div>
            <div className="group">
              <div className="text-4xl md:text-6xl font-bold mb-2 group-hover:scale-110 transition-transform duration-300">25+</div>
              <div className="text-emerald-200 text-lg font-medium">Unique Experiences</div>
            </div>
            <div className="group">
              <div className="text-4xl md:text-6xl font-bold mb-2 group-hover:scale-110 transition-transform duration-300">50K+</div>
              <div className="text-emerald-200 text-lg font-medium">Happy Golfers</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;