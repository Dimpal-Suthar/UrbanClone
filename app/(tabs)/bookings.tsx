import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { useCustomerBookings } from '@/hooks/useBookings';
import { BookingStatus } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';

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
    <Container safeArea edges={['top', 'bottom']}>
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
          filteredBookings.map((booking) => {
            const dateObj = new Date(booking.scheduledDate);
            const formattedDate = dateObj.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });

            return (
              <Pressable
                key={booking.id}
                onPress={() => router.push(`/booking/${booking.id}`)}
                className="active:opacity-70"
              >
                <Card variant="elevated" className="mb-1">
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-1">
                      <Text className="text-base font-semibold mb-1" style={{ color: colors.text }}>
                        {booking.serviceName}
                      </Text>
                      <View className="flex-row items-center mt-2">
                        {booking.providerPhoto ? (
                          <Image
                            source={{ uri: booking.providerPhoto }}
                            style={{ width: 24, height: 24, borderRadius: 12, marginRight: 8 }}
                          />
                        ) : (
                          <View
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 12,
                              backgroundColor: colors.primary,
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: 8,
                            }}
                          >
                            <Text style={{ color: 'white', fontSize: 10, fontWeight: '600' }}>
                              {getInitials(booking.providerName)}
                            </Text>
                          </View>
                        )}
                        <Text className="text-sm" style={{ color: colors.textSecondary }}>
                          {booking.providerName}
                        </Text>
                      </View>
                    </View>
                    <View
                      className="px-3 py-1 rounded-full"
                      style={{
                        backgroundColor: `${getStatusColor(booking.status)}20`,
                      }}
                    >
                      <Text
                        className="text-xs font-medium capitalize"
                        style={{
                          color: getStatusColor(booking.status),
                        }}
                      >
                        {getStatusText(booking.status)}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center mb-3">
                    <View className="flex-row items-center flex-1">
                      <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                      <Text className="text-sm ml-2" style={{ color: colors.text }}>
                        {formattedDate}
                      </Text>
                    </View>
                    <View className="flex-row items-center flex-1">
                      <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                      <Text className="text-sm ml-2" style={{ color: colors.text }}>
                        {booking.scheduledTime}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row justify-between items-center pt-3" style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
                    <Text className="text-lg font-bold" style={{ color: colors.primary }}>
                      ₹{booking.price}
                    </Text>
                    <View className="flex-row items-center">
                      <Text className="text-sm font-medium mr-2" style={{ color: colors.primary }}>
                        View Details
                      </Text>
                      <Ionicons name="chevron-forward" size={20} color={colors.primary} />
                    </View>
                  </View>
                </Card>
              </Pressable>
            );
          })
        )}
        <View className="h-6" />
        </View>
      </ScrollView>
    </Container>
  );
}

