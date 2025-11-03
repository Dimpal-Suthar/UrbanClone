import { Platform } from 'react-native';

/**
 * Google Maps Configuration
 * 
 * Add your API key to .env file:
 * - EXPO_PUBLIC_GOOGLE_MAPS_API_KEY (for both Android and iOS)
 * 
 * Since Application restrictions is set to "None" in Google Cloud Console,
 * the same API key can be used for both platforms.
 * 
 * Note: iOS uses Apple Maps for map display, but Directions API still needs Google Maps API key.
 */

export const GOOGLE_MAPS_CONFIG = {
  // Use same API key for both Android and iOS (when Application restrictions = "None")
  apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  
  // Default map region (fallback if location permission denied)
  // This will be replaced by current location when available
  defaultRegion: {
    latitude: 28.6139, // Delhi, India
    longitude: 77.2090,
    latitudeDelta: 0.01, // Closer zoom
    longitudeDelta: 0.01,
  },
  
  // Map styling
  mapStyle: 'standard' as const,
  
  // Tracking settings
  tracking: {
    distanceFilter: 10, // meters
    updateInterval: 5000, // 5 seconds
    accuracy: 'high' as const,
  },
  
  // Geofencing settings
  geofence: {
    arrivalRadius: 100, // meters
    serviceRadius: 50000, // 50km - maximum service distance
  },
};

// Validate API keys
export const validateMapsConfig = (): boolean => {
  const hasApiKey = !!GOOGLE_MAPS_CONFIG.apiKey;
  
  if (!hasApiKey) {
    console.warn(`⚠️ Google Maps API key not configured. Please add EXPO_PUBLIC_GOOGLE_MAPS_API_KEY to .env`);
    return false;
  }
  
  console.log(`✅ Google Maps API key configured for ${Platform.OS}`);
  return true;
};

