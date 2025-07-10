import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { Provider as ReduxProvider } from 'react-redux';
import { store } from './store';
import { useAppSelector, useAppDispatch } from './hooks/useReduxState';
import { setUser } from './store/slices/userSlice';
import { setItinerary } from './store/slices/itinerarySlice';
import { setActiveSection } from './store/slices/uiSlice';
import Header from './components/Header';
import Hero from './components/Hero';
import GolfCourses from './components/GolfCourses';
import Hotels from './components/Hotels';
import Restaurants from './components/Restaurants';
import Experiences from './components/Experiences';
import Packages from './components/Packages';
import AIAssistant from './components/AIAssistant';
import Itinerary from './components/Itinerary';
import UserProfile from './components/UserProfile';
import AuthModal from './components/AuthModal';
import Footer from './components/Footer';
import AccessibilityWidget from './components/AccessibilityWidget';
import Inspiration from './components/Inspiration';
import Reviews from './components/Reviews';
import TripPlanner from './components/TripPlanner';
import BookingManagement from './components/BookingManagement';
import AdminDashboard from './components/AdminDashboard';
import ItineraryBuilder from './components/ItineraryBuilder';
import NotificationSystem from './components/NotificationSystem';
import { supabase } from './lib/supabase';
import { getCurrentUser } from './lib/auth';

const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();
  const activeSection = useAppSelector(state => state.ui.activeSection);
  const { user, isAdmin } = useAppSelector(state => state.user);
  const itinerary = useAppSelector(state => state.itinerary);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial user
    getCurrentUser().then((user) => {
      dispatch(setUser(user));
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        dispatch(setUser(session?.user ?? null));
        
        if (event === 'SIGNED_OUT') {
          dispatch(setActiveSection('home'));
          dispatch(setItinerary({
            golfCourses: [],
            hotels: [],
            restaurants: [],
            experiences: [],
            packages: [],
            notes: ''
          }));
        }
      }
    );

    // Make the handleNavigation function available to other components
    // This is a bit of a hack, but it works for our demo
    window.appComponent = {
      handleNavigation: (section: string) => dispatch(setActiveSection(section))
    };

    return () => subscription.unsubscribe();
  }, [dispatch]);

  // Handle navigation with proper section validation
  const handleNavigation = (section: string) => {
    const validSections = [
      'home', 'golf', 'hotels', 'restaurants', 'experiences', 'packages', 
      'assistant', 'itinerary', 'profile', 'inspiration', 'reviews', 
      'planner', 'bookings', 'admin'
    ];
    
    if (!validSections.includes(section)) {
      console.warn(`Invalid section: ${section}`);
      dispatch(setActiveSection('home'));
      return;
    }

    // Check if user needs to be authenticated for protected sections
    const protectedSections = ['itinerary', 'assistant', 'profile', 'planner', 'bookings', 'admin'];
    if (protectedSections.includes(section) && !user) {
      setShowAuthModal(true);
      return;
    }

    // Check if admin is required for certain sections
    if (section === 'admin' && !isAdmin) {
      alert('You need administrator privileges to access this section');
      return;
    }

    dispatch(setActiveSection(section));
  };

  const addToItinerary = (type: string, item: any) => {
    console.log('Adding to itinerary:', { type, item });
    
    // Use the appropriate action based on the item type
    switch (type) {
      case 'golfCourses':
        dispatch({ type: 'itinerary/addGolfCourse', payload: item });
        break;
      case 'hotels':
        dispatch({ type: 'itinerary/addHotel', payload: item });
        break;
      case 'restaurants':
        dispatch({ type: 'itinerary/addRestaurant', payload: item });
        break;
      case 'experiences':
        dispatch({ type: 'itinerary/addExperience', payload: item });
        break;
      case 'packages':
        dispatch({ type: 'itinerary/addPackage', payload: item });
        break;
      default:
        console.error(`Invalid itinerary type: ${type}`);
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
  };

  const renderSection = () => {
    // Show auth modal if trying to access protected sections without being logged in
    const protectedSections = ['itinerary', 'assistant', 'profile', 'planner', 'bookings', 'admin'];
    if (protectedSections.includes(activeSection) && !user) {
      setShowAuthModal(true);
      dispatch(setActiveSection('home'));
      return <Hero onNavigate={handleNavigation} />;
    }

    switch (activeSection) {
      case 'golf':
        return <GolfCourses onAddToItinerary={(item) => addToItinerary('golfCourses', item)} />;
      case 'hotels':
        return <Hotels onAddToItinerary={(item) => addToItinerary('hotels', item)} />;
      case 'restaurants':
        return <Restaurants onAddToItinerary={(item) => addToItinerary('restaurants', item)} />;
      case 'experiences':
        return <Experiences onAddToItinerary={(item) => addToItinerary('experiences', item)} />;
      case 'packages':
        return <Packages onAddToItinerary={(item) => addToItinerary('packages', item)} />;
      case 'inspiration':
        return <Inspiration onNavigate={handleNavigation} />;
      case 'reviews':
        return <Reviews />;
      case 'planner':
        return <TripPlanner onUpdateItinerary={(newItinerary) => dispatch(setItinerary(newItinerary))} />;
      case 'bookings':
        return user ? <BookingManagement userId={user.id} /> : <Hero onNavigate={handleNavigation} />;
      case 'admin':
        return isAdmin ? <AdminDashboard /> : <Hero onNavigate={handleNavigation} />;
      case 'assistant':
        return user ? (
          <AIAssistant 
            itinerary={itinerary} 
            onUpdateItinerary={(newItinerary) => dispatch(setItinerary(newItinerary))}
            onAddToItinerary={addToItinerary}
          />
        ) : <Hero onNavigate={handleNavigation} />;
      case 'itinerary':
        return user ? (
          <div className="py-8 bg-gradient-to-br from-indigo-50 to-purple-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <ItineraryBuilder onAddItems={() => handleNavigation('golf')} />
            </div>
          </div>
        ) : <Hero onNavigate={handleNavigation} />;
      case 'profile':
        return user ? (
          <div className="py-8 bg-gradient-to-br from-emerald-50 to-blue-50 min-h-screen">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
              <UserProfile user={user} onSignOut={() => dispatch(setUser(null))} />
            </div>
          </div>
        ) : <Hero onNavigate={handleNavigation} />;
      default:
        return <Hero onNavigate={handleNavigation} />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading GolfGenie AI...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50">
      <Header 
        activeSection={activeSection} 
        onNavigate={handleNavigation}
        user={user}
        onAuthClick={() => setShowAuthModal(true)}
      />
      <main id="main-content">
        {renderSection()}
      </main>
      <Footer onNavigate={handleNavigation} />
      <AccessibilityWidget />
      <NotificationSystem />
      
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
};

function App() {
  return (
    <ReduxProvider store={store}>
      <AppContent />
    </ReduxProvider>
  );
}

export default App;