import { db } from '@/config/firebase';
import { GOOGLE_MAPS_CONFIG } from '@/config/maps';
import { Location as LocationType, ProviderLocation } from '@/types/maps';
import * as Location from 'expo-location';
import { collection, doc, getDocs, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';

/**
 * Location Service
 * Handles all location-related operations including:
 * - Real-time location tracking
 * - Geofencing
 * - Distance calculations
 * - Location updates to Firebase
 */

class LocationService {
  private watchSubscription: Location.LocationSubscription | null = null;
  private currentBookingId: string | null = null;

  /**
   * Check if location permission is granted (without requesting)
   */
  async hasPermission(): Promise<boolean> {
    try {
      const permission = await Location.getForegroundPermissionsAsync();
      return permission.status === 'granted';
    } catch (error) {
      console.error('Error checking location permission:', error);
      return false;
    }
  }

  /**
   * Request foreground location permissions (for customer/admin app)
   * Handles permission denial gracefully
   */
  async requestPermissions(): Promise<boolean> {
    try {
      // Check existing permission status first
      const existingPermission = await Location.getForegroundPermissionsAsync();
      
      // If permanently denied, return false (don't request again)
      if (existingPermission.status === 'denied' && !existingPermission.canAskAgain) {
        console.log('⚠️ Location permission permanently denied');
        return false;
      }

      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        console.log('⚠️ Location permission denied (status:', foregroundStatus, ')');
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Error requesting location permissions:', error);
      // Gracefully handle errors - don't throw, just return false
      return false;
    }
  }

  /**
   * Request background location permissions (for provider app only)
   * Handles permission denial gracefully
   */
  async requestBackgroundPermissions(): Promise<boolean> {
    try {
      // Check current foreground permission status
      const foregroundPermission = await Location.getForegroundPermissionsAsync();
      
      if (foregroundPermission.status !== 'granted') {
        // Check if permanently denied
        if (foregroundPermission.status === 'denied' && !foregroundPermission.canAskAgain) {
          console.log('⚠️ Foreground location permission permanently denied');
          return false;
        }

        // Request foreground permission first
        const { status: newForegroundStatus } = await Location.requestForegroundPermissionsAsync();
        if (newForegroundStatus !== 'granted') {
          console.log('⚠️ Foreground location permission not granted');
          return false;
        }
      }

      // Check existing background permission
      const existingBackgroundPermission = await Location.getBackgroundPermissionsAsync();
      
      // If permanently denied, return false
      if (existingBackgroundPermission.status === 'denied' && !existingBackgroundPermission.canAskAgain) {
        console.log('⚠️ Background location permission permanently denied');
        return false;
      }

      // Request background permission
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      
      if (backgroundStatus === 'granted') {
        console.log('✅ Background location permission granted');
        return true;
      } else {
        console.log('⚠️ Background location permission not granted:', backgroundStatus);
        return false;
      }
    } catch (error) {
      console.error('❌ Error requesting background location permissions:', error);
      // Gracefully handle errors - don't throw, just return false
      return false;
    }
  }

  /**
   * Get current location
   */
  async getCurrentLocation(): Promise<LocationType | null> {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  /**
   * Reverse geocode - convert coordinates to address
   * Checks permission first to avoid errors
   */
  async reverseGeocode(location: LocationType): Promise<Location.LocationGeocodedAddress | null> {
    try {
      // Check permission first
      const permission = await Location.getForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        console.log('⚠️ Location permission not granted, cannot reverse geocode');
        return null;
      }

      const result = await Location.reverseGeocodeAsync(location);
      return result[0] || null;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return null;
    }
  }

  /**
   * Forward geocode - convert address to coordinates
   * Requests permission if needed (required on some platforms for geocoding)
   */
  async geocodeAddress(address: string): Promise<LocationType | null> {
    try {
      // Check permission first
      let permission = await Location.getForegroundPermissionsAsync();
      
      // Request permission if not granted
      if (permission.status !== 'granted') {
        console.log('⚠️ Location permission not granted, requesting...');
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('⚠️ Location permission denied, cannot geocode address');
          return null;
        }
        console.log('✅ Location permission granted');
      }

      const result = await Location.geocodeAsync(address);
      if (result.length > 0) {
        return {
          latitude: result[0].latitude,
          longitude: result[0].longitude,
        };
      }
      return null;
    } catch (error) {
      console.error('Error geocoding address:', error);
      return null;
    }
  }

  /**
   * Calculate distance between two points (in meters)
   */
  calculateDistance(from: LocationType, to: LocationType): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (from.latitude * Math.PI) / 180;
    const φ2 = (to.latitude * Math.PI) / 180;
    const Δφ = ((to.latitude - from.latitude) * Math.PI) / 180;
    const Δλ = ((to.longitude - from.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Check if location is within geofence
   */
  isWithinGeofence(
    current: LocationType,
    target: LocationType,
    radius: number = GOOGLE_MAPS_CONFIG.geofence.arrivalRadius
  ): boolean {
    const distance = this.calculateDistance(current, target);
    return distance <= radius;
  }

  /**
   * Start tracking provider location (Provider App)
   */
  async startProviderTracking(bookingId: string, providerId: string): Promise<boolean> {
    try {
      // First check foreground permission (required)
      const foregroundPermission = await Location.getForegroundPermissionsAsync();
      
      if (foregroundPermission.status !== 'granted') {
        // Check if permanently denied
        if (foregroundPermission.status === 'denied' && !foregroundPermission.canAskAgain) {
          console.error('❌ Foreground location permission permanently denied - cannot start tracking');
          return false;
        }

        // Request foreground permission
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.error('❌ Foreground location permission required for tracking');
          return false;
        }
      }

      // Try to get background permission (optional but recommended)
      const backgroundPermission = await Location.getBackgroundPermissionsAsync();
      const hasBackgroundPermission = backgroundPermission.status === 'granted';
      
      if (!hasBackgroundPermission) {
        console.log('⚠️ Background permission not granted - will use foreground-only tracking');
        console.log('💡 Tip: For better tracking, grant "All the time" permission in Settings');
      }

      this.currentBookingId = bookingId;

      // Start watching location (works with foreground permission, better with background)
      this.watchSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: GOOGLE_MAPS_CONFIG.tracking.distanceFilter,
          timeInterval: GOOGLE_MAPS_CONFIG.tracking.updateInterval,
          mayShowUserSettingsDialog: false, // Prevent showing dialog again if permission already requested
        },
        async (location) => {
          const providerLocation: ProviderLocation = {
            providerId,
            location: {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            },
            timestamp: location.timestamp,
            heading: location.coords.heading || undefined,
            speed: location.coords.speed || undefined,
            accuracy: location.coords.accuracy || undefined,
          };

          // Update location in Firebase
          await this.updateProviderLocation(bookingId, providerLocation);
        }
      );

      console.log('✅ Provider tracking started', hasBackgroundPermission ? '(with background)' : '(foreground only)');
      return true;
    } catch (error) {
      console.error('❌ Error starting provider tracking:', error);
      return false;
    }
  }

  /**
   * Stop tracking provider location
   */
  async stopProviderTracking(bookingId: string): Promise<void> {
    if (this.watchSubscription) {
      this.watchSubscription.remove();
      this.watchSubscription = null;
    }

    // Clear location from Firebase
    if (this.currentBookingId) {
      try {
        await updateDoc(doc(db, 'tracking', bookingId), {
          active: false,
          endedAt: serverTimestamp(),
        });
      } catch (error) {
        console.error('Error clearing tracking data:', error);
      }
    }

    this.currentBookingId = null;
  }

  /**
   * Update provider location in Firebase
   */
  private async updateProviderLocation(
    bookingId: string,
    providerLocation: ProviderLocation
  ): Promise<void> {
    try {
      const trackingRef = doc(db, 'tracking', bookingId);
      
      await setDoc(
        trackingRef,
        {
          bookingId,
          providerId: providerLocation.providerId,
          location: providerLocation.location,
          timestamp: serverTimestamp(),
          heading: providerLocation.heading || null,
          speed: providerLocation.speed || null,
          accuracy: providerLocation.accuracy || null,
          active: true,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error('Error updating provider location:', error);
    }
  }

  /**
   * Subscribe to provider location updates (Customer App)
   */
  subscribeToProviderLocation(
    bookingId: string,
    callback: (location: ProviderLocation | null) => void
  ): () => void {
    const trackingRef = doc(db, 'tracking', bookingId);
    
    const unsubscribe = onSnapshot(
      trackingRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data.active) {
            callback({
              providerId: data.providerId,
              location: data.location,
              timestamp: data.timestamp?.toMillis() || Date.now(),
              heading: data.heading,
              speed: data.speed,
              accuracy: data.accuracy,
            });
          } else {
            callback(null);
          }
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('Error subscribing to provider location:', error);
        callback(null);
      }
    );

    return unsubscribe;
  }

  /**
   * Get all active provider locations (Admin App)
   */
  async getActiveProviderLocations(): Promise<ProviderLocation[]> {
    try {
      const trackingQuery = query(
        collection(db, 'tracking'),
        where('active', '==', true)
      );
      
      const snapshot = await getDocs(trackingQuery);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          providerId: data.providerId,
          location: data.location,
          timestamp: data.timestamp?.toMillis() || Date.now(),
          heading: data.heading,
          speed: data.speed,
          accuracy: data.accuracy,
        };
      });
    } catch (error) {
      console.error('Error getting active provider locations:', error);
      return [];
    }
  }

  /**
   * Format distance for display
   */
  formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  }

  /**
   * Format duration for display
   */
  formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    }
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes}min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
  }

  /**
   * Decode Google Maps polyline to coordinates
   */
  private decodePolyline(encoded: string): Array<{ latitude: number; longitude: number }> {
    const poly: Array<{ latitude: number; longitude: number }> = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
      let b;
      let shift = 0;
      let result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = ((result & 1) !== 0) ? ~(result >> 1) : (result >> 1);
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = ((result & 1) !== 0) ? ~(result >> 1) : (result >> 1);
      lng += dlng;

      poly.push({ latitude: lat * 1e-5, longitude: lng * 1e-5 });
    }

    return poly;
  }

  /**
   * Calculate ETA based on distance and average speed
   */
  calculateETA(distanceMeters: number, averageSpeedKmh: number = 30): Date {
    const durationHours = distanceMeters / 1000 / averageSpeedKmh;
    const durationMs = durationHours * 60 * 60 * 1000;
    return new Date(Date.now() + durationMs);
  }

  /**
   * Fetch route data from Google Directions API using HTTP (avoiding native module issues)
   */
  async fetchRouteData(
    origin: LocationType,
    destination: LocationType
  ): Promise<{
    distance: number; // meters
    duration: number; // seconds
    coordinates?: Array<{ latitude: number; longitude: number }>;
  } | null> {
    if (!GOOGLE_MAPS_CONFIG.apiKey) {
      console.warn('⚠️ Google Maps API key not configured');
      return null;
    }

    // CRITICAL: Validate locations before API call
    if (!origin || !destination || 
        !origin.latitude || !origin.longitude || 
        !destination.latitude || !destination.longitude) {
      console.warn('⚠️ Invalid origin or destination for route calculation');
      return null;
    }

    // Check if locations are too close (less than 10 meters) - use manual calculation instead
    const straightDistance = this.calculateDistance(origin, destination);
    if (straightDistance < 10) {
      // Locations too close - return null to use fallback calculation
      return null;
    }

    try {
      const originStr = `${origin.latitude},${origin.longitude}`;
      const destStr = `${destination.latitude},${destination.longitude}`;
      
      // Request detailed polyline for better route rendering
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destStr}&key=${GOOGLE_MAPS_CONFIG.apiKey}&alternatives=false`;
      
      console.log(`🔍 Fetching route: ${originStr} → ${destStr}`);
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK') {
        console.warn('⚠️ Directions API error:', data.status, data.error_message);
        return null;
      }

      const route = data.routes[0];
      if (!route || !route.legs || route.legs.length === 0) {
        console.warn('⚠️ No route found in API response');
        return null;
      }

      const leg = route.legs[0];
      const distanceMeters = leg.distance?.value || 0; // in meters
      const durationSeconds = leg.duration?.value || 0; // in seconds

      // CRITICAL: Validate API response - reject if distance is 0 or invalid
      if (!distanceMeters || distanceMeters === 0 || !durationSeconds || durationSeconds === 0) {
        console.warn(`⚠️ Invalid route data from API - Distance: ${distanceMeters}m, Duration: ${durationSeconds}s`);
        return null;
      }

      // Decode polyline to get actual route coordinates
      let coordinates: Array<{ latitude: number; longitude: number }> | undefined;
      if (route.overview_polyline?.points) {
        coordinates = this.decodePolyline(route.overview_polyline.points);
        console.log(`📍 Decoded ${coordinates.length} route coordinates`);
        
        // Validate coordinates were decoded
        if (coordinates.length === 0) {
          console.warn('⚠️ Polyline decoding resulted in 0 coordinates');
        }
      } else {
        console.warn('⚠️ No overview_polyline in route response');
      }

      console.log(`✅ Route fetched successfully - Distance: ${distanceMeters}m, Duration: ${durationSeconds}s`);
      
      return {
        distance: distanceMeters,
        duration: durationSeconds,
        coordinates,
      };
    } catch (error) {
      console.error('❌ Error fetching route data:', error);
      return null;
    }
  }
}

export const locationService = new LocationService();

