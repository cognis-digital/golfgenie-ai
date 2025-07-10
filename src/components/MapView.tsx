import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Loader, Search, AlertCircle, RefreshCw } from 'lucide-react';
import { createMap, addMarker, MapLocation, sampleLocations, createPlacesAutocomplete, getMapLoadError } from '../lib/maps';
import PlacesAutocomplete from './PlacesAutocomplete';

interface MapViewProps {
  locations?: MapLocation[];
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: string;
  showControls?: boolean;
  showSearch?: boolean;
}

const MapView: React.FC<MapViewProps> = ({ 
  locations = [], 
  center = { lat: 33.6891, lng: -78.8867 }, // Myrtle Beach
  zoom = 12,
  height = '400px',
  showControls = true,
  showSearch = false
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);

  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current) return;

      try {
        setIsLoading(true);
        setError(null);
        const mapInstance = await createMap(mapRef.current, center, zoom);
        
        if (mapInstance) {
          setMap(mapInstance);
        } else {
          const mapError = getMapLoadError();
          setError(mapError || 'Failed to load map');
        }
      } catch (err) {
        console.error('Map initialization error:', err);
        setError('Failed to load map');
      } finally {
        setIsLoading(false);
      }
    };

    initMap();
  }, [center.lat, center.lng, zoom]);

  useEffect(() => {
    if (!map) return;

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    setMarkers([]);

    // Add new markers
    const newMarkers: google.maps.Marker[] = [];
    const locationsToShow = locations.length > 0 ? locations : Object.values(sampleLocations);

    locationsToShow.forEach(location => {
      const marker = addMarker(map, location);
      newMarkers.push(marker);
    });

    setMarkers(newMarkers);

    // Fit map to show all markers if there are multiple locations
    if (locationsToShow.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      locationsToShow.forEach(location => {
        bounds.extend({ lat: location.lat, lng: location.lng });
      });
      map.fitBounds(bounds);
    }
  }, [map, locations]);

  const centerOnUserLocation = () => {
    if (!map) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          map.setCenter(userLocation);
          map.setZoom(14);

          // Add user location marker
          new google.maps.Marker({
            position: userLocation,
            map,
            title: 'Your Location',
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#ef4444',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 3
            }
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          alert('Unable to get your location. Please enable location services.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  const handlePlaceSelect = (place: google.maps.places.PlaceResult) => {
    if (!map || !place.geometry?.location) return;

    map.setCenter(place.geometry.location);
    map.setZoom(17);

    // Add marker for selected place
    const marker = new google.maps.Marker({
      position: place.geometry.location,
      map,
      title: place.name,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: '#3b82f6',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 3
      }
    });

    // Create info window
    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div class="p-3 max-w-xs">
          <h3 class="font-bold text-gray-900 text-lg mb-2">${place.name}</h3>
          <p class="text-sm text-gray-600 mb-2">${place.formatted_address}</p>
          ${place.rating ? `
            <div class="flex items-center mb-2">
              <span class="text-yellow-500">★</span>
              <span class="text-sm font-medium ml-1">${place.rating}</span>
            </div>
          ` : ''}
          <span class="inline-block mt-2 px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
            Selected Location
          </span>
        </div>
      `
    });

    marker.addListener('click', () => {
      infoWindow.open(map, marker);
    });

    // Open info window immediately
    infoWindow.open(map, marker);
  };

  const retryMapLoad = () => {
    window.location.reload();
  };

  if (error) {
    return (
      <div 
        className="bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200"
        style={{ height }}
      >
        <div className="text-center p-6 max-w-md">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Map Unavailable</h3>
          <div className="text-sm text-gray-600 mb-4 whitespace-pre-line">{error}</div>
          <button
            onClick={retryMapLoad}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </button>
          <p className="text-xs text-gray-500 mt-3">
            Demo mode - showing location information without interactive map
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Search Bar */}
      {showSearch && (
        <div className="absolute top-4 left-4 right-4 z-10">
          <PlacesAutocomplete
            onPlaceSelect={handlePlaceSelect}
            placeholder="Search for places in Myrtle Beach..."
            className="max-w-md"
          />
        </div>
      )}

      {isLoading && (
        <div 
          className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center z-10"
          style={{ height }}
        >
          <div className="text-center">
            <Loader className="h-8 w-8 text-emerald-600 animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-600">Loading interactive map...</p>
          </div>
        </div>
      )}
      
      <div 
        ref={mapRef} 
        className="w-full rounded-lg"
        style={{ height }}
      />
      
      {showControls && map && (
        <div className="absolute top-4 right-4 flex flex-col space-y-2 z-10">
          <button
            onClick={centerOnUserLocation}
            className="bg-white hover:bg-gray-50 p-3 rounded-lg shadow-lg transition-colors duration-200"
            title="Center on your location"
          >
            <Navigation className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      )}
      
      {locations.length === 0 && !isLoading && !error && (
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg">
          <p className="text-sm text-gray-600">
            Showing sample Myrtle Beach locations
          </p>
        </div>
      )}
    </div>
  );
};

export default MapView;