import { Button } from '@/components/ui/Button';
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

    if (!experience || !bio) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      
      // Create provider application
      await setDoc(doc(db, 'providers', user!.uid), {
        userId: user!.uid,
        services: selectedServices,
        experience: parseInt(experience),
        bio,
        approvalStatus: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      Alert.alert(
        'Application Submitted!',
        'We will review your application and notify you within 24-48 hours.',
        [{ text: 'OK', onPress: () => router.back() }]
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

