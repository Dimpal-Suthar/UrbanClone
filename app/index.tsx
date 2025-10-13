import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';

export default function SplashScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  
  // Terminal log - will show in Metro bundler
  console.warn('🔥 SPLASH SCREEN LOADED - App starting');

  return (
    <View className="flex-1 justify-center items-center px-6" style={{ backgroundColor: colors.background }}>
      {/* Logo */}
      <View className="mb-8">
        <View className="w-24 h-24 rounded-full items-center justify-center" style={{ backgroundColor: colors.primary }}>
          <Ionicons name="home" size={48} color="#FFFFFF" />
        </View>
      </View>

      {/* App Name */}
      <Text className="text-4xl font-bold mb-2" style={{ color: colors.text }}>
        UrbanClone
      </Text>
      <Text className="text-lg mb-12" style={{ color: colors.textSecondary }}>
        Home Services at Your Doorstep
      </Text>

      {/* Features */}
      <View className="mb-12 w-full">
        {[
          { icon: 'checkmark-circle', text: '100+ Professional Services' },
          { icon: 'shield-checkmark', text: 'Verified & Trusted Professionals' },
          { icon: 'star', text: 'Top Rated Service Quality' },
        ].map((feature, index) => (
          <View key={index} className="flex-row items-center mb-4">
            <Ionicons name={feature.icon as any} size={24} color={colors.primary} />
            <Text className="ml-3 text-base" style={{ color: colors.text }}>
              {feature.text}
            </Text>
          </View>
        ))}
      </View>

      {/* CTA Button */}
      <Pressable
        onPress={() => router.replace('/(tabs)')}
        className="w-full rounded-xl py-4 items-center active:opacity-80"
        style={{ backgroundColor: colors.primary }}
      >
        <Text className="text-white text-lg font-semibold">Get Started</Text>
      </Pressable>

      <Pressable onPress={() => router.push('/(tabs)')} className="mt-4">
        <Text className="text-base" style={{ color: colors.textSecondary }}>
          Already have an account? <Text style={{ color: colors.primary }} className="font-semibold">Sign In</Text>
        </Text>
      </Pressable>
    </View>
  );
}

