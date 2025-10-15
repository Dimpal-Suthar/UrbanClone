import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { showFailedMessage } from '@/utils/toast';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';

const PhoneAuthScreen = observer(() => {
  const router = useRouter();
  const { colors } = useTheme();
  const { sendOTP, loading, error, clearError } = useAuth();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+91');

  const handleSendOTP = async () => {
    if (phoneNumber.length < 10) {
      showFailedMessage('Error', 'Please enter a valid 10-digit phone number');
      return;
    }

    const fullNumber = `${countryCode}${phoneNumber}`;

    try {
      clearError();
      
      // Send OTP using React Native Firebase (no reCAPTCHA needed!)
      await sendOTP(fullNumber);
      
      // Navigate to OTP screen
      router.push('/auth/otp');
    } catch (err: any) {
      console.error('Send OTP error:', err.message);
      
      // Show user-friendly error message
      const errorMessage = err.message || 'Failed to send OTP. Please try again.';
      showFailedMessage('Error', errorMessage);
    }
  };

  const formatPhoneNumber = (text: string) => {
    // Remove non-numeric characters
    const cleaned = text.replace(/\D/g, '');
    // Limit to 10 digits
    const limited = cleaned.slice(0, 10);
    setPhoneNumber(limited);
  };

  return (
    <Container>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 px-6 pt-16 pb-8">
          {/* Header */}
          <Pressable 
            onPress={() => router.back()} 
            className="mb-8"
            style={{ alignSelf: 'flex-start' }}
          >
            <Ionicons name="arrow-back" size={28} color={colors.text} />
          </Pressable>

          {/* Title */}
          <View className="mb-12">
            <Text className="text-3xl font-bold mb-3" style={{ color: colors.text }}>
              Enter your phone number
            </Text>
            <Text className="text-base" style={{ color: colors.textSecondary }}>
              We'll send you an OTP to verify your number
            </Text>
          </View>

          {/* Phone Input */}
          <View className="mb-6">
            <Text className="text-sm font-medium mb-3" style={{ color: colors.textSecondary }}>
              Phone Number
            </Text>
            
            <View 
              className="flex-row items-center rounded-xl px-4 py-4"
              style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
            >
              {/* Country Code */}
              <Pressable 
                className="flex-row items-center mr-3 pr-3"
                style={{ borderRightWidth: 1, borderRightColor: colors.border }}
              >
                <Text className="text-base font-semibold mr-1" style={{ color: colors.text }}>
                  🇮🇳
                </Text>
                <Text className="text-base font-medium" style={{ color: colors.text }}>
                  {countryCode}
                </Text>
                <Ionicons name="chevron-down" size={16} color={colors.textSecondary} style={{ marginLeft: 4 }} />
              </Pressable>

              {/* Phone Number Input */}
              <TextInput
                className="flex-1 text-base font-medium"
                style={{ color: colors.text }}
                placeholder="XXXXXXXXXX"
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
                maxLength={10}
                value={phoneNumber}
                onChangeText={formatPhoneNumber}
                autoFocus
              />

              {phoneNumber.length === 10 && (
                <Ionicons name="checkmark-circle" size={24} color={colors.success} />
              )}
            </View>
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

          {/* Terms & Conditions */}
          <Text className="text-xs text-center mb-8" style={{ color: colors.textSecondary }}>
            By continuing, you agree to our{' '}
            <Text style={{ color: colors.primary }}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={{ color: colors.primary }}>Privacy Policy</Text>
          </Text>

          {/* Continue Button */}
          <View className="mt-8">
            <Button
              title="Continue"
              onPress={handleSendOTP}
              disabled={phoneNumber.length !== 10 || loading}
              loading={loading}
              variant="primary"
              size="lg"
            />
          </View>

        </View>
      </KeyboardAvoidingView>
    </Container>
  );
});

export default PhoneAuthScreen;
