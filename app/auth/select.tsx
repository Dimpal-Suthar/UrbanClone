import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

export default function AuthSelectScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <Container>
      <View className="flex-1 px-6 pt-16 pb-8 justify-center">
        <View className="items-center mb-12">
          <View className="w-24 h-24 rounded-full items-center justify-center mb-6" style={{ backgroundColor: colors.primary }}>
            <Ionicons name="home" size={48} color="#FFF" />
          </View>
          <Text className="text-3xl font-bold mb-2" style={{ color: colors.text }}>
            Get Started
          </Text>
          <Text className="text-base text-center" style={{ color: colors.textSecondary }}>
            Choose how you'd like to continue
          </Text>
        </View>

        <Button
          title="Continue with Email"
          onPress={() => router.push('/auth/email')}
          variant="primary"
          size="lg"
          icon={<Ionicons name="mail" size={20} color="#FFF" />}
        />

        <View className="my-4" />

        <Button
          title="Continue with Phone"
          onPress={() => router.push('/auth/phone')}
          variant="outline"
          size="lg"
          icon={<Ionicons name="call" size={20} color={colors.primary} />}
        />

        <Pressable onPress={() => router.back()} className="mt-8 self-center">
          <Text className="text-sm" style={{ color: colors.textSecondary }}>
            Go Back
          </Text>
        </Pressable>
      </View>
    </Container>
  );
}

