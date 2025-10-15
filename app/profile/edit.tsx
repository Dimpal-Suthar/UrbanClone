import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { Input } from '@/components/ui/Input';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { useUpdateUserProfile } from '@/hooks/useUser';
import { uploadProfileImage } from '@/services/storageService';
import { showFailedMessage, showSuccessMessage } from '@/utils/toast';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View
} from 'react-native';

export default function EditProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, userProfile } = useAuth();
  const updateProfileMutation = useUpdateUserProfile();

  const [formData, setFormData] = useState({
    name: userProfile?.name || user?.displayName || '',
    displayName: userProfile?.displayName || '',
    phone: userProfile?.phone || user?.phoneNumber || '',
    bio: userProfile?.bio || '',
    experience: userProfile?.experience?.toString() || '',
    address: userProfile?.address || '',
    city: userProfile?.city || '',
    state: userProfile?.state || '',
    pincode: userProfile?.pincode || '',
  });

  const [profileImage, setProfileImage] = useState(userProfile?.photoURL || user?.photoURL || '');
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Update form data when userProfile loads
  useEffect(() => {
    console.log('🔍 Edit Profile Debug:');
    console.log('userProfile:', userProfile);
    console.log('user:', user);
    
    if (userProfile) {
      const newFormData = {
        name: userProfile.name || user?.displayName || '',
        displayName: userProfile.displayName || '',
        phone: userProfile.phone || user?.phoneNumber || '',
        bio: userProfile.bio || '',
        experience: userProfile.experience?.toString() || '',
        address: userProfile.address || '',
        city: userProfile.city || '',
        state: userProfile.state || '',
        pincode: userProfile.pincode || '',
      };
      console.log('Setting form data:', newFormData);
      setFormData(newFormData);
      setProfileImage(userProfile.photoURL || user?.photoURL || '');
    }
  }, [userProfile, user]);

  const handleImageSelect = (imageUri: string) => {
    // Just store the local image URI, don't upload yet
    setLocalImageUri(imageUri);
    setProfileImage(imageUri); // Show preview
  };

  const handleSave = async () => {
    if (!user) return;

    // Validate required fields
    if (!formData.name.trim()) {
      showFailedMessage('Required', 'Name is required');
      return;
    }
    if (!formData.phone.trim()) {
      showFailedMessage('Required', 'Phone number is required');
      return;
    }

    try {
      setIsLoading(true);

      // Prepare updates object
      const updates: any = {
        name: formData.name.trim(),
        displayName: formData.displayName.trim() || undefined,
        phone: formData.phone.trim(),
        bio: formData.bio.trim() || undefined,
        experience: formData.experience ? parseInt(formData.experience) : undefined,
        address: formData.address.trim() || undefined,
        city: formData.city.trim() || undefined,
        state: formData.state.trim() || undefined,
        pincode: formData.pincode.trim() || undefined,
      };

      // Upload image to storage if a new image was selected
      if (localImageUri) {
        try {
          const imageUrl = await uploadProfileImage(user.uid, localImageUri);
          updates.photoURL = imageUrl;
          setProfileImage(imageUrl); // Update the displayed image
          setLocalImageUri(null); // Clear local URI
        } catch (imageError) {
          console.error('Error uploading image:', imageError);
          showFailedMessage('Error', 'Failed to upload profile photo. Please try again.');
          return;
        }
      }

      // Update user profile
      await updateProfileMutation.mutateAsync({
        userId: user.uid,
        updates,
      });

      showSuccessMessage('Success', 'Profile updated successfully');
      setTimeout(() => router.back(), 500);
    } catch (error) {
      console.error('Error updating profile:', error);
      showFailedMessage('Error', 'Failed to update profile. Please try again.');
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
          backgroundColor: colors.surface,
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
            Edit Profile
          </Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
            Update your personal information
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
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-5 pt-5">
            {/* Profile Photo Section */}
            <ImageUpload
              onImageSelect={handleImageSelect}
              currentImage={profileImage}
              placeholder="Add Profile Photo"
              loading={isLoading}
            />

            {/* Basic Information */}
            <View className="p-5 mb-4 rounded-2xl" style={{ backgroundColor: colors.surface }}>
              <Text className="text-base font-bold mb-4" style={{ color: colors.text }}>
                Basic Information
              </Text>

              <View className="gap-4">
                <View>
                  <Text className="text-[13px] font-semibold mb-2" style={{ color: colors.textSecondary }}>
                    FULL NAME <Text style={{ color: colors.error }}>*</Text>
                  </Text>
                  <Input
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                  />
                </View>

                <View>
                  <Text className="text-[13px] font-semibold mb-2" style={{ color: colors.textSecondary }}>
                    DISPLAY NAME
                  </Text>
                  <Input
                    placeholder="How you want to be called"
                    value={formData.displayName}
                    onChangeText={(text) => setFormData({ ...formData, displayName: text })}
                  />
                </View>

                <View>
                  <Text className="text-[13px] font-semibold mb-2" style={{ color: colors.textSecondary }}>
                    PHONE NUMBER <Text style={{ color: colors.error }}>*</Text>
                  </Text>
                  <Input
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChangeText={(text) => setFormData({ ...formData, phone: text })}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
            </View>

            {/* Provider-specific fields */}
            {user?.role === 'provider' && (
              <Card variant="default" style={{ padding: 20, marginBottom: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 16 }}>
                  Professional Information
                </Text>

                <View style={{ gap: 16 }}>
                  <View>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 }}>
                      BIO / DESCRIPTION
                    </Text>
                    <Input
                      placeholder="Tell customers about yourself..."
                      value={formData.bio}
                      onChangeText={(text) => setFormData({ ...formData, bio: text })}
                      multiline
                      numberOfLines={3}
                      style={{ minHeight: 80, textAlignVertical: 'top' }}
                    />
                  </View>

                  <View>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 }}>
                      YEARS OF EXPERIENCE
                    </Text>
                    <Input
                      placeholder="Enter years of experience"
                      value={formData.experience}
                      onChangeText={(text) => setFormData({ ...formData, experience: text })}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </Card>
            )}

            {/* Address Information */}
            <Card variant="default" style={{ padding: 20, marginBottom: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 16 }}>
                Address Information
              </Text>

              <View style={{ gap: 16 }}>
                <View>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 }}>
                    ADDRESS
                  </Text>
                  <Input
                    placeholder="Enter your address"
                    value={formData.address}
                    onChangeText={(text) => setFormData({ ...formData, address: text })}
                    multiline
                    numberOfLines={2}
                    style={{ minHeight: 60, textAlignVertical: 'top' }}
                  />
                </View>

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 }}>
                      CITY
                    </Text>
                    <Input
                      placeholder="City"
                      value={formData.city}
                      onChangeText={(text) => setFormData({ ...formData, city: text })}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 }}>
                      STATE
                    </Text>
                    <Input
                      placeholder="State"
                      value={formData.state}
                      onChangeText={(text) => setFormData({ ...formData, state: text })}
                    />
                  </View>
                </View>

                <View>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 }}>
                    PINCODE
                  </Text>
                  <Input
                    placeholder="Enter pincode"
                    value={formData.pincode}
                    onChangeText={(text) => setFormData({ ...formData, pincode: text })}
                    keyboardType="numeric"
                    maxLength={6}
                  />
                </View>
              </View>
            </Card>
          </View>
        </ScrollView>

        {/* Bottom Action */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: Platform.OS === 'ios' ? 12 : 16,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.surface,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <Button
            title={isLoading ? 'Saving...' : 'Save Changes'}
            onPress={handleSave}
            disabled={isLoading}
            icon="checkmark"
          />
        </View>
      </KeyboardAvoidingView>
    </Container>
  );
}
