import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { useProviderBookings } from '@/hooks/useBookings';
import { useProviderStats } from '@/hooks/useProviderStats';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

const ProviderDashboard = observer(() => {
  const { colors } = useTheme();
  const { userProfile, user } = useAuth();
  const router = useRouter();
  const { stats, isLoading } = useProviderStats();
  const {
    data: providerBookings = [],
    isLoading: loadingProviderBookings,
  } = useProviderBookings(user?.uid || null);

  const todaysBookingsList = useMemo(() => {
    if (!providerBookings?.length) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const toMinutes = (timeString?: string) => {
      if (!timeString) return Number.MAX_SAFE_INTEGER;
      const [timePart, modifier] = timeString.split(' ');
      const [rawHour, rawMinute] = timePart.split(':').map(Number);
      let hours = rawHour % 12;
      if (modifier?.toUpperCase() === 'PM') hours += 12;
      if (modifier?.toUpperCase() === 'AM' && rawHour === 12) hours = 0;
      return hours * 60 + (rawMinute || 0);
    };

    const getBookingDateStr = (scheduledDate: any): string => {
      if (!scheduledDate) return '';
      
      // Handle Firestore Timestamp
      if (scheduledDate?.toDate) {
        return scheduledDate.toDate().toISOString().split('T')[0];
      }
      
      // Handle Date object
      if (scheduledDate instanceof Date) {
        return scheduledDate.toISOString().split('T')[0];
      }
      
      // Handle string (ISO format or date string)
      if (typeof scheduledDate === 'string') {
        // If it's already in YYYY-MM-DD format
        if (scheduledDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return scheduledDate;
        }
        // If it's ISO string, extract date part
        if (scheduledDate.includes('T')) {
          return scheduledDate.split('T')[0];
        }
        // Try to parse as date
        try {
          return new Date(scheduledDate).toISOString().split('T')[0];
        } catch {
          return '';
        }
      }
      
      return '';
    };

    return providerBookings
      .filter((booking) => {
        const bookingDateStr = getBookingDateStr(booking.scheduledDate);
        return (
          bookingDateStr === todayStr &&
          !['cancelled', 'rejected'].includes(booking.status)
        );
      })
      .sort((a, b) => toMinutes(a.scheduledTime) - toMinutes(b.scheduledTime));
  }, [providerBookings]);

  const hasTodaysBookings = todaysBookingsList.length > 0;
  const scheduleLoading = isLoading || loadingProviderBookings;

  return (
    <Container safeArea edges={['top']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-4 pb-6">
          <Text className="text-sm" style={{ color: colors.textSecondary }}>
            Welcome back,
          </Text>
          <Text className="text-2xl font-bold" style={{ color: colors.text }}>
            {userProfile?.displayName || 'Provider'}
          </Text>
          <View className="flex-row items-center mt-2">
            <View 
              className="px-3 py-1 rounded-full"
              style={{ backgroundColor: `${colors.success}20` }}
            >
              <Text className="text-xs font-bold" style={{ color: colors.success }}>
                ● ACTIVE
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View className="px-6 mb-6">
          <View className="flex-row gap-3 mb-3">
            <Pressable 
              className="flex-1 active:opacity-70"
              onPress={() => router.push({
                pathname: '/(provider)/(tabs)/bookings',
                params: { filter: 'today' },
              })}
            >
              <Card variant="elevated" className="p-4">
                <Ionicons name="calendar-outline" size={28} color={colors.primary} />
                {isLoading ? (
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 8 }} />
                ) : (
                  <Text className="text-2xl font-bold mt-2" style={{ color: colors.text }}>
                    {stats?.todaysBookings || 0}
                  </Text>
                )}
                <Text className="text-xs" style={{ color: colors.textSecondary }}>Today's Bookings</Text>
              </Card>
            </Pressable>

            <Pressable 
              className="flex-1 active:opacity-70"
              onPress={() => router.push({
                pathname: '/(provider)/(tabs)/bookings',
                params: { filter: 'completed' },
              })}
            >
              <Card variant="elevated" className="p-4">
                <Ionicons name="checkmark-circle-outline" size={28} color={colors.success} />
                {isLoading ? (
                  <ActivityIndicator size="small" color={colors.success} style={{ marginTop: 8 }} />
                ) : (
                  <Text className="text-2xl font-bold mt-2" style={{ color: colors.text }}>
                    {stats?.completedBookings || 0}
                  </Text>
                )}
                <Text className="text-xs" style={{ color: colors.textSecondary }}>Completed</Text>
              </Card>
            </Pressable>
          </View>

          <View className="flex-row gap-3">
            <Pressable 
              className="flex-1 active:opacity-70"
              onPress={() => router.push('/(provider)/(tabs)/earnings')}
            >
              <Card variant="elevated" className="p-4">
                <Ionicons name="cash-outline" size={28} color={colors.warning} />
                {isLoading ? (
                  <ActivityIndicator size="small" color={colors.warning} style={{ marginTop: 8 }} />
                ) : (
                  <Text className="text-2xl font-bold mt-2" style={{ color: colors.text }}>
                    ₹{stats?.totalEarnings || 0}
                  </Text>
                )}
                <Text className="text-xs" style={{ color: colors.textSecondary }}>Total Earnings</Text>
              </Card>
            </Pressable>

            <Pressable 
              className="flex-1 active:opacity-70"
              onPress={() => {
                if (user?.uid) {
                  router.push(`/provider/reviews/${user.uid}`);
                }
              }}
            >
              <Card variant="elevated" className="p-4">
                <Ionicons name="star" size={28} color="#FFD700" />
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFD700" style={{ marginTop: 8 }} />
                ) : (
                  <Text className="text-2xl font-bold mt-2" style={{ color: colors.text }}>
                    {stats?.averageRating?.toFixed(1) || '0.0'}
                  </Text>
                )}
                <Text className="text-xs" style={{ color: colors.textSecondary }}>Rating</Text>
              </Card>
            </Pressable>
          </View>
        </View>

        {/* Today's Schedule */}
        <View className="px-6 mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold" style={{ color: colors.text }}>
              Today's Schedule
            </Text>
            {hasTodaysBookings && (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/(provider)/(tabs)/bookings',
                    params: { filter: 'today' },
                  })
                }
                className="active:opacity-70"
              >
                <Text className="text-sm font-semibold" style={{ color: colors.primary }}>
                  View All
                </Text>
              </Pressable>
            )}
          </View>

          {scheduleLoading ? (
            <Card variant="default" className="items-center py-8">
              <ActivityIndicator size="small" color={colors.primary} />
              <Text className="text-sm mt-3" style={{ color: colors.textSecondary }}>
                Loading schedule...
              </Text>
            </Card>
          ) : !hasTodaysBookings ? (
            <Card variant="default" className="items-center py-8">
              <Ionicons name="calendar-outline" size={48} color={colors.textSecondary} />
              <Text className="mt-4 text-base" style={{ color: colors.textSecondary }}>
                No bookings for today
              </Text>
              <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                Enjoy your downtime or update your availability.
              </Text>
            </Card>
          ) : (
            <Card variant="default" className="p-4">
              <View className="flex-row items-center mb-4">
                <Ionicons name="calendar" size={20} color={colors.primary} />
                <Text className="text-base font-semibold ml-2" style={{ color: colors.text }}>
                  {stats?.todaysBookings || todaysBookingsList.length}{' '}
                  {(stats?.todaysBookings || todaysBookingsList.length) === 1
                    ? 'Booking'
                    : 'Bookings'}{' '}
                  Today
                </Text>
              </View>

              {todaysBookingsList.slice(0, 3).map((booking, index) => {
                const scheduleLabel = booking.scheduledTime || booking.scheduledSlot;
                const locationLabel = booking.address?.city || booking.address?.street || 'On-site service';
                const statusLabel = booking.status.replace(/-/g, ' ');
                const isLast = index === Math.min(todaysBookingsList.length, 3) - 1;

                return (
                  <View
                    key={booking.id}
                    style={{
                      flexDirection: 'row',
                      marginBottom: isLast ? 0 : 12,
                    }}
                  >
                    <View style={{ alignItems: 'center', marginRight: 12 }}>
                      <View
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: colors.primary,
                        }}
                      />
                      {!isLast && (
                        <View
                          style={{
                            width: 2,
                            flex: 1,
                            backgroundColor: `${colors.primary}40`,
                            marginTop: 4,
                          }}
                        />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: '600',
                          color: colors.text,
                        }}
                      >
                        {booking.customerName || 'Customer'}
                      </Text>
                      <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
                        {scheduleLabel} • {locationLabel}
                      </Text>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          marginTop: 6,
                          justifyContent: 'space-between',
                        }}
                      >
                        <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                          {booking.serviceName}
                        </Text>
                        <View
                          style={{
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderRadius: 12,
                            backgroundColor: `${colors.primary}15`,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: '600',
                              color: colors.primary,
                              textTransform: 'capitalize',
                            }}
                          >
                            {statusLabel}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}

              {todaysBookingsList.length > 3 && (
                <Text
                  className="mt-3 text-xs font-semibold"
                  style={{ color: colors.textSecondary }}
                >
                  +{todaysBookingsList.length - 3} more scheduled later today
                </Text>
              )}

              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/(provider)/(tabs)/bookings',
                    params: { filter: 'today' },
                  })
                }
                className="mt-4 py-2 rounded-lg active:opacity-70"
                style={{ backgroundColor: `${colors.primary}10` }}
              >
                <Text className="text-sm font-semibold text-center" style={{ color: colors.primary }}>
                  Manage Today's Bookings →
                </Text>
              </Pressable>
            </Card>
          )}
        </View>

        {/* Quick Actions */}
        <View className="px-6 mb-6">
          <Text className="text-lg font-bold mb-3" style={{ color: colors.text }}>
            Quick Actions
          </Text>

          <Pressable 
            className="mb-3 active:opacity-70"
            onPress={() => router.push('/(provider)/availability')}
          >
            <Card variant="default">
              <View className="flex-row items-center">
                <View 
                  className="w-12 h-12 rounded-full items-center justify-center"
                  style={{ backgroundColor: `${colors.primary}20` }}
                >
                  <Ionicons name="time-outline" size={24} color={colors.primary} />
                </View>
                <View className="flex-1 ml-4">
                  <Text className="text-base font-bold" style={{ color: colors.text }}>
                    Set Availability
                  </Text>
                  <Text className="text-sm" style={{ color: colors.textSecondary }}>
                    Set custom hours to get more bookings
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </View>
            </Card>
          </Pressable>

          <Pressable 
            className="mb-3 active:opacity-70"
            onPress={() => router.push('/(provider)/(tabs)/services')}
          >
            <Card variant="default">
              <View className="flex-row items-center">
                <View 
                  className="w-12 h-12 rounded-full items-center justify-center"
                  style={{ backgroundColor: `${colors.success}20` }}
                >
                  <Ionicons name="construct-outline" size={24} color={colors.success} />
                </View>
                <View className="flex-1 ml-4">
                  <Text className="text-base font-bold" style={{ color: colors.text }}>
                    My Services
                  </Text>
                  <Text className="text-sm" style={{ color: colors.textSecondary }}>
                    View and manage services
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </View>
            </Card>
          </Pressable>

          <Pressable 
            className="active:opacity-70"
            onPress={() => router.push('/(provider)/(tabs)/earnings')}
          >
            <Card variant="default">
              <View className="flex-row items-center">
                <View 
                  className="w-12 h-12 rounded-full items-center justify-center"
                  style={{ backgroundColor: `${colors.warning}20` }}
                >
                  <Ionicons name="cash-outline" size={24} color={colors.warning} />
                </View>
                <View className="flex-1 ml-4">
                  <Text className="text-base font-bold" style={{ color: colors.text }}>
                    Earnings Report
                  </Text>
                  <Text className="text-sm" style={{ color: colors.textSecondary }}>
                    View detailed earnings
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </View>
            </Card>
          </Pressable>
        </View>

        <View className="h-6" />
      </ScrollView>
    </Container>
  );
});

export default ProviderDashboard;

