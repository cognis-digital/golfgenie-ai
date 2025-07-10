import React, { useState } from 'react';
import { MessageCircle, Send, Bot, User, Sparkles, MapPin, Trophy, Building, Utensils, Compass, Package, Wand2, Calendar, Clock, DollarSign, Zap } from 'lucide-react';
import { Itinerary } from '../types';
import { generateAIResponse, generateAITripPlan, ChatMessage } from '../lib/openai';

interface AIAssistantProps {
  itinerary: Itinerary;
  onUpdateItinerary?: (itinerary: Itinerary) => void;
  onAddToItinerary?: (type: string, item: any) => void;
}

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  itineraryPlan?: any;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ itinerary, onUpdateItinerary, onAddToItinerary }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hello! I'm your GolfGenie AI, your personal golf concierge for Myrtle Beach. I can help you plan the perfect golf getaway with personalized recommendations for courses, hotels, restaurants, experiences, and packages. I can also create complete itineraries tailored to your preferences! What would you like to know?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isGeneratingItinerary, setIsGeneratingItinerary] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([]);

  const quickSuggestions = [
    { icon: Trophy, text: "Best golf courses for beginners", category: "golf" },
    { icon: Building, text: "Oceanfront hotels with golf packages", category: "hotels" },
    { icon: Utensils, text: "Restaurants with OpenTable reservations", category: "dining" },
    { icon: Compass, text: "Family-friendly experiences", category: "experiences" },
    { icon: Package, text: "Complete vacation packages", category: "packages" },
    { icon: Wand2, text: "Create a 3-day golf itinerary for me", category: "planning" }
  ];

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Add to conversation history
    const newHistory: ChatMessage[] = [
      ...conversationHistory,
      { role: 'user', content: inputMessage }
    ];

    try {
      // Check if this is an itinerary planning request
      const isItineraryRequest = inputMessage.toLowerCase().includes('itinerary') || 
                              inputMessage.toLowerCase().includes('plan') ||
                              inputMessage.toLowerCase().includes('schedule') ||
                              inputMessage.toLowerCase().includes('create') && inputMessage.toLowerCase().includes('trip');

      let aiResponseContent = '';
      let itineraryPlan = null;

      if (isItineraryRequest) {
        setIsGeneratingItinerary(true);
        try {
          // Create a mock trip data structure for the AI trip plan function
          const mockTripData = {
            tripDates: {
              startDate: new Date().toISOString().split('T')[0],
              endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            },
            golfers: { count: 2 },
            budget: { min: 1000, max: 2000 },
            activities: [],
            transportation: { needsRental: false, type: 'none' }
          };

          const mockAvailableOptions = {
            golfCourses: itinerary.golfCourses.length > 0 ? itinerary.golfCourses : [],
            hotels: itinerary.hotels.length > 0 ? itinerary.hotels : [],
            restaurants: itinerary.restaurants.length > 0 ? itinerary.restaurants : [],
            experiences: itinerary.experiences.length > 0 ? itinerary.experiences : []
          };

          const plan = await generateAITripPlan(mockTripData, mockAvailableOptions);
          if (plan) {
            itineraryPlan = {
              duration: "3 days",
              description: "A personalized golf getaway in Myrtle Beach",
              days: plan.days || [],
              golfCourses: plan.golfCourses || [],
              hotels: plan.hotels || [],
              restaurants: plan.restaurants || [],
              experiences: plan.experiences || [],
              packages: plan.packages || [],
              estimatedCost: plan.totalCost || 1500,
              totalItems: (plan.golfCourses?.length || 0) + (plan.hotels?.length || 0) + (plan.restaurants?.length || 0) + (plan.experiences?.length || 0),
              notes: plan.notes || ''
            };
            aiResponseContent = `I've created a personalized ${itineraryPlan.duration} itinerary for your Myrtle Beach golf trip! Here's what I've planned for you:\n\n${itineraryPlan.description}\n\nWould you like me to add any of these recommendations to your itinerary?`;
          } else {
            aiResponseContent = await generateAIResponse(inputMessage, itinerary, newHistory);
          }
        } catch (error) {
          console.error('Error generating itinerary:', error);
          aiResponseContent = await generateAIResponse(inputMessage, itinerary, newHistory);
        } finally {
          setIsGeneratingItinerary(false);
        }
      } else {
        // Generate regular AI response
        aiResponseContent = await generateAIResponse(inputMessage, itinerary, newHistory);
      }
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: aiResponseContent,
        timestamp: new Date(),
        itineraryPlan
      };
      
      setMessages(prev => [...prev, aiResponse]);
      
      // Update conversation history
      setConversationHistory([
        ...newHistory,
        { role: 'assistant', content: aiResponseContent }
      ]);
    } catch (error) {
      console.error('Error generating AI response:', error);
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: "I apologize, but I'm having trouble processing your request right now. Please try again or ask me something else about your Myrtle Beach golf trip!",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
  };

  const handleApplyItinerary = (plan: any) => {
    if (!onUpdateItinerary) return;

    const newItinerary = {
      golfCourses: plan.golfCourses || [],
      hotels: plan.hotels || [],
      restaurants: plan.restaurants || [],
      experiences: plan.experiences || [],
      packages: plan.packages || [],
      notes: plan.notes || ''
    };

    onUpdateItinerary(newItinerary);
    
    // Add confirmation message
    const confirmationMessage: Message = {
      id: (Date.now() + 2).toString(),
      type: 'assistant',
      content: "Perfect! I've applied the itinerary to your trip. You can view and modify it in the 'My Trip' section. Is there anything else you'd like me to adjust or add?",
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, confirmationMessage]);
  };

  const handleAddSingleItem = (type: string, item: any) => {
    if (!onAddToItinerary) return;
    
    onAddToItinerary(type, item);
    
    // Add confirmation message
    const confirmationMessage: Message = {
      id: (Date.now() + 3).toString(),
      type: 'assistant',
      content: `Great! I've added ${item.name} to your itinerary. Would you like me to suggest anything else that pairs well with this choice?`,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, confirmationMessage]);
  };

  const renderItineraryPlan = (plan: any) => {
    if (!plan) return null;

    return (
      <div className="mt-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Wand2 className="h-5 w-5 text-blue-600" />
          <h4 className="font-bold text-blue-900">AI-Generated Itinerary</h4>
          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
            {plan.duration}
          </span>
        </div>

        <div className="space-y-3 mb-4">
          {plan.days && plan.days.map((day: any, index: number) => (
            <div key={index} className="bg-white rounded-lg p-3 border border-blue-100">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="font-semibold text-blue-900">Day {day.day}</span>
                <span className="text-sm text-blue-700">{day.theme}</span>
              </div>
              <div className="space-y-2">
                {day.activities.map((activity: any, actIndex: number) => (
                  <div key={actIndex} className="flex items-start space-x-2 text-sm">
                    <Clock className="h-3 w-3 text-blue-500 mt-1 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-blue-800">{activity.time}:</span>
                      <span className="text-gray-700 ml-1">{activity.description}</span>
                      {activity.itemName && (
                        <button
                          onClick={() => handleAddSingleItem(activity.type, { id: activity.itemId, name: activity.itemName })}
                          className="ml-2 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded-full transition-colors duration-200"
                        >
                          Add to Itinerary
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-blue-200">
          <div className="flex items-center space-x-4 text-sm text-blue-700">
            <div className="flex items-center space-x-1">
              <DollarSign className="h-4 w-4" />
              <span>Est. ${plan.estimatedCost}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MapPin className="h-4 w-4" />
              <span>{plan.totalItems} items</span>
            </div>
          </div>
          <button
            onClick={() => handleApplyItinerary(plan)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-200"
          >
            Apply Full Itinerary
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="py-8 bg-gradient-to-br from-purple-50 to-indigo-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="bg-gradient-to-r from-emerald-500 to-blue-500 p-3 rounded-2xl">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
              GolfGenie AI
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your personal AI golf concierge for Myrtle Beach. Ask me anything about courses, hotels, dining, or let me plan your perfect golf getaway.
          </p>
          <div className="mt-4 text-sm text-gray-500">
            {import.meta.env.VITE_OPENAI_API_KEY ? (
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">
                ✓ AI-Powered Responses & Itinerary Planning
              </span>
            ) : (
              <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full">
                Demo Mode - Add OpenAI API key for AI responses
              </span>
            )}
          </div>
        </div>

        {/* Chat Interface */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Messages */}
          <div className="h-96 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex items-start space-x-3 ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.type === 'user' 
                    ? 'bg-emerald-600' 
                    : 'bg-gradient-to-r from-blue-600 to-purple-600'
                }`}>
                  {message.type === 'user' ? (
                    <User className="h-4 w-4 text-white" />
                  ) : (
                    <Zap className="h-4 w-4 text-white" />
                  )}
                </div>
                <div className={`flex-1 max-w-xs sm:max-w-md ${message.type === 'user' ? 'text-right' : ''}`}>
                  <div className={`p-3 rounded-2xl ${
                    message.type === 'user'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                  {message.itineraryPlan && renderItineraryPlan(message.itineraryPlan)}
                  <p className="text-xs text-gray-500 mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            
            {(isTyping || isGeneratingItinerary) && (
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 max-w-xs sm:max-w-md">
                  <div className="bg-gray-100 p-3 rounded-2xl">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                  {isGeneratingItinerary && (
                    <p className="text-xs text-purple-600 mt-1 flex items-center space-x-1">
                      <Wand2 className="h-3 w-3" />
                      <span>Creating your personalized itinerary...</span>
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Suggestions */}
          <div className="px-6 py-4 bg-gray-50 border-t">
            <p className="text-sm font-medium text-gray-700 mb-3">Quick suggestions:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {quickSuggestions.map((suggestion, index) => {
                const Icon = suggestion.icon;
                return (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion.text)}
                    className="flex items-center space-x-2 p-2 text-left text-sm text-gray-600 hover:bg-white hover:text-purple-600 rounded-lg transition-colors duration-200"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{suggestion.text}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Input */}
          <div className="px-6 py-4 border-t">
            <div className="flex space-x-3">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isTyping && !isGeneratingItinerary && handleSendMessage()}
                placeholder="Ask me anything about your golf trip or request an itinerary..."
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isTyping || isGeneratingItinerary}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isTyping || isGeneratingItinerary}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 text-white p-3 rounded-lg font-semibold transition-colors duration-200"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Current Itinerary Summary */}
        {(itinerary.golfCourses.length > 0 || itinerary.hotels.length > 0 || itinerary.restaurants.length > 0 || itinerary.experiences.length > 0 || itinerary.packages.length > 0) && (
          <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Your Current Itinerary</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div className="bg-emerald-50 p-4 rounded-lg">
                <Trophy className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-emerald-600">{itinerary.golfCourses.length}</div>
                <div className="text-sm text-gray-600">Golf Courses</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <Building className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600">{itinerary.hotels.length}</div>
                <div className="text-sm text-gray-600">Hotels</div>
              </div>
              <div className="bg-amber-50 p-4 rounded-lg">
                <Utensils className="h-6 w-6 text-amber-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-amber-600">{itinerary.restaurants.length}</div>
                <div className="text-sm text-gray-600">Restaurants</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <Compass className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-600">{itinerary.experiences.length}</div>
                <div className="text-sm text-gray-600">Experiences</div>
              </div>
              <div className="bg-indigo-50 p-4 rounded-lg">
                <Package className="h-6 w-6 text-indigo-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-indigo-600">{itinerary.packages.length}</div>
                <div className="text-sm text-gray-600">Packages</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAssistant;