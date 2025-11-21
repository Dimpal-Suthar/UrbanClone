import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';
import { useTheme } from '@/contexts/ThemeContext';
import { useAllBookings } from '@/hooks/useBookings';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';

type FilterStatus = 'all' | 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';

const AdminBookingsScreen = observer(() => {
  const { colors } = useTheme();
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState<FilterStatus>('all');

  const { data: allBookings = [], isLoading } = useAllBookings();

  // Filter bookings based on selected status
  const filteredBookings = useMemo(() => {
    if (selectedFilter === 'all') return allBookings;
    return allBookings.filter(booking => booking.status === selectedFilter);
  }, [allBookings, selectedFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    return {
      total: allBookings.length,
      pending: allBookings.filter(b => b.status === 'pending').length,
      confirmed: allBookings.filter(b => b.status === 'confirmed').length,
      inProgress: allBookings.filter(b => b.status === 'in-progress').length,
      completed: allBookings.filter(b => b.status === 'completed').length,
      cancelled: allBookings.filter(b => b.status === 'cancelled').length,
    };
  }, [allBookings]);

  const filters: { label: string; value: FilterStatus; count: number; color: string }[] = [
    { label: 'All', value: 'all', count: stats.total, color: colors.primary },
    { label: 'Pending', value: 'pending', count: stats.pending, color: colors.warning },
    { label: 'Confirmed', value: 'confirmed', count: stats.confirmed, color: colors.success },
    { label: 'In Progress', value: 'in-progress', count: stats.inProgress, color: '#9C27B0' },
    { label: 'Completed', value: 'completed', count: stats.completed, color: colors.success },
    { label: 'Cancelled', value: 'cancelled', count: stats.cancelled, color: colors.error },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return colors.warning;
      case 'accepted':
      case 'confirmed': return colors.success;
      case 'on-the-way': return '#2196F3';
      case 'in-progress': return '#9C27B0';
      case 'completed': return colors.success;
      case 'cancelled':
      case 'rejected': return colors.error;
      default: return colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return 'time-outline';
      case 'accepted':
      case 'confirmed': return 'checkmark-circle-outline';
      case 'on-the-way': return 'car-outline';
      case 'in-progress': return 'construct-outline';
      case 'completed': return 'checkmark-done-circle-outline';
      case 'cancelled':
      case 'rejected': return 'close-circle-outline';
      default: return 'help-circle-outline';
    }
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (scheduledSlot?: string) => {
    if (!scheduledSlot) return 'N/A';
    return scheduledSlot.split(' - ')[0];
  };

  const renderBookingItem = ({ item: booking }: { item: typeof filteredBookings[0] }) => (
    <Pressable
      onPress={() => router.push(`/booking/${booking.id}`)}
      className="mb-3 active:opacity-70"
      style={{ paddingHorizontal: 24 }}
    >
      <Card variant="elevated">
        {/* Booking Header */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center flex-1">
            <View
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: `${getStatusColor(booking.status)}20` }}
            >
              <Ionicons 
                name={getStatusIcon(booking.status) as any} 
                size={20} 
                color={getStatusColor(booking.status)} 
              />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-sm font-bold" style={{ color: colors.text }}>
                {booking.serviceName || 'Service'}
              </Text>
              <Text className="text-xs" style={{ color: colors.textSecondary }}>
                Booking #{booking.id.slice(0, 8)}
              </Text>
            </View>
          </View>
          <View
            className="px-3 py-1 rounded-full"
            style={{ backgroundColor: `${getStatusColor(booking.status)}20` }}
          >
            <Text
              className="text-xs font-bold capitalize"
              style={{ color: getStatusColor(booking.status) }}
            >
              {booking.status.replace('_', ' ')}
            </Text>
          </View>
        </View>

        {/* Booking Details */}
        <View className="space-y-2">
          {/* Customer */}
          <View className="flex-row items-center">
            <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
            <Text className="ml-2 text-sm" style={{ color: colors.textSecondary }}>
              Customer ID: {booking.customerId.slice(0, 8)}
            </Text>
          </View>

          {/* Provider */}
          <View className="flex-row items-center">
            <Ionicons name="briefcase-outline" size={16} color={colors.textSecondary} />
            <Text className="ml-2 text-sm" style={{ color: colors.textSecondary }}>
              Provider ID: {booking.providerId.slice(0, 8)}
            </Text>
          </View>

          {/* Date & Time */}
          <View className="flex-row items-center">
            <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
            <Text className="ml-2 text-sm" style={{ color: colors.textSecondary }}>
              {formatDate(booking.scheduledDate)} at {formatTime(booking.scheduledSlot)}
            </Text>
          </View>

          {/* Price */}
          <View className="flex-row items-center justify-between mt-2 pt-2" style={{ borderTopWidth: 1, borderTopColor: `${colors.textSecondary}20` }}>
            <Text className="text-sm font-semibold" style={{ color: colors.text }}>
              Total Amount
            </Text>
            <Text className="text-lg font-bold" style={{ color: colors.primary }}>
              ₹{booking.price || 0}
            </Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );

  const renderListHeader = () => (
    <>
      {/* Header */}
      <View className="px-6 pt-4 pb-4">
        <Text className="text-2xl font-bold mb-1" style={{ color: colors.text }}>
          All Bookings
        </Text>
        <Text className="text-sm" style={{ color: colors.textSecondary }}>
          Manage platform bookings
        </Text>
      </View>

      {/* Stats Summary */}
      <View className="px-6 mb-4">
        <View className="flex-row flex-wrap gap-2">
          <Card variant="elevated" className="px-4 py-2">
            <Text className="text-xs" style={{ color: colors.textSecondary }}>Total</Text>
            <Text className="text-lg font-bold" style={{ color: colors.text }}>{stats.total}</Text>
          </Card>
          <Card variant="elevated" className="px-4 py-2">
            <Text className="text-xs" style={{ color: colors.warning }}>Pending</Text>
            <Text className="text-lg font-bold" style={{ color: colors.warning }}>{stats.pending}</Text>
          </Card>
          <Card variant="elevated" className="px-4 py-2">
            <Text className="text-xs" style={{ color: colors.success }}>Completed</Text>
            <Text className="text-lg font-bold" style={{ color: colors.success }}>{stats.completed}</Text>
          </Card>
          <Card variant="elevated" className="px-4 py-2">
            <Text className="text-xs" style={{ color: colors.error }}>Cancelled</Text>
            <Text className="text-lg font-bold" style={{ color: colors.error }}>{stats.cancelled}</Text>
          </Card>
        </View>
      </View>

      {/* Filters */}
      <View className="mb-4">
        <FlatList
          data={filters}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.value}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}
          renderItem={({ item: filter }) => (
            <Pressable
              onPress={() => setSelectedFilter(filter.value)}
              className="active:opacity-70"
            >
              <View
                className="px-4 py-2 rounded-full flex-row items-center"
                style={{
                  backgroundColor: selectedFilter === filter.value 
                    ? filter.color 
                    : `${filter.color}15`,
                }}
              >
                <Text
                  className="text-sm font-semibold"
                  style={{
                    color: selectedFilter === filter.value ? 'white' : filter.color,
                  }}
                >
                  {filter.label}
                </Text>
                <View
                  className="ml-2 px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: selectedFilter === filter.value 
                      ? 'rgba(255,255,255,0.3)' 
                      : 'rgba(0,0,0,0.1)',
                  }}
                >
                  <Text
                    className="text-xs font-bold"
                    style={{
                      color: selectedFilter === filter.value ? 'white' : filter.color,
                    }}
                  >
                    {filter.count}
                  </Text>
                </View>
              </View>
            </Pressable>
          )}
        />
      </View>
    </>
  );

  const renderListEmpty = () => {
    if (isLoading) {
      return (
        <View className="items-center py-12">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="text-sm mt-4" style={{ color: colors.textSecondary }}>
            Loading bookings...
          </Text>
        </View>
      );
    }

    return (
      <View className="items-center py-12">
        <Ionicons name="calendar-outline" size={64} color={colors.textSecondary} />
        <Text className="text-lg font-semibold mt-4" style={{ color: colors.text }}>
          No {selectedFilter !== 'all' ? selectedFilter : ''} bookings
        </Text>
        <Text className="text-sm mt-2 text-center" style={{ color: colors.textSecondary }}>
          {selectedFilter === 'all' 
            ? 'No bookings have been made yet' 
            : `No ${selectedFilter} bookings found`}
        </Text>
      </View>
    );
  };

  return (
    <Container>
      <FlatList
        data={filteredBookings}
        keyExtractor={(item) => item.id}
        renderItem={renderBookingItem}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderListEmpty}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      />
    </Container>
  );
});

export default AdminBookingsScreen;
