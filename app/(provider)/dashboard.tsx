import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { observer } from 'mobx-react-lite';
import { Pressable, ScrollView, Text, View } from 'react-native';

const ProviderDashboard = observer(() => {
  const { colors } = useTheme();
  const { userProfile } = useAuth();

  return (
    <Container>
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
            <Card variant="elevated" className="flex-1 p-4">
              <Ionicons name="calendar-outline" size={28} color={colors.primary} />
              <Text className="text-2xl font-bold mt-2" style={{ color: colors.text }}>0</Text>
              <Text className="text-xs" style={{ color: colors.textSecondary }}>Today's Bookings</Text>
            </Card>

            <Card variant="elevated" className="flex-1 p-4">
              <Ionicons name="checkmark-circle-outline" size={28} color={colors.success} />
              <Text className="text-2xl font-bold mt-2" style={{ color: colors.text }}>0</Text>
              <Text className="text-xs" style={{ color: colors.textSecondary }}>Completed</Text>
            </Card>
          </View>

          <View className="flex-row gap-3">
            <Card variant="elevated" className="flex-1 p-4">
              <Ionicons name="cash-outline" size={28} color={colors.warning} />
              <Text className="text-2xl font-bold mt-2" style={{ color: colors.text }}>₹0</Text>
              <Text className="text-xs" style={{ color: colors.textSecondary }}>Today's Earnings</Text>
            </Card>

            <Card variant="elevated" className="flex-1 p-4">
              <Ionicons name="star" size={28} color="#FFD700" />
              <Text className="text-2xl font-bold mt-2" style={{ color: colors.text }}>0.0</Text>
              <Text className="text-xs" style={{ color: colors.textSecondary }}>Rating</Text>
            </Card>
          </View>
        </View>

        {/* Today's Schedule */}
        <View className="px-6 mb-6">
          <Text className="text-lg font-bold mb-3" style={{ color: colors.text }}>
            Today's Schedule
          </Text>

          <Card variant="default" className="items-center py-8">
            <Ionicons name="calendar-outline" size={48} color={colors.textSecondary} />
            <Text className="mt-4 text-base" style={{ color: colors.textSecondary }}>
              No bookings for today
            </Text>
            <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
              You're all caught up!
            </Text>
          </Card>
        </View>

        {/* Quick Actions */}
        <View className="px-6 mb-6">
          <Text className="text-lg font-bold mb-3" style={{ color: colors.text }}>
            Quick Actions
          </Text>

          <Pressable className="mb-3 active:opacity-70">
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
                    Manage your working hours
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </View>
            </Card>
          </Pressable>

          <Pressable className="mb-3 active:opacity-70">
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

          <Pressable className="active:opacity-70">
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

