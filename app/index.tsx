import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { Redirect } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Text, View } from 'react-native';

export default function SplashScreen() {
  const { colors } = useTheme();
  const { user, userProfile, loading, hasSeenOnboarding } = useAuth();
  const [showContent, setShowContent] = useState(false);
  
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();

    // Timeout fallback - show content after 3 seconds max
    const fallback = setTimeout(() => {
      console.log('⏱️ Timeout: Forcing navigation');
      setShowContent(true);
    }, 3000);

    return () => clearTimeout(fallback);
  }, []);

  // Show content once loading is done OR timeout
  useEffect(() => {
    if (!loading) {
      console.log('✅ Auth loaded, user:', user?.uid, 'role:', userProfile?.role);
      setShowContent(true);
    }
  }, [loading]);

  // Wait for auth to load
  if (!showContent) {
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: colors.primary }}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <View className="w-32 h-32 rounded-full items-center justify-center bg-white/20">
            <View className="w-24 h-24 rounded-full items-center justify-center bg-white">
              <Ionicons name="home" size={56} color={colors.primary} />
            </View>
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim, marginTop: 32, alignItems: 'center' }}>
          <Text className="text-4xl font-bold text-white mb-2">UrbanClone</Text>
          <Text className="text-lg text-white/80 text-center mb-4">
            Home Services at Your Doorstep
          </Text>
          <ActivityIndicator size="small" color="#FFFFFF" />
        </Animated.View>
      </View>
    );
  }

  // Auth loaded - redirect based on state
  if (user && userProfile) {
    console.log('✅ User authenticated, role:', userProfile.role);
    // Route based on role
    if (userProfile.role === 'admin') {
      return <Redirect href="/(admin)/dashboard" />;
    }
    if (userProfile.role === 'provider') {
      return <Redirect href="/(provider)/dashboard" />;
    }
    return <Redirect href="/(tabs)" />;  // Customer
  }
  
  // User is logged in but profile is loading - show loading
  if (user && !userProfile) {
    console.log('⏳ User logged in but profile loading...');
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="mt-4 text-lg" style={{ color: colors.text }}>
          Loading profile...
        </Text>
      </View>
    );
  }
  
  // No user - redirect to auth
  console.log('❌ No user, redirecting to auth');
  if (hasSeenOnboarding) return <Redirect href="/auth/select" />;
  return <Redirect href="/onboarding" />;
}
