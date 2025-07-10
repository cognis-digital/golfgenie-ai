import React, { useState, useEffect } from 'react';
import { X, DollarSign, Leaf, Wheat, Fish, Beef, Clock, Star, Phone, ExternalLink } from 'lucide-react';
import { Restaurant } from '../types';
import { restaurantAPI, MenuSection, MenuItem } from '../lib/api';

interface MenuModalProps {
  restaurant: Restaurant;
  isOpen: boolean;
  onClose: () => void;
}

const MenuModal: React.FC<MenuModalProps> = ({ restaurant, isOpen, onClose }) => {
  const [menu, setMenu] = useState<MenuSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      loadMenu();
    }
  }, [isOpen, restaurant.id]);

  const loadMenu = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await restaurantAPI.getMenu(restaurant.id);
      if (response.success && response.menu) {
        setMenu(response.menu);
        if (response.menu.length > 0) {
          setActiveSection(response.menu[0].name);
        }
      } else {
        setError('Menu not available at this time');
        // Load sample menu as fallback
        setMenu(getSampleMenu(restaurant));
        if (getSampleMenu(restaurant).length > 0) {
          setActiveSection(getSampleMenu(restaurant)[0].name);
        }
      }
    } catch (error) {
      console.error('Error loading menu:', error);
      setError('Failed to load menu');
      // Load sample menu as fallback
      const sampleMenu = getSampleMenu(restaurant);
      setMenu(sampleMenu);
      if (sampleMenu.length > 0) {
        setActiveSection(sampleMenu[0].name);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getSampleMenu = (restaurant: Restaurant): MenuSection[] => {
    // Generate sample menu based on restaurant type
    const cuisineType = restaurant.cuisine_type.toLowerCase();
    
    if (cuisineType.includes('seafood')) {
      return [
        {
          name: 'Appetizers',
          description: 'Fresh starts to your dining experience',
          items: [
            {
              id: '1',
              name: 'Shrimp Cocktail',
              description: 'Fresh Gulf shrimp with cocktail sauce and lemon',
              price: 16,
              category: 'appetizer',
              dietary_restrictions: ['gluten-free']
            },
            {
              id: '2',
              name: 'Oysters Rockefeller',
              description: 'Baked oysters with spinach, herbs, and Pernod',
              price: 18,
              category: 'appetizer'
            },
            {
              id: '3',
              name: 'Crab Cakes',
              description: 'Pan-seared jumbo lump crab cakes with remoulade',
              price: 22,
              category: 'appetizer'
            }
          ]
        },
        {
          name: 'Fresh Catch',
          description: 'Daily selections from local waters',
          items: [
            {
              id: '4',
              name: 'Grilled Mahi Mahi',
              description: 'Fresh catch with mango salsa and coconut rice',
              price: 28,
              category: 'entree',
              dietary_restrictions: ['gluten-free']
            },
            {
              id: '5',
              name: 'Blackened Red Snapper',
              description: 'Cajun spiced with dirty rice and vegetables',
              price: 32,
              category: 'entree'
            },
            {
              id: '6',
              name: 'Lobster Thermidor',
              description: 'Whole lobster with cognac cream sauce',
              price: 48,
              category: 'entree'
            }
          ]
        },
        {
          name: 'Desserts',
          items: [
            {
              id: '7',
              name: 'Key Lime Pie',
              description: 'Traditional Florida recipe with graham crust',
              price: 9,
              category: 'dessert',
              dietary_restrictions: ['vegetarian']
            },
            {
              id: '8',
              name: 'Chocolate Lava Cake',
              description: 'Warm chocolate cake with vanilla ice cream',
              price: 11,
              category: 'dessert',
              dietary_restrictions: ['vegetarian']
            }
          ]
        }
      ];
    } else if (cuisineType.includes('steak')) {
      return [
        {
          name: 'Appetizers',
          items: [
            {
              id: '1',
              name: 'Beef Carpaccio',
              description: 'Thinly sliced raw beef with capers and parmesan',
              price: 18,
              category: 'appetizer'
            },
            {
              id: '2',
              name: 'Lobster Bisque',
              description: 'Rich and creamy with cognac',
              price: 14,
              category: 'appetizer'
            }
          ]
        },
        {
          name: 'Prime Steaks',
          description: 'USDA Prime aged beef, grilled to perfection',
          items: [
            {
              id: '3',
              name: 'Ribeye Steak',
              description: '16oz prime cut with garlic mashed potatoes',
              price: 52,
              category: 'entree'
            },
            {
              id: '4',
              name: 'Filet Mignon',
              description: '8oz tenderloin with truffle butter',
              price: 48,
              category: 'entree'
            },
            {
              id: '5',
              name: 'Porterhouse',
              description: '24oz for two with seasonal vegetables',
              price: 78,
              category: 'entree'
            }
          ]
        }
      ];
    } else {
      return [
        {
          name: 'Appetizers',
          items: [
            {
              id: '1',
              name: 'Spinach Artichoke Dip',
              description: 'Creamy dip with tortilla chips',
              price: 12,
              category: 'appetizer',
              dietary_restrictions: ['vegetarian']
            },
            {
              id: '2',
              name: 'Buffalo Wings',
              description: 'Traditional wings with celery and blue cheese',
              price: 14,
              category: 'appetizer'
            }
          ]
        },
        {
          name: 'Main Courses',
          items: [
            {
              id: '3',
              name: 'Grilled Chicken',
              description: 'Herb-marinated chicken breast with vegetables',
              price: 24,
              category: 'entree',
              dietary_restrictions: ['gluten-free']
            },
            {
              id: '4',
              name: 'Fish and Chips',
              description: 'Beer-battered cod with fries and coleslaw',
              price: 18,
              category: 'entree'
            }
          ]
        }
      ];
    }
  };

  const getDietaryIcon = (restrictions: string[] = []) => {
    if (restrictions.includes('vegetarian')) return <Leaf className="h-4 w-4 text-green-600" />;
    if (restrictions.includes('gluten-free')) return <Wheat className="h-4 w-4 text-amber-600" />;
    if (restrictions.includes('seafood')) return <Fish className="h-4 w-4 text-blue-600" />;
    if (restrictions.includes('meat')) return <Beef className="h-4 w-4 text-red-600" />;
    return null;
  };

  const handleCallRestaurant = () => {
    const cleanPhone = restaurant.phone.replace(/[^\d]/g, '');
    window.location.href = `tel:+1${cleanPhone}`;
  };

  const handleVisitWebsite = () => {
    if (restaurant.website) {
      window.open(restaurant.website, '_blank', 'noopener,noreferrer');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h2 className="text-2xl font-bold text-gray-900">{restaurant.name}</h2>
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="text-sm font-medium text-gray-700">{restaurant.rating}</span>
                </div>
              </div>
              <p className="text-gray-600 mb-3">{restaurant.cuisine_type} • {restaurant.price_range} • {restaurant.hours}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleCallRestaurant}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 transition-colors duration-200"
                >
                  <Phone className="h-3 w-3" />
                  <span>Call {restaurant.phone}</span>
                </button>
                {restaurant.website && (
                  <button
                    onClick={handleVisitWebsite}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 transition-colors duration-200"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span>Website</span>
                  </button>
                )}
                {restaurant.opentable_id && (
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                    OpenTable Available
                  </span>
                )}
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200 ml-4"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading menu...</p>
          </div>
        ) : error && menu.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Menu Not Available</h3>
            <p className="text-gray-600 mb-4">We're unable to display the menu at this time.</p>
            <div className="flex justify-center space-x-3">
              <button
                onClick={handleCallRestaurant}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
              >
                <Phone className="h-4 w-4" />
                <span>Call for Menu</span>
              </button>
              {restaurant.website && (
                <button
                  onClick={handleVisitWebsite}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Visit Website</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex h-[calc(90vh-180px)]">
            {/* Menu Sections Sidebar */}
            <div className="w-1/4 bg-gray-50 border-r border-gray-200 overflow-y-auto">
              <div className="p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Menu Sections</h3>
                <nav className="space-y-1">
                  {menu.map((section) => (
                    <button
                      key={section.name}
                      onClick={() => setActiveSection(section.name)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors duration-200 ${
                        activeSection === section.name
                          ? 'bg-amber-100 text-amber-800 font-medium'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {section.name}
                      <span className="ml-2 text-xs text-gray-500">
                        ({section.items.length})
                      </span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                {menu.map((section) => (
                  <div
                    key={section.name}
                    className={`${activeSection === section.name ? 'block' : 'hidden'}`}
                  >
                    <div className="mb-6">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{section.name}</h3>
                      {section.description && (
                        <p className="text-gray-600">{section.description}</p>
                      )}
                    </div>

                    <div className="space-y-6">
                      {section.items.map((item) => (
                        <div key={item.id} className="border-b border-gray-100 pb-6 last:border-b-0">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h4 className="text-lg font-semibold text-gray-900">{item.name}</h4>
                                {getDietaryIcon(item.dietary_restrictions)}
                              </div>
                              <p className="text-gray-600 text-sm leading-relaxed mb-3">{item.description}</p>
                              {item.dietary_restrictions && item.dietary_restrictions.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {item.dietary_restrictions.map((restriction, index) => (
                                    <span
                                      key={index}
                                      className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs"
                                    >
                                      {restriction}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="ml-6 text-right">
                              <div className="text-xl font-bold text-amber-600 flex items-center">
                                <DollarSign className="h-5 w-5" />
                                {item.price}
                              </div>
                            </div>
                          </div>
                          {item.image_url && (
                            <div className="mt-3">
                              <img
                                src={item.image_url}
                                alt={item.name}
                                className="w-32 h-24 object-cover rounded-lg"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {menu.length === 0 && !isLoading && (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No menu items available.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Leaf className="h-4 w-4 text-green-600" />
                <span>Vegetarian</span>
              </div>
              <div className="flex items-center space-x-1">
                <Wheat className="h-4 w-4 text-amber-600" />
                <span>Gluten-Free</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4 text-gray-500" />
                <span>Hours: {restaurant.hours}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Prices and availability subject to change. Please inform your server of any allergies.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuModal;