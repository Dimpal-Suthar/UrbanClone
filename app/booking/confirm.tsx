import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';
import { db } from '@/config/firebase';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { useCreateBooking } from '@/hooks/useBookings';
import { useService } from '@/hooks/useServices';
import { BookingAddress, CreateBookingInput, TimeSlot } from '@/types';
import { showFailedMessage, showSuccessMessage } from '@/utils/toast';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ConfirmBookingScreen() {
  const {
    serviceId,
    providerId,
    scheduledDate,
    scheduledSlot,
    addressStreet,
    addressApartment,
    addressCity,
    addressState,
    addressPincode,
    addressLandmark,
    addressLat,
    addressLng,
    notes,
  } = useLocalSearchParams();

  const router = useRouter();
  const { colors } = useTheme();
  const { user, userProfile } = useAuth();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);

  const { data: service } = useService(serviceId as string);
  const createBookingMutation = useCreateBooking();

  const address: BookingAddress = {
    street: addressStreet as string,
    apartment: (addressApartment as string) || '',
    city: addressCity as string,
    state: addressState as string,
    pincode: addressPincode as string,
    landmark: (addressLandmark as string) || '',
    lat: addressLat && addressLat !== '' ? parseFloat(addressLat as string) : null,
    lng: addressLng && addressLng !== '' ? parseFloat(addressLng as string) : null,
  };

  const dateObj = new Date(scheduledDate as string);
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleConfirmBooking = async () => {
    if (!user || !service) return;

    try {
      setIsLoading(true);

      // Fetch provider data
      const providerDoc = await getDoc(doc(db, 'users', providerId as string));
      if (!providerDoc.exists()) {
        showFailedMessage('Error', 'Provider not found');
        return;
      }
      const providerData = providerDoc.data();

      // Fetch provider service offering to get custom price
      const providerServiceDoc = await getDoc(
        doc(db, 'providerServices', `${providerId}_${serviceId}`)
      );
      const customPrice = providerServiceDoc.exists()
        ? providerServiceDoc.data()?.customPrice || service.basePrice
        : service.basePrice;

      const bookingInput: CreateBookingInput = {
        customerId: user.uid,
        providerId: providerId as string,
        serviceId: serviceId as string,
        scheduledDate: scheduledDate as string,
        scheduledTime: (scheduledSlot as string).split(' - ')[0], // Extract start time
        scheduledSlot: scheduledSlot as TimeSlot,
        address,
        notes: (notes as string) || undefined,
      };

      // Fetch customer's phone number from their Firestore profile
      const customerDoc = await getDoc(doc(db, 'users', user.uid));
      const customerProfile = customerDoc.exists() ? customerDoc.data() : {};
      
      const customerData = {
        name: userProfile?.displayName || user.displayName || user.email?.split('@')[0] || 'Customer',
        phone: customerProfile.phone || user.phoneNumber || '',
        photo: userProfile?.photoURL || user.photoURL || undefined,
      };

      const provider = {
        name: providerData.name || providerData.displayName || providerData.email?.split('@')[0] || 'Provider',
        phone: providerData.phone || '',
        photo: providerData.photoURL || undefined,
      };

      const serviceData = {
        name: service.name,
        category: service.category,
        price: customPrice,
      };

      const bookingId = await createBookingMutation.mutateAsync({
        input: bookingInput,
        customerData,
        providerData: provider,
        serviceData,
      });

      console.log('✅ Booking created:', bookingId);

      // Show success message
      showSuccessMessage(
        'Booking Confirmed!',
        'Your booking has been confirmed. The professional will contact you shortly.'
      );
      
      // Navigate directly to booking details using replace
      // This prevents user from going back to booking form
      // Replace clears the navigation stack, so back button goes to bookings tab
      router.replace({
        pathname: '/booking/[id]',
        params: { id: bookingId, fromBookingFlow: 'true' }
      });
    } catch (error) {
      console.error('❌ Error creating booking:', error);
      showFailedMessage('Error', 'Failed to create booking. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!service) {
    return (
      <Container safeArea edges={['top']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Container>
    );
  }

  return (
    <Container safeArea edges={['top', 'bottom']}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.background,
        }}
      >
        <Pressable 
          onPress={() => router.back()} 
          style={{ padding: 8, marginRight: 8 }}
          className="active:opacity-70"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>
            Confirm Booking
          </Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
            Step 3 of 3 - Final Review
          </Text>
        </View>
      </View>

      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ padding: 20 }}>
          {/* Success Icon */}
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: `${colors.success}15`,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}
            >
              <Ionicons name="checkmark-circle" size={44} color={colors.success} />
            </View>
            <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 6 }}>
              Almost There!
            </Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 20 }}>
              Review your booking details before confirming
            </Text>
          </View>

          {/* Service Details */}
          <Card variant="elevated" style={{ marginBottom: 16, padding: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: `${colors.primary}20`,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <Ionicons name="construct" size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>
                  {service.name}
                </Text>
                <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>
                  {service.duration} min
                </Text>
              </View>
            </View>
          </Card>

          {/* Date & Time */}
          <Card variant="elevated" style={{ marginBottom: 16, padding: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: `${colors.primary}20`,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <Ionicons name="calendar" size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
                  {formattedDate}
                </Text>
                <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4 }}>
                  {scheduledSlot}
                </Text>
              </View>
            </View>
          </Card>

          {/* Address */}
          <Card variant="elevated" style={{ marginBottom: 16, padding: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: `${colors.primary}20`,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <Ionicons name="location" size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 4 }}>
                  Service Address
                </Text>
                <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 20 }}>
                  {address.street}
                  {address.apartment ? `, ${address.apartment}` : ''}
                  {'\n'}
                  {address.landmark ? `${address.landmark}, ` : ''}
                  {address.city}, {address.state} - {address.pincode}
                </Text>
              </View>
            </View>
          </Card>

          {/* Special Instructions */}
          {notes && (
            <Card variant="elevated" style={{ marginBottom: 16, padding: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 }}>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: `${colors.primary}20`,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}
                >
                  <Ionicons name="document-text" size={24} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 4 }}>
                    Special Instructions
                  </Text>
                  <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 20 }}>
                    {notes}
                  </Text>
                </View>
              </View>
            </Card>
          )}

          {/* Price Summary */}
          <Card
            variant="elevated"
            style={{
              marginBottom: 16,
              padding: 20,
              backgroundColor: colors.background,
              borderWidth: 2,
              borderColor: colors.primary,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 4 }}>
                  Total Amount
                </Text>
                <Text style={{ fontSize: 32, fontWeight: '700', color: colors.primary }}>
                  ₹{service.basePrice}
                </Text>
              </View>
              <View
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: `${colors.success}20`,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.success }}>
                  Pay After Service
                </Text>
              </View>
            </View>
          </Card>

          {/* Info Card */}
          <Card
            variant="default"
            style={{
              padding: 16,
              backgroundColor: `${colors.warning}10`,
              borderColor: colors.warning,
              marginBottom: 20,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <Ionicons name="information-circle" size={20} color={colors.warning} style={{ marginTop: 2 }} />
              <Text style={{ flex: 1, fontSize: 13, color: colors.text, marginLeft: 12, lineHeight: 20 }}>
                Payment will be collected after the service is completed. The professional will contact you
                shortly to confirm the booking.
              </Text>
            </View>
          </Card>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: Math.max(insets.bottom + 16, 16),
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.background,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Button
          title={isLoading ? 'Confirming Booking...' : 'Confirm & Book Now'}
          onPress={handleConfirmBooking}
          disabled={isLoading}
          icon={isLoading ? undefined : 'checkmark-circle'}
        />
      </View>
    </Container>
  );
}

