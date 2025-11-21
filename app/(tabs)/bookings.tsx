import { BookingListCard } from '@/components/BookingListCard';
import { Container } from '@/components/ui/Container';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { useCustomerBookings } from '@/hooks/useBookings';
import { BookingStatus } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

const BOOKING_TABS = ['Upcoming', 'Completed', 'Cancelled'];

export default function BookingsScreen() {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState('Upcoming');
  const { user } = useAuth();
  const router = useRouter();

  // Fetch user's bookings
  const { data: bookings = [], isLoading } = useCustomerBookings(user?.uid || null);

  // Filter bookings based on active tab
  const filteredBookings = bookings.filter((booking) => {
    switch (activeTab) {
      case 'Upcoming':
        return ['pending', 'accepted', 'confirmed', 'on-the-way', 'in-progress'].includes(booking.status);
      case 'Completed':
        return booking.status === 'completed';
      case 'Cancelled':
        return ['cancelled', 'rejected'].includes(booking.status);
      default:
        return true;
    }
  });

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case 'pending':
        return colors.warning;
      case 'accepted':
      case 'confirmed':
        return colors.success;
      case 'on-the-way':
        return '#2196F3';
      case 'in-progress':
        return '#9C27B0';
      case 'completed':
        return colors.success;
      case 'cancelled':
      case 'rejected':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusText = (status: BookingStatus) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'accepted':
        return 'Accepted';
      case 'confirmed':
        return 'Confirmed';
      case 'on-the-way':
        return 'On The Way';
      case 'in-progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Container safeArea edges={['top']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-4 pb-4">
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
        <View className="px-6">
        {isLoading ? (
          <View className="items-center justify-center py-6">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="mt-1 text-sm" style={{ color: colors.textSecondary }}>
              Loading bookings...
            </Text>
          </View>
        ) : filteredBookings.length === 0 ? (
          <View className="items-center justify-center py-6">
            <Ionicons name="calendar-outline" size={32} color={colors.textSecondary} />
            <Text className="text-sm font-semibold mt-1" style={{ color: colors.text }}>
              No {activeTab.toLowerCase()} bookings
            </Text>
            <Text className="text-xs mt-0.5 text-center px-3" style={{ color: colors.textSecondary }}>
              {activeTab === 'Upcoming' 
                ? 'Book a service to see your upcoming appointments here'
                : `You don't have any ${activeTab.toLowerCase()} bookings yet`
              }
            </Text>
          </View>
        ) : (
          filteredBookings.map((booking) => (
            <BookingListCard key={booking.id} booking={booking} showProvider={true} />
          ))
        )}
        <View className="h-6" />
        </View>
      </ScrollView>
    </Container>
  );
}

