import { ServiceCard } from '@/components/ServiceCard';
import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';
import { LocationPicker } from '@/components/ui/LocationPicker';
import { SERVICE_CATEGORIES } from '@/constants/ServiceCategories';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { useCreateSavedAddress, useSavedAddresses } from '@/hooks/useSavedAddresses';
import { useActiveServices } from '@/hooks/useServices';
import { BookingAddress, ServiceCategory } from '@/types';
import { showFailedMessage, showSuccessMessage } from '@/utils/toast';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HomeScreen = observer(() => {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, userProfile, updateProfile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  
  // Fetch active services
  const { data: services = [], isLoading } = useActiveServices();
  
  // Fetch saved addresses
  const { data: savedAddresses = [], isLoading: loadingAddresses } = useSavedAddresses(user?.uid || null);
  const createSavedAddressMutation = useCreateSavedAddress();

  // Debug: Log saved addresses
  React.useEffect(() => {
    if (savedAddresses.length > 0) {
      console.log('📍 Saved addresses loaded:', savedAddresses.length);
    }
  }, [savedAddresses]);

  // Filter services based on search and category
  const filteredServices = services.filter((service) => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleCategoryPress = (categoryId: ServiceCategory) => {
    setSelectedCategory(selectedCategory === categoryId ? null : categoryId);
  };

  const handleServicePress = (serviceId: string) => {
    router.push(`/service/${serviceId}`);
  };

  const handleLocationPress = () => {
    setShowLocationModal(true);
  };

  const handleSelectSavedAddress = async (address: typeof savedAddresses[0]) => {
    if (!user?.uid) return;
    
    try {
      await updateProfile({
        city: address.city,
        address: `${address.street}${address.apartment ? `, ${address.apartment}` : ''}, ${address.city}, ${address.state} ${address.pincode}`,
      });
      showSuccessMessage('Location Updated', `Location set to ${address.city}`);
      setShowLocationModal(false);
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  const handleLocationSelect = async (address: Partial<BookingAddress>) => {
    if (!user?.uid || !address.city || !address.street) return;
    
    try {
      // Update profile
      await updateProfile({
        city: address.city,
        address: `${address.street}${address.apartment ? `, ${address.apartment}` : ''}, ${address.city}, ${address.state} ${address.pincode}`,
      });

      // Check if address already exists in saved addresses
      const addressExists = savedAddresses.some(
        (saved) =>
          saved.street === address.street &&
          saved.city === address.city &&
          saved.pincode === address.pincode
      );

      // Save as new address if it doesn't exist
      if (!addressExists) {
        await createSavedAddressMutation.mutateAsync({
          userId: user.uid,
          addressData: {
            label: 'Home', // Default label, user can change later
            street: address.street || '',
            apartment: address.apartment || '',
            city: address.city || '',
            state: address.state || '',
            pincode: address.pincode || '',
            landmark: address.landmark || '',
            lat: address.lat,
            lng: address.lng,
            isDefault: savedAddresses.length === 0, // Set as default if it's the first address
          },
        });
      }

      showSuccessMessage('Location Updated', `Location set to ${address.city}`);
      setShowLocationPicker(false);
      setShowLocationModal(false);
    } catch (error) {
      console.error('Error updating location:', error);
      showFailedMessage('Error', 'Failed to update location. Please try again.');
    }
  };

  return (
    <Container>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-2 pb-6">
          <View className="mb-4">
            <Text className="text-2xl font-bold" style={{ color: colors.text }}>
              {getGreeting()}! 👋
            </Text>
            <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
              Hi {userProfile?.displayName || 'there'}, what service do you need?
            </Text>
          </View>

          {/* Search Bar */}
          <View className="flex-row items-center rounded-xl border border-gray-300 px-4 mb-4" style={{ backgroundColor: colors.background, paddingVertical: Platform.OS === 'ios' ? 8 : 4 }}>
            <Ionicons name="search" size={20} color={colors.textSecondary} />
            <TextInput
              className="flex-1 ml-3 text-base"
              style={{ color: colors.text }}
              placeholder="Search for services..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery !== '' && (
              <Pressable onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
              </Pressable>
            )}
          </View>

          {/* Location */}
          <Pressable 
            onPress={handleLocationPress}
            className="flex-row items-center active:opacity-70"
          >
            <Ionicons name="location" size={16} color={colors.primary} />
            <Text className="ml-2 text-sm font-medium" style={{ color: colors.text }}>
              {userProfile?.city || 'Select Location'}
            </Text>
            <Ionicons name="chevron-down" size={16} color={colors.text} style={{ marginLeft: 4 }} />
          </Pressable>
        </View>

        {/* Categories */}
        <View className="mb-6">
          <Text className="text-lg font-bold px-6 mb-4" style={{ color: colors.text }}>
            Categories
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24 }}
            className="gap-3"
          >
            {SERVICE_CATEGORIES.map((category) => (
              <Pressable
                key={category.id}
                onPress={() => handleCategoryPress(category.id)}
                className="mr-3 active:opacity-70"
              >
                <View
                  className="w-24 rounded-2xl p-4 items-center"
                  style={{
                    backgroundColor: selectedCategory === category.id ? `${category.color}20` : colors.surface,
                    borderWidth: 2,
                    borderColor: selectedCategory === category.id ? category.color : 'transparent',
                  }}
                >
                  <View
                    className="w-14 h-14 rounded-full items-center justify-center mb-2"
                    style={{ backgroundColor: `${category.color}20` }}
                  >
                    <Ionicons name={category.icon as any} size={28} color={category.color} />
                  </View>
                  <Text
                    className="text-xs font-semibold text-center"
                    style={{ color: colors.text }}
                    numberOfLines={2}
                  >
                    {category.name}
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Selected Category Indicator */}
        {selectedCategory && (
          <View className="px-6 mb-4">
            <Card variant="default" className="flex-row items-center justify-between py-2 px-3">
              <View className="flex-row items-center">
                <Text className="text-sm font-medium" style={{ color: colors.text }}>
                  Filtered by:
                </Text>
                <View
                  className="ml-2 px-3 py-1 rounded-full"
                  style={{ backgroundColor: `${colors.primary}20` }}
                >
                  <Text className="text-sm font-bold" style={{ color: colors.primary }}>
                    {SERVICE_CATEGORIES.find(c => c.id === selectedCategory)?.name}
                  </Text>
                </View>
              </View>
              <Pressable onPress={() => setSelectedCategory(null)}>
                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
              </Pressable>
            </Card>
          </View>
        )}

        {/* Services */}
        <View className="px-6 mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold" style={{ color: colors.text }}>
              {searchQuery ? 'Search Results' : selectedCategory ? 'Filtered Services' : 'Available Services'}
            </Text>
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              {filteredServices.length} {filteredServices.length === 1 ? 'service' : 'services'}
            </Text>
          </View>

          {isLoading ? (
            <View className="items-center py-12">
              <ActivityIndicator size="large" color={colors.primary} />
              <Text className="mt-4" style={{ color: colors.textSecondary }}>
                Loading services...
              </Text>
            </View>
          ) : filteredServices.length === 0 ? (
            <Card variant="default" className="items-center py-8">
              <Ionicons
                name={searchQuery ? 'search-outline' : 'construct-outline'}
                size={48}
                color={colors.textSecondary}
              />
              <Text className="mt-4 text-base font-medium" style={{ color: colors.text }}>
                {searchQuery ? 'No services found' : 'No services available'}
              </Text>
              <Text className="text-sm mt-1 text-center px-8" style={{ color: colors.textSecondary }}>
                {searchQuery
                  ? 'Try searching with different keywords'
                  : 'Check back later for new services'}
              </Text>
              {(searchQuery || selectedCategory) && (
                <Pressable
                  onPress={() => {
                    setSearchQuery('');
                    setSelectedCategory(null);
                  }}
                  className="mt-4 px-6 py-2 rounded-full active:opacity-70"
                  style={{ backgroundColor: `${colors.primary}20` }}
                >
                  <Text className="font-semibold" style={{ color: colors.primary }}>
                    Clear Filters
                  </Text>
                </Pressable>
              )}
            </Card>
          ) : (
            filteredServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onPress={() => handleServicePress(service.id)}
              />
            ))
          )}
        </View>

        <View className="h-6" />
      </ScrollView>

      {/* Location Selection Modal */}
      <Modal
        visible={showLocationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLocationModal(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
          onPress={() => setShowLocationModal(false)}
        >
          <Pressable
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: colors.background,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingBottom: insets.bottom,
              maxHeight: '80%',
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={{ padding: 20 }}>
              {/* Header */}
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-xl font-bold" style={{ color: colors.text }}>
                  Select Location
                </Text>
                <Pressable onPress={() => setShowLocationModal(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </Pressable>
              </View>

              {/* Current Location */}
              {userProfile?.city && (
                <View className="mb-4">
                  <Text className="text-base font-semibold mb-3" style={{ color: colors.text }}>
                    Current Location
                  </Text>
                  <Card 
                    variant="default" 
                    className="p-4"
                    style={{ 
                      borderWidth: 2, 
                      borderColor: colors.primary,
                      backgroundColor: `${colors.primary}10`
                    }}
                  >
                    <View className="flex-row items-start">
                      <Ionicons
                        name="location"
                        size={20}
                        color={colors.primary}
                        style={{ marginRight: 12, marginTop: 2 }}
                      />
                      <View className="flex-1">
                        <View className="flex-row items-center mb-1">
                          <Text className="text-base font-semibold" style={{ color: colors.text }}>
                            Current
                          </Text>
                          <View 
                            className="ml-2 px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: colors.primary }}
                          >
                            <Text className="text-xs font-bold text-white">ACTIVE</Text>
                          </View>
                        </View>
                        <Text className="text-sm" style={{ color: colors.textSecondary }}>
                          {userProfile.address || userProfile.city}
                        </Text>
                      </View>
                      <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                    </View>
                  </Card>
                </View>
              )}

              {/* Saved Addresses */}
              <View className="mb-4">
                <Text className="text-base font-semibold mb-3" style={{ color: colors.text }}>
                  Saved Addresses
                </Text>
                {loadingAddresses ? (
                  <View className="items-center py-4">
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text className="text-sm mt-2" style={{ color: colors.textSecondary }}>
                      Loading addresses...
                    </Text>
                  </View>
                ) : savedAddresses.length > 0 ? (
                  <ScrollView style={{ maxHeight: 200 }}>
                    {savedAddresses.map((address) => {
                      // Check if this address matches current location
                      const isCurrentLocation = 
                        userProfile?.city === address.city &&
                        (userProfile.address?.includes(address.street) || 
                         address.street === userProfile.address?.split(',')[0]?.trim());
                      
                      return (
                        <Pressable
                          key={address.id}
                          onPress={() => handleSelectSavedAddress(address)}
                          className="mb-2 active:opacity-70"
                        >
                          <Card 
                            variant="default" 
                            className="p-4"
                            style={isCurrentLocation ? {
                              borderWidth: 1,
                              borderColor: colors.primary,
                            } : {}}
                          >
                            <View className="flex-row items-start">
                              <Ionicons
                                name="location"
                                size={20}
                                color={isCurrentLocation ? colors.primary : colors.textSecondary}
                                style={{ marginRight: 12, marginTop: 2 }}
                              />
                              <View className="flex-1">
                                <View className="flex-row items-center mb-1">
                                  <Text className="text-base font-semibold" style={{ color: colors.text }}>
                                    {address.label || 'Home'}
                                  </Text>
                                  {isCurrentLocation && (
                                    <View 
                                      className="ml-2 px-2 py-0.5 rounded-full"
                                      style={{ backgroundColor: colors.primary }}
                                    >
                                      <Text className="text-xs font-bold text-white">CURRENT</Text>
                                    </View>
                                  )}
                                </View>
                                <Text className="text-sm" style={{ color: colors.textSecondary }}>
                                  {address.street}
                                  {address.apartment && `, ${address.apartment}`}
                                </Text>
                                <Text className="text-sm" style={{ color: colors.textSecondary }}>
                                  {address.city}, {address.state} {address.pincode}
                                </Text>
                              </View>
                              {isCurrentLocation && (
                                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                              )}
                            </View>
                          </Card>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                ) : (
                  <Card variant="default" className="p-4 items-center">
                    <Ionicons name="location-outline" size={32} color={colors.textSecondary} />
                    <Text className="text-sm mt-2 text-center" style={{ color: colors.textSecondary }}>
                      No saved addresses yet.{'\n'}Pick a location to save it.
                    </Text>
                  </Card>
                )}
              </View>

              {/* Pick New Location Button */}
              <Pressable
                onPress={() => {
                  setShowLocationPicker(true);
                  setShowLocationModal(false);
                }}
                className="rounded-xl py-4 items-center active:opacity-70"
                style={{ backgroundColor: colors.primary }}
              >
                <View className="flex-row items-center">
                  <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
                  <Text className="ml-2 text-base font-semibold text-white">
                    {savedAddresses.length > 0 ? 'Pick New Location' : 'Pick Location'}
                  </Text>
                </View>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Location Picker Modal */}
      <Modal
        visible={showLocationPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLocationPicker(false)}
      >
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <View
            style={{
              paddingTop: insets.top + 20,
              paddingBottom: insets.bottom,
              paddingHorizontal: 20,
              flex: 1,
            }}
          >
            {/* Header */}
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold" style={{ color: colors.text }}>
                Pick Location
              </Text>
              <Pressable onPress={() => setShowLocationPicker(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>

            {/* Location Picker */}
            <LocationPicker
              onLocationSelect={handleLocationSelect}
            />
          </View>
        </View>
      </Modal>
    </Container>
  );
});

export default HomeScreen;
