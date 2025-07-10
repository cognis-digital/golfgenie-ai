import React from 'react';
import { Star, MapPin, Trophy, Camera, Sunrise, Sunset, Users, Calendar, ArrowRight } from 'lucide-react';

interface InspirationProps {
  onNavigate: (section: string) => void;
}

const Inspiration: React.FC<InspirationProps> = ({ onNavigate }) => {
  const destinations = [
    {
      id: 'oceanfront',
      title: 'Oceanfront Golf Paradise',
      description: 'Wake up to ocean views and play championship courses with the Atlantic as your backdrop',
      image: 'https://images.pexels.com/photos/1325735/pexels-photo-1325735.jpeg',
      highlights: ['Ocean views from every hole', 'Luxury oceanfront resorts', 'Fresh seafood dining'],
      courses: ['Dunes Golf & Beach Club', 'TPC Myrtle Beach'],
      rating: 4.9,
      duration: '3-4 days'
    },
    {
      id: 'championship',
      title: 'Championship Course Collection',
      description: 'Play where the pros play on world-renowned championship layouts',
      image: 'https://images.pexels.com/photos/914682/pexels-photo-914682.jpeg',
      highlights: ['PGA Tour venues', 'Signature hole experiences', 'Pro shop exclusives'],
      courses: ['TPC Myrtle Beach', 'Caledonia Golf & Fish Club'],
      rating: 4.8,
      duration: '4-5 days'
    },
    {
      id: 'family',
      title: 'Family Golf Adventure',
      description: 'Perfect blend of golf and family fun with activities for everyone',
      image: 'https://images.pexels.com/photos/1386604/pexels-photo-1386604.jpeg',
      highlights: ['Family-friendly courses', 'Kids activities', 'Group dining options'],
      courses: ['Resort courses', 'Executive layouts'],
      rating: 4.7,
      duration: '4-6 days'
    },
    {
      id: 'luxury',
      title: 'Ultimate Luxury Experience',
      description: 'Indulge in the finest golf, dining, and accommodations Myrtle Beach offers',
      image: 'https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg',
      highlights: ['5-star resorts', 'Private dining', 'Concierge services'],
      courses: ['Exclusive private clubs', 'Premium resort courses'],
      rating: 5.0,
      duration: '5-7 days'
    }
  ];

  const experiences = [
    {
      icon: Sunrise,
      title: 'Sunrise Golf',
      description: 'Start your day with an early morning round as the sun rises over the Atlantic',
      time: '6:00 AM - 10:00 AM'
    },
    {
      icon: Trophy,
      title: 'Tournament Play',
      description: 'Experience tournament-style golf on championship courses',
      time: 'All day events'
    },
    {
      icon: Users,
      title: 'Group Outings',
      description: 'Perfect for corporate events, bachelor parties, and golf buddy trips',
      time: 'Customizable'
    },
    {
      icon: Sunset,
      title: 'Sunset Dining',
      description: 'End your golf day with oceanfront dining and spectacular sunsets',
      time: '6:00 PM - 9:00 PM'
    }
  ];

  const seasonalHighlights = [
    {
      season: 'Spring',
      months: 'March - May',
      highlights: ['Perfect weather', 'Azalea blooms', 'Mild temperatures'],
      color: 'green'
    },
    {
      season: 'Summer',
      months: 'June - August',
      highlights: ['Long days', 'Beach activities', 'Family fun'],
      color: 'blue'
    },
    {
      season: 'Fall',
      months: 'September - November',
      highlights: ['Ideal conditions', 'Lower rates', 'Comfortable weather'],
      color: 'amber'
    },
    {
      season: 'Winter',
      months: 'December - February',
      highlights: ['Escape the cold', 'Best deals', 'Peaceful courses'],
      color: 'purple'
    }
  ];

  return (
    <div className="py-8 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-2xl">
              <Camera className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
              Golf Inspiration
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover the magic of Myrtle Beach golf through curated experiences, 
            stunning destinations, and unforgettable moments that await you.
          </p>
        </div>

        {/* Featured Destinations */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Featured Golf Destinations</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {destinations.map((destination) => (
              <div key={destination.id} className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                <div className="relative h-64">
                  <img 
                    src={destination.image} 
                    alt={destination.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="font-semibold text-gray-800">{destination.rating}</span>
                    </div>
                  </div>
                  <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {destination.duration}
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{destination.title}</h3>
                  <p className="text-gray-600 mb-4 leading-relaxed">{destination.description}</p>
                  
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Highlights:</h4>
                    <div className="flex flex-wrap gap-2">
                      {destination.highlights.map((highlight, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                          {highlight}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-2">Featured Courses:</h4>
                    <div className="space-y-1">
                      {destination.courses.map((course, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                          <Trophy className="h-3 w-3 text-emerald-600" />
                          <span>{course}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => onNavigate('assistant')}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    <span>Plan This Experience</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Golf Experiences */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Signature Golf Experiences</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {experiences.map((experience, index) => {
              const Icon = experience.icon;
              return (
                <div key={index} className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-center">
                  <div className="bg-gradient-to-br from-blue-400 to-purple-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{experience.title}</h3>
                  <p className="text-gray-600 mb-3 leading-relaxed">{experience.description}</p>
                  <div className="text-sm text-blue-600 font-medium">{experience.time}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Seasonal Guide */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Best Times to Visit</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {seasonalHighlights.map((season, index) => (
              <div key={index} className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                <div className={`w-12 h-12 bg-gradient-to-br from-${season.color}-400 to-${season.color}-600 rounded-xl flex items-center justify-center mb-4`}>
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{season.season}</h3>
                <p className="text-gray-600 mb-3 font-medium">{season.months}</p>
                <div className="space-y-2">
                  {season.highlights.map((highlight, highlightIndex) => (
                    <div key={highlightIndex} className="flex items-center space-x-2 text-sm text-gray-600">
                      <div className={`w-2 h-2 bg-${season.color}-500 rounded-full`}></div>
                      <span>{highlight}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 md:p-12 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Create Your Golf Story?</h2>
          <p className="text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
            Let our AI genie turn your golf dreams into reality with personalized recommendations 
            and seamless booking experiences.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => onNavigate('assistant')}
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105"
            >
              Start Planning with AI
            </button>
            <button
              onClick={() => onNavigate('packages')}
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 border border-white/30"
            >
              Browse Packages
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inspiration;