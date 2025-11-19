import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';
import { Input } from '@/components/ui/Input';
import { LocationPicker } from '@/components/ui/LocationPicker';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { useSavedAddresses } from '@/hooks/useSavedAddresses';
import { BookingAddress } from '@/types';
import { showFailedMessage } from '@/utils/toast';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View
} from 'react-native';

export default function AddressBookingScreen() {
  const { serviceId, providerId, scheduledDate, scheduledSlot } = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();

  const { data: savedAddresses = [], isLoading: loadingAddresses } = useSavedAddresses(user?.uid || null);
  const [showSavedAddresses, setShowSavedAddresses] = useState(false);

  const [address, setAddress] = useState<BookingAddress>({
    street: '',
    apartment: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
    lat: undefined,
    lng: undefined,
  });

  const [notes, setNotes] = useState('');

  const handleSelectSavedAddress = (savedAddress: any) => {
    setAddress({
      street: savedAddress.street,
      apartment: savedAddress.apartment || '',
      city: savedAddress.city,
      state: savedAddress.state,
      pincode: savedAddress.pincode,
      landmark: savedAddress.landmark || '',
      lat: savedAddress.lat,
      lng: savedAddress.lng,
    });
    setShowSavedAddresses(false);
  };

  const handleLocationSelect = (locationData: Partial<BookingAddress>) => {
    setAddress(prev => ({
      ...prev,
      ...locationData,
    }));
  };

  const handleContinue = () => {
    // Validate address
    if (!address.street.trim()) {
      showFailedMessage('Required', 'Please enter your street address');
      return;
    }
    if (!address.city.trim()) {
      showFailedMessage('Required', 'Please enter your city');
      return;
    }
    if (!address.state.trim()) {
      showFailedMessage('Required', 'Please enter your state');
      return;
    }
    if (!address.pincode.trim()) {
      showFailedMessage('Required', 'Please enter your pincode');
      return;
    }

    // Validate pincode format (6 digits)
    if (!/^\d{6}$/.test(address.pincode)) {
      showFailedMessage('Invalid Pincode', 'Pincode must be 6 digits');
      return;
    }

    // Navigate to confirmation screen with all booking data
    router.push({
      pathname: '/booking/confirm',
      params: {
        serviceId: serviceId as string,
        providerId: providerId as string,
        scheduledDate: scheduledDate as string,
        scheduledSlot: scheduledSlot as string,
        addressStreet: address.street,
        addressApartment: address.apartment || '',
        addressCity: address.city,
        addressState: address.state,
        addressPincode: address.pincode,
        addressLandmark: address.landmark || '',
        addressLat: address.lat?.toString() || '',
        addressLng: address.lng?.toString() || '',
        notes: notes || '',
      },
    });
  };

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
            Service Address
          </Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
            Step 2 of 3
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-5 pt-5">
            {/* Saved Addresses Section */}
            {savedAddresses.length > 0 && (
              <Card variant="default" className="p-4 mb-4">
                <Pressable
                  onPress={() => setShowSavedAddresses(!showSavedAddresses)}
                  className="active:opacity-70"
                >
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center">
                      <Ionicons name="bookmark" size={20} color={colors.primary} />
                      <Text className="ml-2 text-base font-bold" style={{ color: colors.text }}>
                        Saved Addresses
                      </Text>
                    </View>
                    <Ionicons
                      name={showSavedAddresses ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={colors.primary}
                    />
                  </View>
                </Pressable>

                {showSavedAddresses && (
                  <View className="gap-2">
                    {savedAddresses.map((savedAddress) => (
                      <Pressable
                        key={savedAddress.id}
                        onPress={() => handleSelectSavedAddress(savedAddress)}
                        className="p-3 rounded-lg active:opacity-70"
                        style={{
                          backgroundColor: colors.background,
                          borderWidth: 1,
                          borderColor: colors.border,
                        }}
                      >
                        <View className="flex-row items-center mb-1">
                          <Ionicons name="location" size={16} color={colors.primary} />
                          <Text className="ml-2 text-sm font-semibold" style={{ color: colors.text }}>
                            {savedAddress.label}
                          </Text>
                          {savedAddress.isDefault && (
                            <View
                              className="ml-2 px-2 py-0.5 rounded"
                              style={{ backgroundColor: `${colors.success}20` }}
                            >
                              <Text className="text-xs font-bold" style={{ color: colors.success }}>
                                DEFAULT
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text className="text-sm" style={{ color: colors.text }}>
                          {savedAddress.street}
                          {savedAddress.apartment ? `, ${savedAddress.apartment}` : ''}
                        </Text>
                        <Text className="text-xs" style={{ color: colors.textSecondary }}>
                          {savedAddress.city}, {savedAddress.state} - {savedAddress.pincode}
                        </Text>
                      </Pressable>
                    ))}
                    <Pressable
                      onPress={() => router.push('/addresses')}
                      className="p-3 rounded-lg active:opacity-70"
                      style={{
                        backgroundColor: `${colors.primary}10`,
                        borderWidth: 1,
                        borderColor: colors.primary,
                      }}
                    >
                      <Text className="text-center text-sm font-semibold" style={{ color: colors.primary }}>
                        Manage Saved Addresses →
                      </Text>
                    </Pressable>
                  </View>
                )}
              </Card>
            )}

            {/* Location Picker */}
            <LocationPicker
              onLocationSelect={handleLocationSelect}
              selectedAddress={address}
            />


            {/* Address Form */}
            <Card variant="default" className="p-5 mb-4">
              <View className="flex-row items-center mb-5">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: `${colors.primary}15` }}
                >
                  <Ionicons name="home" size={20} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <Text className="text-[17px] font-bold" style={{ color: colors.text }}>
                    Complete Address
                  </Text>
                  <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
                    Please provide complete details
                  </Text>
                </View>
              </View>

              <View className="gap-3.5">
                <View>
                  <Text className="text-[13px] font-semibold mb-2" style={{ color: colors.textSecondary }}>
                    HOUSE NO, BUILDING NAME <Text style={{ color: colors.error }}>*</Text>
                  </Text>
                  <Input
                    placeholder="e.g., B-304, Green Park Apartments"
                    value={address.street}
                    onChangeText={(text) => setAddress({ ...address, street: text })}
                  />
                </View>

                <View>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 }}>
                    FLAT / APARTMENT NUMBER
                  </Text>
                  <Input
                    placeholder="e.g., Flat 304"
                    value={address.apartment}
                    onChangeText={(text) => setAddress({ ...address, apartment: text })}
                  />
                </View>

                <View>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 }}>
                    LANDMARK (OPTIONAL)
                  </Text>
                  <Input
                    placeholder="e.g., Near City Mall"
                    value={address.landmark}
                    onChangeText={(text) => setAddress({ ...address, landmark: text })}
                  />
                </View>

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 }}>
                      CITY <Text style={{ color: colors.error }}>*</Text>
                    </Text>
                    <Input
                      placeholder="City"
                      value={address.city}
                      onChangeText={(text) => setAddress({ ...address, city: text })}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 }}>
                      STATE <Text style={{ color: colors.error }}>*</Text>
                    </Text>
                    <Input
                      placeholder="State"
                      value={address.state}
                      onChangeText={(text) => setAddress({ ...address, state: text })}
                    />
                  </View>
                </View>

                <View>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 }}>
                    PINCODE <Text style={{ color: colors.error }}>*</Text>
                  </Text>
                  <Input
                    placeholder="6-digit pincode"
                    value={address.pincode}
                    onChangeText={(text) => setAddress({ ...address, pincode: text })}
                    keyboardType="numeric"
                    maxLength={6}
                  />
                </View>
              </View>
            </Card>

            {/* Special Instructions */}
            <Card variant="default" className="p-5 mb-4">
              <View className="flex-row items-center mb-4">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: `${colors.primary}15` }}
                >
                  <Ionicons name="clipboard" size={20} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <Text className="text-[17px] font-bold" style={{ color: colors.text }}>
                    Special Instructions
                  </Text>
                  <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
                    Optional - Add any specific requirements
                  </Text>
                </View>
              </View>

              <Input
                placeholder="Example: Please call before arriving, Use back entrance, etc."
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
                className="min-h-[100px]"
                style={{ textAlignVertical: 'top' }}
              />
            </Card>

            {/* Info Card */}
            <View
              className="p-3.5 rounded-xl"
              style={{ 
                backgroundColor: `${colors.primary}08`, 
                borderWidth: 1,
                borderColor: `${colors.primary}20`,
              }}
            >
              <View className="flex-row items-start">
                <Ionicons name="shield-checkmark" size={18} color={colors.primary} className="mt-0.5" />
                <Text className="flex-1 text-xs ml-2.5 leading-[18px]" style={{ color: colors.textSecondary }}>
                  Your address is secure and will only be shared with the assigned professional after booking confirmation.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Action */}
        <View
          className="px-5 pt-4 border-t"
          style={{
            paddingBottom: Platform.OS === 'ios' ? 12 : 16,
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
            title="Continue to Confirmation" 
            onPress={handleContinue}
            icon="arrow-forward"
            variant="primary"
            size="lg"
          />
        </View>
      </KeyboardAvoidingView>
    </Container>
  );
}

