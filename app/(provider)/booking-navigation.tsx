import { ProviderNavigationMap } from '@/components/maps/ProviderNavigationMap';
import { Container } from '@/components/ui/Container';
import { db } from '@/config/firebase';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { locationService } from '@/services/locationService';
import { Location } from '@/types/maps';
import { requestPermissionWithAlert } from '@/utils/permissionUtils';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

/**
 * Provider Navigation Screen
 * 
 * Turn-by-turn navigation screen for providers to reach customer location
 * Shows route, ETA, and enables real-time location sharing
 */
export default function ProviderNavigationScreen() {
  const { bookingId } = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();

  const [customerLocation, setCustomerLocation] = useState<Location | null>(null);
  const [customerName, setCustomerName] = useState<string>('Customer');
  const [customerAddress, setCustomerAddress] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookingDetails();
  }, [bookingId]);

  const loadBookingDetails = async () => {
    try {
      if (!bookingId || typeof bookingId !== 'string') {
        console.error('❌ Missing bookingId:', bookingId);
        setLoading(false);
        return;
      }

      console.log('📖 Loading booking details for:', bookingId);
      const bookingDoc = await getDoc(doc(db, 'bookings', bookingId));
      
      if (!bookingDoc.exists()) {
        console.error('❌ Booking not found:', bookingId);
        setLoading(false);
        return;
      }

      const data = bookingDoc.data();
      console.log('📍 Booking address data:', JSON.stringify(data.address, null, 2));
      
      // Get customer location from booking address
      if (data.address?.lat && data.address?.lng) {
        console.log('✅ Found location:', data.address.lat, data.address.lng);
        setCustomerLocation({
          latitude: data.address.lat,
          longitude: data.address.lng,
        });
      } else if (data.address) {
        // Fallback: Geocode address string if lat/lng is missing
        console.log('⚠️ Missing lat/lng, geocoding address...');
        const addr = data.address;
        const addressString = [
          addr.street,
          addr.city,
          addr.state,
          addr.pincode
        ].filter(Boolean).join(', ');
        
        console.log('🔍 Geocoding address:', addressString);
        
        try {
          // Request location permission before geocoding (required on some platforms)
          const hasPermission = await requestPermissionWithAlert(
            'location',
            locationService.requestPermissions,
            undefined, // We'll handle geocoding after permission check
            'Location permission is needed to convert the address to coordinates for navigation.'
          );

          if (hasPermission) {
            // Permission granted, proceed with geocoding
            const geocodedLocation = await locationService.geocodeAddress(addressString);
            if (geocodedLocation) {
              console.log('✅ Geocoded location:', geocodedLocation);
              setCustomerLocation(geocodedLocation);
            } else {
              console.error('❌ Failed to geocode address');
              Alert.alert(
                'Navigation Unavailable',
                'Unable to get location from address. Please ensure the booking has a valid address with coordinates.',
                [{ text: 'OK' }]
              );
            }
          } else {
            // Permission denied
            Alert.alert(
              'Permission Required',
              'Location permission is required to convert the address to coordinates. Please grant permission in Settings.',
              [{ text: 'OK' }]
            );
          }
        } catch (error) {
          console.error('❌ Geocoding error:', error);
          Alert.alert(
            'Error',
            'Failed to convert address to location. Please try again or contact support.',
            [{ text: 'OK' }]
          );
        }
      } else {
        console.error('❌ No address data in booking');
        Alert.alert(
          'Navigation Unavailable',
          'No address information found for this booking.',
          [{ text: 'OK' }]
        );
      }

      // Format address
      if (data.address) {
        const addr = data.address;
        setCustomerAddress(
          [addr.street, addr.city, addr.state, addr.pincode]
            .filter(Boolean)
            .join(', ')
        );
      }

      // Get customer details
      if (data.customerId) {
        const customerDoc = await getDoc(doc(db, 'users', data.customerId));
        if (customerDoc.exists()) {
          const customerData = customerDoc.data();
          setCustomerName(customerData.name || 'Customer');
        }
      }
    } catch (error) {
      console.error('❌ Error loading booking details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container safeArea>
        <View style={styles.loadingContainer}>
          <Text style={{ color: colors.text }}>Loading navigation...</Text>
        </View>
      </Container>
    );
  }

  if (!customerLocation || !user) {
    return (
      <Container safeArea>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.text }]}>
            Unable to load navigation information
          </Text>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={{ color: colors.primary }}>Go Back</Text>
          </Pressable>
        </View>
      </Container>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Pressable onPress={() => router.back()} style={styles.backButtonIcon}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <View style={styles.headerTextContainer}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Navigate to Customer
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Enable tracking to share location
          </Text>
        </View>
      </View>

      {/* Map */}
      <ProviderNavigationMap
        bookingId={bookingId as string}
        providerId={user.uid}
        customerLocation={customerLocation}
        customerName={customerName}
        customerAddress={customerAddress}
        onTrackingStart={() => console.log('Tracking started')}
        onTrackingStop={() => console.log('Tracking stopped')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  backButtonIcon: {
    padding: 8,
    marginRight: 8,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  backButton: {
    marginTop: 24,
    padding: 12,
  },
});

