import React, { useState } from 'react';
import { FileText, Download, MapPin, Phone, Star, Trash2, Edit3, Save, Calendar, DollarSign, Clock, Compass, Package as PackageIcon, Wand2, Sparkles } from 'lucide-react';
import { Itinerary as ItineraryType } from '../types';
import { generateAITripPlan } from '../lib/openai';
import jsPDF from 'jspdf';

interface ItineraryProps {
  itinerary: ItineraryType;
  onRemove: (type: string, itemId: string) => void;
  onUpdateNotes: (notes: string) => void;
  onUpdateItinerary?: (itinerary: ItineraryType) => void;
}

const Itinerary: React.FC<ItineraryProps> = ({ itinerary, onRemove, onUpdateNotes, onUpdateItinerary }) => {
  const [notes, setNotes] = useState(itinerary.notes);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isGeneratingAIItinerary, setIsGeneratingAIItinerary] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAIPlanner, setShowAIPlanner] = useState(false);

  const handleSaveNotes = () => {
    onUpdateNotes(notes);
    setIsEditingNotes(false);
  };

  const calculateTotalCost = () => {
    const golfCost = itinerary.golfCourses.reduce((sum, course) => sum + course.price, 0);
    const hotelCost = itinerary.hotels.reduce((sum, hotel) => sum + hotel.price_per_night, 0);
    const experienceCost = itinerary.experiences.reduce((sum, experience) => sum + experience.price, 0);
    const packageCost = itinerary.packages.reduce((sum, pkg) => sum + pkg.price, 0);
    return golfCost + hotelCost + experienceCost + packageCost;
  };

  const handleGenerateAIItinerary = async () => {
    if (!aiPrompt.trim() || !onUpdateItinerary) return;

    setIsGeneratingAIItinerary(true);
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
        const newItinerary = {
          golfCourses: plan.golfCourses || [],
          hotels: plan.hotels || [],
          restaurants: plan.restaurants || [],
          experiences: plan.experiences || [],
          packages: plan.packages || [],
          notes: plan.notes || ''
        };
        onUpdateItinerary(newItinerary);
        setShowAIPlanner(false);
        setAiPrompt('');
        alert('AI itinerary has been generated and applied to your trip!');
      } else {
        alert('Unable to generate itinerary. Please try a different request.');
      }
    } catch (error) {
      console.error('Error generating AI itinerary:', error);
      alert('Error generating itinerary. Please try again.');
    } finally {
      setIsGeneratingAIItinerary(false);
    }
  };

  const generatePDF = async () => {
    setIsGeneratingPDF(true);
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 20;
      let currentY = margin;

      // Title
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Myrtle Beach Golf Itinerary', margin, currentY);
      currentY += 15;

      // Date
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, currentY);
      currentY += 20;

      // Summary
      const totalItems = itinerary.golfCourses.length + itinerary.hotels.length + 
                        itinerary.restaurants.length + itinerary.experiences.length + 
                        itinerary.packages.length;
      
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Trip Summary', margin, currentY);
      currentY += 10;
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Total Items: ${totalItems}`, margin, currentY);
      currentY += 5;
      pdf.text(`Estimated Cost: $${calculateTotalCost().toLocaleString()}`, margin, currentY);
      currentY += 15;

      // Golf Courses Section
      if (itinerary.golfCourses.length > 0) {
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Golf Courses', margin, currentY);
        currentY += 10;

        itinerary.golfCourses.forEach((course, index) => {
          if (currentY > 250) {
            pdf.addPage();
            currentY = margin;
          }

          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${index + 1}. ${course.name}`, margin, currentY);
          currentY += 7;

          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          pdf.text(`Rating: ${course.rating}/5 | Par: ${course.par} | Yardage: ${course.yardage}`, margin, currentY);
          currentY += 5;
          pdf.text(`Price: $${course.price}/round | Difficulty: ${course.difficulty}`, margin, currentY);
          currentY += 5;
          pdf.text(`Address: ${course.address}`, margin, currentY);
          currentY += 5;
          pdf.text(`Phone: ${course.phone}`, margin, currentY);
          currentY += 10;
        });
      }

      // Hotels Section
      if (itinerary.hotels.length > 0) {
        if (currentY > 200) {
          pdf.addPage();
          currentY = margin;
        }

        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Hotels', margin, currentY);
        currentY += 10;

        itinerary.hotels.forEach((hotel, index) => {
          if (currentY > 250) {
            pdf.addPage();
            currentY = margin;
          }

          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${index + 1}. ${hotel.name}`, margin, currentY);
          currentY += 7;

          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          pdf.text(`Rating: ${hotel.rating}/5 | Price: $${hotel.price_per_night}/night`, margin, currentY);
          currentY += 5;
          pdf.text(`Address: ${hotel.address}`, margin, currentY);
          currentY += 5;
          pdf.text(`Phone: ${hotel.phone}`, margin, currentY);
          currentY += 10;
        });
      }

      // Restaurants Section
      if (itinerary.restaurants.length > 0) {
        if (currentY > 200) {
          pdf.addPage();
          currentY = margin;
        }

        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Restaurants', margin, currentY);
        currentY += 10;

        itinerary.restaurants.forEach((restaurant, index) => {
          if (currentY > 250) {
            pdf.addPage();
            currentY = margin;
          }

          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${index + 1}. ${restaurant.name}`, margin, currentY);
          currentY += 7;

          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          pdf.text(`Rating: ${restaurant.rating}/5 | Cuisine: ${restaurant.cuisine_type}`, margin, currentY);
          currentY += 5;
          pdf.text(`Price Range: ${restaurant.price_range} | Hours: ${restaurant.hours}`, margin, currentY);
          currentY += 5;
          pdf.text(`Address: ${restaurant.address}`, margin, currentY);
          currentY += 5;
          pdf.text(`Phone: ${restaurant.phone}`, margin, currentY);
          if (restaurant.opentable_id) {
            currentY += 5;
            pdf.text('OpenTable reservations available', margin, currentY);
          }
          currentY += 10;
        });
      }

      // Experiences Section
      if (itinerary.experiences.length > 0) {
        if (currentY > 200) {
          pdf.addPage();
          currentY = margin;
        }

        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Experiences', margin, currentY);
        currentY += 10;

        itinerary.experiences.forEach((experience, index) => {
          if (currentY > 250) {
            pdf.addPage();
            currentY = margin;
          }

          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${index + 1}. ${experience.name}`, margin, currentY);
          currentY += 7;

          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          pdf.text(`Rating: ${experience.rating}/5 | Category: ${experience.category}`, margin, currentY);
          currentY += 5;
          pdf.text(`Duration: ${experience.duration} | Price: $${experience.price}/person`, margin, currentY);
          currentY += 5;
          pdf.text(`Address: ${experience.address}`, margin, currentY);
          currentY += 5;
          pdf.text(`Phone: ${experience.phone}`, margin, currentY);
          currentY += 10;
        });
      }

      // Packages Section
      if (itinerary.packages.length > 0) {
        if (currentY > 200) {
          pdf.addPage();
          currentY = margin;
        }

        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Packages', margin, currentY);
        currentY += 10;

        itinerary.packages.forEach((pkg, index) => {
          if (currentY > 250) {
            pdf.addPage();
            currentY = margin;
          }

          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${index + 1}. ${pkg.name}`, margin, currentY);
          currentY += 7;

          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          pdf.text(`Rating: ${pkg.rating}/5 | Duration: ${pkg.duration}`, margin, currentY);
          currentY += 5;
          pdf.text(`Price: $${pkg.price.toLocaleString()}/package`, margin, currentY);
          currentY += 5;
          pdf.text('Includes:', margin, currentY);
          currentY += 5;
          pkg.includes.forEach((item) => {
            pdf.text(`  • ${item}`, margin + 5, currentY);
            currentY += 4;
          });
          currentY += 5;
        });
      }

      // Notes Section
      if (notes) {
        if (currentY > 200) {
          pdf.addPage();
          currentY = margin;
        }

        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Notes', margin, currentY);
        currentY += 10;

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        const splitNotes = pdf.splitTextToSize(notes, pageWidth - 2 * margin);
        pdf.text(splitNotes, margin, currentY);
      }

      pdf.save(`Myrtle-Beach-Golf-Itinerary-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const isEmpty = itinerary.golfCourses.length === 0 && 
                 itinerary.hotels.length === 0 && 
                 itinerary.restaurants.length === 0 &&
                 itinerary.experiences.length === 0 &&
                 itinerary.packages.length === 0;

  return (
    <div className="py-8 bg-gradient-to-br from-indigo-50 to-purple-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="bg-indigo-600 p-3 rounded-2xl">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
              My Golf Itinerary
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Review your selected golf courses, hotels, restaurants, experiences, and packages. Use AI to plan or export to PDF when ready.
          </p>
        </div>

        {isEmpty ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-2xl shadow-lg p-12">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Your itinerary is empty</h3>
              <p className="text-gray-600 mb-6">Start building your perfect golf getaway by adding courses, hotels, restaurants, experiences, and packages.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={() => setShowAIPlanner(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center space-x-2"
                >
                  <Wand2 className="h-4 w-4" />
                  <span>Generate AI Itinerary</span>
                </button>
                <button 
                  onClick={() => window.location.href = '#golf'}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
                >
                  Browse Golf Courses
                </button>
                <button 
                  onClick={() => window.location.href = '#packages'}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
                >
                  View Packages
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <div className="bg-emerald-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Calendar className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{itinerary.golfCourses.length}</div>
                <div className="text-sm text-gray-600">Golf Courses</div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <MapPin className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{itinerary.hotels.length}</div>
                <div className="text-sm text-gray-600">Hotels</div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <div className="bg-amber-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Star className="h-6 w-6 text-amber-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{itinerary.restaurants.length}</div>
                <div className="text-sm text-gray-600">Restaurants</div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Compass className="h-6 w-6 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{itinerary.experiences.length}</div>
                <div className="text-sm text-gray-600">Experiences</div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <div className="bg-indigo-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <PackageIcon className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{itinerary.packages.length}</div>
                <div className="text-sm text-gray-600">Packages</div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">${calculateTotalCost().toLocaleString()}</div>
                <div className="text-sm text-gray-600">Estimated Cost</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setShowAIPlanner(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors duration-200 flex items-center space-x-3"
              >
                <Wand2 className="h-5 w-5" />
                <span>Generate AI Itinerary</span>
              </button>
              <button
                onClick={generatePDF}
                disabled={isGeneratingPDF}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors duration-200 flex items-center space-x-3"
              >
                <Download className="h-5 w-5" />
                <span>{isGeneratingPDF ? 'Generating PDF...' : 'Export to PDF'}</span>
              </button>
            </div>

            {/* Golf Courses */}
            {itinerary.golfCourses.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-3">
                  <div className="bg-emerald-100 p-2 rounded-lg">
                    <Calendar className="h-6 w-6 text-emerald-600" />
                  </div>
                  <span>Golf Courses ({itinerary.golfCourses.length})</span>
                </h2>
                <div className="space-y-4">
                  {itinerary.golfCourses.map((course) => (
                    <div key={course.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-2">{course.name}</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                              <Star className="h-4 w-4 text-yellow-400" />
                              <span>Rating: {course.rating}/5</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4" />
                              <span>{course.address}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Phone className="h-4 w-4" />
                              <span>{course.phone}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <DollarSign className="h-4 w-4" />
                              <span>${course.price}/round</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => onRemove('golfCourses', course.id)}
                          className="text-red-500 hover:text-red-700 p-2"
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
            {itinerary.hotels.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <MapPin className="h-6 w-6 text-blue-600" />
                  </div>
                  <span>Hotels ({itinerary.hotels.length})</span>
                </h2>
                <div className="space-y-4">
                  {itinerary.hotels.map((hotel) => (
                    <div key={hotel.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-2">{hotel.name}</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                              <Star className="h-4 w-4 text-yellow-400" />
                              <span>Rating: {hotel.rating}/5</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4" />
                              <span>{hotel.address}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Phone className="h-4 w-4" />
                              <span>{hotel.phone}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <DollarSign className="h-4 w-4" />
                              <span>${hotel.price_per_night}/night</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => onRemove('hotels', hotel.id)}
                          className="text-red-500 hover:text-red-700 p-2"
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
            {itinerary.restaurants.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-3">
                  <div className="bg-amber-100 p-2 rounded-lg">
                    <Star className="h-6 w-6 text-amber-600" />
                  </div>
                  <span>Restaurants ({itinerary.restaurants.length})</span>
                </h2>
                <div className="space-y-4">
                  {itinerary.restaurants.map((restaurant) => (
                    <div key={restaurant.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {restaurant.name}
                            {restaurant.opentable_id && (
                              <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                OpenTable
                              </span>
                            )}
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                              <Star className="h-4 w-4 text-yellow-400" />
                              <span>Rating: {restaurant.rating}/5</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4" />
                              <span>{restaurant.address}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Phone className="h-4 w-4" />
                              <span>{restaurant.phone}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <DollarSign className="h-4 w-4" />
                              <span>{restaurant.price_range}</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => onRemove('restaurants', restaurant.id)}
                          className="text-red-500 hover:text-red-700 p-2"
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
            {itinerary.experiences.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-3">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <Compass className="h-6 w-6 text-purple-600" />
                  </div>
                  <span>Experiences ({itinerary.experiences.length})</span>
                </h2>
                <div className="space-y-4">
                  {itinerary.experiences.map((experience) => (
                    <div key={experience.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-2">{experience.name}</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                              <Star className="h-4 w-4 text-yellow-400" />
                              <span>Rating: {experience.rating}/5</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4" />
                              <span>{experience.duration}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4" />
                              <span>{experience.address}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <DollarSign className="h-4 w-4" />
                              <span>${experience.price}/person</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => onRemove('experiences', experience.id)}
                          className="text-red-500 hover:text-red-700 p-2"
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
            {itinerary.packages.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-3">
                  <div className="bg-indigo-100 p-2 rounded-lg">
                    <PackageIcon className="h-6 w-6 text-indigo-600" />
                  </div>
                  <span>Packages ({itinerary.packages.length})</span>
                </h2>
                <div className="space-y-4">
                  {itinerary.packages.map((pkg) => (
                    <div key={pkg.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                            <div className="flex items-center space-x-2">
                              <Star className="h-4 w-4 text-yellow-400" />
                              <span>Rating: {pkg.rating}/5</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4" />
                              <span>{pkg.duration}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <DollarSign className="h-4 w-4" />
                              <span>${pkg.price.toLocaleString()}/package</span>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Includes:</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                              {pkg.includes.map((item, index) => (
                                <div key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></div>
                                  <span>{item}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => onRemove('packages', pkg.id)}
                          className="text-red-500 hover:text-red-700 p-2"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes Section */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
                  <div className="bg-gray-100 p-2 rounded-lg">
                    <Edit3 className="h-6 w-6 text-gray-600" />
                  </div>
                  <span>Trip Notes</span>
                </h2>
                {!isEditingNotes && (
                  <button
                    onClick={() => setIsEditingNotes(true)}
                    className="text-indigo-600 hover:text-indigo-700 flex items-center space-x-2"
                  >
                    <Edit3 className="h-4 w-4" />
                    <span>Edit</span>
                  </button>
                )}
              </div>

              {isEditingNotes ? (
                <div className="space-y-4">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes about your trip, special requirements, preferences, etc."
                    className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setNotes(itinerary.notes);
                        setIsEditingNotes(false);
                      }}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveNotes}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-semibold flex items-center space-x-2"
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
        )}

        {/* AI Itinerary Planner Modal */}
        {showAIPlanner && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <Wand2 className="h-6 w-6 text-purple-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">AI Itinerary Planner</h3>
                  </div>
                  <button 
                    onClick={() => setShowAIPlanner(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Describe your ideal golf trip
                    </label>
                    <textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="e.g., 'Create a 3-day golf trip for 4 people with championship courses, luxury hotel, and fine dining'"
                      className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <Sparkles className="h-5 w-5 text-purple-600 mt-0.5" />
                      <div className="text-sm text-purple-800">
                        <p className="font-medium">AI will create a personalized itinerary including:</p>
                        <ul className="mt-1 space-y-1 text-xs">
                          <li>• Golf course recommendations</li>
                          <li>• Hotel accommodations</li>
                          <li>• Restaurant reservations</li>
                          <li>• Experience suggestions</li>
                          <li>• Daily schedule with timing</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleGenerateAIItinerary}
                    disabled={!aiPrompt.trim() || isGeneratingAIItinerary}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white py-3 px-4 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    {isGeneratingAIItinerary ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Generating Itinerary...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4" />
                        <span>Generate AI Itinerary</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Itinerary;