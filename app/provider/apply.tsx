import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';
import { Input } from '@/components/ui/Input';
import { db } from '@/config/firebase';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

type ApplyErrors = {
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

export default function ProviderApplicationScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [experience, setExperience] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ApplyErrors>({});

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
    const validationErrors: ApplyErrors = {};

    if (selectedServices.length === 0) {
      validationErrors.services = 'Select at least one service you can offer.';
    }

    if (!experience) {
      validationErrors.experience = 'Enter your professional experience.';
    }

    if (!bio.trim()) {
      validationErrors.bio = 'Tell customers about your skills and work style.';
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

      await setDoc(doc(db, 'providers', user!.uid), {
        userId: user!.uid,
        services: selectedServices,
        experience: experienceValue,
        bio,
        approvalStatus: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      Alert.alert(
        'Application Submitted!',
        'Your provider application has been submitted successfully. Admin will review it within 24-48 hours.\n\nUntil approval, you can continue using the app as a customer.',
        [{ 
          text: 'OK', 
          onPress: () => {
            // Try to go back, if can't (no history), go to customer home
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)');
            }
          }
        }]
      );
    } catch (error: any) {
      console.error('Application error:', error);
      Alert.alert('Error', 'Failed to submit application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-16 pb-8">
          <Pressable onPress={() => router.back()} className="mb-6">
            <Ionicons name="arrow-back" size={28} color={colors.text} />
          </Pressable>

          <Text className="text-3xl font-bold mb-2" style={{ color: colors.text }}>
            Become a Service Provider
          </Text>
          <Text className="text-base mb-8" style={{ color: colors.textSecondary }}>
            Start earning by offering your services
          </Text>

          <Card
            style={{
              marginBottom: 20,
              backgroundColor: `${colors.primary}08`,
              borderColor: `${colors.primary}30`,
              borderWidth: 1,
            }}
          >
            <Text className="text-base font-semibold mb-1" style={{ color: colors.primary }}>
              Quick heads-up
            </Text>
            <Text className="text-sm" style={{ color: colors.text }}>
              Admin reviews applications within 24–48 hours. You can keep using the app as a customer meanwhile.
            </Text>
          </Card>

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
            title="Submit Application"
            onPress={handleSubmit}
            disabled={loading}
            loading={loading}
            variant="primary"
            size="lg"
          />
        </View>
      </ScrollView>
    </Container>
  );
}

