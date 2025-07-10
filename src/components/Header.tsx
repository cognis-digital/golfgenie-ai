import React, { useState } from 'react';
import { Zap, Calendar, MessageCircle, FileText, Home, Building, Utensils, Trophy, Compass, Package, User, LogIn, Crown, Shield, Menu, X, Lightbulb, Star } from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { isCurrentUserAdmin } from '../lib/auth';

interface HeaderProps {
  activeSection: string;
  onNavigate: (section: string) => void;
  user: SupabaseUser | null;
  onAuthClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ activeSection, onNavigate, user, onAuthClick }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const isAdmin = user ? isCurrentUserAdmin(user) : false;

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'golf', label: 'Golf', icon: Trophy },
    { id: 'hotels', label: 'Hotels', icon: Building },
    { id: 'restaurants', label: 'Dining', icon: Utensils },
    { id: 'experiences', label: 'Experiences', icon: Compass },
    { id: 'packages', label: 'Packages', icon: Package },
    { id: 'inspiration', label: 'Inspiration', icon: Lightbulb },
    { id: 'reviews', label: 'Reviews', icon: Star },
    { id: 'assistant', label: 'AI Genie', icon: MessageCircle },
    { id: 'itinerary', label: 'My Trip', icon: FileText },
  ];

  const handleUserMenuClick = () => {
    if (user) {
      onNavigate('profile');
      setShowUserMenu(false);
    } else {
      onAuthClick();
    }
  };

  const handleMobileNavClick = (sectionId: string) => {
    onNavigate(sectionId);
    setShowMobileMenu(false);
  };

  return (
    <>
      <header className="bg-white shadow-lg sticky top-0 z-50 border-b border-gray-100 safe-area-top">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-3 md:py-4">
          <div className="flex items-center space-x-4 md:space-x-6">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-2 md:space-x-3 cursor-pointer" onClick={() => onNavigate('home')}>
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-2 md:p-3 rounded-lg md:rounded-xl shadow-lg">
                <Zap className="h-5 w-5 md:h-7 md:w-7 text-white" />
              </div>
              <div>
                <h1 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                  GolfGenie
                </h1>
                <p className="text-xs md:text-sm text-gray-500 font-medium">Myrtle Beach</p>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center space-x-2 lg:hidden ml-auto">
              {/* Date Display - Mobile */}
              <div className="hidden sm:flex items-center space-x-1 bg-gray-50 px-2 py-1 rounded-lg">
                <Calendar className="h-3 w-3 text-emerald-600" />
                <span className="text-xs font-medium text-gray-700">
                  {new Date().toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </span>
              </div>

              {/* User Button - Mobile */}
              <button
                onClick={handleUserMenuClick}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 font-medium touch-target ${
                  user 
                    ? isAdmin 
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg' 
                      : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                {user ? (
                  <>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      isAdmin ? 'bg-white/20' : 'bg-white/20'
                    }`}>
                      {isAdmin ? (
                        <Crown className="h-3 w-3 text-white" />
                      ) : (
                        <User className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <span className="text-sm hidden sm:block">
                      {user.user_metadata?.name?.split(' ')[0] || 'User'}
                    </span>
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    <span className="text-sm hidden sm:block">Sign In</span>
                  </>
                )}
              </button>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors duration-200 touch-target"
              >
                {showMobileMenu ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-all duration-200 font-medium touch-target ${
                      activeSection === item.id
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg transform scale-105'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-emerald-600 hover:scale-105'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm">{item.label}</span>
                  </button>
                );
              })}
              {isAdmin && (
                <button
                  onClick={() => onNavigate('admin')}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-all duration-200 font-medium touch-target ${
                    activeSection === 'admin'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg transform scale-105'
                      : 'text-gray-600 hover:bg-amber-50 hover:text-amber-600 hover:scale-105'
                  }`}
                >
                  <Shield className="h-4 w-4" />
                  <span className="text-sm">Admin</span>
                </button>
              )}
            </nav>

            {/* Desktop Right Side Actions */}
            <div className="hidden lg:flex items-center space-x-4 ml-auto">
              {/* Free Service Badge */}
              <div className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 px-3 py-2 rounded-lg text-sm font-semibold">
                ✨ Free Service
              </div>

              {/* Date Display - Desktop */}
              <div className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg">
                <Calendar className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium text-gray-700">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </span>
              </div>

              {/* User Menu - Desktop */}
              <button
                onClick={handleUserMenuClick}
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all duration-200 font-medium touch-target ${
                  user 
                    ? isAdmin 
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg hover:shadow-xl' 
                      : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg hover:shadow-xl'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                }`}
              >
                {user ? (
                  <>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isAdmin ? 'bg-white/20' : 'bg-white/20'
                    }`}>
                      {isAdmin ? (
                        <Crown className="h-4 w-4 text-white" />
                      ) : (
                        <User className="h-4 w-4 text-white" />
                      )}
                    </div>
                    <div className="text-left">
                      <div className="flex items-center space-x-1">
                        <div className="text-sm font-semibold">
                          {user.user_metadata?.name || 'User'}
                        </div>
                        {isAdmin && (
                          <Shield className="h-3 w-3 text-white/80" />
                        )}
                      </div>
                      <div className="text-xs opacity-90">
                        {isAdmin ? 'Administrator' : 'Member'}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    <span className="text-sm font-semibold">Sign In</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      </header>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowMobileMenu(false)} />
          <div className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-xl">
            <div className="p-6 safe-area-top">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-2 rounded-lg shadow-lg">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">GolfGenie</h2>
                    <p className="text-xs text-gray-600">Myrtle Beach Navigation</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors duration-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleMobileNavClick(item.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium text-left touch-target ${
                        activeSection === item.id
                          ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-emerald-600'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
                {isAdmin && (
                  <button
                    onClick={() => handleMobileNavClick('admin')}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium text-left touch-target ${
                      activeSection === 'admin'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                        : 'text-gray-700 hover:bg-amber-50 hover:text-amber-600'
                    }`}
                  >
                    <Shield className="h-5 w-5" />
                    <span>Admin Dashboard</span>
                  </button>
                )}
              </nav>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 px-3 py-2 rounded-lg text-sm font-semibold text-center mb-4">
                  ✨ Free Service
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {new Date().toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;