import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';
import { Input } from '@/components/ui/Input';
import { db } from '@/config/firebase';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ProviderDetailErrors = {
  services?: string;
  experience?: string;
  bio?: string;
};

const AVAILABLE_SERVICES = [
  { id: 'cleaning', name: 'Home Cleaning', icon: 'sparkles' },
  { id: 'repairs', name: 'Repairs & Maintenance', icon: 'build' },
  { id: 'beauty', name: 'Beauty & Spa', icon: 'cut' },
  { id: 'appliance', name: 'Appliance Repair', icon: 'tv' },
  { id: 'painting', name: 'Painting', icon: 'color-palette' },
  { id: 'pest-control', name: 'Pest Control', icon: 'bug' },
];
const AVAILABLE_SERVICE_IDS = AVAILABLE_SERVICES.map((service) => service.id);

export default function EditProviderDetailsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [experience, setExperience] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [errors, setErrors] = useState<ProviderDetailErrors>({});

  // Listen to keyboard events
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    loadProviderData();
  }, [user?.uid]);

  const loadProviderData = async () => {
    if (!user?.uid) return;
    
    try {
      setFetching(true);
      const providerDoc = await getDoc(doc(db, 'providers', user.uid));
      
      if (providerDoc.exists()) {
        const data = providerDoc.data();
        const savedServices = Array.isArray(data.services) ? data.services : [];
        const validServices = savedServices.filter((serviceId: string) =>
          AVAILABLE_SERVICE_IDS.includes(serviceId)
        );
        setSelectedServices(validServices);
        setExperience(data.experience ? String(data.experience) : '');
        setBio(data.bio || '');
      }
    } catch (error) {
      console.error('Error loading provider data:', error);
      Alert.alert('Error', 'Failed to load provider details');
    } finally {
      setFetching(false);
    }
  };

  const toggleService = (serviceId: string) => {
    const updatedServices = selectedServices.includes(serviceId)
      ? selectedServices.filter(id => id !== serviceId)
      : [...selectedServices, serviceId];

    setSelectedServices(updatedServices);

    if (updatedServices.length > 0 && errors.services) {
      setErrors(prev => ({ ...prev, services: undefined }));
    }
  };

  const handleExperienceChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '').slice(0, 2);
    setExperience(numericValue);
    if (numericValue && errors.experience) {
      setErrors(prev => ({ ...prev, experience: undefined }));
    }
  };

  const handleBioChange = (text: string) => {
    setBio(text);
    if (text.trim() && errors.bio) {
      setErrors(prev => ({ ...prev, bio: undefined }));
    }
  };

  const handleSubmit = async () => {
    const validationErrors: ProviderDetailErrors = {};

    if (selectedServices.length === 0) {
      validationErrors.services = 'Select at least one service to offer.';
    }

    if (!experience) {
      validationErrors.experience = 'Enter your professional experience.';
    }

    if (!bio.trim()) {
      validationErrors.bio = 'Share a short bio to help customers trust you.';
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});

    try {
      setLoading(true);

      const experienceNumber = parseInt(experience, 10);
      const experienceValue = !isNaN(experienceNumber) && experienceNumber > 0 ? experienceNumber : null;

      await updateDoc(doc(db, 'providers', user!.uid), {
        services: selectedServices,
        experience: experienceValue,
        bio: bio.trim(),
        updatedAt: serverTimestamp(),
      });
      
      Alert.alert(
        'Profile Updated!',
        'Your provider details have been updated successfully.',
        [{ 
          text: 'OK', 
          onPress: () => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(provider)/(tabs)/profile');
            }
          }
        }]
      );
    } catch (error: any) {
      console.error('Update error:', error);
      Alert.alert('Error', 'Failed to update details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <Container>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-4" style={{ color: colors.textSecondary }}>
            Loading provider details...
          </Text>
        </View>
      </Container>
    );
  }

  return (
    <Container>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        style={{ flex: 1 }}
      >
        <ScrollView 
          className="flex-1" 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: keyboardVisible ? 400 : Math.max(insets.bottom + 50, 50) }}
        >
          <View className="px-6" style={{ paddingTop: Math.max(insets.top + 16, 16) }}>
          <Pressable onPress={() => router.back()} className="mb-6">
            <Ionicons name="arrow-back" size={28} color={colors.text} />
          </Pressable>

          <Text className="text-3xl font-bold mb-2" style={{ color: colors.text }}>
            Edit Provider Details
          </Text>
          <Text className="text-base mb-8" style={{ color: colors.textSecondary }}>
            Update your services, experience, and bio
          </Text>

          <Card style={{ marginBottom: 24 }}>
            <Text className="text-lg font-bold" style={{ color: colors.text }}>
              Which services do you offer? <Text style={{ color: colors.error }}>*</Text>
            </Text>
            <View className="mt-4">
            {AVAILABLE_SERVICES.map((service) => (
              <Pressable
                key={service.id}
                onPress={() => toggleService(service.id)}
                className="mb-3"
              >
                <View
                  className="flex-row items-center p-4 rounded-xl"
                  style={{
                    backgroundColor: selectedServices.includes(service.id) 
                      ? `${colors.primary}20` 
                        : colors.background,
                    borderWidth: 2,
                    borderColor: selectedServices.includes(service.id) 
                      ? colors.primary 
                      : colors.border,
                  }}
                >
                  <Ionicons 
                    name={service.icon as any} 
                    size={24} 
                    color={selectedServices.includes(service.id) ? colors.primary : colors.text} 
                  />
                  <Text 
                    className="ml-3 flex-1 text-base font-medium"
                    style={{ color: colors.text }}
                  >
                    {service.name}
                  </Text>
                  {selectedServices.includes(service.id) && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                  )}
                </View>
              </Pressable>
            ))}
          </View>
            {errors.services && (
              <Text className="text-sm mt-3" style={{ color: colors.error }}>
                {errors.services}
              </Text>
            )}
          </Card>

          <Card style={{ marginBottom: 24 }}>
            <Input
              label="Years of Experience"
              required
              leftIcon={<Ionicons name="time-outline" size={20} color={colors.textSecondary} />}
              placeholder="e.g., 5"
              value={experience}
              onChangeText={handleExperienceChange}
              keyboardType="number-pad"
              maxLength={2}
              error={errors.experience}
            />
          </Card>

          <Card style={{ marginBottom: 32 }}>
            <Input
              label="About You"
              required
              placeholder="Tell customers about your skills and experience..."
              value={bio}
              onChangeText={handleBioChange}
              multiline
              numberOfLines={4}
              style={{ minHeight: 120, textAlignVertical: 'top' }}
              maxLength={500}
              error={errors.bio}
            />
          </Card>

          {/* Submit Button */}
          <Button
            title="Update Details"
            onPress={handleSubmit}
            disabled={loading}
            loading={loading}
            variant="primary"
            size="lg"
          />
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </Container>
  );
}

