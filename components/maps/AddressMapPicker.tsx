import { Button } from '@/components/ui/Button';
import { GOOGLE_MAPS_CONFIG } from '@/config/maps';
import { useTheme } from '@/contexts/ThemeContext';
import { locationService } from '@/services/locationService';
import { Address, Location } from '@/types/maps';
import { showFailedMessage, showSuccessMessage } from '@/utils/toast';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';

interface AddressMapPickerProps {
  onAddressSelect: (address: Address, location: Location) => void;
  initialLocation?: Location;
  initialAddress?: string;
}

/**
 * AddressMapPicker Component
 * 
 * Interactive map for selecting service location with:
 * - Google Places Autocomplete
 * - Draggable marker
 * - Current location button
 * - Address reverse geocoding
 */
export const AddressMapPicker: React.FC<AddressMapPickerProps> = ({
  onAddressSelect,
  initialLocation,
  initialAddress,
}) => {
  const { colors } = useTheme();
  const mapRef = useRef<MapView>(null);
  const searchInputRef = useRef<TextInput>(null);

  const [region, setRegion] = useState<Region>({
    ...GOOGLE_MAPS_CONFIG.defaultRegion,
    ...(initialLocation && {
      latitude: initialLocation.latitude,
      longitude: initialLocation.longitude,
    }),
  });

  const [markerPosition, setMarkerPosition] = useState<Location>(
    initialLocation || {
      latitude: GOOGLE_MAPS_CONFIG.defaultRegion.latitude,
      longitude: GOOGLE_MAPS_CONFIG.defaultRegion.longitude,
    }
  );

  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState<string>(initialAddress || '');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    // Always get current location on mount to center map
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    setLoading(true);
    try {
      const hasPermission = await locationService.requestPermissions();
      if (!hasPermission) {
        console.log('Location permission denied, using default region');
        setLoading(false);
        return;
      }

      const location = await locationService.getCurrentLocation();
      if (location) {
        const newRegion = {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };

        setMarkerPosition(location);
        setRegion(newRegion);
        
        // Animate map to current location
        mapRef.current?.animateToRegion(newRegion, 1000);

        // Get address for location
        await updateAddressFromLocation(location);
        console.log('✅ Map centered on current location');
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      // Silently fail and use default region
    } finally {
      setLoading(false);
    }
  };

  const updateAddressFromLocation = async (location: Location) => {
    try {
      const geocoded = await locationService.reverseGeocode(location);
      if (geocoded) {
        const formattedAddress = [
          geocoded.name,
          geocoded.street,
          geocoded.city,
          geocoded.region,
          geocoded.postalCode,
        ]
          .filter(Boolean)
          .join(', ');
        
        setAddress(formattedAddress);
        setSearchQuery(formattedAddress);
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    }
  };

  const handleRegionChangeComplete = async (newRegion: Region) => {
    const newLocation = {
      latitude: newRegion.latitude,
      longitude: newRegion.longitude,
    };
    
    setMarkerPosition(newLocation);
    setRegion(newRegion);
    await updateAddressFromLocation(newLocation);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      // Use expo-location geocoding as fallback
      const location = await locationService.geocodeAddress(searchQuery);
      
      if (location) {
        setMarkerPosition(location);
        setRegion({
          ...region,
          latitude: location.latitude,
          longitude: location.longitude,
        });

        mapRef.current?.animateToRegion({
          ...region,
          latitude: location.latitude,
          longitude: location.longitude,
        }, 1000);

        await updateAddressFromLocation(location);
        showSuccessMessage('Success', 'Location found');
      } else {
        showFailedMessage('Not Found', 'Could not find this location');
      }
    } catch (error) {
      console.error('Error searching location:', error);
      showFailedMessage('Error', 'Search failed. Try dragging the marker instead.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmLocation = async () => {
    setLoading(true);
    try {
      const geocoded = await locationService.reverseGeocode(markerPosition);
      
      if (geocoded) {
        const addressData: Address = {
          street: `${geocoded.name || ''} ${geocoded.street || ''}`.trim(),
          city: geocoded.city || geocoded.subregion || '',
          state: geocoded.region || '',
          pincode: geocoded.postalCode || '',
          landmark: geocoded.district || '',
          lat: markerPosition.latitude,
          lng: markerPosition.longitude,
          formattedAddress: address,
        };

        onAddressSelect(addressData, markerPosition);
        showSuccessMessage('Success', 'Location confirmed');
      } else {
        showFailedMessage('Error', 'Could not get address details');
      }
    } catch (error) {
      console.error('Error confirming location:', error);
      showFailedMessage('Error', 'Failed to confirm location');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <View style={styles.searchInputContainer}>
          <Ionicons 
            name="search" 
            size={20} 
            color={colors.textSecondary} 
            style={styles.searchIcon}
          />
          <TextInput
            ref={searchInputRef}
            style={[styles.searchInput, { 
              color: colors.text,
              backgroundColor: colors.background,
              borderColor: colors.border,
            }]}
            placeholder="Search for area, street name..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable 
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={region}
        onRegionChangeComplete={handleRegionChangeComplete}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass
        toolbarEnabled={false}
      >
        {/* Google Maps Style Red Pin Marker */}
        <Marker
          coordinate={markerPosition}
          title="Selected Location"
          description="Move map to change location"
          anchor={{ x: 0.5, y: 1 }}
          draggable
          onDragEnd={(e) => {
            const newLocation = {
              latitude: e.nativeEvent.coordinate.latitude,
              longitude: e.nativeEvent.coordinate.longitude,
            };
            setMarkerPosition(newLocation);
            updateAddressFromLocation(newLocation);
          }}
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
      </MapView>

      {/* Current Location Button */}
      <Pressable
        style={[styles.locationButton, { backgroundColor: colors.surface }]}
        onPress={getCurrentLocation}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Ionicons name="navigate" size={24} color={colors.primary} />
        )}
      </Pressable>

      {/* Address Display & Confirm Button */}
      <View style={[styles.bottomSheet, { backgroundColor: colors.surface }]}>
        <View style={styles.handle} />
        
        <View style={styles.addressContainer}>
          <Ionicons name="location-outline" size={24} color={colors.primary} />
          <View style={styles.addressText}>
            <Text style={[styles.addressLabel, { color: colors.textSecondary }]}>
              Selected Location
            </Text>
            <Text style={[styles.address, { color: colors.text }]} numberOfLines={2}>
              {address || 'Move pin to select location'}
            </Text>
          </View>
        </View>

        <View style={styles.coordinatesContainer}>
          <Text style={[styles.coordinates, { color: colors.textSecondary }]}>
            {markerPosition.latitude.toFixed(6)}, {markerPosition.longitude.toFixed(6)}
          </Text>
        </View>

        <Button
          title="Confirm Location"
          onPress={handleConfirmLocation}
          disabled={loading || !address}
          icon="checkmark-circle"
          variant="primary"
          size="lg"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 20,
    left: 16,
    right: 16,
    zIndex: 10,
    elevation: 10,
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    borderRadius: 12,
    paddingLeft: 48,
    paddingRight: 48,
    borderWidth: 1,
  },
  clearButton: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  map: {
    flex: 1,
  },
  // Google Maps style marker
  destinationMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  pinShadow: {
    width: 30,
    height: 15,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    marginBottom: -8,
    transform: [{ scaleX: 0.8 }, { scaleY: 0.5 }],
  },
  destinationPinRed: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EA4335', // Google Maps red
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  pinInnerCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EA4335',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinPointRed: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#EA4335',
    marginTop: -2,
  },
  locationButton: {
    position: 'absolute',
    right: 16,
    top: Platform.OS === 'ios' ? 180 : 140,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 10,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  addressText: {
    flex: 1,
    marginLeft: 12,
  },
  addressLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  address: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
  },
  coordinatesContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  coordinates: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});

