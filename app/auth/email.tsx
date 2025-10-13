import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Input } from '@/components/ui/Input';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';

const EmailAuthScreen = observer(() => {
  const router = useRouter();
  const { colors } = useTheme();
  const { signInWithEmail, signUpWithEmail, loading, error, clearError } = useAuth();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    // Clear form when switching modes
    setEmail('');
    setPassword('');
    setName('');
    clearError();
  };

  const handleSubmit = async () => {
    if (!email || !password || (isSignUp && !name)) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      clearError();
      
      if (isSignUp) {
        await signUpWithEmail(email, password, name);
        Alert.alert('Success', 'Account created! Check your email.', 
          [{ text: 'OK', onPress: () => setIsSignUp(false) }]
        );
      } else {
        await signInWithEmail(email, password);
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  return (
    <Container>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <View className="flex-1 px-6 pt-16 pb-8">
          <Pressable onPress={() => router.back()} className="mb-8">
            <Ionicons name="arrow-back" size={28} color={colors.text} />
          </Pressable>

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
