import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';
import { useTheme } from '@/contexts/ThemeContext';
import { RevenueFilter, useAdminStats } from '@/hooks/useAdminStats';
import { formatCurrency } from '@/utils/currencyHelpers';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

const REVENUE_FILTERS: { label: string; value: RevenueFilter }[] = [
  { label: 'All Time', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'This Year', value: 'year' },
];

const AdminDashboard = observer(() => {
  const { colors } = useTheme();
  const router = useRouter();
  const [revenueFilter, setRevenueFilter] = useState<RevenueFilter>('all');
  const { data: stats, isLoading, isLoadingRevenue, isLoadingCounts } = useAdminStats({ revenueFilter });

  return (
    <Container>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-4 pb-6">
          <Text className="text-2xl font-bold" style={{ color: colors.text }}>
            Admin Dashboard
          </Text>
          <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
            Platform Overview
          </Text>
        </View>

        {/* Stats */}
        <View className="px-6 mb-6">
          <View className="flex-row gap-3 mb-3">
            <Card variant="elevated" className="flex-1 p-4">
              <Ionicons name="people" size={32} color={colors.primary} />
              {isLoadingCounts ? (
                <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 8 }} />
              ) : (
                <Text className="text-2xl font-bold mt-2" style={{ color: colors.text }}>
                  {stats?.totalUsers || 0}
                </Text>
              )}
              <Text className="text-sm" style={{ color: colors.textSecondary }}>Total Users</Text>
            </Card>

            <Card variant="elevated" className="flex-1 p-4">
              <Ionicons name="briefcase" size={32} color={colors.success} />
              {isLoadingCounts ? (
                <ActivityIndicator size="small" color={colors.success} style={{ marginTop: 8 }} />
              ) : (
                <Text className="text-2xl font-bold mt-2" style={{ color: colors.text }}>
                  {stats?.totalProviders || 0}
                </Text>
              )}
              <Text className="text-sm" style={{ color: colors.textSecondary }}>Providers</Text>
            </Card>
          </View>

          <View className="flex-row gap-3 mb-3">
            <Card variant="elevated" className="flex-1 p-4">
              <Ionicons name="calendar" size={32} color={colors.warning} />
              {isLoadingCounts ? (
                <ActivityIndicator size="small" color={colors.warning} style={{ marginTop: 8 }} />
              ) : (
                <Text className="text-2xl font-bold mt-2" style={{ color: colors.text }}>
                  {stats?.totalBookings || 0}
                </Text>
              )}
              <Text className="text-sm" style={{ color: colors.textSecondary }}>Bookings</Text>
            </Card>

            <Card variant="elevated" className="flex-1 p-4">
              <Ionicons name="cash" size={32} color={colors.success} />
              {isLoadingRevenue ? (
                <ActivityIndicator size="small" color={colors.success} style={{ marginTop: 8 }} />
              ) : (
                <Text 
                  className="text-xl font-bold mt-2" 
                  style={{ color: colors.text }}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {formatCurrency(stats?.totalRevenue || 0)}
                </Text>
              )}
              <Text className="text-sm" style={{ color: colors.textSecondary }}>Revenue</Text>
            </Card>
          </View>

          {/* Revenue Filter */}
          <View className="mb-2">
            <Text className="text-sm font-semibold mb-2" style={{ color: colors.textSecondary }}>
              Revenue Period:
            </Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {REVENUE_FILTERS.map((filter) => (
                <Pressable
                  key={filter.value}
                  onPress={() => setRevenueFilter(filter.value)}
                  className="px-4 py-2 rounded-full"
                  style={{
                    backgroundColor: revenueFilter === filter.value 
                      ? colors.primary 
                      : colors.border,
                  }}
                >
                  <Text
                    className="text-sm font-medium"
                    style={{
                      color: revenueFilter === filter.value 
                        ? 'white' 
                        : colors.textSecondary,
                    }}
                  >
                    {filter.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="px-6 mb-6">
          <Text className="text-lg font-bold mb-3" style={{ color: colors.text }}>
            Quick Actions
          </Text>

          <Pressable 
            onPress={() => router.push('/(admin)/providers')}
            className="mb-3 active:opacity-70"
          >
            <Card variant="default">
              <View className="flex-row items-center">
                <View 
                  className="w-12 h-12 rounded-full items-center justify-center"
                  style={{ backgroundColor: `${colors.primary}20` }}
                >
                  <Ionicons name="person-add" size={24} color={colors.primary} />
                </View>
                <View className="flex-1 ml-4">
                  <Text className="text-base font-bold mb-1" style={{ color: colors.text }}>
                    Approve Providers
                  </Text>
                  <Text className="text-sm" style={{ color: colors.textSecondary }}>
                    Review pending applications
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </View>
            </Card>
          </Pressable>

          <Pressable 
            onPress={() => router.push('/(admin)/services')}
            className="mb-3 active:opacity-70"
          >
            <Card variant="default">
              <View className="flex-row items-center">
                <View 
                  className="w-12 h-12 rounded-full items-center justify-center"
                  style={{ backgroundColor: `${colors.success}20` }}
                >
                  <Ionicons name="construct" size={24} color={colors.success} />
                </View>
                <View className="flex-1 ml-4">
                  <Text className="text-base font-bold mb-1" style={{ color: colors.text }}>
                    Manage Services
                  </Text>
                  <Text className="text-sm" style={{ color: colors.textSecondary }}>
                    Add or edit services
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </View>
            </Card>
          </Pressable>

          <Pressable 
            onPress={() => router.push('/(admin)/bookings')}
            className="active:opacity-70"
          >
            <Card variant="default">
              <View className="flex-row items-center">
                <View 
                  className="w-12 h-12 rounded-full items-center justify-center"
                  style={{ backgroundColor: `${colors.warning}20` }}
                >
                  <Ionicons name="calendar" size={24} color={colors.warning} />
                </View>
                <View className="flex-1 ml-4">
                  <Text className="text-base font-bold mb-1" style={{ color: colors.text }}>
                    View All Bookings
                  </Text>
                  <Text className="text-sm" style={{ color: colors.textSecondary }}>
                    Monitor platform bookings
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </View>
            </Card>
          </Pressable>
        </View>
      </ScrollView>
    </Container>
  );
});

export default AdminDashboard;

