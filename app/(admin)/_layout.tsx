import { useTheme } from '@/contexts/ThemeContext';
import { useRole } from '@/hooks/useRole';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';

export default function AdminLayout() {
  const { isAdmin } = useRole();
  const { colors } = useTheme();
  
  // Only admins can access
  if (!isAdmin) {
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
        name="providers" 
        options={{
          title: 'Providers',
          tabBarIcon: ({ color }) => <Ionicons name="people" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="services" 
        options={{
          title: 'Services',
          tabBarIcon: ({ color }) => <Ionicons name="construct" size={24} color={color} />
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
        name="settings" 
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Ionicons name="settings" size={24} color={color} />
        }} 
      />
    </Tabs>
  );
}

