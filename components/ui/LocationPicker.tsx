import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useTheme } from '@/contexts/ThemeContext';
import { BookingAddress } from '@/types';
import { showFailedMessage, showSuccessMessage } from '@/utils/toast';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import React, { useState } from 'react';
import {
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

      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showFailedMessage(
          'Permission Required',
          'Location permission is required to use this feature. Please enable it in settings.'
        );
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
        showFailedMessage('Error', 'Could not get address details. Please try again.');
      }
    } catch (error) {
      console.error('Error getting location:', error);
      showFailedMessage('Error', 'Failed to get current location. Please enter manually.');
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

      {/* Map Picker Modal - Placeholder for now */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View
            style={{
              flex: 1,
              marginTop: 100,
              backgroundColor: colors.background,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 20,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text }}>
                Select Location
              </Text>
              <Pressable onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>

            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
              <Ionicons name="map-outline" size={64} color={colors.textSecondary} />
              <Text
                style={{
                  fontSize: 16,
                  color: colors.text,
                  marginTop: 16,
                  textAlign: 'center',
                }}
              >
                Map Integration Coming Soon
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: colors.textSecondary,
                  marginTop: 8,
                  textAlign: 'center',
                }}
              >
                For now, please use "Use Current Location" or enter address manually
              </Text>
              <View style={{ marginTop: 24, width: '100%' }}>
                <Button title="Close" onPress={() => setShowModal(false)} variant="outline" />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

