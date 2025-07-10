import React, { useState, useEffect, useRef } from 'react';
import { Zap, Send, User, Calendar, MapPin, Trophy, Building, Utensils, Compass, Car, DollarSign, Clock, CheckCircle, Loader } from 'lucide-react';
import { TripFormData } from './TripPlanningForm';
import { generateAITripPlan } from '../lib/openai';
import { searchGolfCourses } from '../lib/golfApi';
import { searchHotels } from '../lib/hotelApi';
import { searchRestaurants } from '../lib/restaurantApi';
import { searchExperiences } from '../lib/experienceApi';
import { supabase } from '../lib/supabase';

interface AIGolfConciergeProps {
  initialTripData?: TripFormData;
  onUpdateItinerary?: (itinerary: any) => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

interface TripPlan {
  days: TripDay[];
  golfCourses: any[];
  hotels: any[];
  restaurants: any[];
  experiences: any[];
  transportation: any;
  totalCost: number;
}

interface TripDay {
  day: number;
  date: string;
  activities: TripActivity[];
}

interface TripActivity {
  time: string;
  description: string;
  type: 'golf' | 'hotel' | 'restaurant' | 'experience' | 'transportation' | 'other';
  itemId?: string;
  itemName?: string;
  notes?: string;
}

const AIGolfConcierge: React.FC<AIGolfConciergeProps> = ({ initialTripData, onUpdateItinerary }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [tripPlan, setTripPlan] = useState<TripPlan | null>(null);
  const [tripData, setTripData] = useState<TripFormData | undefined>(initialTripData);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Initialize with welcome message and trip data if available
  useEffect(() => {
    const initialMessages: Message[] = [
      {
        id: '1',
        role: 'assistant',
        content: "Welcome to GolfGenie AI! I'm your personal golf trip concierge. How can I help plan your perfect golf getaway?",
        timestamp: new Date()
      }
    ];

    if (initialTripData) {
      const tripSummary = generateTripSummary(initialTripData);
      initialMessages.push({
        id: '2',
        role: 'assistant',
        content: `I see you're planning a golf trip to ${initialTripData.destination}! ${tripSummary} Would you like me to generate a personalized trip plan based on these details?`,
        timestamp: new Date()
      });
    }

    setMessages(initialMessages);
  }, []);

  // Generate a summary of the trip data for the AI to reference
  const generateTripSummary = (data: TripFormData): string => {
    const startDate = new Date(data.tripDates.startDate);
    const endDate = new Date(data.tripDates.endDate);
    const nights = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return `You're planning a ${nights}-night trip for ${data.golfers.count} golfer(s) with ${data.golfExperience} experience. Your budget is $${data.budget.min}-$${data.budget.max} per person, and you're interested in ${data.accommodation.type} accommodations with preferences for ${data.accommodation.preferences.join(', ')}. You're also interested in ${data.activities.join(', ')} activities and ${data.dining.preferences.join(', ')} dining options.`;
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Add typing indicator
    const typingIndicatorId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: typingIndicatorId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true
    }]);

    try {
      // Check if this is a request to generate a plan
      const isPlanRequest = inputMessage.toLowerCase().includes('plan') || 
                           inputMessage.toLowerCase().includes('generate') || 
                           inputMessage.toLowerCase().includes('create') ||
                           inputMessage.toLowerCase().includes('itinerary');

      if (isPlanRequest && tripData) {
        await generatePlan();
      } else {
        // Process regular message
        await processUserMessage(userMessage.content, typingIndicatorId);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      
      // Remove typing indicator and add error message
      setMessages(prev => prev.filter(msg => msg.id !== typingIndicatorId));
      setMessages(prev => [...prev, {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error while processing your request. Please try again.",
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const processUserMessage = async (message: string, typingIndicatorId: string) => {
    // In a real implementation, this would call the OpenAI API
    // For now, we'll simulate a response
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    let response = "I'm processing your request. How else can I help with your golf trip planning?";
    
    if (message.toLowerCase().includes('golf course') || message.toLowerCase().includes('where to play')) {
      response = "Based on your preferences, I recommend TPC Myrtle Beach for championship-level play, Caledonia Golf & Fish Club for its historic charm, and Dunes Golf & Beach Club for stunning ocean views. Would you like more details about any of these courses?";
    } else if (message.toLowerCase().includes('hotel') || message.toLowerCase().includes('stay') || message.toLowerCase().includes('accommodation')) {
      response = "For your trip, I recommend The Ocean House for luxury oceanfront accommodations, or the Marriott Myrtle Beach Resort which offers excellent golf packages and amenities. Both have availability during your dates. Would you like me to include either in your itinerary?";
    } else if (message.toLowerCase().includes('restaurant') || message.toLowerCase().includes('dining') || message.toLowerCase().includes('food')) {
      response = "For dining, I recommend Sea Captain's House for fresh seafood with ocean views, and The Cypress Grill for premium steaks. Both have excellent ratings and I can make OpenTable reservations for you. Would you like me to add these to your plan?";
    } else if (message.toLowerCase().includes('budget') || message.toLowerCase().includes('cost') || message.toLowerCase().includes('price')) {
      response = `Based on your budget of $${tripData?.budget.min}-$${tripData?.budget.max} per person, I can create a customized package that includes quality golf courses, comfortable accommodations, and dining options that fit your preferences. Would you like me to optimize for value or premium experiences?`;
    } else if (message.toLowerCase().includes('plan') || message.toLowerCase().includes('generate') || message.toLowerCase().includes('itinerary')) {
      response = "I'd be happy to generate a complete trip plan for you! I'll include golf courses, accommodations, dining options, and any additional activities you mentioned. Would you like me to proceed?";
    }
    
    // Remove typing indicator and add response
    setMessages(prev => prev.filter(msg => msg.id !== typingIndicatorId));
    setMessages(prev => [...prev, {
      id: (Date.now() + 2).toString(),
      role: 'assistant',
      content: response,
      timestamp: new Date()
    }]);
  };

  const generatePlan = async () => {
    if (!tripData) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: "I need some information about your trip before I can generate a plan. Please fill out the trip planning form first.",
        timestamp: new Date()
      }]);
      return;
    }

    setIsGeneratingPlan(true);
    
    try {
      // Add a message indicating plan generation
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: "I'm generating your personalized golf trip plan. This will include recommended courses, accommodations, dining options, and a day-by-day itinerary based on your preferences. Just a moment...",
        timestamp: new Date()
      }]);

      // Fetch data from APIs in parallel
      const [golfCoursesData, hotelsData, restaurantsData, experiencesData] = await Promise.all([
        searchGolfCourses(tripData.destination, tripData.tripDates.startDate, tripData.tripDates.endDate, tripData.golfers.count),
        searchHotels(tripData.destination, tripData.tripDates.startDate, tripData.tripDates.endDate, tripData.golfers.count),
        searchRestaurants(tripData.destination, tripData.tripDates.startDate, tripData.dining.preferences.join(',')),
        searchExperiences(tripData.destination, tripData.tripDates.startDate, tripData.activities.join(','))
      ]);

      // Generate AI plan using OpenAI
      const plan = await generateAITripPlan(
        tripData,
        {
          golfCourses: golfCoursesData,
          hotels: hotelsData,
          restaurants: restaurantsData,
          experiences: experiencesData
        }
      );

      // Save plan to state
      setTripPlan(plan);

      // Format and display the plan
      const planMessage = formatTripPlan(plan);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: planMessage,
        timestamp: new Date()
      }]);

      // Save plan to Supabase if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('trip_plans')
          .insert([
            {
              user_id: user.id,
              trip_data: tripData,
              plan_data: plan,
              status: 'generated',
              created_at: new Date().toISOString()
            }
          ])
          .select();
          
        if (error) {
          console.error('Error saving trip plan:', error);
        } else {
          console.log('Saved trip plan:', data);
        }
      }

      // Update itinerary if callback provided
      if (onUpdateItinerary) {
        onUpdateItinerary({
          golfCourses: plan.golfCourses,
          hotels: plan.hotels,
          restaurants: plan.restaurants,
          experiences: plan.experiences,
          notes: `AI-generated plan for ${tripData.destination} from ${tripData.tripDates.startDate} to ${tripData.tripDates.endDate} for ${tripData.golfers.count} golfers.`
        });
      }

    } catch (error) {
      console.error('Error generating plan:', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error while generating your trip plan. Please try again or adjust your preferences.",
        timestamp: new Date()
      }]);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const formatTripPlan = (plan: TripPlan): string => {
    // In a real implementation, this would format the plan nicely
    // For now, we'll return a simple text representation
    
    let planText = "# Your Personalized Golf Trip Plan\n\n";
    planText += `I've created a custom ${plan.days.length}-day itinerary for your golf trip to ${tripData?.destination}. This plan includes ${plan.golfCourses.length} golf courses, accommodations at ${plan.hotels[0]?.name || 'a selected hotel'}, and carefully chosen dining options based on your preferences.\n\n`;
    
    planText += "## Daily Itinerary\n\n";
    
    plan.days.forEach(day => {
      planText += `### Day ${day.day} - ${day.date}\n\n`;
      
      day.activities.forEach(activity => {
        planText += `**${activity.time}**: ${activity.description}`;
        if (activity.notes) {
          planText += ` - ${activity.notes}`;
        }
        planText += "\n\n";
      });
    });
    
    planText += `## Total Estimated Cost: $${plan.totalCost.toLocaleString()}\n\n`;
    planText += "Would you like to make any adjustments to this plan? I can modify tee times, change accommodations, or add more activities based on your feedback.";
    
    return planText;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-blue-600 p-6">
        <div className="flex items-center space-x-3">
          <div className="bg-white/20 p-2 rounded-lg">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">GolfGenie AI Concierge</h2>
            <p className="text-emerald-100 text-sm">Powered by advanced AI for personalized golf trip planning</p>
          </div>
        </div>
      </div>

      {/* Trip Summary (if available) */}
      {tripData && (
        <div className="bg-emerald-50 p-4 border-b border-emerald-100">
          <div className="flex items-start space-x-3">
            <div className="bg-emerald-100 p-2 rounded-lg">
              <Calendar className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-medium text-emerald-800">Trip Summary</h3>
              <p className="text-sm text-emerald-700">
                {tripData.tripDates.startDate} to {tripData.tripDates.endDate} • {tripData.golfers.count} golfers • {tripData.destination}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full text-xs">
                  ${tripData.budget.min}-${tripData.budget.max}
                </span>
                <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full text-xs">
                  {tripData.golfExperience} golfers
                </span>
                <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full text-xs">
                  {tripData.accommodation.type}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="h-96 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-3/4 rounded-2xl p-4 ${
              message.role === 'user' 
                ? 'bg-emerald-600 text-white' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {message.isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              ) : (
                <div className="whitespace-pre-wrap">{message.content}</div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Trip Plan Display */}
      {tripPlan && (
        <div className="border-t border-gray-200 p-4 bg-blue-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900">Your Golf Trip Plan</h3>
            <button 
              onClick={() => onUpdateItinerary && onUpdateItinerary({
                golfCourses: tripPlan.golfCourses,
                hotels: tripPlan.hotels,
                restaurants: tripPlan.restaurants,
                experiences: tripPlan.experiences
              })}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm font-medium"
            >
              Add to Itinerary
            </button>
          </div>
          
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="bg-white p-2 rounded-lg">
              <Trophy className="h-4 w-4 text-emerald-600 mx-auto mb-1" />
              <div className="font-semibold">{tripPlan.golfCourses.length}</div>
              <div className="text-gray-600">Golf Courses</div>
            </div>
            <div className="bg-white p-2 rounded-lg">
              <Building className="h-4 w-4 text-blue-600 mx-auto mb-1" />
              <div className="font-semibold">{tripPlan.hotels.length}</div>
              <div className="text-gray-600">Hotels</div>
            </div>
            <div className="bg-white p-2 rounded-lg">
              <Utensils className="h-4 w-4 text-amber-600 mx-auto mb-1" />
              <div className="font-semibold">{tripPlan.restaurants.length}</div>
              <div className="text-gray-600">Restaurants</div>
            </div>
            <div className="bg-white p-2 rounded-lg">
              <DollarSign className="h-4 w-4 text-green-600 mx-auto mb-1" />
              <div className="font-semibold">${tripPlan.totalCost.toLocaleString()}</div>
              <div className="text-gray-600">Total Cost</div>
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your golf trip or request changes to your plan..."
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            disabled={isTyping || isGeneratingPlan}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isTyping || isGeneratingPlan}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white p-3 rounded-lg transition-colors"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
        
        {!tripPlan && tripData && (
          <div className="mt-3 text-center">
            <button
              onClick={generatePlan}
              disabled={isGeneratingPlan}
              className="bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center space-x-2"
            >
              {isGeneratingPlan ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  <span>Generating Plan...</span>
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  <span>Generate Trip Plan</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIGolfConcierge;