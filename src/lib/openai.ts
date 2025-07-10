import OpenAI from 'openai';
import { TripFormData } from '../components/TripPlanningForm';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

// Initialize OpenAI client
const openai = OPENAI_API_KEY ? new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: In production, API calls should go through your backend
}) : null;

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export const generateAIResponse = async (
  userMessage: string,
  tripData: any,
  conversationHistory: ChatMessage[] = []
): Promise<string> => {
  // If OpenAI is not configured, fall back to mock responses
  if (!openai || !OPENAI_API_KEY) {
    console.warn('OpenAI not configured - using mock responses');
    return generateMockResponse(userMessage, tripData);
  }

  try {
    const systemPrompt = `You are GolfGenie AI, an expert golf trip planning assistant specializing in Myrtle Beach golf vacations. 
    
Current trip details:
${JSON.stringify(tripData, null, 2)}

Your goal is to help the user plan the perfect golf trip by providing personalized recommendations for golf courses, accommodations, dining, and activities based on their preferences. Be friendly, knowledgeable, and focus on creating memorable experiences.

When making recommendations:
- Suggest specific golf courses that match their skill level and budget
- Recommend accommodations that meet their preferences
- Suggest dining options that align with their cuisine preferences
- Offer additional activities based on their interests
- Provide practical travel advice for Myrtle Beach

Always be helpful, specific, and enthusiastic about creating the perfect golf vacation experience.`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-6), // Keep last 6 messages for context
      { role: 'user', content: userMessage }
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: messages as any,
      max_tokens: 500,
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content || 'I apologize, but I encountered an issue generating a response. Please try again.';
  } catch (error) {
    console.error('OpenAI API error:', error);
    return generateMockResponse(userMessage, tripData);
  }
};

