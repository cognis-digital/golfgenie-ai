import React from 'react';
import { MapPin, Phone, Mail, Facebook, Twitter, Instagram, ExternalLink, Zap } from 'lucide-react';

interface FooterProps {
  onNavigate?: (section: string) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const handleNavigation = (section: string) => {
    if (onNavigate) {
      onNavigate(section);
    }
  };

  const handlePhoneCall = (phone: string) => {
    const cleanPhone = phone.replace(/[^\d]/g, '');
    window.location.href = `tel:+1${cleanPhone}`;
  };

  const handleEmailClick = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  const handleSocialClick = (platform: string) => {
    const socialUrls = {
      facebook: 'https://www.facebook.com/GolfGenieAI',
      twitter: 'https://twitter.com/GolfGenieAI',
      instagram: 'https://www.instagram.com/golfgenieai'
    };
    
    const url = socialUrls[platform as keyof typeof socialUrls];
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleLegalPageClick = (page: string) => {
    window.open(`/${page}.html`, '_blank', 'noopener,noreferrer');
  };

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="bg-emerald-600 p-2 rounded-lg">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">GolfGenie AI</h3>
                <p className="text-sm text-gray-400">Myrtle Beach</p>
              </div>
            </div>
            <p className="text-gray-400 mb-4">
              AI-powered golf vacation planning for Myrtle Beach, America's premier golf destination.
            </p>
            <div className="flex space-x-3">
              <button 
                onClick={() => handleSocialClick('facebook')}
                className="text-gray-400 hover:text-emerald-400 transition-colors duration-200"
                aria-label="Visit our Facebook page"
              >
                <Facebook className="h-5 w-5" />
              </button>
              <button 
                onClick={() => handleSocialClick('twitter')}
                className="text-gray-400 hover:text-emerald-400 transition-colors duration-200"
                aria-label="Visit our Twitter page"
              >
                <Twitter className="h-5 w-5" />
              </button>
              <button 
                onClick={() => handleSocialClick('instagram')}
                className="text-gray-400 hover:text-emerald-400 transition-colors duration-200"
                aria-label="Visit our Instagram page"
              >
                <Instagram className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <button 
                  onClick={() => handleNavigation('golf')}
                  className="text-gray-400 hover:text-white transition-colors duration-200 text-left"
                >
                  Golf Courses
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNavigation('hotels')}
                  className="text-gray-400 hover:text-white transition-colors duration-200 text-left"
                >
                  Hotels
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNavigation('restaurants')}
                  className="text-gray-400 hover:text-white transition-colors duration-200 text-left"
                >
                  Restaurants
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNavigation('experiences')}
                  className="text-gray-400 hover:text-white transition-colors duration-200 text-left"
                >
                  Experiences
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNavigation('packages')}
                  className="text-gray-400 hover:text-white transition-colors duration-200 text-left"
                >
                  Packages
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNavigation('assistant')}
                  className="text-gray-400 hover:text-white transition-colors duration-200 text-left"
                >
                  AI Genie
                </button>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Services</h4>
            <ul className="space-y-2">
              <li>
                <button 
                  onClick={() => handleNavigation('golf')}
                  className="text-gray-400 hover:text-white transition-colors duration-200 text-left"
                >
                  Tee Time Booking
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNavigation('hotels')}
                  className="text-gray-400 hover:text-white transition-colors duration-200 text-left"
                >
                  Hotel Reservations
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNavigation('restaurants')}
                  className="text-gray-400 hover:text-white transition-colors duration-200 text-left"
                >
                  Dining Reservations
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNavigation('itinerary')}
                  className="text-gray-400 hover:text-white transition-colors duration-200 text-left"
                >
                  Trip Planning
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNavigation('inspiration')}
                  className="text-gray-400 hover:text-white transition-colors duration-200 text-left"
                >
                  Inspiration
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleNavigation('reviews')}
                  className="text-gray-400 hover:text-white transition-colors duration-200 text-left"
                >
                  Reviews
                </button>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Us</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-emerald-400" />
                <button 
                  onClick={() => handlePhoneCall('8435554653')}
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  (843) 555-GOLF
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-emerald-400" />
                <button 
                  onClick={() => handleEmailClick('info@golfgenie.ai')}
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                >
                  info@golfgenie.ai
                </button>
              </div>
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-emerald-400 mt-1" />
                <button 
                  onClick={() => window.open('https://maps.google.com/?q=1200+N+Ocean+Blvd,+Myrtle+Beach,+SC+29577', '_blank', 'noopener,noreferrer')}
                  className="text-gray-400 hover:text-white transition-colors duration-200 text-left"
                >
                  1200 N Ocean Blvd<br />
                  Myrtle Beach, SC 29577
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2025 GolfGenie AI. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <button 
                onClick={() => handleLegalPageClick('privacy-policy')}
                className="text-gray-400 hover:text-white text-sm transition-colors duration-200"
              >
                Privacy Policy
              </button>
              <button 
                onClick={() => handleLegalPageClick('terms-of-service')}
                className="text-gray-400 hover:text-white text-sm transition-colors duration-200"
              >
                Terms of Service
              </button>
              <button 
                onClick={() => handleLegalPageClick('accessibility')}
                className="text-gray-400 hover:text-white text-sm transition-colors duration-200"
              >
                Accessibility
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;