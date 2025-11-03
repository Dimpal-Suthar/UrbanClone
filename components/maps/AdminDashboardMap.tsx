import { GOOGLE_MAPS_CONFIG } from '@/config/maps';
import { useTheme } from '@/contexts/ThemeContext';
import { locationService } from '@/services/locationService';
import { Location, ProviderLocation } from '@/types/maps';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Callout, Circle, Marker, PROVIDER_GOOGLE } from 'react-native-maps';

interface BookingData {
  id: string;
  customerId: string;
  customerName: string;
  providerId: string;
  providerName: string;
  serviceType: string;
  status: string;
  customerLocation: Location;
}

interface AdminDashboardMapProps {
  bookings?: BookingData[];
  onBookingSelect?: (bookingId: string) => void;
  onProviderSelect?: (providerId: string) => void;
}

/**
 * AdminDashboardMap Component
 * 
 * Comprehensive map view for admin dashboard with:
 * - All active bookings visualization
 * - Real-time provider locations
 * - Service area heatmaps
 * - Provider density
 * - Booking analytics by location
 * - Clustering for better performance
 */
export const AdminDashboardMap: React.FC<AdminDashboardMapProps> = ({
  bookings = [],
  onBookingSelect,
  onProviderSelect,
}) => {
  const { colors } = useTheme();
  const mapRef = useRef<MapView>(null);

  const [providerLocations, setProviderLocations] = useState<ProviderLocation[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [mapType, setMapType] = useState<'standard' | 'hybrid'>('standard');
  const [showServiceAreas, setShowServiceAreas] = useState(false);

  useEffect(() => {
    // Load initial provider locations
    loadProviderLocations();

    // Set up periodic refresh
    const interval = setInterval(loadProviderLocations, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Fit map to show all markers
    if (bookings.length > 0 && mapRef.current) {
      const coordinates = bookings.map(b => b.customerLocation);
      
      if (coordinates.length > 0) {
        mapRef.current.fitToCoordinates(coordinates, {
          edgePadding: {
            top: 100,
            right: 50,
            bottom: 300,
            left: 50,
          },
          animated: true,
        });
      }
    }
  }, [bookings]);

  const loadProviderLocations = async () => {
    const locations = await locationService.getActiveProviderLocations();
    setProviderLocations(locations);
  };

  const handleBookingMarkerPress = (bookingId: string) => {
    setSelectedBooking(bookingId);
    onBookingSelect?.(bookingId);
  };

  const handleProviderMarkerPress = (providerId: string) => {
    onProviderSelect?.(providerId);
  };

  const getMarkerColor = (status: string): string => {
    switch (status) {
      case 'pending':
        return '#FFA500'; // Orange
      case 'confirmed':
        return colors.primary;
      case 'in_progress':
        return colors.success;
      case 'completed':
        return '#9CA3AF'; // Gray
      case 'cancelled':
        return colors.error;
      default:
        return colors.primary;
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'time';
      case 'confirmed':
        return 'checkmark-circle';
      case 'in_progress':
        return 'play-circle';
      case 'completed':
        return 'checkmark-done';
      case 'cancelled':
        return 'close-circle';
      default:
        return 'information-circle';
    }
  };

  const toggleMapType = () => {
    setMapType(prev => prev === 'standard' ? 'hybrid' : 'standard');
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={GOOGLE_MAPS_CONFIG.defaultRegion}
        mapType={mapType}
        showsCompass
        showsScale
        toolbarEnabled={false}
      >
        {/* Booking Markers */}
        {bookings.map((booking) => (
          <React.Fragment key={booking.id}>
            <Marker
              coordinate={booking.customerLocation}
              onPress={() => handleBookingMarkerPress(booking.id)}
            >
              <View style={styles.bookingMarkerContainer}>
                <View
                  style={[
                    styles.bookingMarker,
                    {
                      backgroundColor: getMarkerColor(booking.status),
                      borderColor: selectedBooking === booking.id ? 'white' : 'transparent',
                      borderWidth: selectedBooking === booking.id ? 3 : 0,
                    },
                  ]}
                >
                  <Ionicons
                    name={getStatusIcon(booking.status) as any}
                    size={20}
                    color="white"
                  />
                </View>
              </View>
              
              <Callout tooltip>
                <View style={[styles.callout, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.calloutTitle, { color: colors.text }]}>
                    {booking.serviceType}
                  </Text>
                  <Text style={[styles.calloutText, { color: colors.textSecondary }]}>
                    Customer: {booking.customerName}
                  </Text>
                  <Text style={[styles.calloutText, { color: colors.textSecondary }]}>
                    Provider: {booking.providerName}
                  </Text>
                  <View style={styles.calloutBadge}>
                    <View
                      style={[
                        styles.calloutBadgeDot,
                        { backgroundColor: getMarkerColor(booking.status) },
                      ]}
                    />
                    <Text
                      style={[
                        styles.calloutBadgeText,
                        { color: getMarkerColor(booking.status) },
                      ]}
                    >
                      {booking.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </Callout>
            </Marker>

            {/* Service Area Circle */}
            {showServiceAreas && (
              <Circle
                center={booking.customerLocation}
                radius={GOOGLE_MAPS_CONFIG.geofence.arrivalRadius}
                fillColor={`${getMarkerColor(booking.status)}20`}
                strokeColor={getMarkerColor(booking.status)}
                strokeWidth={2}
              />
            )}
          </React.Fragment>
        ))}

        {/* Active Provider Markers */}
        {providerLocations.map((provider) => (
          <Marker
            key={provider.providerId}
            coordinate={provider.location}
            onPress={() => handleProviderMarkerPress(provider.providerId)}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.providerMarkerContainer}>
              <View style={[styles.providerMarker, { backgroundColor: colors.success }]}>
                <Ionicons name="car" size={18} color="white" />
              </View>
              <View style={[styles.providerPulse, { borderColor: colors.success }]} />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Map Controls */}
      <View style={styles.controlsContainer}>
        <Pressable
          style={[styles.controlButton, { backgroundColor: colors.surface }]}
          onPress={toggleMapType}
        >
          <Ionicons name="layers" size={20} color={colors.text} />
        </Pressable>
        
        <Pressable
          style={[
            styles.controlButton,
            { backgroundColor: showServiceAreas ? colors.primary : colors.surface },
          ]}
          onPress={() => setShowServiceAreas(!showServiceAreas)}
        >
          <Ionicons
            name="radio-button-on"
            size={20}
            color={showServiceAreas ? 'white' : colors.text}
          />
        </Pressable>

        <Pressable
          style={[styles.controlButton, { backgroundColor: colors.surface }]}
          onPress={loadProviderLocations}
        >
          <Ionicons name="refresh" size={20} color={colors.text} />
        </Pressable>
      </View>

      {/* Stats Card */}
      <View style={[styles.statsCard, { backgroundColor: colors.surface }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsScrollContent}
        >
          <View style={styles.statItem}>
            <View style={[styles.statIconContainer, { backgroundColor: `${colors.primary}15` }]}>
              <Ionicons name="calendar" size={20} color={colors.primary} />
            </View>
            <View style={styles.statTextContainer}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {bookings.length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Total Bookings
              </Text>
            </View>
          </View>

          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

          <View style={styles.statItem}>
            <View style={[styles.statIconContainer, { backgroundColor: `${colors.success}15` }]}>
              <Ionicons name="car" size={20} color={colors.success} />
            </View>
            <View style={styles.statTextContainer}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {providerLocations.length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Active Providers
              </Text>
            </View>
          </View>

          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

          <View style={styles.statItem}>
            <View style={[styles.statIconContainer, { backgroundColor: `${colors.success}15` }]}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            </View>
            <View style={styles.statTextContainer}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {bookings.filter(b => b.status === 'in_progress').length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                In Progress
              </Text>
            </View>
          </View>

          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

          <View style={styles.statItem}>
            <View style={[styles.statIconContainer, { backgroundColor: `${colors.warning}15` }]}>
              <Ionicons name="time" size={20} color="#FFA500" />
            </View>
            <View style={styles.statTextContainer}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {bookings.filter(b => b.status === 'pending').length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Pending
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Legend */}
      <View style={[styles.legendCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.legendTitle, { color: colors.text }]}>Status Legend</Text>
        <View style={styles.legendGrid}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FFA500' }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>Pending</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>Confirmed</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>In Progress</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>Cancelled</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  bookingMarkerContainer: {
    alignItems: 'center',
  },
  bookingMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  providerMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  providerPulse: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    opacity: 0.3,
  },
  callout: {
    padding: 12,
    borderRadius: 12,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  calloutTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  calloutText: {
    fontSize: 13,
    marginBottom: 4,
  },
  calloutBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  calloutBadgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  calloutBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  controlsContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 20,
    right: 16,
    gap: 12,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  statsCard: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 20,
    left: 16,
    right: 80,
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  statsScrollContent: {
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 120,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  statTextContainer: {
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  legendCard: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 44 : 24,
    left: 16,
    right: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: '40%',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

