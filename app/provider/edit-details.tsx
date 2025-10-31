import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Input } from '@/components/ui/Input';
import { db } from '@/config/firebase';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';

const AVAILABLE_SERVICES = [
  { id: 'cleaning', name: 'Home Cleaning', icon: 'sparkles' },
  { id: 'repairs', name: 'Repairs & Maintenance', icon: 'build' },
  { id: 'beauty', name: 'Beauty & Spa', icon: 'cut' },
  { id: 'appliance', name: 'Appliance Repair', icon: 'tv' },
  { id: 'painting', name: 'Painting', icon: 'color-palette' },
  { id: 'pest-control', name: 'Pest Control', icon: 'bug' },
];

export default function EditProviderDetailsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [experience, setExperience] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

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
        setSelectedServices(data.services || []);
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
    if (selectedServices.includes(serviceId)) {
      setSelectedServices(selectedServices.filter(id => id !== serviceId));
    } else {
      setSelectedServices([...selectedServices, serviceId]);
    }
  };

  const handleSubmit = async () => {
    if (selectedServices.length === 0) {
      Alert.alert('Error', 'Please select at least one service');
      return;
    }

    if (!bio.trim()) {
      Alert.alert('Error', 'Please add your bio');
      return;
    }

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
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-16 pb-8">
          <Pressable onPress={() => router.back()} className="mb-6">
            <Ionicons name="arrow-back" size={28} color={colors.text} />
          </Pressable>

          <Text className="text-3xl font-bold mb-2" style={{ color: colors.text }}>
            Edit Provider Details
          </Text>
          <Text className="text-base mb-8" style={{ color: colors.textSecondary }}>
            Update your services, experience, and bio
          </Text>

          {/* Select Services */}
          <Text className="text-lg font-bold mb-4" style={{ color: colors.text }}>
            Which services do you offer?
          </Text>
          
          <View className="mb-6">
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
                      : colors.surface,
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

          {/* Experience */}
          <Input
            label="Years of Experience"
            leftIcon={<Ionicons name="time-outline" size={20} color={colors.textSecondary} />}
            placeholder="e.g., 5"
            value={experience}
            onChangeText={setExperience}
            keyboardType="number-pad"
          />

          {/* Bio */}
          <View className="mb-6">
            <Text className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
              About You
            </Text>
            <View
              className="rounded-xl px-4 py-4"
              style={{ backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border }}
            >
              <Input
                placeholder="Tell customers about your skills and experience..."
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={4}
                style={{ minHeight: 100, textAlignVertical: 'top' }}
              />
            </View>
          </View>

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
    </Container>
  );
}

