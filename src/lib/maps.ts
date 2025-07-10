import { Loader } from '@googlemaps/js-api-loader';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export interface MapLocation {
  lat: number;
  lng: number;
  title: string;
  address: string;
  type: 'golf' | 'hotel' | 'restaurant' | 'experience';
  phone?: string;
  website?: string;
  rating?: number;
}

let googleMapsLoader: Loader | null = null;
let isGoogleMapsLoaded = false;
let mapLoadError: string | null = null;

export const getMapLoadError = (): string | null => mapLoadError;

export const initializeGoogleMaps = async (): Promise<boolean> => {
  if (isGoogleMapsLoaded) return true;
  if (mapLoadError) return false;
  
  if (!GOOGLE_MAPS_API_KEY) {
    mapLoadError = 'Google Maps API key not found. Please add VITE_GOOGLE_MAPS_API_KEY to your environment variables.';
    console.warn(mapLoadError);
    return false;
  }

  try {
    if (!googleMapsLoader) {
      googleMapsLoader = new Loader({
        apiKey: GOOGLE_MAPS_API_KEY,
        version: 'weekly',
        libraries: ['places', 'geometry', 'marker']
      });
    }

    await googleMapsLoader.load();
    isGoogleMapsLoaded = true;
    mapLoadError = null;
    return true;
  } catch (error) {
    console.error('Error loading Google Maps:', error);
    
    // Check for specific API activation errors
    if (error instanceof Error) {
      if (error.message.includes('ApiNotActivatedMapError')) {
        mapLoadError = `Google Maps APIs are not activated for your project.

To fix this issue:

1. Go to Google Cloud Console (console.cloud.google.com)
2. Select your project or create a new one
3. Navigate to "APIs & Services" → "Library"
4. Search for and enable these APIs:
   • Maps JavaScript API
   • Places API  
   • Geocoding API
   • Distance Matrix API

5. Go to "APIs & Services" → "Credentials"
6. Create an API key or use existing one
7. Add your domain to API key restrictions
8. Update your .env file with the API key

Need help? Visit: https://developers.google.com/maps/gmp-get-started`;
      } else if (error.message.includes('InvalidKeyMapError')) {
        mapLoadError = `Invalid Google Maps API key.

Please check:
1. Your VITE_GOOGLE_MAPS_API_KEY in the .env file
2. The API key is correctly copied from Google Cloud Console
3. The API key has proper permissions

Current API Key: ${GOOGLE_MAPS_API_KEY.substring(0, 20)}...`;
      } else if (error.message.includes('RefererNotAllowedMapError')) {
        mapLoadError = `This domain is not authorized for this API key.

To fix this:
1. Go to Google Cloud Console → "APIs & Services" → "Credentials"
2. Click on your API key
3. Under "Application restrictions", add your domain:
   • http://localhost:*
   • https://localhost:*
   • Your production domain

Or remove restrictions for testing (not recommended for production).`;
      } else if (error.message.includes('QuotaExceededError')) {
        mapLoadError = `Google Maps API quota exceeded.

Solutions:
1. Check your usage in Google Cloud Console
2. Increase your quota limits
3. Enable billing if required
4. Wait for quota reset (if daily limit)`;
      } else {
        mapLoadError = `Google Maps API Error: ${error.message}

Please check:
1. API key is valid and active
2. Required APIs are enabled
3. Billing is set up (if required)
4. Domain restrictions are configured correctly

Visit Google Cloud Console for more details.`;
      }
    } else {
      mapLoadError = 'Unknown error loading Google Maps API. Please check your configuration and try again.';
    }
    
    return false;
  }
};

