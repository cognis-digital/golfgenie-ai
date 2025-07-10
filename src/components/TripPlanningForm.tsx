import React, { useState } from 'react';
import { Calendar, Users, DollarSign, MapPin, Trophy, Building, Utensils, Compass, Car, Zap } from 'lucide-react';
import { addDays, format } from 'date-fns';
import { supabase } from '../lib/supabase';
import { useNavigateToSection } from '../hooks/useNavigateToSection';

interface TripPlanningFormProps {
  onSubmit: (formData: TripFormData) => void;
}

export interface TripFormData {
  tripDates: {
    startDate: string;
    endDate: string;
    flexible: boolean;
  };
  golfers: {
    count: number;
    skillLevels: string[];
  };
  destination: string;
  budget: {
    min: number;
    max: number;
    currency: string;
  };
  golfExperience: string;
  accommodation: {
    type: string;
    preferences: string[];
  };
  activities: string[];
  dining: {
    preferences: string[];
    priceRange: string;
  };
  transportation: {
    needsRental: boolean;
    type: string;
  };
  specialRequests: string;
}

const TripPlanningForm: React.FC<TripPlanningFormProps> = ({ onSubmit }) => {
  const navigateToSection = useNavigateToSection();
  const today = new Date();
  const defaultStartDate = format(addDays(today, 30), 'yyyy-MM-dd');
  const defaultEndDate = format(addDays(today, 34), 'yyyy-MM-dd');

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<TripFormData>({
    tripDates: {
      startDate: defaultStartDate,
      endDate: defaultEndDate,
      flexible: false
    },
    golfers: {
      count: 4,
      skillLevels: ['intermediate']
    },
    destination: 'Myrtle Beach, SC',
    budget: {
      min: 1000,
      max: 2000,
      currency: 'USD'
    },
    golfExperience: 'intermediate',
    accommodation: {
      type: 'hotel',
      preferences: ['oceanfront']
    },
    activities: ['dining'],
    dining: {
      preferences: ['seafood'],
      priceRange: 'moderate'
    },
    transportation: {
      needsRental: true,
      type: 'car'
    },
    specialRequests: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateFormData = (updates: Partial<TripFormData>) => {
    setFormData(prev => ({
      ...prev,
      ...updates
    }));
  };

  const updateNestedFormData = (field: keyof TripFormData, updates: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        ...updates
      }
    }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (step === 1) {
      if (!formData.tripDates.startDate) {
        newErrors.startDate = 'Start date is required';
      }
      if (!formData.tripDates.endDate) {
        newErrors.endDate = 'End date is required';
      }
      if (formData.golfers.count < 1) {
        newErrors.golferCount = 'At least 1 golfer is required';
      }
      if (!formData.destination) {
        newErrors.destination = 'Destination is required';
      }
    } else if (step === 2) {
      if (!formData.budget.min || !formData.budget.max) {
        newErrors.budget = 'Budget range is required';
      }
      if (formData.budget.min > formData.budget.max) {
        newErrors.budgetRange = 'Minimum budget cannot exceed maximum budget';
      }
      if (!formData.golfExperience) {
        newErrors.golfExperience = 'Golf experience level is required';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(currentStep)) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Save to Supabase if authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data, error } = await supabase
          .from('trip_planning_requests')
          .insert([
            {
              user_id: user.id,
              trip_data: formData,
              status: 'pending',
              created_at: new Date().toISOString()
            }
          ])
          .select();
          
        if (error) {
          console.error('Error saving trip planning request:', error);
        } else {
          console.log('Saved trip planning request:', data);
        }
      }
      
      // Call the onSubmit callback with the form data
      onSubmit(formData);
      
      // Navigate to AI concierge
      navigateToSection('assistant');
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const skillLevelOptions = [
    { value: 'beginner', label: 'Beginner (New to golf)' },
    { value: 'intermediate', label: 'Intermediate (Occasional player)' },
    { value: 'advanced', label: 'Advanced (Regular player)' },
    { value: 'expert', label: 'Expert (Low handicap)' }
  ];

  const accommodationOptions = [
    { value: 'hotel', label: 'Hotel' },
    { value: 'resort', label: 'Golf Resort' },
    { value: 'condo', label: 'Condo/Apartment' },
    { value: 'villa', label: 'Villa' },
    { value: 'house', label: 'Vacation Home' }
  ];

  const accommodationPreferences = [
    { value: 'oceanfront', label: 'Oceanfront' },
    { value: 'golf-view', label: 'Golf Course View' },
    { value: 'luxury', label: 'Luxury' },
    { value: 'budget', label: 'Budget-friendly' },
    { value: 'pool', label: 'Swimming Pool' },
    { value: 'kitchen', label: 'Kitchen/Kitchenette' },
    { value: 'spa', label: 'Spa Services' }
  ];

  const activityOptions = [
    { value: 'dining', label: 'Fine Dining' },
    { value: 'beach', label: 'Beach Activities' },
    { value: 'fishing', label: 'Fishing' },
    { value: 'shopping', label: 'Shopping' },
    { value: 'nightlife', label: 'Nightlife' },
    { value: 'spa', label: 'Spa & Wellness' },
    { value: 'tours', label: 'Sightseeing Tours' },
    { value: 'water-sports', label: 'Water Sports' }
  ];

  const diningOptions = [
    { value: 'seafood', label: 'Seafood' },
    { value: 'steakhouse', label: 'Steakhouse' },
    { value: 'italian', label: 'Italian' },
    { value: 'american', label: 'American' },
    { value: 'asian', label: 'Asian' },
    { value: 'mexican', label: 'Mexican' },
    { value: 'bbq', label: 'BBQ' },
    { value: 'vegetarian', label: 'Vegetarian/Vegan' }
  ];

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          currentStep >= 1 ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-600'
        }`}>
          1
        </div>
        <div className={`w-16 h-1 ${currentStep >= 2 ? 'bg-emerald-600' : 'bg-gray-200'}`}></div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          currentStep >= 2 ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-600'
        }`}>
          2
        </div>
        <div className={`w-16 h-1 ${currentStep >= 3 ? 'bg-emerald-600' : 'bg-gray-200'}`}></div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          currentStep >= 3 ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-600'
        }`}>
          3
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
      {renderStepIndicator()}
      
      <form onSubmit={handleSubmit}>
        {/* Step 1: Basic Trip Details */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Trip Basics</h2>
            
            {/* Trip Dates */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <Calendar className="h-5 w-5 text-emerald-600" />
                <label className="text-lg font-semibold text-gray-700">Trip Dates</label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date*</label>
                  <input
                    type="date"
                    value={formData.tripDates.startDate}
                    min={format(today, 'yyyy-MM-dd')}
                    onChange={(e) => updateNestedFormData('tripDates', { startDate: e.target.value })}
                    className={`w-full p-3 border ${errors.startDate ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500`}
                    required
                  />
                  {errors.startDate && <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date*</label>
                  <input
                    type="date"
                    value={formData.tripDates.endDate}
                    min={formData.tripDates.startDate || format(today, 'yyyy-MM-dd')}
                    onChange={(e) => updateNestedFormData('tripDates', { endDate: e.target.value })}
                    className={`w-full p-3 border ${errors.endDate ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500`}
                    required
                  />
                  {errors.endDate && <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>}
                </div>
              </div>
              <div className="mt-2">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.tripDates.flexible}
                    onChange={(e) => updateNestedFormData('tripDates', { flexible: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  <span className="ms-3 text-sm font-medium text-gray-700">My dates are flexible</span>
                </label>
              </div>
            </div>
            
            {/* Number of Golfers */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <Users className="h-5 w-5 text-emerald-600" />
                <label className="text-lg font-semibold text-gray-700">Number of Golfers*</label>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => updateNestedFormData('golfers', { count: Math.max(1, formData.golfers.count - 1) })}
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-semibold transition-colors"
                >
                  -
                </button>
                <div className="flex-1 text-center">
                  <div className="text-2xl font-bold text-gray-900">{formData.golfers.count}</div>
                  <div className="text-xs text-gray-500">golfer{formData.golfers.count !== 1 ? 's' : ''}</div>
                </div>
                <button
                  type="button"
                  onClick={() => updateNestedFormData('golfers', { count: Math.min(16, formData.golfers.count + 1) })}
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-semibold transition-colors"
                >
                  +
                </button>
              </div>
              {errors.golferCount && <p className="mt-1 text-sm text-red-600">{errors.golferCount}</p>}
            </div>
            
            {/* Destination */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <MapPin className="h-5 w-5 text-emerald-600" />
                <label className="text-lg font-semibold text-gray-700">Destination*</label>
              </div>
              <select
                value={formData.destination}
                onChange={(e) => updateFormData({ destination: e.target.value })}
                className={`w-full p-3 border ${errors.destination ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500`}
                required
              >
                <option value="Myrtle Beach, SC">Myrtle Beach, South Carolina</option>
                <option value="Hilton Head, SC">Hilton Head, South Carolina</option>
                <option value="Kiawah Island, SC">Kiawah Island, South Carolina</option>
                <option value="Pinehurst, NC">Pinehurst, North Carolina</option>
                <option value="Pebble Beach, CA">Pebble Beach, California</option>
                <option value="Scottsdale, AZ">Scottsdale, Arizona</option>
              </select>
              {errors.destination && <p className="mt-1 text-sm text-red-600">{errors.destination}</p>}
            </div>
          </div>
        )}
        
        {/* Step 2: Preferences */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Golf & Accommodation Preferences</h2>
            
            {/* Budget Range */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                <label className="text-lg font-semibold text-gray-700">Budget Range (per person)*</label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minimum ($)</label>
                  <input
                    type="number"
                    value={formData.budget.min}
                    onChange={(e) => updateNestedFormData('budget', { min: parseInt(e.target.value) || 0 })}
                    min="0"
                    step="100"
                    className={`w-full p-3 border ${errors.budget ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Maximum ($)</label>
                  <input
                    type="number"
                    value={formData.budget.max}
                    onChange={(e) => updateNestedFormData('budget', { max: parseInt(e.target.value) || 0 })}
                    min={formData.budget.min}
                    step="100"
                    className={`w-full p-3 border ${errors.budget || errors.budgetRange ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500`}
                    required
                  />
                </div>
              </div>
              {errors.budget && <p className="mt-1 text-sm text-red-600">{errors.budget}</p>}
              {errors.budgetRange && <p className="mt-1 text-sm text-red-600">{errors.budgetRange}</p>}
            </div>
            
            {/* Golf Experience Level */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <Trophy className="h-5 w-5 text-emerald-600" />
                <label className="text-lg font-semibold text-gray-700">Golf Experience Level*</label>
              </div>
              <select
                value={formData.golfExperience}
                onChange={(e) => updateFormData({ golfExperience: e.target.value })}
                className={`w-full p-3 border ${errors.golfExperience ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500`}
                required
              >
                <option value="">Select experience level</option>
                {skillLevelOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              {errors.golfExperience && <p className="mt-1 text-sm text-red-600">{errors.golfExperience}</p>}
            </div>
            
            {/* Accommodation Type */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <Building className="h-5 w-5 text-emerald-600" />
                <label className="text-lg font-semibold text-gray-700">Accommodation Type</label>
              </div>
              <select
                value={formData.accommodation.type}
                onChange={(e) => updateNestedFormData('accommodation', { type: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                {accommodationOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            
            {/* Accommodation Preferences */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Accommodation Preferences</label>
              <div className="grid grid-cols-2 gap-2">
                {accommodationPreferences.map(pref => (
                  <label key={pref.value} className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.accommodation.preferences.includes(pref.value)}
                      onChange={(e) => {
                        const newPreferences = e.target.checked
                          ? [...formData.accommodation.preferences, pref.value]
                          : formData.accommodation.preferences.filter(p => p !== pref.value);
                        updateNestedFormData('accommodation', { preferences: newPreferences });
                      }}
                      className="rounded border-gray-300 text-emerald-600 shadow-sm focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">{pref.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Step 3: Additional Preferences */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Additional Preferences</h2>
            
            {/* Activities */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <Compass className="h-5 w-5 text-emerald-600" />
                <label className="text-lg font-semibold text-gray-700">Additional Activities</label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {activityOptions.map(activity => (
                  <label key={activity.value} className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.activities.includes(activity.value)}
                      onChange={(e) => {
                        const newActivities = e.target.checked
                          ? [...formData.activities, activity.value]
                          : formData.activities.filter(a => a !== activity.value);
                        updateFormData({ activities: newActivities });
                      }}
                      className="rounded border-gray-300 text-emerald-600 shadow-sm focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">{activity.label}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Dining Preferences */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <Utensils className="h-5 w-5 text-emerald-600" />
                <label className="text-lg font-semibold text-gray-700">Dining Preferences</label>
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">Cuisine Types</label>
                <div className="grid grid-cols-2 gap-2">
                  {diningOptions.map(option => (
                    <label key={option.value} className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.dining.preferences.includes(option.value)}
                        onChange={(e) => {
                          const newPreferences = e.target.checked
                            ? [...formData.dining.preferences, option.value]
                            : formData.dining.preferences.filter(p => p !== option.value);
                          updateNestedFormData('dining', { preferences: newPreferences });
                        }}
                        className="rounded border-gray-300 text-emerald-600 shadow-sm focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                <select
                  value={formData.dining.priceRange}
                  onChange={(e) => updateNestedFormData('dining', { priceRange: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="budget">Budget ($)</option>
                  <option value="moderate">Moderate ($$)</option>
                  <option value="upscale">Upscale ($$$)</option>
                  <option value="fine">Fine Dining ($$$$)</option>
                </select>
              </div>
            </div>
            
            {/* Transportation */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <Car className="h-5 w-5 text-emerald-600" />
                <label className="text-lg font-semibold text-gray-700">Transportation</label>
              </div>
              <div className="mb-3">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.transportation.needsRental}
                    onChange={(e) => updateNestedFormData('transportation', { needsRental: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  <span className="ms-3 text-sm font-medium text-gray-700">I need a rental vehicle</span>
                </label>
              </div>
              {formData.transportation.needsRental && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Type</label>
                  <select
                    value={formData.transportation.type}
                    onChange={(e) => updateNestedFormData('transportation', { type: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="car">Standard Car</option>
                    <option value="suv">SUV</option>
                    <option value="luxury">Luxury Vehicle</option>
                    <option value="van">Van/Minivan</option>
                  </select>
                </div>
              )}
            </div>
            
            {/* Special Requests */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Special Requests or Additional Information</label>
              <textarea
                value={formData.specialRequests}
                onChange={(e) => updateFormData({ specialRequests: e.target.value })}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Tell us about any special requirements or additional information that might help us plan your perfect golf trip..."
              />
            </div>
          </div>
        )}
        
        {/* Navigation Buttons */}
        <div className="mt-8 flex justify-between">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handlePrevStep}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-semibold transition-colors"
            >
              Back
            </button>
          ) : (
            <div></div> // Empty div to maintain flex spacing
          )}
          
          {currentStep < 3 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white rounded-lg font-semibold transition-colors flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5" />
                  <span>Generate AI Plan</span>
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default TripPlanningForm;