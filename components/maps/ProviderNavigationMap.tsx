import { Button } from '@/components/ui/Button';
import { GOOGLE_MAPS_CONFIG } from '@/config/maps';
import { useTheme } from '@/contexts/ThemeContext';
import { locationService } from '@/services/locationService';
import { Location } from '@/types/maps';
import { requestPermissionWithAlert } from '@/utils/permissionUtils';
import { showSuccessMessage } from '@/utils/toast';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

interface ProviderNavigationMapProps {
  bookingId: string;
  providerId: string;
  customerLocation: Location;
  customerName: string;
  customerAddress: string;
  onTrackingStart?: () => void;
  onTrackingStop?: () => void;
}

/**
 * ProviderNavigationMap Component
 * 
 * Navigation map for providers with:
 * - Turn-by-turn directions
 * - Real-time location tracking
 * - Route visualization
 * - Distance and ETA
 * - External navigation app integration
 */
export const ProviderNavigationMap: React.FC<ProviderNavigationMapProps> = ({
  bookingId,
  providerId,
  customerLocation,
  customerName,
  customerAddress,
  onTrackingStart,
  onTrackingStop,
}) => {
  const { colors } = useTheme();
  const mapRef = useRef<MapView>(null);

  const [providerLocation, setProviderLocation] = useState<Location | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [distance, setDistance] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [eta, setEta] = useState<Date | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<Location[]>([]); // Actual route coordinates from Google Directions
  const routeFetchRef = useRef<{ lastFetch: number; lastLocation: Location | null }>({
    lastFetch: 0,
    lastLocation: null,
  }); // Debounce route API calls
  
  // Animation for provider marker
  const markerAnimValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Get initial provider location
    getInitialLocation();

    return () => {
      // Stop tracking on unmount
      if (isTracking) {
        handleStopTracking();
      }
    };
  }, []);

  useEffect(() => {
    // Fetch initial route when provider location is available
    if (providerLocation && customerLocation && routeCoordinates.length === 0) {
      console.log('📍 Fetching initial route for navigation...');
      locationService.fetchRouteData(providerLocation, customerLocation).then((routeData) => {
        if (routeData && routeData.coordinates && routeData.coordinates.length > 0) {
          setRouteCoordinates(routeData.coordinates);
          setDistance(routeData.distance);
          setDuration(routeData.duration);
          setEta(locationService.calculateETA(routeData.distance, 30));
          console.log(`✅ Initial route fetched: ${routeData.coordinates.length} coordinates`);
        } else {
          console.warn('⚠️ No route coordinates in initial fetch');
        }
      }).catch((error) => {
        console.warn('⚠️ Error fetching initial route:', error);
      });
    }
  }, [providerLocation, customerLocation, routeCoordinates.length]);

  // Pulsing animation for provider marker
  useEffect(() => {
    if (providerLocation) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(markerAnimValue, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(markerAnimValue, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    }
  }, [providerLocation]);

  const markerScale = markerAnimValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15],
  });

  useEffect(() => {
    // Fit map to show both locations when provider location is available
    if (providerLocation && mapRef.current) {
      mapRef.current.fitToCoordinates(
        [providerLocation, customerLocation],
        {
          edgePadding: {
            top: 100,
            right: 50,
            bottom: 350,
            left: 50,
          },
          animated: true,
        }
      );
    }
  }, [providerLocation, customerLocation]);

  const getInitialLocation = async () => {
    const location = await locationService.getCurrentLocation();
    if (location) {
      setProviderLocation(location);
      
      // Calculate initial distance
      const dist = locationService.calculateDistance(location, customerLocation);
      setDistance(dist);
    }
  };

  const handleStartTracking = async () => {
    try {
      // Request permission with automatic alert handling
      const hasPermission = await requestPermissionWithAlert(
        'location',
        () => locationService.requestPermissions(),
        async () => {
          // Permission granted, start tracking
      const success = await locationService.startProviderTracking(bookingId, providerId);
      
      if (success) {
        setIsTracking(true);
        onTrackingStart?.();
        showSuccessMessage('Success', 'Location tracking started');
        startLocationUpdates();
      } else {
            Alert.alert(
              'Tracking Failed',
              'Failed to start location tracking. Please ensure location services are enabled in your device settings.',
              [{ text: 'OK' }]
            );
          }
        },
        'Location permission is required to start tracking.'
      );

      if (!hasPermission) {
        return; // Permission denied, tracking not started
      }
    } catch (error) {
      console.error('Error starting tracking:', error);
      Alert.alert('Error', 'Failed to start tracking. Please try again.');
    }
  };

  const handleStopTracking = async () => {
    try {
      await locationService.stopProviderTracking(bookingId);
      setIsTracking(false);
      onTrackingStop?.();
      showSuccessMessage('Success', 'Location tracking stopped');
    } catch (error) {
      console.error('Error stopping tracking:', error);
    }
  };

  const startLocationUpdates = () => {
    // Location updates are handled by locationService.startProviderTracking
    // This function can be used for additional UI updates
    const interval = setInterval(async () => {
      const location = await locationService.getCurrentLocation();
      if (location) {
        setProviderLocation(location);
        
        // CRITICAL: Always calculate distance immediately (prevents 0m display)
        const immediateDist = locationService.calculateDistance(location, customerLocation);
        
        // Validate distance - never show 0m unless actually 0
        if (immediateDist > 0) {
          setDistance(immediateDist);
        } else {
          console.warn('⚠️ Calculated distance is 0m - provider and customer might be at same location');
          // Keep previous distance if new is 0
          if (distance === 0) {
            console.warn('⚠️ Provider location might not be initialized correctly');
          }
        }
        
        // Debounce route API calls - only fetch if location changed significantly or after 15 seconds
        const now = Date.now();
        const lastLocation = routeFetchRef.current.lastLocation;
        const locationChanged = !lastLocation || 
          locationService.calculateDistance(location, lastLocation) > 50; // 50 meters
        const timeSinceLastFetch = now - routeFetchRef.current.lastFetch;
        const shouldFetch = (locationChanged || timeSinceLastFetch > 15000) && immediateDist > 10;
        
        if (shouldFetch) {
          routeFetchRef.current.lastFetch = now;
          routeFetchRef.current.lastLocation = location;
          
          // Fetch route data from Directions API (via HTTP, no native modules)
          locationService.fetchRouteData(location, customerLocation).then((routeData) => {
            // Store actual route coordinates for rendering
            if (routeData && routeData.coordinates && routeData.coordinates.length > 0) {
              setRouteCoordinates(routeData.coordinates);
              console.log(`📍 Stored ${routeData.coordinates.length} route coordinates for rendering`);
            }
            
            // CRITICAL: Only use API data if it's valid (> 0)
            if (routeData && routeData.distance > 0 && routeData.duration > 0) {
              // Use API route data (more accurate) - but validate again
              if (routeData.distance >= immediateDist * 0.5 && routeData.distance <= immediateDist * 2) {
                // API distance is reasonable (between 50% and 200% of straight distance)
                setDistance(routeData.distance);
                setDuration(routeData.duration);
                setEta(locationService.calculateETA(routeData.distance, 30));
                console.log(`✅ Route calculated - Distance: ${locationService.formatDistance(routeData.distance)}, Duration: ${locationService.formatDuration(routeData.duration)}`);
              } else {
                // API returned unreasonable data - use immediate distance
                console.warn(`⚠️ API distance (${routeData.distance}m) seems unreasonable vs straight distance (${immediateDist}m) - using straight distance`);
                const avgSpeedKmh = 30;
                setEta(locationService.calculateETA(immediateDist, avgSpeedKmh));
                const durationMinutes = (immediateDist / 1000) / (avgSpeedKmh / 60);
                setDuration(durationMinutes * 60);
              }
            } else {
              // API returned invalid data - use immediate distance calculation
              console.log(`⚠️ API returned invalid data - using fallback calculation - Distance: ${locationService.formatDistance(immediateDist)}`);
              const avgSpeedKmh = 30;
              setEta(locationService.calculateETA(immediateDist, avgSpeedKmh));
              const durationMinutes = (immediateDist / 1000) / (avgSpeedKmh / 60);
              setDuration(durationMinutes * 60);
            }
          }).catch((error) => {
            // Fallback on error - keep immediate distance
            const avgSpeedKmh = 30;
            setEta(locationService.calculateETA(immediateDist, avgSpeedKmh));
            const durationMinutes = (immediateDist / 1000) / (avgSpeedKmh / 60);
            setDuration(durationMinutes * 60);
            console.warn('⚠️ Route fetch failed, using fallback:', error);
          });
        } else {
          // Use immediate distance and estimate duration
          const avgSpeedKmh = 30;
          setEta(locationService.calculateETA(immediateDist, avgSpeedKmh));
          const durationMinutes = (immediateDist / 1000) / (avgSpeedKmh / 60);
          setDuration(durationMinutes * 60);
        }
      }
    }, 10000); // Update every 10 seconds (matches tracking interval)

    return () => clearInterval(interval);
  };

  const openInGoogleMaps = async () => {
    const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${customerLocation.latitude},${customerLocation.longitude}`;
    
    if (Platform.OS === 'android') {
      // Android - try Google Maps app first, fallback to web
      const appUrl = `google.navigation:q=${customerLocation.latitude},${customerLocation.longitude}&mode=d`;
      try {
        const supported = await Linking.canOpenURL('google.navigation:');
        if (supported) {
          await Linking.openURL(appUrl);
        } else {
          await Linking.openURL(webUrl);
        }
      } catch (error) {
        console.error('Error opening Google Maps:', error);
        await Linking.openURL(webUrl);
      }
    } else {
      // iOS - try Google Maps app, fallback to Apple Maps, then web
      const googleMapsUrl = `comgooglemaps://?daddr=${customerLocation.latitude},${customerLocation.longitude}&directionsmode=driving`;
      
      try {
        // Try Google Maps app first
        const canOpenGoogleMaps = await Linking.canOpenURL('comgooglemaps://');
        if (canOpenGoogleMaps) {
          await Linking.openURL(googleMapsUrl);
          return;
        }
      } catch (error) {
        // Google Maps app not installed, continue to fallback
        console.log('Google Maps app not available, using fallback');
      }
      
      // Fallback to Apple Maps
      try {
        const appleMapsUrl = `http://maps.apple.com/?daddr=${customerLocation.latitude},${customerLocation.longitude}&dirflg=d`;
        await Linking.openURL(appleMapsUrl);
      } catch (error) {
        // If Apple Maps fails, use web
        console.error('Error opening maps:', error);
        await Linking.openURL(webUrl);
      }
    }
  };

  const openInAppleMaps = async () => {
    const url = `http://maps.apple.com/?daddr=${customerLocation.latitude},${customerLocation.longitude}&dirflg=d`;
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('Error opening Apple Maps:', error);
      // Fallback to web
      const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${customerLocation.latitude},${customerLocation.longitude}`;
      await Linking.openURL(webUrl);
    }
  };

  const handleNavigate = () => {
    if (Platform.OS === 'ios') {
      Alert.alert(
        'Open in Maps',
        'Choose your preferred navigation app',
        [
          {
            text: 'Apple Maps',
            onPress: openInAppleMaps,
          },
          {
            text: 'Google Maps',
            onPress: openInGoogleMaps,
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } else {
      openInGoogleMaps();
    }
  };

  // Validate and prepare region for iOS (critical - prevents blank map)
  const mapRegion = React.useMemo(() => {
    // Priority 1: Provider location (when available)
    if (providerLocation && 
        providerLocation.latitude && 
        providerLocation.longitude &&
        !isNaN(providerLocation.latitude) &&
        !isNaN(providerLocation.longitude)) {
      return {
        latitude: providerLocation.latitude,
        longitude: providerLocation.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
    }
    
    // Priority 2: Customer location (when provider location not available)
    if (customerLocation && 
        customerLocation.latitude && 
        customerLocation.longitude &&
        !isNaN(customerLocation.latitude) &&
        !isNaN(customerLocation.longitude)) {
      return {
        latitude: customerLocation.latitude,
        longitude: customerLocation.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
    }
    
    // Fallback to default region
    console.warn('⚠️ Using default region - no valid location found');
    return {
      latitude: GOOGLE_MAPS_CONFIG.defaultRegion.latitude,
      longitude: GOOGLE_MAPS_CONFIG.defaultRegion.longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };
  }, [providerLocation, customerLocation]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={mapRegion}
        region={mapRegion}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass
        showsTraffic
        toolbarEnabled={false}
        loadingEnabled={true}
        loadingIndicatorColor={colors.primary}
        onMapReady={() => {
          console.log(`✅ Map ready on ${Platform.OS} - Region:`, mapRegion);
          // Ensure map is visible on iOS
          if (mapRef.current && Platform.OS === 'ios') {
            setTimeout(() => {
              mapRef.current?.animateToRegion(mapRegion, 500);
            }, 100);
          }
        }}
      >
        {/* Customer Location Marker - Google Maps Style Red Pin */}
        {customerLocation && (
          <Marker
            coordinate={customerLocation}
            title={customerName || 'Customer Location'}
            description={customerAddress || 'Destination'}
            anchor={{ x: 0.5, y: 1 }}
          >
            <View style={styles.destinationMarkerContainer}>
              {/* Pin Shadow */}
              <View style={styles.pinShadow} />
              {/* Pin Body - Red like Google Maps */}
              <View style={styles.destinationPinRed}>
                <View style={styles.pinInnerCircle}>
                  <Ionicons name="location" size={18} color="white" />
                </View>
              </View>
              {/* Pin Point */}
              <View style={styles.pinPointRed} />
            </View>
          </Marker>
        )}

        {/* Provider Location Marker - Blue Dot with Arrow (Google Maps Style) */}
        {providerLocation && (
          <Marker
            coordinate={providerLocation}
            title="Your Location"
            description="Provider location"
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <Animated.View
              style={[
                styles.providerMarkerContainer,
                {
                  transform: [{ scale: markerScale }],
                }
              ]}
            >
              {/* Pulsing Circle Animation */}
              <Animated.View
                style={[
                  styles.providerPulseCircle,
                  {
                    borderColor: '#4285F4',
                    backgroundColor: '#4285F420',
                    opacity: markerAnimValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.4, 0],
                    }),
                    transform: [{
                      scale: markerAnimValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.8],
                      }),
                    }],
                  }
                ]}
              />
              {/* Blue Circle - Google Maps style */}
              <View style={styles.providerBlueCircle}>
                <View style={styles.providerBlueCircleInner} />
              </View>
              {/* Direction Arrow on top */}
              <View style={styles.directionArrowBlue}>
                <View style={styles.arrowTriangle} />
              </View>
            </Animated.View>
          </Marker>
        )}

        {/* Actual Route Line - Shows the real road route from Google Directions (SOLID, Google Maps Blue) */}
        {routeCoordinates.length > 0 ? (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#4285F4" // Google Maps blue
            strokeWidth={6}
            lineCap="round"
            lineJoin="round"
          />
        ) : providerLocation && customerLocation ? (
          // Fallback: straight line while route is loading
          <Polyline
            coordinates={[
              {
                latitude: providerLocation.latitude,
                longitude: providerLocation.longitude,
              },
              {
                latitude: customerLocation.latitude,
                longitude: customerLocation.longitude,
              },
            ]}
            strokeColor="#4285F4"
            strokeWidth={6}
            lineCap="round"
            lineJoin="round"
          />
        ) : null}
      </MapView>

      {/* Info Card */}
      <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
        {/* Distance & Time */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <View style={[styles.statIconContainer, { backgroundColor: `${colors.primary}15` }]}>
              <Ionicons name="navigate" size={20} color={colors.primary} />
            </View>
            <View style={styles.statTextContainer}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Distance
              </Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {locationService.formatDistance(distance)}
              </Text>
            </View>
          </View>

          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

          <View style={styles.statItem}>
            <View style={[styles.statIconContainer, { backgroundColor: `${colors.primary}15` }]}>
              <Ionicons name="time" size={20} color={colors.primary} />
            </View>
            <View style={styles.statTextContainer}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                ETA
              </Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {duration > 0
                  ? locationService.formatDuration(duration)
                  : distance > 0
                  ? locationService.formatDuration(Math.round(distance / 1000 / 30 * 60)) // Fallback calculation
                  : 'Calculating...'}
              </Text>
            </View>
          </View>
        </View>

        {/* Customer Info */}
        <View style={[styles.customerInfoContainer, { borderTopColor: colors.border }]}>
          <View style={styles.customerInfo}>
            <View style={[styles.customerIconContainer, { backgroundColor: `${colors.error}15` }]}>
              <Ionicons name="location" size={20} color={colors.error} />
            </View>
            <View style={styles.customerTextContainer}>
              <Text style={[styles.customerName, { color: colors.text }]}>
                {customerName}
              </Text>
              <Text style={[styles.customerAddress, { color: colors.textSecondary }]} numberOfLines={1}>
                {customerAddress}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <View style={styles.buttonRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Button
                title={isTracking ? 'Stop Tracking' : 'Start Tracking'}
                onPress={isTracking ? handleStopTracking : handleStartTracking}
                variant={isTracking ? 'outline' : 'primary'}
                icon={isTracking ? 'stop-circle' : 'play-circle'}
                size="md"
              />
            </View>
            <Pressable
              style={[styles.navigateButton, { backgroundColor: colors.primary }]}
              onPress={handleNavigate}
            >
              <Ionicons name="map" size={24} color="white" />
            </Pressable>
          </View>

          {isTracking && (
            <View style={[styles.trackingIndicator, { backgroundColor: `${colors.success}15` }]}>
              <View style={[styles.trackingDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.trackingText, { color: colors.success }]}>
                Live tracking active • Location updating every 10 seconds
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0', // Background color while map loads (iOS fix)
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%', // Explicit dimensions for iOS
  },
  // Destination Pin Marker - Google Maps Red Pin Style
  destinationMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  destinationPinRed: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EA4335', // Google Maps red
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  pinInnerCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EA4335',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinPointRed: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EA4335',
    marginTop: -5,
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  pinShadow: {
    position: 'absolute',
    width: 18,
    height: 10,
    borderRadius: 9,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    top: 48,
    transform: [{ scaleX: 1.3 }],
  },
  // Provider Marker - Google Maps Blue Dot Style
  providerMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerPulseCircle: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
  },
  providerBlueCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4285F4', // Google Maps blue
    borderWidth: 3,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  providerBlueCircleInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  },
  directionArrowBlue: {
    position: 'absolute',
    top: -8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowTriangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#4285F4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  infoCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statTextContainer: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statDivider: {
    width: 1,
    height: '100%',
    marginHorizontal: 16,
  },
  customerInfoContainer: {
    borderTopWidth: 1,
    paddingTop: 16,
    marginBottom: 16,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  customerTextContainer: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  customerAddress: {
    fontSize: 13,
  },
  actionsContainer: {
    gap: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navigateButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  trackingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  trackingText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
});

