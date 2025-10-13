import { Container } from '@/components/ui/Container';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { observer } from 'mobx-react-lite';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import {
  CodeField,
  Cursor,
  useBlurOnFulfill,
  useClearByFocusCell,
} from 'react-native-confirmation-code-field';

const CELL_COUNT = 6;
const RESEND_TIMEOUT = 30;

const OTPVerificationScreen = observer(() => {
  const router = useRouter();
  const { colors } = useTheme();
  const { verifyOTP, sendOTP, loading, error, phoneNumber, clearError } = useAuth();
  
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(RESEND_TIMEOUT);
  const [canResend, setCanResend] = useState(false);
  
  const ref = useBlurOnFulfill({ value: otp, cellCount: CELL_COUNT });
  const [props, getCellOnLayoutHandler] = useClearByFocusCell({
    value: otp,
    setValue: setOtp,
  });

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  // Auto-verify when OTP is complete
  useEffect(() => {
    if (otp.length === CELL_COUNT) {
      handleVerifyOTP();
    }
  }, [otp]);

  const handleVerifyOTP = async () => {
    try {
      clearError();
      console.log('🔑 Verifying OTP:', otp);
      
      // Real Firebase OTP verification
      const isComplete = await verifyOTP(otp);
      
      if (isComplete) {
        console.log('✅ OTP verified successfully');
        // Profile is complete, go to home
        router.replace('/(tabs)');
      } else {
        console.log('✅ OTP verified, profile incomplete');
        // Profile incomplete, go to profile setup
        router.replace('/auth/profile');
      }
    } catch (err: any) {
      console.error('❌ Verify OTP error:', err);
      setOtp('');
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    
    try {
      clearError();
      // TODO: Implement resend with saved recaptcha verifier
      setResendTimer(RESEND_TIMEOUT);
      setCanResend(false);
    } catch (err: any) {
      console.error('Resend OTP error:', err);
    }
  };

  const maskPhoneNumber = (phone: string) => {
    if (phone.length < 10) return phone;
    const lastFour = phone.slice(-4);
    return `${'*'.repeat(phone.length - 4)}${lastFour}`;
  };

  return (
    <Container>
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
            Enter verification code
          </Text>
          <Text className="text-base" style={{ color: colors.textSecondary }}>
            We've sent a 6-digit code to{'\n'}
            <Text className="font-semibold">{maskPhoneNumber(phoneNumber)}</Text>
          </Text>
        </View>

        {/* OTP Input */}
        <View className="mb-8">
          <CodeField
            ref={ref}
            {...props}
            value={otp}
            onChangeText={setOtp}
            cellCount={CELL_COUNT}
            rootStyle={{ marginBottom: 20 }}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            renderCell={({ index, symbol, isFocused }) => (
              <View
                key={index}
                onLayout={getCellOnLayoutHandler(index)}
                style={{
                  width: 50,
                  height: 60,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 2,
                  borderColor: isFocused ? colors.primary : colors.border,
                  borderRadius: 12,
                  backgroundColor: colors.surface,
                  marginHorizontal: 4,
                }}
              >
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: 'bold',
                    color: colors.text,
                  }}
                >
                  {symbol || (isFocused ? <Cursor /> : null)}
                </Text>
              </View>
            )}
          />
        </View>

        {/* Error Message */}
        {error && (
          <View 
            className="rounded-lg px-4 py-3 mb-4"
            style={{ backgroundColor: `${colors.error}15` }}
          >
            <Text className="text-sm text-center" style={{ color: colors.error }}>
              {error}
            </Text>
          </View>
        )}

        {/* Resend OTP */}
        <View className="flex-row items-center justify-center mb-8">
          <Text className="text-sm" style={{ color: colors.textSecondary }}>
            Didn't receive code?{' '}
          </Text>
          {canResend ? (
            <Pressable onPress={handleResend}>
              <Text className="text-sm font-semibold" style={{ color: colors.primary }}>
                Resend OTP
              </Text>
            </Pressable>
          ) : (
            <Text className="text-sm font-semibold" style={{ color: colors.textSecondary }}>
              Resend in {resendTimer}s
            </Text>
          )}
        </View>

        {/* Loading Indicator */}
        {loading && (
          <View className="items-center mb-8">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="text-sm mt-3" style={{ color: colors.textSecondary }}>
              Verifying OTP...
            </Text>
          </View>
        )}

        {/* Spacer */}
        <View className="flex-1" />

        {/* Edit Phone Number */}
        <Pressable onPress={() => router.back()} className="py-4">
          <Text className="text-sm text-center font-medium" style={{ color: colors.primary }}>
            Change phone number
          </Text>
        </Pressable>
      </View>
    </Container>
  );
});

export default OTPVerificationScreen;

