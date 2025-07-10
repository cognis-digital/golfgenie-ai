import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../hooks/useReduxState';
import { 
  addGolfCourse, 
  addHotel, 
  addRestaurant, 
  addExperience, 
  addPackage,
  removeGolfCourse,
  removeHotel,
  removeRestaurant,
  removeExperience,
  removePackage,
  updateNotes,
  saveItinerary,
  clearItinerary
} from '../store/slices/itinerarySlice';
import { createBooking } from '../store/slices/bookingsSlice';
import { addNotification } from '../store/slices/uiSlice';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Trophy, 
  Building, 
  Utensils, 
  Compass, 
  Package as PackageIcon, 
  Trash2, 
  Save, 
  Download, 
  Share2, 
  CreditCard, 
  AlertCircle,
  CheckCircle,
  Plus,
  Edit3,
  X,
  DollarSign,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { format, addDays, isSameDay, parseISO } from 'date-fns';
import { GolfCourse, Hotel, Restaurant, Experience, Package } from '../types';
import StripeCheckout from './StripeCheckout';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ItineraryBuilderProps {
  onAddItems?: () => void;
}

const ItineraryBuilder: React.FC<ItineraryBuilderProps> = ({ onAddItems }) => {
  const dispatch = useAppDispatch();
  const { 
    golfCourses, 
    hotels, 
    restaurants, 
    experiences, 
    packages, 
    notes,
    loading,
    error
  } = useAppSelector(state => state.itinerary);
  const { user } = useAppSelector(state => state.user);
  
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState(notes);
  const [showCheckout, setShowCheckout] = useState(false);
  const [savingItinerary, setSavingItinerary] = useState(false);
  const [itineraryName, setItineraryName] = useState('My Golf Getaway');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [currentView, setCurrentView] = useState<'list' | 'calendar'>('list');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(addDays(new Date(), 3));
  const [scheduledItems, setScheduledItems] = useState<any[]>([]);
  const [draggedItem, setDraggedItem] = useState<any | null>(null);
  const [draggedItemType, setDraggedItemType] = useState<string | null>(null);
  
  // Calculate total cost
  const totalCost = 
    golfCourses.reduce((sum, course) => sum + course.price, 0) +
    hotels.reduce((sum, hotel) => sum + hotel.price_per_night, 0) +
    experiences.reduce((sum, exp) => sum + exp.price, 0) +
    packages.reduce((sum, pkg) => sum + pkg.price, 0);
  
  // Calculate total items
  const totalItems = 
    golfCourses.length +
    hotels.length +
    restaurants.length +
    experiences.length +
    packages.length;
  
  useEffect(() => {
    setEditedNotes(notes);
  }, [notes]);
  
  useEffect(() => {
    // Initialize scheduled items
    const initialSchedule: any[] = [];
    
    // Add golf courses
    golfCourses.forEach((course, index) => {
      const day = index % Math.max(1, Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
      const date = addDays(startDate, day);
      initialSchedule.push({
        id: `golf_${course.id}`,
        type: 'golf',
        item: course,
        date: format(date, 'yyyy-MM-dd'),
        time: '09:00',
        duration: 4 * 60, // 4 hours in minutes
      });
    });
    
    // Add hotels (spanning multiple days)
    hotels.forEach((hotel) => {
      initialSchedule.push({
        id: `hotel_${hotel.id}`,
        type: 'hotel',
        item: hotel,
        date: format(startDate, 'yyyy-MM-dd'),
        time: '15:00', // Check-in
        duration: 24 * 60, // 24 hours in minutes
        endDate: format(endDate, 'yyyy-MM-dd'),
        endTime: '11:00', // Check-out
      });
    });
    
    // Add restaurants
    restaurants.forEach((restaurant, index) => {
      const day = index % Math.max(1, Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
      const date = addDays(startDate, day);
      initialSchedule.push({
        id: `restaurant_${restaurant.id}`,
        type: 'restaurant',
        item: restaurant,
        date: format(date, 'yyyy-MM-dd'),
        time: '19:00',
        duration: 2 * 60, // 2 hours in minutes
      });
    });
    
    // Add experiences
    experiences.forEach((experience, index) => {
      const day = index % Math.max(1, Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
      const date = addDays(startDate, day);
      initialSchedule.push({
        id: `experience_${experience.id}`,
        type: 'experience',
        item: experience,
        date: format(date, 'yyyy-MM-dd'),
        time: '14:00',
        duration: 2 * 60, // 2 hours in minutes
      });
    });
    
    setScheduledItems(initialSchedule);
  }, [golfCourses, hotels, restaurants, experiences, startDate, endDate]);
  
  const handleSaveNotes = () => {
    dispatch(updateNotes(editedNotes));
    setIsEditingNotes(false);
  };
  
  const handleSaveItinerary = async () => {
    if (!user) {
      dispatch(addNotification({
        type: 'error',
        message: 'You must be signed in to save an itinerary',
        duration: 5000,
      }));
      return;
    }
    
    setSavingItinerary(true);
    
    try {
      await dispatch(saveItinerary(itineraryName)).unwrap();
      setShowSaveModal(false);
      dispatch(addNotification({
        type: 'success',
        message: 'Itinerary saved successfully!',
        duration: 3000,
      }));
    } catch (error) {
      console.error('Error saving itinerary:', error);
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to save itinerary. Please try again.',
        duration: 5000,
      }));
    } finally {
      setSavingItinerary(false);
    }
  };
  
  const handleGeneratePDF = async () => {
    const element = document.getElementById('itinerary-content');
    if (!element) return;
    
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        logging: false,
        useCORS: true,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 30;
      
      // Add title
      pdf.setFontSize(20);
      pdf.setTextColor(40, 40, 40);
      pdf.text('Your Golf Getaway Itinerary', pdfWidth / 2, 20, { align: 'center' });
      
      // Add image
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      
      // Add footer
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text('Generated by GolfGenie AI - golfgenie.ai', pdfWidth / 2, pdfHeight - 10, { align: 'center' });
      
      pdf.save('golf-itinerary.pdf');
      
      dispatch(addNotification({
        type: 'success',
        message: 'Itinerary PDF generated successfully!',
        duration: 3000,
      }));
    } catch (error) {
      console.error('Error generating PDF:', error);
      dispatch(addNotification({
        type: 'error',
        message: 'Failed to generate PDF. Please try again.',
        duration: 5000,
      }));
    }
  };
  
  const handleCheckout = () => {
    setShowCheckout(true);
  };
  
  const handlePaymentSuccess = async (paymentId: string) => {
    setShowCheckout(false);
    
    // Create bookings for each item
    try {
      // Book golf courses
      for (const course of golfCourses) {
        const scheduledCourse = scheduledItems.find(item => item.type === 'golf' && item.item.id === course.id);
        
        if (scheduledCourse) {
          await dispatch(createBooking({
            user_id: user!.id,
            booking_type: 'golf',
            item_id: course.id,
            booking_date: scheduledCourse.date,
            booking_time: scheduledCourse.time,
            party_size: 4, // Default party size
            status: 'confirmed',
            total_price: course.price * 4, // Price for 4 players
            confirmation_code: `GC${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
            customer_info: {
              name: user?.user_metadata?.name || 'Guest',
              email: user?.email || '',
              phone: user?.user_metadata?.phone || '',
            },
          })).unwrap();
        }
      }
      
      // Book hotels
      for (const hotel of hotels) {
        const scheduledHotel = scheduledItems.find(item => item.type === 'hotel' && item.item.id === hotel.id);
        
        if (scheduledHotel) {
          await dispatch(createBooking({
            user_id: user!.id,
            booking_type: 'hotel',
            item_id: hotel.id,
            booking_date: scheduledHotel.date,
            end_date: scheduledHotel.endDate,
            party_size: 2, // Default party size
            status: 'confirmed',
            total_price: hotel.price_per_night * 3, // 3 nights
            confirmation_code: `HB${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
            customer_info: {
              name: user?.user_metadata?.name || 'Guest',
              email: user?.email || '',
              phone: user?.user_metadata?.phone || '',
            },
          })).unwrap();
        }
      }
      
      // Book restaurants
      for (const restaurant of restaurants) {
        const scheduledRestaurant = scheduledItems.find(item => item.type === 'restaurant' && item.item.id === restaurant.id);
        
        if (scheduledRestaurant) {
          await dispatch(createBooking({
            user_id: user!.id,
            booking_type: 'restaurant',
            item_id: restaurant.id,
            booking_date: scheduledRestaurant.date,
            booking_time: scheduledRestaurant.time,
            party_size: 4, // Default party size
            status: 'confirmed',
            total_price: 0, // Restaurants don't have upfront costs
            confirmation_code: `RB${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
            customer_info: {
              name: user?.user_metadata?.name || 'Guest',
              email: user?.email || '',
              phone: user?.user_metadata?.phone || '',
            },
          })).unwrap();
        }
      }
      
      // Book experiences
      for (const experience of experiences) {
        const scheduledExperience = scheduledItems.find(item => item.type === 'experience' && item.item.id === experience.id);
        
        if (scheduledExperience) {
          await dispatch(createBooking({
            user_id: user!.id,
            booking_type: 'experience',
            item_id: experience.id,
            booking_date: scheduledExperience.date,
            booking_time: scheduledExperience.time,
            party_size: 4, // Default party size
            status: 'confirmed',
            total_price: experience.price * 4, // Price for 4 people
            confirmation_code: `EB${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
            customer_info: {
              name: user?.user_metadata?.name || 'Guest',
              email: user?.email || '',
              phone: user?.user_metadata?.phone || '',
            },
          })).unwrap();
        }
      }
      
      dispatch(addNotification({
        type: 'success',
        message: 'All items booked successfully! Check your bookings for details.',
        duration: 5000,
      }));
      
      // Clear the itinerary after successful booking
      dispatch(clearItinerary());
    } catch (error) {
      console.error('Error creating bookings:', error);
      dispatch(addNotification({
        type: 'error',
        message: 'Some bookings failed. Please check your bookings for details.',
        duration: 5000,
      }));
    }
  };
  
  const handleScheduleChange = (itemId: string, changes: Partial<any>) => {
    setScheduledItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, ...changes } : item
      )
    );
  };
  
  const handleDragStart = (item: any, type: string) => {
    setDraggedItem(item);
    setDraggedItemType(type);
  };
  
  const handleDrop = (date: string, time: string) => {
    if (!draggedItem || !draggedItemType) return;
    
    // Find if this item is already scheduled
    const existingItem = scheduledItems.find(item => 
      item.type === draggedItemType && item.item.id === draggedItem.id
    );
    
    if (existingItem) {
      // Update existing scheduled item
      handleScheduleChange(existingItem.id, { date, time });
    } else {
      // Add new scheduled item
      const newScheduledItem = {
        id: `${draggedItemType}_${draggedItem.id}`,
        type: draggedItemType,
        item: draggedItem,
        date,
        time,
        duration: getDurationForType(draggedItemType),
      };
      
      setScheduledItems(prev => [...prev, newScheduledItem]);
    }
    
    setDraggedItem(null);
    setDraggedItemType(null);
  };
  
  const getDurationForType = (type: string): number => {
    switch (type) {
      case 'golf':
        return 4 * 60; // 4 hours
      case 'restaurant':
        return 2 * 60; // 2 hours
      case 'experience':
        return 3 * 60; // 3 hours
      case 'hotel':
        return 24 * 60; // 24 hours
      default:
        return 2 * 60; // 2 hours default
    }
  };
  
  const checkForTimeConflicts = () => {
    const conflicts: string[] = [];
    
    // Check each scheduled item against all others
    scheduledItems.forEach((item1, i) => {
      scheduledItems.forEach((item2, j) => {
        // Skip comparing an item with itself
        if (i === j) return;
        
        // Skip if not on the same day
        if (item1.date !== item2.date) return;
        
        // Convert times to minutes since midnight
        const time1Start = timeToMinutes(item1.time);
        const time1End = time1Start + item1.duration;
        
        const time2Start = timeToMinutes(item2.time);
        const time2End = time2Start + item2.duration;
        
        // Check for overlap
        if (
          (time1Start >= time2Start && time1Start < time2End) || // item1 starts during item2
          (time1End > time2Start && time1End <= time2End) || // item1 ends during item2
          (time1Start <= time2Start && time1End >= time2End) // item1 completely contains item2
        ) {
          conflicts.push(`${item1.item.name} conflicts with ${item2.item.name} on ${item1.date}`);
        }
      });
    });
    
    return conflicts;
  };
  
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  const generateDays = () => {
    const days = [];
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      days.push(new Date(currentDate));
      currentDate = addDays(currentDate, 1);
    }
    
    return days;
  };
  
  const getItemsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return scheduledItems.filter(item => item.date === dateStr);
  };
  
  const getTimeSlots = () => {
    const slots = [];
    for (let hour = 6; hour < 22; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }
    return slots;
  };
  
  const isEmpty = totalItems === 0;
  
  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Your Golf Itinerary</h2>
              <p className="text-blue-100 text-sm">
                {totalItems} {totalItems === 1 ? 'item' : 'items'} • ${totalCost.toLocaleString()} estimated total
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentView('list')}
              className={`p-2 rounded-lg ${
                currentView === 'list' 
                  ? 'bg-white text-blue-600' 
                  : 'bg-blue-500 text-white hover:bg-blue-400'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentView('calendar')}
              className={`p-2 rounded-lg ${
                currentView === 'calendar' 
                  ? 'bg-white text-blue-600' 
                  : 'bg-blue-500 text-white hover:bg-blue-400'
              }`}
            >
              <Calendar className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Date Range Selector (for Calendar View) */}
      {currentView === 'calendar' && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={format(startDate, 'yyyy-MM-dd')}
                  onChange={(e) => setStartDate(new Date(e.target.value))}
                  className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={format(endDate, 'yyyy-MM-dd')}
                  min={format(startDate, 'yyyy-MM-dd')}
                  onChange={(e) => setEndDate(new Date(e.target.value))}
                  className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              {Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1} days
            </div>
          </div>
          
          {/* Time Conflict Warnings */}
          {currentView === 'calendar' && checkForTimeConflicts().length > 0 && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-amber-800">Scheduling Conflicts Detected</h4>
                  <ul className="mt-1 text-xs text-amber-700 space-y-1">
                    {checkForTimeConflicts().slice(0, 3).map((conflict, index) => (
                      <li key={index}>• {conflict}</li>
                    ))}
                    {checkForTimeConflicts().length > 3 && (
                      <li>• ...and {checkForTimeConflicts().length - 3} more conflicts</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Content */}
      <div id="itinerary-content" className="p-6">
        {isEmpty ? (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Your itinerary is empty</h3>
            <p className="text-gray-600 mb-6">Start building your perfect golf getaway by adding courses, hotels, restaurants, and experiences.</p>
            <button
              onClick={onAddItems}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 inline-flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Add Items to Itinerary</span>
            </button>
          </div>
        ) : currentView === 'list' ? (
          <div className="space-y-8">
            {/* Golf Courses */}
            {golfCourses.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Trophy className="h-5 w-5 text-emerald-600" />
                  <span>Golf Courses ({golfCourses.length})</span>
                </h3>
                <div className="space-y-4">
                  {golfCourses.map((course) => (
                    <div key={course.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900 mb-1">{course.name}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-2">
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              <span>{course.address}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <DollarSign className="h-4 w-4 text-gray-400" />
                              <span>${course.price}/round</span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full text-xs">
                              {course.difficulty}
                            </span>
                            <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full text-xs">
                              {course.holes} holes
                            </span>
                            <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full text-xs">
                              Par {course.par}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => dispatch(removeGolfCourse(course.id))}
                          className="text-red-500 hover:text-red-700 p-1"
                          aria-label="Remove course"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Hotels */}
            {hotels.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Building className="h-5 w-5 text-blue-600" />
                  <span>Hotels ({hotels.length})</span>
                </h3>
                <div className="space-y-4">
                  {hotels.map((hotel) => (
                    <div key={hotel.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900 mb-1">{hotel.name}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-2">
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              <span>{hotel.address}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <DollarSign className="h-4 w-4 text-gray-400" />
                              <span>${hotel.price_per_night}/night</span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {hotel.amenities.slice(0, 3).map((amenity, index) => (
                              <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                {amenity}
                              </span>
                            ))}
                            {hotel.amenities.length > 3 && (
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                +{hotel.amenities.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => dispatch(removeHotel(hotel.id))}
                          className="text-red-500 hover:text-red-700 p-1"
                          aria-label="Remove hotel"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Restaurants */}
            {restaurants.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Utensils className="h-5 w-5 text-amber-600" />
                  <span>Restaurants ({restaurants.length})</span>
                </h3>
                <div className="space-y-4">
                  {restaurants.map((restaurant) => (
                    <div key={restaurant.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900 mb-1">{restaurant.name}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-2">
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              <span>{restaurant.address}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <span>{restaurant.hours}</span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs">
                              {restaurant.cuisine_type}
                            </span>
                            <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs">
                              {restaurant.price_range}
                            </span>
                            {restaurant.opentable_id && (
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                                OpenTable
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => dispatch(removeRestaurant(restaurant.id))}
                          className="text-red-500 hover:text-red-700 p-1"
                          aria-label="Remove restaurant"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Experiences */}
            {experiences.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Compass className="h-5 w-5 text-purple-600" />
                  <span>Experiences ({experiences.length})</span>
                </h3>
                <div className="space-y-4">
                  {experiences.map((experience) => (
                    <div key={experience.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900 mb-1">{experience.name}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-2">
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              <span>{experience.address}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <DollarSign className="h-4 w-4 text-gray-400" />
                              <span>${experience.price}/person</span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                              {experience.category}
                            </span>
                            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                              {experience.duration}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => dispatch(removeExperience(experience.id))}
                          className="text-red-500 hover:text-red-700 p-1"
                          aria-label="Remove experience"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Packages */}
            {packages.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <PackageIcon className="h-5 w-5 text-indigo-600" />
                  <span>Packages ({packages.length})</span>
                </h3>
                <div className="space-y-4">
                  {packages.map((pkg) => (
                    <div key={pkg.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900 mb-1">{pkg.name}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-2">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span>{pkg.duration}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <DollarSign className="h-4 w-4 text-gray-400" />
                              <span>${pkg.price.toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="mt-2">
                            <h5 className="text-sm font-medium text-gray-900 mb-1">Includes:</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                              {pkg.includes.slice(0, 4).map((item, index) => (
                                <div key={index} className="flex items-center space-x-2 text-xs text-gray-600">
                                  <CheckCircle className="h-3 w-3 text-indigo-600" />
                                  <span>{item}</span>
                                </div>
                              ))}
                              {pkg.includes.length > 4 && (
                                <div className="text-xs text-indigo-600">
                                  +{pkg.includes.length - 4} more inclusions
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => dispatch(removePackage(pkg.id))}
                          className="text-red-500 hover:text-red-700 p-1"
                          aria-label="Remove package"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Notes */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <Edit3 className="h-5 w-5 text-gray-600" />
                  <span>Notes</span>
                </h3>
                {!isEditingNotes ? (
                  <button
                    onClick={() => setIsEditingNotes(true)}
                    className="text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                  >
                    <Edit3 className="h-4 w-4" />
                    <span>Edit</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsEditingNotes(false);
                      setEditedNotes(notes);
                    }}
                    className="text-gray-600 hover:text-gray-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              {isEditingNotes ? (
                <div className="space-y-3">
                  <textarea
                    value={editedNotes}
                    onChange={(e) => setEditedNotes(e.target.value)}
                    placeholder="Add notes about your trip, special requirements, preferences, etc."
                    className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveNotes}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2"
                    >
                      <Save className="h-4 w-4" />
                      <span>Save Notes</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4 min-h-[100px]">
                  {notes ? (
                    <p className="text-gray-700 whitespace-pre-wrap">{notes}</p>
                  ) : (
                    <p className="text-gray-500 italic">No notes added yet. Click "Edit" to add trip notes.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Calendar View</h3>
            
            {/* Calendar Grid */}
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Time slots */}
                <div className="grid grid-cols-[100px_1fr] gap-4">
                  <div className="pt-8 border-r border-gray-200">
                    {/* Time labels */}
                    <div className="space-y-6">
                      {getTimeSlots().map(time => (
                        <div key={time} className="h-24 -mb-3 text-right pr-2">
                          <span className="text-xs font-medium text-gray-500">{time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    {/* Days */}
                    <div className="grid grid-cols-1 divide-y divide-gray-200">
                      <div className="grid grid-cols-7 gap-2 pb-2">
                        {generateDays().map((day, index) => (
                          <div key={index} className="text-center">
                            <div className="font-medium text-gray-900">
                              {format(day, 'EEE')}
                            </div>
                            <div className="text-sm text-gray-500">
                              {format(day, 'MMM d')}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Time grid */}
                      <div className="pt-4">
                        {getTimeSlots().map(time => (
                          <div key={time} className="grid grid-cols-7 gap-2 mb-6">
                            {generateDays().map((day, dayIndex) => {
                              const dateStr = format(day, 'yyyy-MM-dd');
                              const itemsAtTime = scheduledItems.filter(item => 
                                item.date === dateStr && item.time === time
                              );
                              
                              return (
                                <div 
                                  key={dayIndex}
                                  className="h-24 border border-gray-200 rounded-lg p-1 relative"
                                  onDragOver={(e) => e.preventDefault()}
                                  onDrop={() => handleDrop(dateStr, time)}
                                >
                                  {itemsAtTime.map(item => (
                                    <div 
                                      key={item.id}
                                      className={`absolute inset-0 m-1 p-2 rounded-lg overflow-hidden text-xs ${
                                        item.type === 'golf' ? 'bg-emerald-100 text-emerald-800' :
                                        item.type === 'hotel' ? 'bg-blue-100 text-blue-800' :
                                        item.type === 'restaurant' ? 'bg-amber-100 text-amber-800' :
                                        item.type === 'experience' ? 'bg-purple-100 text-purple-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}
                                    >
                                      <div className="font-medium truncate">{item.item.name}</div>
                                      <div className="truncate">{item.time}</div>
                                    </div>
                                  ))}
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Draggable Items */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Drag items to schedule:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {golfCourses.map(course => (
                  <div
                    key={course.id}
                    draggable
                    onDragStart={() => handleDragStart(course, 'golf')}
                    className="bg-emerald-100 text-emerald-800 p-2 rounded-lg cursor-move text-sm"
                  >
                    <div className="font-medium">{course.name}</div>
                    <div className="text-xs">Golf Course • ${course.price}</div>
                  </div>
                ))}
                
                {hotels.map(hotel => (
                  <div
                    key={hotel.id}
                    draggable
                    onDragStart={() => handleDragStart(hotel, 'hotel')}
                    className="bg-blue-100 text-blue-800 p-2 rounded-lg cursor-move text-sm"
                  >
                    <div className="font-medium">{hotel.name}</div>
                    <div className="text-xs">Hotel • ${hotel.price_per_night}/night</div>
                  </div>
                ))}
                
                {restaurants.map(restaurant => (
                  <div
                    key={restaurant.id}
                    draggable
                    onDragStart={() => handleDragStart(restaurant, 'restaurant')}
                    className="bg-amber-100 text-amber-800 p-2 rounded-lg cursor-move text-sm"
                  >
                    <div className="font-medium">{restaurant.name}</div>
                    <div className="text-xs">Restaurant • {restaurant.cuisine_type}</div>
                  </div>
                ))}
                
                {experiences.map(experience => (
                  <div
                    key={experience.id}
                    draggable
                    onDragStart={() => handleDragStart(experience, 'experience')}
                    className="bg-purple-100 text-purple-800 p-2 rounded-lg cursor-move text-sm"
                  >
                    <div className="font-medium">{experience.name}</div>
                    <div className="text-xs">Experience • ${experience.price}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer with Actions */}
      {!isEmpty && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-wrap gap-3 justify-between">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowSaveModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>Save Itinerary</span>
              </button>
              <button
                onClick={handleGeneratePDF}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Export PDF</span>
              </button>
              <button
                onClick={() => {
                  // This would open a share modal in a real app
                  alert('Share functionality would be implemented here');
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2"
              >
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </button>
            </div>
            
            <button
              onClick={handleCheckout}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-sm font-medium flex items-center space-x-2"
            >
              <CreditCard className="h-4 w-4" />
              <span>Book All (${totalCost.toLocaleString()})</span>
            </button>
          </div>
        </div>
      )}
      
      {/* Save Itinerary Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Save Itinerary</h3>
                <button 
                  onClick={() => setShowSaveModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Itinerary Name
                  </label>
                  <input
                    type="text"
                    value={itineraryName}
                    onChange={(e) => setItineraryName(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="My Golf Getaway"
                  />
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-800">Itinerary Summary</h4>
                      <ul className="mt-2 text-sm text-blue-700 space-y-1">
                        <li>{golfCourses.length} Golf Courses</li>
                        <li>{hotels.length} Hotels</li>
                        <li>{restaurants.length} Restaurants</li>
                        <li>{experiences.length} Experiences</li>
                        <li>{packages.length} Packages</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleSaveItinerary}
                  disabled={savingItinerary || !itineraryName.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-3 px-4 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  {savingItinerary ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Save Itinerary</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Stripe Checkout Modal */}
      {showCheckout && (
        <StripeCheckout
          isOpen={showCheckout}
          onClose={() => setShowCheckout(false)}
          onSuccess={handlePaymentSuccess}
          amount={totalCost * 100} // Convert to cents for Stripe
          description={`Golf Itinerary with ${golfCourses.length} courses, ${hotels.length} hotels, and more`}
          items={[
            ...golfCourses.map(course => ({
              id: course.id,
              name: course.name,
              price: course.price,
              quantity: 1,
              type: 'golf' as const,
            })),
            ...hotels.map(hotel => ({
              id: hotel.id,
              name: hotel.name,
              price: hotel.price_per_night,
              quantity: 1,
              type: 'hotel' as const,
            })),
            ...experiences.map(experience => ({
              id: experience.id,
              name: experience.name,
              price: experience.price,
              quantity: 1,
              type: 'experience' as const,
            })),
            ...packages.map(pkg => ({
              id: pkg.id,
              name: pkg.name,
              price: pkg.price,
              quantity: 1,
              type: 'package' as const,
            })),
          ]}
        />
      )}
    </div>
  );
};

export default ItineraryBuilder;