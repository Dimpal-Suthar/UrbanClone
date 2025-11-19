import { LiveTrackingMap } from '@/components/maps/LiveTrackingMap';
import { Container } from '@/components/ui/Container';
import { db } from '@/config/firebase';
import { useTheme } from '@/contexts/ThemeContext';
import { locationService } from '@/services/locationService';
import { Location } from '@/types/maps';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

/**
 * Track Booking Screen
 * 
 * Real-time tracking screen for customers to monitor their service provider
 * Shows live location, ETA, distance, and arrival notifications
 */
export default function TrackBookingScreen() {
  const { bookingId } = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useTheme();

  const [customerLocation, setCustomerLocation] = useState<Location | null>(null);
  const [providerName, setProviderName] = useState<string>('Provider');
  const [providerImage, setProviderImage] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookingDetails();
  }, [bookingId]);

  const loadBookingDetails = async () => {
    try {
      if (!bookingId || typeof bookingId !== 'string') {
        return;
      }

      const bookingDoc = await getDoc(doc(db, 'bookings', bookingId));
      
      if (bookingDoc.exists()) {
        const data = bookingDoc.data();
        
        // Get customer location from booking address
        if (data.address?.lat && data.address?.lng) {
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
          
          try {
            const geocodedLocation = await locationService.geocodeAddress(addressString);
            if (geocodedLocation) {
              console.log('✅ Geocoded location:', geocodedLocation);
              setCustomerLocation(geocodedLocation);
            }
          } catch (error) {
            console.error('❌ Geocoding error:', error);
          }
        }

        // Get provider details
        if (data.providerId) {
          const providerDoc = await getDoc(doc(db, 'users', data.providerId));
          if (providerDoc.exists()) {
            const providerData = providerDoc.data();
            setProviderName(providerData.name || 'Provider');
            setProviderImage(providerData.photoURL);
          }
        }
      }
    } catch (error) {
      console.error('Error loading booking details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleArrival = () => {
    // Could show a notification or update UI
    console.log('Provider has arrived!');
  };

  if (loading) {
    return (
      <Container safeArea>
        <View style={styles.loadingContainer}>
          <Text style={{ color: colors.text }}>Loading tracking information...</Text>
        </View>
      </Container>
    );
  }

  if (!customerLocation) {
    return (
      <Container safeArea>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.text }]}>
            Unable to load tracking information
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
            Track Your Service
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Live location tracking
          </Text>
        </View>
      </View>

      {/* Map */}
      <LiveTrackingMap
        bookingId={bookingId as string}
        customerLocation={customerLocation}
        providerName={providerName}
        providerImage={providerImage}
        onArrival={handleArrival}
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

