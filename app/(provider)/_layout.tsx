import { useTheme } from '@/contexts/ThemeContext';
import { useRole } from '@/hooks/useRole';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';

export default function ProviderLayout() {
  const { isProvider, isAdmin } = useRole();
  const { colors } = useTheme();
  
  // Only providers (and admins for testing) can access
  if (!isProvider && !isAdmin) {
    return <Redirect href="/(tabs)" />;
  }
  
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tabs.Screen 
        name="dashboard" 
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <Ionicons name="grid" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="bookings" 
        options={{
          title: 'Bookings',
          tabBarIcon: ({ color }) => <Ionicons name="calendar" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="services" 
        options={{
          title: 'My Services',
          tabBarIcon: ({ color }) => <Ionicons name="construct" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="earnings" 
        options={{
          title: 'Earnings',
          tabBarIcon: ({ color }) => <Ionicons name="cash" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />
        }} 
      />
    </Tabs>
  );
}

