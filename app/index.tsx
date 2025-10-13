import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Text, View } from 'react-native';

export default function SplashScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [isNavigating, setIsNavigating] = useState(false);
  
  // Animation values
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start animations
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Check navigation after animation
    const timer = setTimeout(() => {
      checkOnboarding();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const checkOnboarding = async () => {
    if (isNavigating) return;

    try {
      const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
      
      // Navigate after splash animation
      setTimeout(() => {
        setIsNavigating(true);
        
        if (hasSeenOnboarding === 'true') {
          router.push('/auth/select');
        } else {
          router.push('/onboarding');
        }
      }, 1000);
    } catch (error) {
      // Fallback to onboarding on error
      setTimeout(() => {
        setIsNavigating(true);
        router.push('/onboarding');
      }, 1000);
    }
  };

  return (
    <View className="flex-1 justify-center items-center" style={{ backgroundColor: colors.primary }}>
      {/* Animated Logo */}
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
        }}
      >
        <View className="w-32 h-32 rounded-full items-center justify-center bg-white/20">
          <View className="w-24 h-24 rounded-full items-center justify-center bg-white">
            <Ionicons name="home" size={56} color={colors.primary} />
          </View>
        </View>
      </Animated.View>

      {/* Animated Text */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          marginTop: 32,
        }}
      >
        <Text className="text-4xl font-bold text-white mb-2">
          UrbanClone
        </Text>
        <Text className="text-lg text-white/80 text-center">
          Home Services at Your Doorstep
        </Text>
      </Animated.View>
    </View>
  );
}
