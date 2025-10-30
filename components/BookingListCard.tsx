import { Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Card } from '@/components/ui/Card';
import { BookingStatus } from '@/types';
import { useUserProfile, useUserProfileRealtime } from '@/hooks/useUserProfile';

interface BookingListCardProps {
  booking: any;
  showProvider?: boolean; // true for customer bookings, false for provider bookings
}

export const BookingListCard = ({ booking, showProvider = true }: BookingListCardProps) => {
  const router = useRouter();
  const { colors } = useTheme();
  
  // Fetch fresh user data instead of using stale booking data
  const userId = showProvider ? booking.providerId : booking.customerId;
  const { data: userProfile } = useUserProfile(userId || null);
  useUserProfileRealtime(userId || null);
  
  // Use fresh data with fallback to booking data
  const userName = userProfile?.displayName || (showProvider ? booking.providerName : booking.customerName);
  const userPhoto = userProfile?.photoURL || (showProvider ? booking.providerPhoto : booking.customerPhoto);
  
  const dateObj = new Date(booking.scheduledDate);
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
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
    <Pressable
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
              {userPhoto ? (
                <Image
                  source={{ uri: userPhoto }}
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
                    {getInitials(userName)}
                  </Text>
                </View>
              )}
              <Text className="text-sm" style={{ color: colors.textSecondary }}>
                {userName}
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

        <View className="flex-row items-center justify-between">
          <Text className="text-base font-bold" style={{ color: colors.primary }}>
            ₹{booking.price}
          </Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </View>
      </Card>
    </Pressable>
  );
};

