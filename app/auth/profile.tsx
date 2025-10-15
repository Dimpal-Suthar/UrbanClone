import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';

const ProfileSetupScreen = observer(() => {
  const router = useRouter();
  const { colors } = useTheme();
  const { updateProfile, loading, error, userProfile } = useAuth();
  
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');

  const handleComplete = async () => {
    if (!displayName.trim()) {
      return;
    }

    try {
      await updateProfile({
        displayName: displayName.trim(),
        email: email.trim() || undefined,
      });
      
      // Navigate based on user role
      const role = userProfile?.role || 'customer';
      if (role === 'admin') {
        router.replace('/(admin)/dashboard');
      } else if (role === 'provider') {
        router.replace('/(provider)/dashboard');
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      console.error('Update profile error:', err);
    }
  };

  return (
    <Container>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1 px-6 pt-16 pb-8" showsVerticalScrollIndicator={false}>
          {/* Title */}
          <View className="mb-12">
            <Text className="text-3xl font-bold mb-3" style={{ color: colors.text }}>
              Complete your profile
            </Text>
            <Text className="text-base" style={{ color: colors.textSecondary }}>
              Help us personalize your experience
            </Text>
          </View>

          {/* Profile Photo (Optional - Future) */}
          <View className="items-center mb-8">
            <View 
              className="w-24 h-24 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.surface }}
            >
              <Text className="text-4xl">👤</Text>
            </View>
            <Text className="text-sm mt-3" style={{ color: colors.textSecondary }}>
              Add photo (optional)
            </Text>
          </View>

          {/* Name Input */}
          <View className="mb-6">
            <Text className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
              Full Name *
            </Text>
            <TextInput
              className="rounded-xl px-4 py-4 text-base font-medium"
              style={{ 
                backgroundColor: colors.surface, 
                color: colors.text,
                borderWidth: 1,
                borderColor: colors.border 
              }}
              placeholder="Enter your full name"
              placeholderTextColor={colors.textSecondary}
              value={displayName}
              onChangeText={setDisplayName}
              autoFocus
            />
          </View>

          {/* Email Input */}
          <View className="mb-6">
            <Text className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
              Email (Optional)
            </Text>
            <TextInput
              className="rounded-xl px-4 py-4 text-base font-medium"
              style={{ 
                backgroundColor: colors.surface, 
                color: colors.text,
                borderWidth: 1,
                borderColor: colors.border 
              }}
              placeholder="Enter your email"
              placeholderTextColor={colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* Error Message */}
          {error && (
            <View 
              className="rounded-lg px-4 py-3 mb-4"
              style={{ backgroundColor: `${colors.error}15` }}
            >
              <Text className="text-sm" style={{ color: colors.error }}>
                {error}
              </Text>
            </View>
          )}

          {/* Spacer */}
          <View className="flex-1" />

          {/* Complete Button */}
          <Button
            title={loading ? 'Saving...' : 'Complete Profile'}
            onPress={handleComplete}
            disabled={!displayName.trim() || loading}
            style={{ 
              marginTop: 24,
              opacity: !displayName.trim() || loading ? 0.5 : 1 
            }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Container>
  );
});

export default ProfileSetupScreen;

