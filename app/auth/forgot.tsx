import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Input } from '@/components/ui/Input';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { getAuthErrorMessage } from '@/utils/authErrors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Formik } from 'formik';
import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';
import * as Yup from 'yup';

const ForgotPasswordScreen = observer(() => {
  const router = useRouter();
  const { colors } = useTheme();
  const { resetPassword, clearError } = useAuth();

  const [formError, setFormError] = useState<string | null>(null);

  return (
    <Container>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <View className="flex-1 px-6 pt-16 pb-8">
          <Text className="text-3xl font-bold mb-2" style={{ color: colors.text }}>
            Forgot Password
          </Text>
          <Text className="text-base mb-8" style={{ color: colors.textSecondary }}>
            Enter the email associated with your account and we’ll send a reset link.
          </Text>

          <Formik
            initialValues={{ email: '' }}
            validationSchema={Yup.object().shape({
              email: Yup.string().email('Enter a valid email address.').required('Email is required.'),
            })}
            validateOnChange
            validateOnBlur
            onSubmit={async (values, { setSubmitting, resetForm }) => {
              try {
                setFormError(null);
                clearError();

                await resetPassword(values.email);
                Alert.alert(
                  'Reset Email Sent',
                  'Check your inbox for instructions to reset your password.',
                  [{ text: 'OK', onPress: () => router.back() }]
                );
                resetForm();
              } catch (err: any) {
                setFormError(getAuthErrorMessage(err));
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({ handleChange, handleBlur, handleSubmit, values, errors, touched, submitCount, isValid, isSubmitting }) => (
              <>
                <Input
                  leftIcon={<Ionicons name="mail-outline" size={20} color={colors.textSecondary} />}
                  placeholder="Email"
                  value={values.email}
                  onChangeText={handleChange('email')}
                  onBlur={handleBlur('email')}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={(touched.email || submitCount > 0 || !!values.email) && errors.email ? errors.email : undefined}
                />

                {formError && (
                  <View className="rounded-lg px-4 py-3 mb-4" style={{ backgroundColor: `${colors.error}15` }}>
                    <Text className="text-sm" style={{ color: colors.error }}>{formError}</Text>
                  </View>
                )}

                <Button
                  title="Send Reset Link"
                  onPress={() => handleSubmit()}
                  disabled={!isValid || isSubmitting}
                  loading={isSubmitting}
                  variant="primary"
                  size="lg"
                />
              </>
            )}
          </Formik>

          <Pressable onPress={() => router.back()} className="mt-6 self-center">
            <Text style={{ color: colors.textSecondary }}>
              Remembered your password?{' '}
              <Text className="font-semibold" style={{ color: colors.primary }}>
                Back to sign in
              </Text>
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Container>
  );
});

export default ForgotPasswordScreen;
