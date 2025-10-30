import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Input } from '@/components/ui/Input';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { showFailedMessage, showSuccessMessage } from '@/utils/toast';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';

const EmailAuthScreen = observer(() => {
  const router = useRouter();
  const { colors } = useTheme();
  const { signInWithEmail, signUpWithEmail, userProfile, loading, error, clearError } = useAuth();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [wantsToBecomeProvider, setWantsToBecomeProvider] = useState(false);

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setEmail('');
    setPassword('');
    setName('');
    setWantsToBecomeProvider(false);
    clearError();
  };

  const handleSubmit = async () => {
    if (!email || !password || (isSignUp && !name)) {
      showFailedMessage('Error', 'Please fill in all fields');
      return;
    }

    try {
      clearError();
      console.log('🔄 Starting auth, loading:', loading);
      
      if (isSignUp) {
        console.log('📝 Signing up...');
        await signUpWithEmail(email, password, name, wantsToBecomeProvider);
        console.log('✅ Signup complete');
        
        if (wantsToBecomeProvider) {
          showSuccessMessage(
            'Application Submitted!',
            'Your provider application will be reviewed within 24-48 hours. Meanwhile, you can use the app as a customer.'
          );
          setTimeout(() => router.replace('/(tabs)'), 2000);
        } else {
          router.replace('/(tabs)');
        }
      } else {
        console.log('🔐 Signing in...');
        const profile = await signInWithEmail(email, password);
        console.log('✅ Sign in complete, role:', profile?.role);
        
        // Route based on role (use returned profile, not store)
        if (profile?.role === 'admin') {
          console.log('→ Routing to admin');
          router.replace('/(admin)/dashboard');
        } else if (profile?.role === 'provider') {
          console.log('→ Routing to provider');
          router.replace('/(provider)/dashboard');
        } else {
          console.log('→ Routing to customer');
          router.replace('/(tabs)');
        }
      }
    } catch (err: any) {
      showFailedMessage('Error', err.message);
    }
  };

  return (
    <Container>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <View className="flex-1 px-6 pt-16 pb-8">

          <Text className="text-3xl font-bold mb-2" style={{ color: colors.text }}>
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </Text>
          <Text className="text-base mb-8" style={{ color: colors.textSecondary }}>
            {isSignUp ? 'Sign up with email' : 'Sign in to continue'}
          </Text>

          {isSignUp && (
            <Input
              leftIcon={<Ionicons name="person-outline" size={20} color={colors.textSecondary} />}
              placeholder="Full Name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          )}

          <Input
            leftIcon={<Ionicons name="mail-outline" size={20} color={colors.textSecondary} />}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            leftIcon={<Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {/* Role Selection (Signup Only) */}
          {isSignUp && (
            <View className="mb-4">
              <Text className="text-sm font-medium mb-3" style={{ color: colors.textSecondary }}>
                I want to sign up as:
              </Text>
              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => setWantsToBecomeProvider(false)}
                  className="flex-1"
                >
                  <View
                    className="p-4 rounded-xl items-center"
                    style={{
                      backgroundColor: !wantsToBecomeProvider ? `${colors.primary}20` : colors.surface,
                      borderWidth: 2,
                      borderColor: !wantsToBecomeProvider ? colors.primary : colors.border,
                    }}
                  >
                    <Ionicons 
                      name="person" 
                      size={32} 
                      color={!wantsToBecomeProvider ? colors.primary : colors.textSecondary} 
                    />
                    <Text 
                      className="mt-2 font-semibold"
                      style={{ color: !wantsToBecomeProvider ? colors.primary : colors.text }}
                    >
                      Customer
                    </Text>
                    <Text className="text-xs text-center mt-1" style={{ color: colors.textSecondary }}>
                      Book services
                    </Text>
                  </View>
                </Pressable>

                <Pressable
                  onPress={() => setWantsToBecomeProvider(true)}
                  className="flex-1"
                >
                  <View
                    className="p-4 rounded-xl items-center"
                    style={{
                      backgroundColor: wantsToBecomeProvider ? `${colors.success}20` : colors.surface,
                      borderWidth: 2,
                      borderColor: wantsToBecomeProvider ? colors.success : colors.border,
                    }}
                  >
                    <Ionicons 
                      name="briefcase" 
                      size={32} 
                      color={wantsToBecomeProvider ? colors.success : colors.textSecondary} 
                    />
                    <Text 
                      className="mt-2 font-semibold"
                      style={{ color: wantsToBecomeProvider ? colors.success : colors.text }}
                    >
                      Provider
                    </Text>
                    <Text className="text-xs text-center mt-1" style={{ color: colors.textSecondary }}>
                      Offer services
                    </Text>
                  </View>
                </Pressable>
              </View>
            </View>
          )}

          {error && (
            <View className="rounded-lg px-4 py-3 mb-4" style={{ backgroundColor: `${colors.error}15` }}>
              <Text className="text-sm" style={{ color: colors.error }}>{error}</Text>
            </View>
          )}

          <Button
            title={isSignUp ? 'Create Account' : 'Sign In'}
            onPress={handleSubmit}
            disabled={loading}
            loading={loading}
            variant="primary"
            size="lg"
          />

          <Pressable onPress={toggleMode} className="mt-6 self-center">
            <Text style={{ color: colors.textSecondary }}>
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              <Text className="font-semibold" style={{ color: colors.primary }}>
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </Text>
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Container>
  );
});

export default EmailAuthScreen;
