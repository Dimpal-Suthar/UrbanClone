import { TabBadge } from '@/components/ui/TabBadge';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { useProviderBookingCount } from '@/hooks/useBookings';
import { useUnreadCount } from '@/hooks/useConversations';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProviderTabsLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  
  // Get counts for badges (optimized using getCountFromServer)
  const { data: unreadCount = 0 } = useUnreadCount(user?.uid || null);
  
  // Get new bookings count (optimized - doesn't fetch all documents)
  const { data: newBookingsCount = 0 } = useProviderBookingCount(
    user?.uid || null,
    ['pending']
  );
  
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
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
          tabBarIcon: ({ color, size }) => (
            <View style={{ position: 'relative' }}>
              <Ionicons name="calendar" size={size} color={color} />
              {newBookingsCount > 0 && (
                <TabBadge count={newBookingsCount} />
              )}
            </View>
          ),
        }} 
      />
      <Tabs.Screen 
        name="chat" 
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size }) => (
            <View style={{ position: 'relative' }}>
              <Ionicons name="chatbubbles" size={size} color={color} />
              <TabBadge count={unreadCount} />
            </View>
          ),
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
        name="profile" 
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />
        }} 
      />
    </Tabs>
  );
}