export const createMap = async (
  container: HTMLElement,
  center: { lat: number; lng: number } = { lat: 33.6891, lng: -78.8867 }, // Myrtle Beach
  zoom: number = 12
): Promise<google.maps.Map | null> => {
  const isLoaded = await initializeGoogleMaps();
  if (!isLoaded) {
    // Show enhanced error message in the map container
    container.innerHTML = `
      <div class="flex items-center justify-center h-full bg-gray-50 p-6">
        <div class="text-center max-w-2xl">
          <div class="mb-6">
            <svg class="mx-auto h-16 w-16 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mb-4">Google Maps Unavailable</h3>
          <div class="bg-white border border-gray-200 rounded-lg p-4 mb-6">
            <pre class="text-sm text-gray-700 text-left whitespace-pre-wrap font-mono leading-relaxed">${mapLoadError || 'Unable to load Google Maps'}</pre>
          </div>
          <div class="flex flex-col sm:flex-row gap-3 justify-center">
            <button onclick="window.location.reload()" class="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              Retry
            </button>
            <a href="https://console.cloud.google.com/apis/library" target="_blank" rel="noopener noreferrer" class="inline-flex items-center px-6 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
              </svg>
              Open Google Cloud Console
            </a>
          </div>
        </div>
      </div>
    `;
    return null;
  }

  try {
    const map = new google.maps.Map(container, {
      center,
      zoom,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: true,
      styles: [
        {
          featureType: 'poi.business',
          stylers: [{ visibility: 'off' }]
        },
        {
          featureType: 'poi.park',
          elementType: 'labels.text',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    return map;
  } catch (error) {
    console.error('Error creating map:', error);
    container.innerHTML = `
      <div class="flex items-center justify-center h-full bg-gray-100 p-6">
        <div class="text-center">
          <div class="mb-4">
            <svg class="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">Map Creation Error</h3>
          <p class="text-sm text-gray-600 mb-4">Unable to create map instance</p>
          <button onclick="window.location.reload()" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            Retry
          </button>
        </div>
      </div>
    `;
    return null;
  }
};

export const addMarker = (
  map: google.maps.Map,
  location: MapLocation
): google.maps.Marker => {
  const iconColors = {
    golf: '#10b981', // emerald
    hotel: '#3b82f6', // blue
    restaurant: '#f59e0b', // amber
    experience: '#8b5cf6' // purple
  };

  const marker = new google.maps.Marker({
    position: { lat: location.lat, lng: location.lng },
    map,
    title: location.title,
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 10,
      fillColor: iconColors[location.type],
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 3
    }
  });

  const infoWindowContent = `
    <div class="p-3 max-w-xs">
      <h3 class="font-bold text-gray-900 text-lg mb-2">${location.title}</h3>
      <p class="text-sm text-gray-600 mb-2">${location.address}</p>
      ${location.rating ? `
        <div class="flex items-center mb-2">
          <span class="text-yellow-500">★</span>
          <span class="text-sm font-medium ml-1">${location.rating}</span>
        </div>
      ` : ''}
      ${location.phone ? `
        <div class="mb-2">
          <a href="tel:${location.phone.replace(/[^\d]/g, '')}" 
             class="text-blue-600 hover:underline text-sm">
            📞 ${location.phone}
          </a>
        </div>
      ` : ''}
      ${location.website ? `
        <div class="mb-2">
          <a href="${location.website}" target="_blank" rel="noopener noreferrer"
             class="text-blue-600 hover:underline text-sm">
            🌐 Visit Website
          </a>
        </div>
      ` : ''}
      <span class="inline-block mt-2 px-3 py-1 text-xs font-medium rounded-full" 
            style="background-color: ${iconColors[location.type]}20; color: ${iconColors[location.type]}">
        ${location.type.charAt(0).toUpperCase() + location.type.slice(1)}
      </span>
    </div>
  `;

  const infoWindow = new google.maps.InfoWindow({
    content: infoWindowContent
  });

  marker.addListener('click', () => {
    infoWindow.open(map, marker);
  });

  return marker;
};

export const createPlacesAutocomplete = async (
  input: HTMLInputElement,
  onPlaceChanged: (place: google.maps.places.PlaceResult) => void
): Promise<google.maps.places.Autocomplete | null> => {
  const isLoaded = await initializeGoogleMaps();
  if (!isLoaded) return null;

  try {
    const autocomplete = new google.maps.places.Autocomplete(input, {
      types: ['establishment'],
      componentRestrictions: { country: 'us' },
      fields: ['place_id', 'geometry', 'name', 'formatted_address', 'types', 'rating', 'photos']
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        onPlaceChanged(place);
      }
    });

    return autocomplete;
  } catch (error) {
    console.error('Error creating places autocomplete:', error);
    return null;
  }
};

export const searchNearbyPlaces = async (
  location: { lat: number; lng: number },
  type: string,
  radius: number = 5000
): Promise<google.maps.places.PlaceResult[]> => {
  const isLoaded = await initializeGoogleMaps();
  if (!isLoaded) return [];

  try {
    const map = new google.maps.Map(document.createElement('div'));
    const service = new google.maps.places.PlacesService(map);
    
    const request = {
      location: new google.maps.LatLng(location.lat, location.lng),
      radius,
      type: type as google.maps.places.PlaceType
    };

    return new Promise((resolve, reject) => {
      service.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          resolve(results);
        } else {
          reject(new Error(`Places search failed: ${status}`));
        }
      });
    });
  } catch (error) {
    console.error('Error searching nearby places:', error);
    return [];
  }
};

export const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
  const isLoaded = await initializeGoogleMaps();
  if (!isLoaded) return null;

  try {
    const geocoder = new google.maps.Geocoder();
    const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
      geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK' && results) {
          resolve(results);
        } else {
          reject(new Error(`Geocoding failed: ${status}`));
        }
      });
    });

    if (result.length > 0) {
      const location = result[0].geometry.location;
      return {
        lat: location.lat(),
        lng: location.lng()
      };
    }

    return null;
  } catch (error) {
    console.error('Error geocoding address:', error);
    return null;
  }
};

