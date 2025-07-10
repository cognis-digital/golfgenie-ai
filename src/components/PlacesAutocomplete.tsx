import React, { useRef, useEffect, useState } from 'react';
import { Search, MapPin, Star, Phone, Globe } from 'lucide-react';
import { createPlacesAutocomplete } from '../lib/maps';

interface PlacesAutocompleteProps {
  onPlaceSelect: (place: google.maps.places.PlaceResult) => void;
  placeholder?: string;
  className?: string;
}

const PlacesAutocomplete: React.FC<PlacesAutocompleteProps> = ({
  onPlaceSelect,
  placeholder = "Search for golf courses, hotels, restaurants...",
  className = ""
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedPlace, setSelectedPlace] = useState<google.maps.places.PlaceResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const initAutocomplete = async () => {
      if (inputRef.current) {
        setIsLoading(true);
        try {
          const autocomplete = await createPlacesAutocomplete(
            inputRef.current,
            (place) => {
              setSelectedPlace(place);
              onPlaceSelect(place);
            }
          );
          
          if (!autocomplete) {
            console.warn('Google Places Autocomplete not available');
          }
        } catch (error) {
          console.error('Error initializing autocomplete:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    initAutocomplete();
  }, [onPlaceSelect]);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white shadow-sm"
          disabled={isLoading}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600"></div>
          </div>
        )}
      </div>

      {selectedPlace && (
        <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="flex items-start space-x-3">
            <div className="bg-emerald-100 p-2 rounded-lg">
              <MapPin className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{selectedPlace.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{selectedPlace.formatted_address}</p>
              
              <div className="flex items-center space-x-4 mt-2">
                {selectedPlace.rating && (
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium">{selectedPlace.rating}</span>
                  </div>
                )}
                
                {selectedPlace.types && selectedPlace.types.length > 0 && (
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                    {selectedPlace.types[0].replace(/_/g, ' ')}
                  </span>
                )}
              </div>

              {selectedPlace.photos && selectedPlace.photos.length > 0 && (
                <div className="mt-3">
                  <img
                    src={selectedPlace.photos[0].getUrl({ maxWidth: 200, maxHeight: 100 })}
                    alt={selectedPlace.name}
                    className="w-full h-20 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlacesAutocomplete;