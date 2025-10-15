import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { useProviderBookings } from '@/hooks/useBookings';
import { BookingStatus } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';

type BookingTab = 'new' | 'upcoming' | 'completed' | 'cancelled';

const ProviderBookingsScreen = observer(() => {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<BookingTab>('new');
  const { user } = useAuth();
  const router = useRouter();

  // Fetch provider's bookings
  const { data: allBookings = [], isLoading } = useProviderBookings(user?.uid || null);

  // Filter bookings based on active tab
  const filteredBookings = allBookings.filter((booking) => {
    switch (activeTab) {
      case 'new':
        return booking.status === 'pending';
      case 'upcoming':
        return ['accepted', 'confirmed', 'on-the-way', 'in-progress'].includes(booking.status);
      case 'completed':
        return booking.status === 'completed';
      case 'cancelled':
        return ['cancelled', 'rejected'].includes(booking.status);
      default:
        return true;
    }
  });

  const getBookingCount = (tab: BookingTab) => {
    switch (tab) {
      case 'new':
        return allBookings.filter(b => b.status === 'pending').length;
      case 'upcoming':
        return allBookings.filter(b => ['accepted', 'confirmed', 'on-the-way', 'in-progress'].includes(b.status)).length;
      case 'completed':
        return allBookings.filter(b => b.status === 'completed').length;
      case 'cancelled':
        return allBookings.filter(b => ['cancelled', 'rejected'].includes(b.status)).length;
      default:
        return 0;
    }
  };

  const tabs: { key: BookingTab; label: string; count: number }[] = [
    { key: 'new', label: 'New', count: getBookingCount('new') },
    { key: 'upcoming', label: 'Upcoming', count: getBookingCount('upcoming') },
    { key: 'completed', label: 'Completed', count: getBookingCount('completed') },
    { key: 'cancelled', label: 'Cancelled', count: getBookingCount('cancelled') },
  ];

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
        return 'New Request';
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
        {/* Header */}
        <View className="px-6 pt-4 pb-4">
          <Text className="text-2xl font-bold" style={{ color: colors.text }}>
            My Bookings
          </Text>
        </View>

        {/* Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 14,
            paddingVertical: 8,
          }}
          style={{ maxHeight: 50 }}
        >
          {tabs.map((tab) => (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              className="mr-2"
            >
              <View
                className="px-5 py-2.5 rounded-full flex-row items-center"
                style={{
                  backgroundColor: activeTab === tab.key ? colors.primary : colors.surface,
                }}
              >
                <Text
                  className="font-semibold"
                  style={{ 
                    color: activeTab === tab.key ? '#FFFFFF' : colors.text 
                  }}
                >
                  {tab.label}
                </Text>
                {tab.count > 0 && (
                  <View 
                    className="ml-2 px-2 py-0.5 rounded-full"
                    style={{ 
                      backgroundColor: activeTab === tab.key ? '#FFFFFF20' : colors.border 
                    }}
                  >
                    <Text 
                      className="text-xs font-bold"
                      style={{ 
                        color: activeTab === tab.key ? '#FFFFFF' : colors.text 
                      }}
                    >
                      {tab.count}
                    </Text>
                  </View>
                )}
              </View>
            </Pressable>
          ))}
        </ScrollView>

        {/* Content */}
        <ScrollView 
          className="flex-1 px-6" 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {isLoading ? (
            <View className="items-center justify-center py-20">
              <ActivityIndicator size="large" color={colors.primary} />
              <Text className="mt-4" style={{ color: colors.textSecondary }}>
                Loading bookings...
              </Text>
            </View>
          ) : filteredBookings.length === 0 ? (
            <Card variant="default" className="items-center py-12">
              <Ionicons 
                name={
                  activeTab === 'new' ? 'notifications-outline' :
                  activeTab === 'upcoming' ? 'calendar-outline' :
                  activeTab === 'completed' ? 'checkmark-circle-outline' :
                  'close-circle-outline'
                } 
                size={64} 
                color={colors.textSecondary} 
              />
              <Text className="mt-4 text-lg font-bold" style={{ color: colors.text }}>
                {activeTab === 'new' && 'No New Requests'}
                {activeTab === 'upcoming' && 'No Upcoming Bookings'}
                {activeTab === 'completed' && 'No Completed Jobs'}
                {activeTab === 'cancelled' && 'No Cancelled Bookings'}
              </Text>
              <Text className="text-sm mt-2 text-center px-8" style={{ color: colors.textSecondary }}>
                {activeTab === 'new' && "You'll see new booking requests here"}
                {activeTab === 'upcoming' && "Your confirmed bookings will appear here"}
                {activeTab === 'completed' && "Your completed jobs will be listed here"}
                {activeTab === 'cancelled' && "Cancelled bookings history will show here"}
              </Text>
            </Card>
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
                  <Card variant="elevated" className="mb-4">
                    <View className="flex-row justify-between items-start mb-3">
                      <View className="flex-1">
                        <Text className="text-base font-semibold mb-1" style={{ color: colors.text }}>
                          {booking.serviceName}
                        </Text>
                        <View className="flex-row items-center mt-2">
                          {booking.customerPhoto ? (
                            <Image
                              source={{ uri: booking.customerPhoto }}
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
                                {getInitials(booking.customerName)}
                              </Text>
                            </View>
                          )}
                          <Text className="text-sm" style={{ color: colors.textSecondary }}>
                            {booking.customerName}
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
                          className="text-xs font-medium"
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

                    <View className="flex-row items-center mb-3">
                      <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
                      <Text className="text-sm ml-2 flex-1" style={{ color: colors.textSecondary }} numberOfLines={1}>
                        {booking.address.city}, {booking.address.state}
                      </Text>
                    </View>

                    <View className="flex-row justify-between items-center pt-3" style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
                      <Text className="text-lg font-bold" style={{ color: colors.primary }}>
                        ₹{booking.price}
                      </Text>
                      <View className="flex-row items-center">
                        <Text className="text-sm font-medium mr-2" style={{ color: colors.primary }}>
                          {activeTab === 'new' ? 'View Request' : 'View Details'}
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
        </ScrollView>
    </Container>
  );
});

export default ProviderBookingsScreen;

