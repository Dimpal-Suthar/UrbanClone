import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';
import { Input } from '@/components/ui/Input';
import { LocationPicker } from '@/components/ui/LocationPicker';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import {
  useCreateSavedAddress,
  useDeleteSavedAddress,
  useSavedAddresses,
  useUpdateSavedAddress,
} from '@/hooks/useSavedAddresses';
import { SavedAddress } from '@/types/savedAddress';
import { showFailedMessage, showSuccessMessage } from '@/utils/toast';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ADDRESS_LABELS = ['Home', 'Office', 'Other'];

export default function SavedAddressesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const { data: savedAddresses = [], isLoading } = useSavedAddresses(user?.uid || null);
  const createMutation = useCreateSavedAddress();
  const updateMutation = useUpdateSavedAddress();
  const deleteMutation = useDeleteSavedAddress();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);
  const [addressData, setAddressData] = useState({
    label: 'Home',
    street: '',
    apartment: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
    lat: undefined as number | undefined,
    lng: undefined as number | undefined,
    isDefault: false,
  });

  const resetForm = () => {
    setAddressData({
      label: 'Home',
      street: '',
      apartment: '',
      city: '',
      state: '',
      pincode: '',
      landmark: '',
      lat: undefined,
      lng: undefined,
      isDefault: false,
    });
    setEditingAddress(null);
  };

  const handleLocationSelect = (locationData: any) => {
    setAddressData(prev => ({
      ...prev,
      ...locationData,
    }));
  };

  const handleSave = async () => {
    if (!user?.uid) return;

    // Validation
    if (!addressData.street.trim()) {
      showFailedMessage('Required', 'Please enter your street address');
      return;
    }
    if (!addressData.city.trim()) {
      showFailedMessage('Required', 'Please enter your city');
      return;
    }
    if (!addressData.state.trim()) {
      showFailedMessage('Required', 'Please enter your state');
      return;
    }
    if (!addressData.pincode.trim() || !/^\d{6}$/.test(addressData.pincode)) {
      showFailedMessage('Invalid Pincode', 'Pincode must be 6 digits');
      return;
    }

    try {
      if (editingAddress) {
        await updateMutation.mutateAsync({
          addressId: editingAddress.id,
          updates: addressData,
          userId: user.uid,
        });
        showSuccessMessage('Success', 'Address updated successfully');
      } else {
        await createMutation.mutateAsync({
          userId: user.uid,
          addressData,
        });
        showSuccessMessage('Success', 'Address saved successfully');
      }
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      showFailedMessage('Error', 'Failed to save address');
    }
  };

  const handleEdit = (address: SavedAddress) => {
    setEditingAddress(address);
    setAddressData({
      label: address.label,
      street: address.street,
      apartment: address.apartment || '',
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      landmark: address.landmark || '',
      lat: address.lat,
      lng: address.lng,
      isDefault: address.isDefault || false,
    });
    setShowAddModal(true);
  };

  const handleDelete = (address: SavedAddress) => {
    if (!user?.uid) return;

    Alert.alert('Delete Address', `Are you sure you want to delete "${address.label}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMutation.mutateAsync({
              addressId: address.id,
              userId: user.uid,
            });
            showSuccessMessage('Success', 'Address deleted successfully');
          } catch (error) {
            showFailedMessage('Error', 'Failed to delete address');
          }
        },
      },
    ]);
  };

  return (
    <Container safeArea edges={['top']}>
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
        <Pressable onPress={() => router.back()} style={{ padding: 8, marginRight: 8 }} className="active:opacity-70">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>Saved Addresses</Text>
        </View>
        <Pressable
          onPress={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="active:opacity-70"
          style={{ padding: 8 }}
        >
          <Ionicons name="add" size={24} color={colors.primary} />
        </Pressable>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-4" style={{ color: colors.textSecondary }}>
            Loading addresses...
          </Text>
        </View>
      ) : savedAddresses.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="location-outline" size={80} color={colors.textSecondary} />
          <Text className="mt-6 text-xl font-bold" style={{ color: colors.text }}>
            No Saved Addresses
          </Text>
          <Text className="mt-2 text-sm text-center" style={{ color: colors.textSecondary }}>
            Save your frequently used addresses for faster booking
          </Text>
          <Button
            title="Add Address"
            onPress={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="mt-6"
            icon="add"
          />
        </View>
      ) : (
        <>
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            <View className="px-5 pt-5 pb-24">
              {savedAddresses.map((address) => (
              <Card key={address.id} variant="default" className="mb-4 p-5">
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-1">
                    <View className="flex-row items-center mb-2">
                      <Ionicons name="location" size={20} color={colors.primary} />
                      <Text className="ml-2 text-base font-bold" style={{ color: colors.text }}>
                        {address.label}
                      </Text>
                      {address.isDefault && (
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
                    <Text className="text-sm mb-1" style={{ color: colors.text }}>
                      {address.street}
                      {address.apartment ? `, ${address.apartment}` : ''}
                    </Text>
                    <Text className="text-sm mb-1" style={{ color: colors.textSecondary }}>
                      {address.city}, {address.state} - {address.pincode}
                    </Text>
                    {address.landmark && (
                      <Text className="text-xs" style={{ color: colors.textSecondary }}>
                        Near {address.landmark}
                      </Text>
                    )}
                  </View>
                </View>
                <View className="flex-row gap-2 mt-3 mb-2">
                  <Pressable
                    onPress={() => handleEdit(address)}
                    className="flex-1 py-2 rounded-lg active:opacity-70"
                    style={{ backgroundColor: `${colors.primary}10` }}
                  >
                    <Text className="text-center text-sm font-semibold" style={{ color: colors.primary }}>
                      Edit
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleDelete(address)}
                    className="flex-1 py-2 rounded-lg active:opacity-70"
                    style={{ backgroundColor: `${colors.error}10` }}
                  >
                    <Text className="text-center text-sm font-semibold" style={{ color: colors.error }}>
                      Delete
                    </Text>
                  </Pressable>
                </View>
              </Card>
              ))}
            </View>
          </ScrollView>
          
          {!showAddModal && (
            <View
              style={{
                position: 'absolute',
                bottom: Math.max(insets.bottom + 12, Platform.OS === 'ios' ? 28 : 16),
                left: 20,
                right: 20,
              }}
            >
              <Button
                title="Add New Address"
                onPress={() => {
                  resetForm();
                  setShowAddModal(true);
                }}
                icon="add"
                size="lg"
              />
            </View>
          )}
        </>
      )}

      {/* Add/Edit Modal */}
      <Modal 
        visible={showAddModal} 
        animationType="slide" 
        transparent
        onRequestClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
          onPress={() => {
            setShowAddModal(false);
            resetForm();
          }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'stretch' }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? insets.bottom + 12 : 0}
          >
            <Pressable
              onPress={(e) => e.stopPropagation()}
              style={{ flex: 1, justifyContent: 'flex-end', width: '100%',}}
            >
              <View
                className="rounded-t-3xl px-5 pt-5"
                style={{
                  backgroundColor: colors.background,
                  maxHeight: '90%',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: -2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 10,
                  elevation: 10,
                  paddingBottom:insets.bottom+24,
                  width: '100%',
                }}
              >
              <View className="flex-row items-center justify-between mb-5">
                <Text className="text-xl font-bold" style={{ color: colors.text }}>
                  {editingAddress ? 'Edit Address' : 'Add New Address'}
                </Text>
                <Pressable onPress={() => {
                  setShowAddModal(false);
                  resetForm();
                }} className="active:opacity-70">
                  <Ionicons name="close" size={24} color={colors.text} />
                </Pressable>
              </View>

              <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 16 }}
              >
                <View className="gap-4">
                  {/* Label */}
                  <View>
                    <Text className="text-sm font-semibold mb-2" style={{ color: colors.textSecondary }}>
                      LABEL
                    </Text>
                    <View className="flex-row gap-2">
                      {ADDRESS_LABELS.map((label) => (
                        <Pressable
                          key={label}
                          onPress={() => setAddressData({ ...addressData, label })}
                          className="flex-1 py-2 rounded-lg active:opacity-70"
                          style={{
                            backgroundColor: addressData.label === label ? colors.primary : colors.background,
                          }}
                        >
                          <Text
                            className="text-center text-sm font-semibold"
                            style={{ color: addressData.label === label ? 'white' : colors.text }}
                          >
                            {label}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  {/* Location Picker */}
                  <LocationPicker
                    onLocationSelect={handleLocationSelect}
                    selectedAddress={{
                      street: addressData.street,
                      apartment: addressData.apartment,
                      city: addressData.city,
                      state: addressData.state,
                      pincode: addressData.pincode,
                      landmark: addressData.landmark,
                      lat: addressData.lat,
                      lng: addressData.lng,
                    }}
                  />

                  {/* Street */}
                  <View>
                    <Text className="text-sm font-semibold mb-2" style={{ color: colors.textSecondary }}>
                      HOUSE NO, BUILDING NAME <Text style={{ color: colors.error }}>*</Text>
                    </Text>
                    <Input
                      placeholder="e.g., B-304, Green Park Apartments"
                      value={addressData.street}
                      onChangeText={(text) => setAddressData({ ...addressData, street: text })}
                    />
                  </View>

                  {/* Apartment */}
                  <View>
                    <Text className="text-sm font-semibold mb-2" style={{ color: colors.textSecondary }}>
                      FLAT / APARTMENT NUMBER
                    </Text>
                    <Input
                      placeholder="e.g., Flat 304"
                      value={addressData.apartment}
                      onChangeText={(text) => setAddressData({ ...addressData, apartment: text })}
                    />
                  </View>

                  {/* City & State */}
                  <View className="flex-row gap-2">
                    <View className="flex-1">
                      <Text className="text-sm font-semibold mb-2" style={{ color: colors.textSecondary }}>
                        CITY <Text style={{ color: colors.error }}>*</Text>
                      </Text>
                      <Input
                        placeholder="City"
                        value={addressData.city}
                        onChangeText={(text) => setAddressData({ ...addressData, city: text })}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-semibold mb-2" style={{ color: colors.textSecondary }}>
                        STATE <Text style={{ color: colors.error }}>*</Text>
                      </Text>
                      <Input
                        placeholder="State"
                        value={addressData.state}
                        onChangeText={(text) => setAddressData({ ...addressData, state: text })}
                      />
                    </View>
                  </View>

                  {/* Pincode */}
                  <View>
                    <Text className="text-sm font-semibold mb-2" style={{ color: colors.textSecondary }}>
                      PINCODE <Text style={{ color: colors.error }}>*</Text>
                    </Text>
                    <Input
                      placeholder="6-digit pincode"
                      value={addressData.pincode}
                      onChangeText={(text) => setAddressData({ ...addressData, pincode: text })}
                      keyboardType="numeric"
                      maxLength={6}
                    />
                  </View>

                  {/* Landmark */}
                  <View>
                    <Text className="text-sm font-semibold mb-2" style={{ color: colors.textSecondary }}>
                      LANDMARK (OPTIONAL)
                    </Text>
                    <Input
                      placeholder="e.g., Near City Mall"
                      value={addressData.landmark}
                      onChangeText={(text) => setAddressData({ ...addressData, landmark: text })}
                    />
                  </View>

                  {/* Default Toggle */}
                  <View className="flex-row items-center justify-between py-3">
                    <Text className="text-base" style={{ color: colors.text }}>
                      Set as default address
                    </Text>
                    <Switch
                      value={addressData.isDefault}
                      onValueChange={(value) => setAddressData({ ...addressData, isDefault: value })}
                      trackColor={{ false: colors.border, true: colors.primary }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                </View>
              </ScrollView>

              <View className="mt-4">
                <Button
                  title={editingAddress ? 'Update Address' : 'Save Address'}
                  onPress={handleSave}
                  loading={createMutation.isPending || updateMutation.isPending}
                  icon={editingAddress ? 'checkmark' : 'add'}
                />
              </View>
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </Container>
  );
}

