import React, { useState } from 'react';
import { Zap, Calendar, Users, DollarSign, MapPin, Trophy, Building, Utensils, Compass, Car } from 'lucide-react';
import TripPlanningForm, { TripFormData } from './TripPlanningForm';
import AIGolfConcierge from './AIGolfConcierge';

interface TripPlannerProps {
  onUpdateItinerary?: (itinerary: any) => void;
}

const TripPlanner: React.FC<TripPlannerProps> = ({ onUpdateItinerary }) => {
  const [tripData, setTripData] = useState<TripFormData | undefined>();
  const [showConcierge, setShowConcierge] = useState(false);

  const handleFormSubmit = (formData: TripFormData) => {
    setTripData(formData);
    setShowConcierge(true);
  };

  return (
    <div className="py-8 bg-gradient-to-br from-emerald-50 to-blue-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="bg-gradient-to-r from-emerald-500 to-blue-500 p-3 rounded-2xl">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
              AI Trip Planner
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Tell us about your dream golf vacation, and our AI will create a personalized itinerary 
            with tee times, accommodations, dining, and activities.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Planning Form */}
          <div className={`${showConcierge ? 'lg:col-span-5' : 'lg:col-span-12'}`}>
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-600 to-blue-600 p-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-white/20 p-2 rounded-lg">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Trip Details</h2>
                    <p className="text-emerald-100 text-sm">Tell us about your perfect golf getaway</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <TripPlanningForm onSubmit={handleFormSubmit} />
              </div>
            </div>

            {/* Planning Features */}
            {!showConcierge && (
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <div className="flex items-start space-x-3">
                    <div className="bg-emerald-100 p-2 rounded-lg">
                      <Trophy className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">Expert Golf Recommendations</h3>
                      <p className="text-sm text-gray-600">Get personalized course suggestions based on your skill level and preferences</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <div className="flex items-start space-x-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Building className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">Perfect Accommodations</h3>
                      <p className="text-sm text-gray-600">Find the ideal place to stay with real-time availability checking</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <div className="flex items-start space-x-3">
                    <div className="bg-amber-100 p-2 rounded-lg">
                      <Utensils className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">Dining Reservations</h3>
                      <p className="text-sm text-gray-600">Secure tables at top restaurants with OpenTable integration</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-md">
                  <div className="flex items-start space-x-3">
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <Compass className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">Local Experiences</h3>
                      <p className="text-sm text-gray-600">Discover activities and attractions to enhance your golf vacation</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* AI Concierge */}
          {showConcierge && (
            <div className="lg:col-span-7">
              <AIGolfConcierge 
                initialTripData={tripData} 
                onUpdateItinerary={onUpdateItinerary}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TripPlanner;