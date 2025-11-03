import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, Platform, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

import { GOOGLE_MAPS_CONFIG } from '@/config/maps';
import { useTheme } from '@/contexts/ThemeContext';
import { locationService } from '@/services/locationService';
import { Location } from '@/types/maps';

interface LiveTrackingMapProps {
  bookingId: string;
  customerLocation: Location;
  providerName: string;
  providerImage?: string;
  onArrival?: () => void;
}

/**
 * LiveTrackingMap Component
 * 
 * Real-time provider tracking for customers with:
 * - Live provider location updates
 * - Route visualization
 * - ETA calculation
 * - Distance updates
 * - Geofence-based arrival detection
 */
export const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({
  bookingId,
  customerLocation,
  providerName,
  providerImage,
  onArrival,
}) => {
  const { colors } = useTheme();
  const mapRef = useRef<MapView>(null);
  const markerAnimValue = useRef(new Animated.Value(0)).current;

  const [providerLocation, setProviderLocation] = useState<Location | null>(null);
  const [distance, setDistance] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [eta, setEta] = useState<Date | null>(null);
  const [hasArrived, setHasArrived] = useState(false);
  const [travelPath, setTravelPath] = useState<Location[]>([]); // Path history like Urban Company
  const [routeError, setRouteError] = useState(false); // Track if route API fails
  const [routeCoordinates, setRouteCoordinates] = useState<Location[]>([]); // Actual route coordinates from Google Directions
  const routeFetchRef = useRef<{ lastFetch: number; lastLocation: Location | null }>({
    lastFetch: 0,
    lastLocation: null,
  }); // Debounce route API calls
  
  // Fetch initial route when provider location is first available
  useEffect(() => {
    if (providerLocation && customerLocation && routeCoordinates.length === 0 && !hasArrived) {
      console.log('📍 Fetching initial route...');
      locationService.fetchRouteData(providerLocation, customerLocation).then((routeData) => {
        if (routeData && routeData.coordinates && routeData.coordinates.length > 0) {
          setRouteCoordinates(routeData.coordinates);
          console.log(`✅ Initial route fetched: ${routeData.coordinates.length} coordinates`);
        } else {
          console.warn('⚠️ No route coordinates in initial fetch');
        }
      }).catch((error) => {
        console.warn('⚠️ Error fetching initial route:', error);
      });
    }
  }, [providerLocation, customerLocation, routeCoordinates.length, hasArrived]);

  // Initialize ETA calculation when distance is available
  useEffect(() => {
    if (distance > 0 && !eta && customerLocation) {
      const avgSpeedKmh = 30;
      const etaDate = locationService.calculateETA(distance, avgSpeedKmh);
      if (etaDate) {
        setEta(etaDate);
        try {
          const etaTime = etaDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
          console.log(`⏰ Initial ETA calculated: ${etaTime}`);
        } catch (error) {
          const hours = etaDate.getHours();
          const minutes = etaDate.getMinutes();
          const ampm = hours >= 12 ? 'PM' : 'AM';
          const displayHours = hours % 12 || 12;
          console.log(`⏰ Initial ETA calculated: ${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`);
        }
        
        // Also set duration
        const durationMinutes = (distance / 1000) / (avgSpeedKmh / 60);
        setDuration(durationMinutes * 60);
      }
    }
  }, [distance, eta, customerLocation]);

  useEffect(() => {
    // Subscribe to provider location updates
    const unsubscribe = locationService.subscribeToProviderLocation(
      bookingId,
      (location) => {
        if (location) {
          const newLocation = location.location;
          
          // Update provider location
          setProviderLocation(newLocation);
          
          // Add to travel path history (like Urban Company shows route)
          setTravelPath((prevPath) => {
            // Only add if location changed significantly (more than 5 meters for smoother path)
            if (prevPath.length === 0 || 
                locationService.calculateDistance(prevPath[prevPath.length - 1], newLocation) > 5) {
              const newPath = [...prevPath, newLocation];
              // Limit path to last 100 points to prevent memory issues
              return newPath.slice(-100);
            }
            return prevPath;
          });
          
                 // CRITICAL: Always calculate distance immediately (prevents 0m display)
                 const immediateDist = locationService.calculateDistance(newLocation, customerLocation);
                 
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
                   locationService.calculateDistance(newLocation, lastLocation) > 50; // 50 meters
                 const timeSinceLastFetch = now - routeFetchRef.current.lastFetch;
                 const shouldFetch = (locationChanged || timeSinceLastFetch > 15000) && immediateDist > 10;
                 
                 if (shouldFetch) {
                   routeFetchRef.current.lastFetch = now;
                   routeFetchRef.current.lastLocation = newLocation;
                   
                  // Fetch route data from Directions API (via HTTP, no native modules)
                  locationService.fetchRouteData(newLocation, customerLocation).then((routeData) => {
                    // CRITICAL: Only use API data if it's valid (> 0)
                    if (routeData && routeData.distance > 0 && routeData.duration > 0) {
                      // Use API route data (more accurate) - but validate again
                      if (routeData.distance >= immediateDist * 0.5 && routeData.distance <= immediateDist * 2) {
                        // API distance is reasonable (between 50% and 200% of straight distance)
                        setDistance(routeData.distance);
                        setDuration(routeData.duration);
                        const etaDate = locationService.calculateETA(routeData.distance, 30);
                        setEta(etaDate);
                        
                        // Store actual route coordinates for rendering
                        if (routeData.coordinates && routeData.coordinates.length > 0) {
                          setRouteCoordinates(routeData.coordinates);
                          console.log(`📍 Stored ${routeData.coordinates.length} route coordinates for rendering`);
                        } else {
                          setRouteCoordinates([]);
                        }
                        
                        setRouteError(false);
                        console.log(`✅ Route calculated - Distance: ${locationService.formatDistance(routeData.distance)}, Duration: ${locationService.formatDuration(routeData.duration)}`);
                      } else {
                        // API returned unreasonable data - use immediate distance
                        console.warn(`⚠️ API distance (${routeData.distance}m) seems unreasonable vs straight distance (${immediateDist}m) - using straight distance`);
                        const avgSpeedKmh = 30;
                        const etaDate = locationService.calculateETA(immediateDist, avgSpeedKmh);
                        setEta(etaDate);
                        const durationMinutes = (immediateDist / 1000) / (avgSpeedKmh / 60);
                        setDuration(durationMinutes * 60);
                        setRouteCoordinates([]);
                        setRouteError(true);
                      }
                    } else {
                      // API returned invalid data - use immediate distance calculation
                      console.log(`⚠️ API returned invalid data - using fallback calculation - Distance: ${locationService.formatDistance(immediateDist)}`);
                      const avgSpeedKmh = 30;
                      const etaDate = locationService.calculateETA(immediateDist, avgSpeedKmh);
                      setEta(etaDate);
                      const durationMinutes = (immediateDist / 1000) / (avgSpeedKmh / 60);
                      setDuration(durationMinutes * 60);
                      setRouteCoordinates([]);
                      setRouteError(true);
                    }
                  }).catch((error) => {
                    // Fallback on error - keep immediate distance
                    const avgSpeedKmh = 30;
                    const etaDate = locationService.calculateETA(immediateDist, avgSpeedKmh);
                    setEta(etaDate);
                    const durationMinutes = (immediateDist / 1000) / (avgSpeedKmh / 60);
                    setDuration(durationMinutes * 60);
                    setRouteCoordinates([]);
                    setRouteError(true);
                    console.warn('⚠️ Route fetch failed, using fallback:', error);
                  });
                 } else {
                   // Use immediate distance and estimate duration
                   const avgSpeedKmh = 30;
                   const etaDate = locationService.calculateETA(immediateDist, avgSpeedKmh);
                   setEta(etaDate);
                   const durationMinutes = (immediateDist / 1000) / (avgSpeedKmh / 60);
                   setDuration(durationMinutes * 60);
                 }

          // Check if provider has arrived (within 50 meters)
          const isWithinGeofence = locationService.isWithinGeofence(
            newLocation,
            customerLocation,
            50 // 50 meter radius
          );

          if (isWithinGeofence && !hasArrived) {
            setHasArrived(true);
            onArrival?.();
          }
          
          // Smoothly update map camera to show both provider and customer (like Urban Company)
          if (mapRef.current && newLocation) {
            // Fit both locations on screen instead of just following provider
            mapRef.current.fitToCoordinates(
              [customerLocation, newLocation],
              {
                edgePadding: {
                  top: 150,
                  right: 50,
                  bottom: 350,
                  left: 50,
                },
                animated: true,
              }
            );
          }
        } else {
          // Provider location not available yet
          console.log('⏳ Waiting for provider location...');
        }
      }
    );

    return () => unsubscribe();
  }, [bookingId, customerLocation, hasArrived]);

  useEffect(() => {
    // Fit map to show both markers when provider location is first available
    if (providerLocation && mapRef.current && travelPath.length === 1) {
      // Initial fit when first location received
      mapRef.current.fitToCoordinates(
        [customerLocation, providerLocation],
        {
          edgePadding: {
            top: 100,
            right: 50,
            bottom: 300,
            left: 50,
          },
          animated: true,
        }
      );
    }
  }, [providerLocation, customerLocation, travelPath.length]);

  // Continuous pulse animation for provider marker
  useEffect(() => {
    if (providerLocation && !hasArrived) {
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
  }, [providerLocation, hasArrived]);

  const markerScale = markerAnimValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15],
  });

  // Note: RouteArrowIndicator removed - using MapViewDirections only
  // If API fails, we rely on MapViewDirections error handling

  // Validate and prepare region for iOS
  const mapRegion = React.useMemo(() => {
    const lat = customerLocation?.latitude;
    const lng = customerLocation?.longitude;
    
    // Ensure valid coordinates
    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
      return {
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
    }
    
    // Fallback to default region
    console.log('⚠️ Invalid customer location, using default region');
    return {
      latitude: GOOGLE_MAPS_CONFIG.defaultRegion.latitude,
      longitude: GOOGLE_MAPS_CONFIG.defaultRegion.longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };
  }, [customerLocation]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={mapRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        toolbarEnabled={false}
        mapType="standard"
        loadingEnabled={true}
        loadingIndicatorColor={colors.primary}
        onMapReady={() => {
          console.log(`✅ Map ready - Platform: ${Platform.OS}, Region:`, mapRegion);
          // Ensure map is visible on iOS
          if (mapRef.current && Platform.OS === 'ios') {
            setTimeout(() => {
              mapRef.current?.animateToRegion(mapRegion, 500);
            }, 100);
          }
        }}
        onLayout={() => {
          console.log('🗺️ Map layout rendered');
        }}
      >
        {/* Customer Location Marker - Google Maps Style Red Pin */}
        {customerLocation && (
          <Marker
            coordinate={customerLocation}
            title="Your Location"
            description="Destination"
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
        {providerLocation && !hasArrived && (
          <Marker
            coordinate={providerLocation}
            title={providerName || 'Provider'}
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
        {routeCoordinates.length > 0 && !hasArrived ? (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#4285F4" // Google Maps blue
            strokeWidth={6}
            lineCap="round"
            lineJoin="round"
          />
        ) : null}

        {/* Travel Path Polyline - Shows the path the provider has taken (dotted, semi-transparent) */}
        {travelPath.length > 1 && (
          <Polyline
            coordinates={travelPath.map(loc => ({
              latitude: loc.latitude,
              longitude: loc.longitude,
            }))}
            strokeColor={`#4285F460`} // Light blue, semi-transparent
            strokeWidth={4}
            lineDashPattern={[6, 6]}
            lineCap="round"
            lineJoin="round"
          />
        )}
      </MapView>

      {/* Tracking Info Card */}
      {providerLocation && (
        <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
          {hasArrived ? (
            <View style={styles.arrivedContainer}>
              <View style={[styles.arrivedIconContainer, { backgroundColor: `${colors.success}15` }]}>
                <Ionicons name="checkmark-circle" size={32} color={colors.success} />
              </View>
              <View style={styles.arrivedTextContainer}>
                <Text style={[styles.arrivedTitle, { color: colors.success }]}>
                  Provider Arrived!
                </Text>
                <Text style={[styles.arrivedSubtitle, { color: colors.textSecondary }]}>
                  {providerName} is at your location
                </Text>
              </View>
            </View>
          ) : (
            <>
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Ionicons name="navigate" size={20} color={colors.primary} />
                  <View style={styles.infoTextContainer}>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                      Distance
                    </Text>
                    <Text style={[styles.infoValue, { color: colors.text }]}>
                      {locationService.formatDistance(distance)}
                    </Text>
                  </View>
                </View>

                <View style={[styles.infoDivider, { backgroundColor: colors.border }]} />

                <View style={styles.infoItem}>
                  <Ionicons name="time" size={20} color={colors.primary} />
                  <View style={styles.infoTextContainer}>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                      ETA
                    </Text>
                    <Text style={[styles.infoValue, { color: colors.text }]}>
                      {duration > 0
                        ? locationService.formatDuration(duration)
                        : distance > 0
                        ? locationService.formatDuration(Math.round(distance / 1000 / 30 * 60)) // Fallback calculation
                        : 'Calculating...'}
                    </Text>
                  </View>
                </View>
              </View>

              {(eta || duration > 0) && (
                <View style={[styles.etaContainer, { backgroundColor: `${colors.primary}10` }]}>
                  <Ionicons name="information-circle" size={16} color={colors.primary} />
                  <Text style={[styles.etaText, { color: colors.primary }]}>
                    {eta 
                      ? (() => {
                          try {
                            return `Expected arrival at ${eta.toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true,
                            })}`;
                          } catch (error) {
                            // Fallback for iOS if toLocaleTimeString fails
                            const hours = eta.getHours();
                            const minutes = eta.getMinutes();
                            const ampm = hours >= 12 ? 'PM' : 'AM';
                            const displayHours = hours % 12 || 12;
                            return `Expected arrival at ${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
                          }
                        })()
                      : `Estimated time: ${locationService.formatDuration(duration)}`}
                  </Text>
                </View>
              )}

              <View style={[styles.providerInfoContainer, { borderTopColor: colors.border }]}>
                <View style={styles.providerInfo}>
                  {providerImage ? (
                    <Image source={{ uri: providerImage }} style={styles.providerAvatar} />
                  ) : (
                    <View style={[styles.providerAvatarDefault, { backgroundColor: colors.primary }]}>
                      <Ionicons name="person" size={20} color="white" />
                    </View>
                  )}
                  <View style={styles.providerTextContainer}>
                    <Text style={[styles.providerName, { color: colors.text }]}>
                      {providerName}
                    </Text>
                    <View style={styles.statusContainer}>
                      <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
                      <Text style={[styles.statusText, { color: colors.success }]}>
                        On the way
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </>
          )}
        </View>
      )}

      {/* Loading State */}
      {!providerLocation && (
        <View style={[styles.loadingCard, { backgroundColor: colors.surface }]}>
          <View style={[styles.loadingIconContainer, { backgroundColor: `${colors.primary}15` }]}>
            <Ionicons name="locate" size={24} color={colors.primary} />
          </View>
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Waiting for provider location...
          </Text>
          <Text style={[styles.loadingSubtext, { color: colors.textSecondary }]}>
            The map will update when {providerName} starts tracking
          </Text>
        </View>
      )}

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0', // Background color while map loads
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
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
  infoRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  infoItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoTextContainer: {
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  infoDivider: {
    width: 1,
    height: '100%',
    marginHorizontal: 16,
  },
  etaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  etaText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
  },
  providerInfoContainer: {
    borderTopWidth: 1,
    paddingTop: 16,
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  providerAvatarDefault: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
  },
  arrivedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  arrivedIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  arrivedTextContainer: {
    flex: 1,
  },
  arrivedTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  arrivedSubtitle: {
    fontSize: 14,
  },
  loadingCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  loadingIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});

