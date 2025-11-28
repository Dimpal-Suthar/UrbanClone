import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Input } from '@/components/ui/Input';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { getAuthErrorMessage } from '@/utils/authErrors';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { Formik } from 'formik';
import { observer } from 'mobx-react-lite';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import * as Yup from 'yup';

const PASSWORD_RULE_MESSAGE = 'Use 8+ characters with uppercase, lowercase, and a number.';
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

const SIGN_IN_INITIAL_VALUES = { email: '', password: '' };
const SIGN_UP_INITIAL_VALUES = { name: '', email: '', password: '', confirmPassword: '', role: 'customer' as 'customer' | 'provider' };

const EmailAuthScreen = observer(() => {
  const router = useRouter();
  const { colors } = useTheme();
  const { signInWithEmail, signUpWithEmail, clearError } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const SignInSchema = useMemo(
    () =>
      Yup.object().shape({
        email: Yup.string().email('Enter a valid email address.').required('Email is required.'),
        password: Yup.string()
          .matches(PASSWORD_REGEX, PASSWORD_RULE_MESSAGE)
          .required('Password is required.'),
      }),
    []
  );

  const SignUpSchema = useMemo(
    () =>
      Yup.object().shape({
        name: Yup.string().min(2, 'Please enter at least 2 characters.').required('Full name is required.'),
        email: Yup.string().email('Enter a valid email address.').required('Email is required.'),
        password: Yup.string()
          .matches(PASSWORD_REGEX, PASSWORD_RULE_MESSAGE)
          .required('Password is required.'),
        confirmPassword: Yup.string()
          .oneOf([Yup.ref('password')], 'Passwords must match.')
          .required('Confirm password is required.'),
        role: Yup.mixed<'customer' | 'provider'>().oneOf(['customer', 'provider']).required(),
      }),
    []
  );

  const toggleMode = () => {
    setIsSignUp((prev) => !prev);
    setFormError(null);
    clearError();
    setFormKey((k) => k + 1);
  };

  const renderError = (condition: boolean | undefined, message?: string) =>
    condition && message ? message : undefined;

  return (
    <Container>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={{ paddingBottom:  50 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
        >
          <View className="px-6 pt-16 pb-8">
          <Text className="text-3xl font-bold mb-2" style={{ color: colors.text }}>
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </Text>
          <Text className="text-base mb-8" style={{ color: colors.textSecondary }}>
            {isSignUp ? 'Sign up with email' : 'Sign in to continue'}
          </Text>

          {isSignUp ? (
            <Formik
              key={`signup-${formKey}`}
              initialValues={SIGN_UP_INITIAL_VALUES}
              validationSchema={SignUpSchema}
              validateOnChange={false}
              validateOnBlur={false}
              onSubmit={async (values, { setSubmitting }) => {
                setIsAuthenticating(true);
                try {
                  setFormError(null);
                  clearError();

                  const wantsProvider = values.role === 'provider';
                  await signUpWithEmail(values.email, values.password, values.name, wantsProvider);

                  if (wantsProvider) {
                    router.replace('/provider/apply');
                  } else {
                    router.replace('/(tabs)');
                  }
                } catch (err: any) {
                  setFormError(getAuthErrorMessage(err));
                  setSubmitting(false);
                  setIsAuthenticating(false);
                }
              }}
            >
              {({ handleChange, handleBlur, handleSubmit, setFieldValue, values, errors, touched, submitCount }) => (
                <>
                  <Input
                    leftIcon={<Ionicons name="person-outline" size={20} color={colors.textSecondary} />}
                    placeholder="Full Name"
                    value={values.name}
                    onChangeText={handleChange('name')}
                    onBlur={handleBlur('name')}
                    autoCapitalize="words"
                    error={renderError((touched.name || submitCount > 0), errors.name)}
                  />

                  <Input
                    leftIcon={<Ionicons name="mail-outline" size={20} color={colors.textSecondary} />}
                    placeholder="Email"
                    value={values.email}
                    onChangeText={handleChange('email')}
                    onBlur={handleBlur('email')}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    error={renderError((touched.email || submitCount > 0), errors.email)}
                  />

                  <Input
                    leftIcon={<Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />}
                    rightIcon={
                      <Pressable onPress={() => setShowPassword(!showPassword)}>
                        <Ionicons 
                          name={showPassword ? "eye-off-outline" : "eye-outline"} 
                          size={20} 
                          color={colors.textSecondary} 
                        />
                      </Pressable>
                    }
                    placeholder="Password"
                    value={values.password}
                    onChangeText={handleChange('password')}
                    onBlur={handleBlur('password')}
                    secureTextEntry={!showPassword}
                    helperText={!errors.password ? PASSWORD_RULE_MESSAGE : undefined}
                    error={renderError((touched.password || submitCount > 0), errors.password)}
                  />

                  <Input
                    leftIcon={<Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />}
                    rightIcon={
                      <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                        <Ionicons 
                          name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                          size={20} 
                          color={colors.textSecondary} 
                        />
                      </Pressable>
                    }
                    placeholder="Confirm Password"
                    value={values.confirmPassword}
                    onChangeText={handleChange('confirmPassword')}
                    onBlur={handleBlur('confirmPassword')}
                    secureTextEntry={!showConfirmPassword}
                    error={renderError((touched.confirmPassword || submitCount > 0), errors.confirmPassword)}
                  />

                  <View className="mb-4">
                    <Text className="text-sm font-medium mb-3" style={{ color: colors.textSecondary }}>
                      I want to sign up as:
                    </Text>
                    <View className="flex-row gap-3">
                      <Pressable
                        onPress={() => setFieldValue('role', 'customer')}
                        className="flex-1"
                      >
                        <View
                          className="p-4 rounded-xl items-center"
                          style={{
                            backgroundColor: values.role === 'customer' ? `${colors.primary}20` : colors.surface,
                            borderWidth: 2,
                            borderColor: values.role === 'customer' ? colors.primary : colors.border,
                          }}
                        >
                          <Ionicons name="person" size={32} color={values.role === 'customer' ? colors.primary : colors.textSecondary} />
                          <Text className="mt-2 font-semibold" style={{ color: values.role === 'customer' ? colors.primary : colors.text }}>
                            Customer
                          </Text>
                          <Text className="text-xs text-center mt-1" style={{ color: colors.textSecondary }}>
                            Book services
                          </Text>
                        </View>
                      </Pressable>

                      <Pressable
                        onPress={() => setFieldValue('role', 'provider')}
                        className="flex-1"
                      >
                        <View
                          className="p-4 rounded-xl items-center"
                          style={{
                            backgroundColor: values.role === 'provider' ? `${colors.success}20` : colors.surface,
                            borderWidth: 2,
                            borderColor: values.role === 'provider' ? colors.success : colors.border,
                          }}
                        >
                          <Ionicons name="briefcase" size={32} color={values.role === 'provider' ? colors.success : colors.textSecondary} />
                          <Text className="mt-2 font-semibold" style={{ color: values.role === 'provider' ? colors.success : colors.text }}>
                            Provider
                          </Text>
                          <Text className="text-xs text-center mt-1" style={{ color: colors.textSecondary }}>
                            Offer services
                          </Text>
                        </View>
                      </Pressable>
                    </View>
                  </View>

                  {formError && (
                    <View className="rounded-lg px-4 py-3 mb-4" style={{ backgroundColor: `${colors.error}15` }}>
                      <Text className="text-sm" style={{ color: colors.error }}>{formError}</Text>
                    </View>
                  )}

                  <Button
                    title="Create Account"
                    onPress={() => handleSubmit()}
                    disabled={isAuthenticating}
                    loading={isAuthenticating}
                    variant="primary"
                    size="lg"
                  />
                </>
              )}
            </Formik>
          ) : (
            <Formik
              key={`signin-${formKey}`}
              initialValues={SIGN_IN_INITIAL_VALUES}
              validationSchema={SignInSchema}
              validateOnChange={false}
              validateOnBlur={false}
              onSubmit={async (values, { setSubmitting }) => {
                setIsAuthenticating(true);
                try {
                  setFormError(null);
                  clearError();

                  const profile = await signInWithEmail(values.email, values.password);

                  if (profile?.role === 'admin') router.replace('/(admin)/dashboard');
                  else if (profile?.role === 'provider') router.replace('/(provider)/(tabs)/dashboard' as any);
                  else router.replace('/(tabs)');
                } catch (err: any) {
                  setFormError(getAuthErrorMessage(err));
                  setSubmitting(false);
                  setIsAuthenticating(false);
                }
              }}
            >
              {({ handleChange, handleBlur, handleSubmit, values, errors, touched, submitCount }) => (
                <>
                  <Input
                    leftIcon={<Ionicons name="mail-outline" size={20} color={colors.textSecondary} />}
                    placeholder="Email"
                    value={values.email}
                    onChangeText={handleChange('email')}
                    onBlur={handleBlur('email')}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    error={renderError((touched.email || submitCount > 0), errors.email)}
                  />

                  <Input
                    leftIcon={<Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />}
                    rightIcon={
                      <Pressable onPress={() => setShowPassword(!showPassword)}>
                        <Ionicons 
                          name={showPassword ? "eye-off-outline" : "eye-outline"} 
                          size={20} 
                          color={colors.textSecondary} 
                        />
                      </Pressable>
                    }
                    placeholder="Password"
                    value={values.password}
                    onChangeText={handleChange('password')}
                    onBlur={handleBlur('password')}
                    secureTextEntry={!showPassword}
                    helperText={!errors.password ? PASSWORD_RULE_MESSAGE : undefined}
                    error={renderError((touched.password || submitCount > 0), errors.password)}
                  />

                  <View className="items-end mb-6">
                    <Link href="/auth/forgot" asChild>
                      <Pressable>
                        <Text style={{ color: colors.primary, fontWeight: '600' }}>Forgot password?</Text>
                      </Pressable>
                    </Link>
                  </View>

                  {formError && (
                    <View className="rounded-lg px-4 py-3 mb-4" style={{ backgroundColor: `${colors.error}15` }}>
                      <Text className="text-sm" style={{ color: colors.error }}>{formError}</Text>
                    </View>
                  )}

                  <Button
                    title="Sign In"
                    onPress={() => handleSubmit()}
                    disabled={isAuthenticating}
                    loading={isAuthenticating}
                    variant="primary"
                    size="lg"
                  />
                </>
              )}
            </Formik>
          )}

          <Pressable onPress={toggleMode} className="mt-6 self-center">
            <Text style={{ color: colors.textSecondary }}>
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              <Text className="font-semibold" style={{ color: colors.primary }}>
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </Text>
            </Text>
          </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Container>
  );
});

export default EmailAuthScreen;
