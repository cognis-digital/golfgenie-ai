import React, { useState } from 'react';
import { Calendar, Users, Trophy, CalendarDays, ToggleLeft, ToggleRight, Zap } from 'lucide-react';
import { format, addDays } from 'date-fns';

interface BookingData {
  dates: {
    start: string;
    end: string;
    flexible: boolean;
  };
  golfers: number;
  rounds: number;
}

interface BookingFiltersProps {
  bookingData: BookingData;
  onBookingDataChange: (data: BookingData) => void;
  onPlanTrip: () => void;
}

const BookingFilters: React.FC<BookingFiltersProps> = ({
  bookingData,
  onBookingDataChange,
  onPlanTrip
}) => {
  const [expanded, setExpanded] = useState(false);

  const updateBookingData = (updates: Partial<BookingData>) => {
    onBookingDataChange({ ...bookingData, ...updates });
  };

  const updateDates = (updates: Partial<BookingData['dates']>) => {
    onBookingDataChange({
      ...bookingData,
      dates: { ...bookingData.dates, ...updates }
    });
  };

  const getMinDate = () => {
    const today = new Date();
    return format(today, 'yyyy-MM-dd');
  };

  const getMinEndDate = () => {
    if (!bookingData.dates.start) return getMinDate();
    const startDate = new Date(bookingData.dates.start);
    return format(addDays(startDate, 1), 'yyyy-MM-dd');
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 md:p-8 max-w-4xl mx-auto">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Plan Your Golf Getaway</h3>
        <p className="text-gray-600">Tell us your preferences and let our AI create the perfect itinerary</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Date Selection */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-3">
            <Calendar className="h-5 w-5 text-emerald-600" />
            <label className="text-sm font-semibold text-gray-700">Travel Dates</label>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Check-in</label>
              <input
                type="date"
                value={bookingData.dates.start}
                min={getMinDate()}
                onChange={(e) => updateDates({ start: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Check-out</label>
              <input
                type="date"
                value={bookingData.dates.end}
                min={getMinEndDate()}
                onChange={(e) => updateDates({ end: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => updateDates({ flexible: !bookingData.dates.flexible })}
              className="flex items-center space-x-2 text-sm text-gray-600 hover:text-emerald-600 transition-colors"
            >
              {bookingData.dates.flexible ? (
                <ToggleRight className="h-5 w-5 text-emerald-600" />
              ) : (
                <ToggleLeft className="h-5 w-5 text-gray-400" />
              )}
              <span>Flexible dates</span>
            </button>
          </div>
        </div>

        {/* Number of Golfers */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-3">
            <Users className="h-5 w-5 text-emerald-600" />
            <label className="text-sm font-semibold text-gray-700">Number of Golfers</label>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => updateBookingData({ golfers: Math.max(1, bookingData.golfers - 1) })}
              className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-semibold transition-colors"
            >
              -
            </button>
            <div className="flex-1 text-center">
              <div className="text-2xl font-bold text-gray-900">{bookingData.golfers}</div>
              <div className="text-xs text-gray-500">golfer{bookingData.golfers !== 1 ? 's' : ''}</div>
            </div>
            <button
              onClick={() => updateBookingData({ golfers: Math.min(8, bookingData.golfers + 1) })}
              className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-semibold transition-colors"
            >
              +
            </button>
          </div>
          
          <div className="text-xs text-gray-500 text-center">
            Maximum 8 golfers per group
          </div>
        </div>

        {/* Number of Rounds */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-3">
            <Trophy className="h-5 w-5 text-emerald-600" />
            <label className="text-sm font-semibold text-gray-700">Golf Rounds</label>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => updateBookingData({ rounds: Math.max(1, bookingData.rounds - 1) })}
              className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-semibold transition-colors"
            >
              -
            </button>
            <div className="flex-1 text-center">
              <div className="text-2xl font-bold text-gray-900">{bookingData.rounds}</div>
              <div className="text-xs text-gray-500">round{bookingData.rounds !== 1 ? 's' : ''}</div>
            </div>
            <button
              onClick={() => updateBookingData({ rounds: Math.min(7, bookingData.rounds + 1) })}
              className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-semibold transition-colors"
            >
              +
            </button>
          </div>
          
          <div className="text-xs text-gray-500 text-center">
            Up to 7 rounds per trip
          </div>
        </div>
      </div>

      {/* Plan Trip Button */}
      <div className="mt-8 text-center">
        <button
          onClick={() => {
            if (expanded) {
              onPlanTrip();
            } else {
              setExpanded(true);
            }
          }}
          disabled={expanded && (!bookingData.dates.start || !bookingData.dates.end)}
          className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-400 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg disabled:transform-none disabled:shadow-none flex items-center justify-center space-x-2 mx-auto"
        >
          <Zap className="h-5 w-5" />
          <span>{expanded ? 'Let AI Plan My Trip' : 'Start Planning'}</span>
        </button>
        <p className="text-xs text-gray-500 mt-2">
          Free service • No hidden fees • Instant recommendations
        </p>
      </div>
    </div>
  );
};

export default BookingFilters;