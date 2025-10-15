import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';

export default function ProviderLayout() {
  const { user, userProfile, loading } = useAuth();
  const { colors } = useTheme();
  
  // Show loading while auth is being determined
  if (loading || (user && !userProfile)) {
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="mt-4 text-lg" style={{ color: colors.text }}>
          Loading...
        </Text>
      </View>
    );
  }
  
  // Only providers (and admins for testing) can access
  if (!user || (userProfile?.role !== 'provider' && userProfile?.role !== 'admin')) {
    return <Redirect href="/(tabs)" />;
  }
  
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen 
        name="availability" 
        options={{
          presentation: 'modal',
          headerShown: false,
        }} 
      />
    </Stack>
  );
}