export const calculateDistance = async (
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<{ distance: string; duration: string } | null> => {
  const isLoaded = await initializeGoogleMaps();
  if (!isLoaded) return null;

  try {
    const service = new google.maps.DistanceMatrixService();
    const result = await new Promise<google.maps.DistanceMatrixResponse>((resolve, reject) => {
      service.getDistanceMatrix({
        origins: [origin],
        destinations: [destination],
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.IMPERIAL
      }, (response, status) => {
        if (status === 'OK' && response) {
          resolve(response);
        } else {
          reject(new Error(`Distance calculation failed: ${status}`));
        }
      });
    });

    const element = result.rows[0]?.elements[0];
    if (element && element.status === 'OK') {
      return {
        distance: element.distance?.text || 'Unknown',
        duration: element.duration?.text || 'Unknown'
      };
    }

    return null;
  } catch (error) {
    console.error('Error calculating distance:', error);
    return null;
  }
};

// Enhanced sample coordinates with more details
export const sampleLocations: Record<string, MapLocation> = {
  'tpc-myrtle-beach': {
    lat: 33.5707,
    lng: -79.0728,
    title: 'TPC Myrtle Beach',
    address: '1199 TPC Blvd, Murrells Inlet, SC 29576',
    type: 'golf',
    phone: '(843) 357-3399',
    website: 'https://tpc.com/myrtle-beach',
    rating: 4.8
  },
  'caledonia-golf': {
    lat: 33.4321,
    lng: -79.1234,
    title: 'Caledonia Golf & Fish Club',
    address: '369 Caledonia Dr, Pawleys Island, SC 29585',
    type: 'golf',
    phone: '(843) 237-3675',
    website: 'https://fishclub.com',
    rating: 4.7
  },
  'dunes-golf': {
    lat: 33.7123,
    lng: -78.8456,
    title: 'Dunes Golf & Beach Club',
    address: '9000 N Ocean Blvd, Myrtle Beach, SC 29572',
    type: 'golf',
    phone: '(843) 449-5914',
    rating: 4.6
  },
  'ocean-house': {
    lat: 33.6891,
    lng: -78.8867,
    title: 'The Ocean House',
    address: '1000 N Ocean Blvd, Myrtle Beach, SC 29577',
    type: 'hotel',
    phone: '(843) 448-8888',
    website: 'https://oceanhouse.com',
    rating: 4.9
  },
  'hampton-inn': {
    lat: 33.6945,
    lng: -78.8923,
    title: 'Hampton Inn & Suites Myrtle Beach',
    address: '2100 N Kings Hwy, Myrtle Beach, SC 29577',
    type: 'hotel',
    phone: '(843) 946-6400',
    rating: 4.4
  },
  'marriott-resort': {
    lat: 33.6234,
    lng: -78.9012,
    title: 'Marriott Myrtle Beach Resort',
    address: '8400 Costa Verde Dr, Myrtle Beach, SC 29572',
    type: 'hotel',
    phone: '(843) 449-8880',
    rating: 4.6
  },
  'sea-captains-house': {
    lat: 33.7001,
    lng: -78.8851,
    title: 'Sea Captain\'s House',
    address: '3002 N Ocean Blvd, Myrtle Beach, SC 29577',
    type: 'restaurant',
    phone: '(843) 448-8082',
    website: 'https://seacaptainshouse.com',
    rating: 4.8
  },
  'cypress-grill': {
    lat: 33.7234,
    lng: -78.8567,
    title: 'The Cypress Grill',
    address: '9911 N Kings Hwy, Myrtle Beach, SC 29572',
    type: 'restaurant',
    phone: '(843) 497-0020',
    rating: 4.7
  },
  'margaritaville': {
    lat: 33.6912,
    lng: -78.8834,
    title: 'Jimmy Buffett\'s Margaritaville',
    address: '1114 Celebrity Cir, Myrtle Beach, SC 29577',
    type: 'restaurant',
    phone: '(843) 448-5455',
    rating: 4.3
  },
  'skywheel': {
    lat: 33.6901,
    lng: -78.8831,
    title: 'Myrtle Beach SkyWheel',
    address: '1110 N Ocean Blvd, Myrtle Beach, SC 29577',
    type: 'experience',
    phone: '(843) 839-9200',
    website: 'https://skywheel.com',
    rating: 4.5
  },
  'fishing-charter': {
    lat: 33.6823,
    lng: -78.8745,
    title: 'Deep Sea Fishing Charter',
    address: '1398 21st Ave N, Myrtle Beach, SC 29577',
    type: 'experience',
    phone: '(843) 626-2424',
    rating: 4.7
  },
  'helicopter-tours': {
    lat: 33.6789,
    lng: -78.9234,
    title: 'Helicopter Tours',
    address: '1100 Jetport Rd, Myrtle Beach, SC 29577',
    type: 'experience',
    phone: '(843) 497-8200',
    rating: 4.9
  }
};