export const generateAITripPlan = async (
  tripData: TripFormData,
  availableOptions: {
    golfCourses: any[];
    hotels: any[];
    restaurants: any[];
    experiences: any[];
  }
): Promise<any> => {
  // If OpenAI is not configured, fall back to mock trip plan
  if (!openai || !OPENAI_API_KEY) {
    console.warn('OpenAI not configured - using mock trip plan');
    return generateMockTripPlan(tripData, availableOptions);
  }

  try {
    const systemPrompt = `You are GolfGenie AI, an expert golf trip planning assistant. Your task is to create a detailed, day-by-day itinerary for a golf trip based on the user's preferences and available options.

Trip Details:
${JSON.stringify(tripData, null, 2)}

Available Options:
${JSON.stringify(availableOptions, null, 2)}

Create a comprehensive trip plan with the following structure:
1. A list of days, each with:
   - Date
   - Multiple activities with times (golf, meals, check-in/out, other activities)
   - Each activity should reference actual items from the available options
2. Selected golf courses with details
3. Selected accommodations with details
4. Selected restaurants with details
5. Selected experiences/activities with details
6. Transportation arrangements if needed
7. Total estimated cost

The plan should be realistic, taking into account:
- Travel times between venues
- Appropriate tee times
- Meal times
- Check-in/out times for accommodations
- Activity durations

Return the plan as a structured JSON object that can be parsed and displayed in the application.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Generate a detailed golf trip plan based on my preferences and the available options.' }
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('Empty response from OpenAI');
    }

    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const plan = JSON.parse(jsonMatch[0]);
      return plan;
    } catch (parseError) {
      console.error('Error parsing AI trip plan response:', parseError);
      return generateMockTripPlan(tripData, availableOptions);
    }
  } catch (error) {
    console.error('OpenAI trip plan generation error:', error);
    return generateMockTripPlan(tripData, availableOptions);
  }
};

// Fallback mock response generator
const generateMockResponse = (userMessage: string, tripData: any): string => {
  const message = userMessage.toLowerCase();
  
  if (message.includes('golf') || message.includes('course')) {
    return "Based on your preferences, I'd recommend TPC Myrtle Beach for championship-level play, Caledonia Golf & Fish Club for its historic charm, and Dunes Golf & Beach Club for stunning ocean views. Each offers unique challenges and world-class amenities. Would you like specific details about any of these courses or recommendations based on your skill level?";
  }
  
  if (message.includes('hotel') || message.includes('stay') || message.includes('accommodation')) {
    return "For your trip, I recommend The Ocean House for luxury oceanfront accommodations, or the Marriott Myrtle Beach Resort which offers excellent golf packages and amenities. Both have availability during your dates and are conveniently located near the golf courses in your itinerary. Would you like me to include either in your plan?";
  }
  
  if (message.includes('restaurant') || message.includes('dining') || message.includes('eat')) {
    return "For dining, I recommend Sea Captain's House for fresh seafood with ocean views, and The Cypress Grill for premium steaks. Both have excellent ratings and I can make OpenTable reservations for you. Would you like me to add these to your plan?";
  }

  if (message.includes('budget') || message.includes('cost') || message.includes('price')) {
    return `Based on your budget of $${tripData?.budget?.min || 1000}-$${tripData?.budget?.max || 2000} per person, I can create a customized package that includes quality golf courses, comfortable accommodations, and dining options that fit your preferences. Would you like me to optimize for value or premium experiences?`;
  }

  if (message.includes('plan') || message.includes('generate') || message.includes('itinerary')) {
    return "I'd be happy to generate a complete trip plan for you! I'll include golf courses, accommodations, dining options, and any additional activities you mentioned. Would you like me to proceed?";
  }
  
  return "I'm here to help plan your perfect golf getaway! I can recommend golf courses, accommodations, restaurants, and activities based on your preferences. What specific aspect of your trip would you like assistance with?";
};

// Mock trip plan generator
const generateMockTripPlan = (
  tripData: TripFormData,
  availableOptions: {
    golfCourses: any[];
    hotels: any[];
    restaurants: any[];
    experiences: any[];
  }
): any => {
  // Calculate trip duration
  const startDate = new Date(tripData.tripDates.startDate);
  const endDate = new Date(tripData.tripDates.endDate);
  const tripDuration = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Select items from available options
  const selectedGolfCourses = availableOptions.golfCourses.slice(0, Math.min(tripDuration, 3));
  const selectedHotel = availableOptions.hotels[0];
  const selectedRestaurants = availableOptions.restaurants.slice(0, Math.min(tripDuration, 3));
  const selectedExperiences = tripData.activities.length > 0 
    ? availableOptions.experiences.slice(0, Math.min(2, availableOptions.experiences.length))
    : [];
  
  // Generate days
  const days = [];
  for (let i = 0; i < tripDuration; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    
    const dayActivities = [];
    
    // Check-in on first day
    if (i === 0) {
      dayActivities.push({
        time: '3:00 PM',
        description: `Check-in at ${selectedHotel.name}`,
        type: 'hotel',
        itemId: selectedHotel.id,
        itemName: selectedHotel.name,
        notes: 'Your home for the duration of your stay'
      });
      
      // Dinner on first day
      if (selectedRestaurants[0]) {
        dayActivities.push({
          time: '7:00 PM',
          description: `Dinner at ${selectedRestaurants[0].name}`,
          type: 'restaurant',
          itemId: selectedRestaurants[0].id,
          itemName: selectedRestaurants[0].name,
          notes: `${selectedRestaurants[0].cuisine_type} cuisine`
        });
      }
    } 
    // Check-out on last day
    else if (i === tripDuration - 1) {
      dayActivities.push({
        time: '11:00 AM',
        description: `Check-out from ${selectedHotel.name}`,
        type: 'hotel',
        itemId: selectedHotel.id,
        itemName: selectedHotel.name
      });
    }
    
    // Add golf if not last day or if only 1-day trip
    if (i < selectedGolfCourses.length && (i < tripDuration - 1 || tripDuration === 1)) {
      const golfCourse = selectedGolfCourses[i];
      dayActivities.unshift({
        time: '8:30 AM',
        description: `Tee time at ${golfCourse.name}`,
        type: 'golf',
        itemId: golfCourse.id,
        itemName: golfCourse.name,
        notes: `${golfCourse.difficulty} course, ${golfCourse.holes} holes`
      });
    }
    
    // Add lunch if playing golf
    if (dayActivities.some(a => a.type === 'golf')) {
      dayActivities.push({
        time: '1:30 PM',
        description: 'Lunch at the clubhouse',
        type: 'other',
        notes: 'Casual dining after your round'
      });
    }
    
    // Add experience on a day without golf
    if (selectedExperiences.length > 0 && !dayActivities.some(a => a.type === 'golf')) {
      const experience = selectedExperiences[0];
      dayActivities.push({
        time: '2:00 PM',
        description: `${experience.name}`,
        type: 'experience',
        itemId: experience.id,
        itemName: experience.name,
        notes: `${experience.duration} activity`
      });
    }
    
    // Add dinner if not first day (already added)
    if (i > 0 && i < selectedRestaurants.length) {
      const restaurant = selectedRestaurants[i];
      dayActivities.push({
        time: '7:00 PM',
        description: `Dinner at ${restaurant.name}`,
        type: 'restaurant',
        itemId: restaurant.id,
        itemName: restaurant.name,
        notes: `${restaurant.cuisine_type} cuisine`
      });
    }
    
    // Sort activities by time
    dayActivities.sort((a, b) => {
      const timeA = new Date(`2000-01-01 ${a.time}`).getTime();
      const timeB = new Date(`2000-01-01 ${b.time}`).getTime();
      return timeA - timeB;
    });
    
    days.push({
      day: i + 1,
      date: currentDate.toISOString().split('T')[0],
      activities: dayActivities
    });
  }
  
  // Calculate total cost
  const golfCost = selectedGolfCourses.reduce((sum, course) => sum + course.price * tripData.golfers.count, 0);
  const hotelCost = selectedHotel.price_per_night * tripDuration;
  const restaurantCost = selectedRestaurants.length * 100 * tripData.golfers.count; // Estimate $100 per person per meal
  const experienceCost = selectedExperiences.reduce((sum, exp) => sum + exp.price * tripData.golfers.count, 0);
  const transportationCost = tripData.transportation.needsRental ? 50 * tripDuration : 0; // Estimate $50 per day for rental
  
  const totalCost = golfCost + hotelCost + restaurantCost + experienceCost + transportationCost;
  
  // Create transportation object if needed
  const transportation = tripData.transportation.needsRental ? {
    type: tripData.transportation.type,
    pickup: 'Myrtle Beach International Airport',
    dropoff: 'Myrtle Beach International Airport',
    cost_per_day: 50,
    total_cost: 50 * tripDuration
  } : null;
  
  return {
    days,
    golfCourses: selectedGolfCourses,
    hotels: [selectedHotel],
    restaurants: selectedRestaurants,
    experiences: selectedExperiences,
    transportation,
    totalCost
  };
};