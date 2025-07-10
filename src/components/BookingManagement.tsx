import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Trophy, Building, Utensils, Compass, Car, Clock, DollarSign, CheckCircle, XCircle, Edit, Trash, Download, Printer, Share2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

interface Booking {
  id: string;
  booking_type: 'golf' | 'hotel' | 'restaurant' | 'experience' | 'transportation' | 'package';
  item_id: string;
  item_name: string;
  booking_date: string;
  booking_time?: string;
  end_date?: string;
  party_size: number;
  status: 'confirmed' | 'pending' | 'cancelled';
  total_price: number;
  confirmation_code: string;
  customer_info: any;
  special_requests?: string;
  created_at: string;
}

interface BookingManagementProps {
  userId: string;
}

const BookingManagement: React.FC<BookingManagementProps> = ({ userId }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, [userId]);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', userId)
        .order('booking_date', { ascending: true });

      if (error) {
        throw error;
      }

      // In a real app, we would fetch item details for each booking
      // For now, we'll add mock item names
      const bookingsWithNames = data.map(booking => ({
        ...booking,
        item_name: getItemNameById(booking.booking_type, booking.item_id)
      }));

      setBookings(bookingsWithNames);
    } catch (err: any) {
      console.error('Error fetching bookings:', err);
      setError(err.message || 'Failed to load bookings');
      
      // Set mock data for demo
      setBookings(generateMockBookings());
    } finally {
      setLoading(false);
    }
  };

  const getItemNameById = (type: string, id: string): string => {
    // In a real app, this would look up the item name from the database
    // For now, we'll return a mock name
    const typeNames = {
      golf: 'Golf Course',
      hotel: 'Hotel',
      restaurant: 'Restaurant',
      experience: 'Experience',
      transportation: 'Transportation',
      package: 'Package'
    };
    
    return `${typeNames[type as keyof typeof typeNames]} ${id.slice(-2)}`;
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (error) {
        throw error;
      }

      // Update local state
      setBookings(prev => 
        prev.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: 'cancelled' } 
            : booking
        )
      );

      alert('Booking cancelled successfully');
    } catch (err: any) {
      console.error('Error cancelling booking:', err);
      alert(err.message || 'Failed to cancel booking');
    }
  };

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowModal(true);
  };

  const handlePrintConfirmation = (booking: Booking) => {
    // In a real app, this would generate a PDF or print view
    window.print();
  };

  const getBookingTypeIcon = (type: string) => {
    switch (type) {
      case 'golf': return <Trophy className="h-5 w-5 text-emerald-600" />;
      case 'hotel': return <Building className="h-5 w-5 text-blue-600" />;
      case 'restaurant': return <Utensils className="h-5 w-5 text-amber-600" />;
      case 'experience': return <Compass className="h-5 w-5 text-purple-600" />;
      case 'transportation': return <Car className="h-5 w-5 text-gray-600" />;
      case 'package': return <Calendar className="h-5 w-5 text-indigo-600" />;
      default: return <Calendar className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
          <CheckCircle className="h-3 w-3" />
          <span>Confirmed</span>
        </span>;
      case 'pending':
        return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
          <Clock className="h-3 w-3" />
          <span>Pending</span>
        </span>;
      case 'cancelled':
        return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
          <XCircle className="h-3 w-3" />
          <span>Cancelled</span>
        </span>;
      default:
        return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">
          {status}
        </span>;
    }
  };

  const filteredBookings = filter === 'all' 
    ? bookings 
    : filter === 'upcoming' 
      ? bookings.filter(b => new Date(b.booking_date) >= new Date() && b.status !== 'cancelled')
      : bookings.filter(b => b.booking_type === filter);

  if (loading) {
    return (
      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your bookings...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-start space-x-3">
              <XCircle className="h-6 w-6 text-red-600 mt-0.5" />
              <div>
                <h3 className="text-lg font-medium text-red-800">Error Loading Bookings</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <button
                  onClick={fetchBookings}
                  className="mt-3 bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-blue-600 p-6">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">My Bookings</h2>
                <p className="text-emerald-100 text-sm">Manage your reservations and itinerary</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  filter === 'all' 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                All Bookings
              </button>
              <button
                onClick={() => setFilter('upcoming')}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  filter === 'upcoming' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                Upcoming
              </button>
              <button
                onClick={() => setFilter('golf')}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  filter === 'golf' 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                Golf
              </button>
              <button
                onClick={() => setFilter('hotel')}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  filter === 'hotel' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                Hotels
              </button>
              <button
                onClick={() => setFilter('restaurant')}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  filter === 'restaurant' 
                    ? 'bg-amber-100 text-amber-800' 
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                Restaurants
              </button>
              <button
                onClick={() => setFilter('experience')}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  filter === 'experience' 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                Experiences
              </button>
            </div>
          </div>

          {/* Bookings List */}
          <div className="divide-y divide-gray-200">
            {filteredBookings.length === 0 ? (
              <div className="p-8 text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
                <p className="text-gray-600 mb-4">You don't have any {filter !== 'all' ? filter : ''} bookings yet.</p>
                <button
                  onClick={() => window.location.href = '#assistant'}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Plan a Trip
                </button>
              </div>
            ) : (
              filteredBookings.map((booking) => (
                <div key={booking.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start space-x-4 mb-4 md:mb-0">
                      <div className="bg-gray-100 p-3 rounded-lg">
                        {getBookingTypeIcon(booking.booking_type)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-bold text-gray-900">{booking.item_name}</h3>
                          {getStatusBadge(booking.status)}
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4" />
                            <span>{format(new Date(booking.booking_date), 'MMMM d, yyyy')}</span>
                            {booking.booking_time && (
                              <>
                                <Clock className="h-4 w-4 ml-2" />
                                <span>{booking.booking_time}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                            {booking.party_size} {booking.booking_type === 'golf' ? 'Golfers' : 'People'}
                          </span>
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center space-x-1">
                            <DollarSign className="h-3 w-3" />
                            <span>${booking.total_price.toLocaleString()}</span>
                          </span>
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            Conf: {booking.confirmation_code}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleViewDetails(booking)}
                        className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-1"
                      >
                        <Calendar className="h-4 w-4" />
                        <span>Details</span>
                      </button>
                      {booking.status === 'confirmed' && new Date(booking.booking_date) > new Date() && (
                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-1"
                        >
                          <XCircle className="h-4 w-4" />
                          <span>Cancel</span>
                        </button>
                      )}
                      <button
                        onClick={() => handlePrintConfirmation(booking)}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-1"
                      >
                        <Printer className="h-4 w-4" />
                        <span>Print</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Booking Details Modal */}
      {showModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-gray-100 p-3 rounded-lg">
                    {getBookingTypeIcon(selectedBooking.booking_type)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{selectedBooking.item_name}</h3>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(selectedBooking.status)}
                      <span className="text-sm text-gray-600">
                        Booked on {format(new Date(selectedBooking.created_at), 'MMMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Booking Details */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">Booking Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Date</p>
                      <p className="font-medium">{format(new Date(selectedBooking.booking_date), 'MMMM d, yyyy')}</p>
                    </div>
                    {selectedBooking.booking_time && (
                      <div>
                        <p className="text-gray-600">Time</p>
                        <p className="font-medium">{selectedBooking.booking_time}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-600">Confirmation Code</p>
                      <p className="font-medium">{selectedBooking.confirmation_code}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Party Size</p>
                      <p className="font-medium">{selectedBooking.party_size} {selectedBooking.booking_type === 'golf' ? 'Golfers' : 'People'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Total Price</p>
                      <p className="font-medium">${selectedBooking.total_price.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Status</p>
                      <p className="font-medium">{selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}</p>
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Customer Information</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Name</p>
                        <p className="font-medium">{selectedBooking.customer_info?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Email</p>
                        <p className="font-medium">{selectedBooking.customer_info?.email || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Phone</p>
                        <p className="font-medium">{selectedBooking.customer_info?.phone || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Special Requests */}
                {selectedBooking.special_requests && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Special Requests</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm">{selectedBooking.special_requests}</p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                  {selectedBooking.status === 'confirmed' && new Date(selectedBooking.booking_date) > new Date() && (
                    <button
                      onClick={() => {
                        handleCancelBooking(selectedBooking.id);
                        setShowModal(false);
                      }}
                      className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Cancel Booking</span>
                    </button>
                  )}
                  <button
                    onClick={() => handlePrintConfirmation(selectedBooking)}
                    className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Print Confirmation</span>
                  </button>
                  <button
                    onClick={() => {
                      // In a real app, this would generate a shareable link
                      alert('Booking details copied to clipboard!');
                    }}
                    className="bg-purple-100 hover:bg-purple-200 text-purple-800 px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2"
                  >
                    <Share2 className="h-4 w-4" />
                    <span>Share Details</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to generate mock bookings for demo
const generateMockBookings = (): Booking[] => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  
  return [
    {
      id: 'booking_1',
      booking_type: 'golf',
      item_id: '1',
      item_name: 'TPC Myrtle Beach',
      booking_date: nextWeek.toISOString().split('T')[0],
      booking_time: '8:30 AM',
      party_size: 4,
      status: 'confirmed',
      total_price: 756,
      confirmation_code: 'GT123456',
      customer_info: {
        name: 'John Smith',
        email: 'john@example.com',
        phone: '(555) 123-4567'
      },
      created_at: today.toISOString()
    },
    {
      id: 'booking_2',
      booking_type: 'hotel',
      item_id: '1',
      item_name: 'The Ocean House',
      booking_date: nextWeek.toISOString().split('T')[0],
      end_date: new Date(nextWeek.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      party_size: 4,
      status: 'confirmed',
      total_price: 1167,
      confirmation_code: 'HB789012',
      customer_info: {
        name: 'John Smith',
        email: 'john@example.com',
        phone: '(555) 123-4567'
      },
      special_requests: 'Ocean view room if available',
      created_at: today.toISOString()
    },
    {
      id: 'booking_3',
      booking_type: 'restaurant',
      item_id: '1',
      item_name: 'Sea Captain\'s House',
      booking_date: nextWeek.toISOString().split('T')[0],
      booking_time: '7:00 PM',
      party_size: 4,
      status: 'confirmed',
      total_price: 0, // Reservations don't have upfront costs
      confirmation_code: 'OT345678',
      customer_info: {
        name: 'John Smith',
        email: 'john@example.com',
        phone: '(555) 123-4567'
      },
      special_requests: 'Window table if possible',
      created_at: today.toISOString()
    },
    {
      id: 'booking_4',
      booking_type: 'golf',
      item_id: '2',
      item_name: 'Caledonia Golf & Fish Club',
      booking_date: tomorrow.toISOString().split('T')[0],
      booking_time: '9:00 AM',
      party_size: 4,
      status: 'confirmed',
      total_price: 636,
      confirmation_code: 'GT901234',
      customer_info: {
        name: 'John Smith',
        email: 'john@example.com',
        phone: '(555) 123-4567'
      },
      created_at: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'booking_5',
      booking_type: 'experience',
      item_id: '1',
      item_name: 'Myrtle Beach SkyWheel',
      booking_date: tomorrow.toISOString().split('T')[0],
      booking_time: '4:00 PM',
      party_size: 4,
      status: 'confirmed',
      total_price: 64,
      confirmation_code: 'EX567890',
      customer_info: {
        name: 'John Smith',
        email: 'john@example.com',
        phone: '(555) 123-4567'
      },
      created_at: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];
};

export default BookingManagement;