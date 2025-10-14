import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

const BOOKING_TABS = ['Upcoming', 'Completed', 'Cancelled'];

export default function BookingsScreen() {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState('Upcoming');
  const { user } = useAuth();

  // Fetch user's bookings
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['user-bookings', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      
      // For now, return empty array as we don't have booking system implemented yet
      // This will be implemented when we add the booking system
      return [];
    },
    enabled: !!user?.uid,
  });

  // Filter bookings based on active tab
  const filteredBookings = bookings.filter((booking) => {
    switch (activeTab) {
      case 'Upcoming':
        return ['pending', 'confirmed', 'in-progress'].includes(booking.status);
      case 'Completed':
        return booking.status === 'completed';
      case 'Cancelled':
        return booking.status === 'cancelled';
      default:
        return true;
    }
  });

  return (
    <Container>
      {/* Header */}
      <View className="px-6 pt-4 pb-2">
        <Text className="text-2xl font-bold" style={{ color: colors.text }}>
          My Bookings
        </Text>
      </View>

      {/* Tabs */}
      <View className="flex-row px-6 mb-4">
        {BOOKING_TABS.map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            className="mr-4 pb-2"
            style={{
              borderBottomWidth: activeTab === tab ? 2 : 0,
              borderBottomColor: colors.primary,
            }}
          >
            <Text
              className="font-semibold"
              style={{
                color: activeTab === tab ? colors.primary : colors.textSecondary,
              }}
            >
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Bookings List */}
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View className="items-center justify-center py-20">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="mt-4" style={{ color: colors.textSecondary }}>
              Loading bookings...
            </Text>
          </View>
        ) : filteredBookings.length === 0 ? (
          <View className="items-center justify-center py-20">
            <Ionicons name="calendar-outline" size={64} color={colors.textSecondary} />
            <Text className="text-lg mt-4" style={{ color: colors.textSecondary }}>
              No {activeTab.toLowerCase()} bookings
            </Text>
            <Text className="text-sm mt-2 text-center px-8" style={{ color: colors.textSecondary }}>
              {activeTab === 'Upcoming' 
                ? 'Book a service to see your upcoming appointments here'
                : `You don't have any ${activeTab.toLowerCase()} bookings yet`
              }
            </Text>
          </View>
        ) : (
          filteredBookings.map((booking) => (
            <Card key={booking.id} variant="elevated" className="mb-4">
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1">
                  <Text className="text-base font-semibold mb-1" style={{ color: colors.text }}>
                    {booking.service}
                  </Text>
                  <View className="flex-row items-center">
                    <Ionicons name="person-outline" size={14} color={colors.textSecondary} />
                    <Text className="text-sm ml-1" style={{ color: colors.textSecondary }}>
                      {booking.professional}
                    </Text>
                  </View>
                </View>
                <View
                  className="px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: booking.status === 'confirmed' ? `${colors.success}20` : `${colors.warning}20`,
                  }}
                >
                  <Text
                    className="text-xs font-medium capitalize"
                    style={{
                      color: booking.status === 'confirmed' ? colors.success : colors.warning,
                    }}
                  >
                    {booking.status}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center mb-3">
                <View className="flex-row items-center flex-1">
                  <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                  <Text className="text-sm ml-2" style={{ color: colors.text }}>
                    {booking.date}
                  </Text>
                </View>
                <View className="flex-row items-center flex-1">
                  <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                  <Text className="text-sm ml-2" style={{ color: colors.text }}>
                    {booking.time}
                  </Text>
                </View>
              </View>

              <View className="flex-row justify-between items-center pt-3" style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
                <Text className="text-lg font-bold" style={{ color: colors.primary }}>
                  ₹{booking.price}
                </Text>
                <View className="flex-row gap-2">
                  <Pressable
                    className="px-4 py-2 rounded-lg active:opacity-70"
                    style={{ backgroundColor: colors.surface }}
                  >
                    <Text className="text-sm font-medium" style={{ color: colors.text }}>
                      Reschedule
                    </Text>
                  </Pressable>
                  <Pressable
                    className="px-4 py-2 rounded-lg active:opacity-70"
                    style={{ backgroundColor: colors.primary }}
                  >
                    <Text className="text-sm font-medium text-white">
                      Track
                    </Text>
                  </Pressable>
                </View>
              </View>
            </Card>
          ))
        )}
        <View className="h-6" />
      </ScrollView>
    </Container>
  );
}

