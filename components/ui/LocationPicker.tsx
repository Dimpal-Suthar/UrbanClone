import { AddressMapPicker } from '@/components/maps/AddressMapPicker';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useTheme } from '@/contexts/ThemeContext';
import { BookingAddress } from '@/types';
import { requestPermissionWithAlert } from '@/utils/permissionUtils';
import { showSuccessMessage } from '@/utils/toast';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  Text,
  View
} from 'react-native';

interface LocationPickerProps {
  onLocationSelect: (address: Partial<BookingAddress>) => void;
  selectedAddress?: Partial<BookingAddress>;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationSelect,
  selectedAddress,
}) => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const getCurrentLocation = async () => {
    try {
      setLoading(true);

      // Request permission with automatic alert handling
      const hasPermission = await requestPermissionWithAlert(
        'location',
        async () => {
          const { status } = await Location.requestForegroundPermissionsAsync();
          return status === 'granted';
        },
        undefined,
        'Location permission is required to detect your current location.'
      );

      if (!hasPermission) {
        setLoading(false);
        return;
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // Reverse geocode
      const geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (geocode.length > 0) {
        const address = geocode[0];
        const locationData = {
          street: `${address.name || ''} ${address.street || ''}`.trim() || address.street || '',
          city: address.city || address.subregion || '',
          state: address.region || '',
          pincode: address.postalCode || '',
          landmark: address.district || address.subregion || '',
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        };
        
        onLocationSelect(locationData);
        showSuccessMessage('Success', 'Location detected successfully');
      } else {
        Alert.alert('Error', 'Could not get address details. Please try again.');
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get current location. Please enter manually or pick from map.');
    } finally {
      setLoading(false);
    }
  };

  const openMapPicker = () => {
    setShowModal(true);
  };

  return (
    <>
      <Card
        variant="default"
        style={{
          padding: 16,
          marginBottom: 20,
          backgroundColor: `${colors.primary}05`,
          borderColor: colors.primary,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
          >
            <Ionicons name="location" size={20} color="white" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
              Quick Location Select
            </Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
              Use your current location or pick from map
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Button
              title={loading ? 'Detecting...' : 'Use Current'}
              onPress={getCurrentLocation}
              disabled={loading}
              variant="outline"
              icon={loading ? undefined : 'navigate'}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              title="Pick on Map"
              onPress={openMapPicker}
              variant="outline"
              icon="map"
            />
          </View>
        </View>

      </Card>

      {/* Map Picker Modal */}
      <Modal visible={showModal} animationType="slide">
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 16,
              paddingTop: 60,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
              backgroundColor: colors.surface,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text }}>
              Select Location on Map
            </Text>
            <Pressable onPress={() => setShowModal(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          <AddressMapPicker
            onAddressSelect={(address, location) => {
              onLocationSelect({
                street: address.street,
                city: address.city,
                state: address.state,
                pincode: address.pincode,
                landmark: address.landmark,
                lat: location.latitude,
                lng: location.longitude,
              });
              setShowModal(false);
            }}
            initialLocation={
              selectedAddress?.lat && selectedAddress?.lng
                ? { latitude: selectedAddress.lat, longitude: selectedAddress.lng }
                : undefined
            }
          />
        </View>
      </Modal>
    </>
  );
};

