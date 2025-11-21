import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

type PeriodTab = 'today' | 'week' | 'month' | 'all';

const ProviderEarningsScreen = observer(() => {
  const { colors } = useTheme();
  const [activePeriod, setActivePeriod] = useState<PeriodTab>('today');

  const periods: { key: PeriodTab; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'all', label: 'All Time' },
  ];

  return (
    <Container safeArea edges={['top']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-4 pb-4">
          <Text className="text-2xl font-bold" style={{ color: colors.text }}>
            Earnings
          </Text>
        </View>

        {/* Period Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          className="px-6 mb-6"
        >
          {periods.map((period) => (
            <Pressable
              key={period.key}
              onPress={() => setActivePeriod(period.key)}
              className="mr-3"
            >
              <View
                className="px-5 py-2.5 rounded-full"
                style={{
                  backgroundColor: activePeriod === period.key ? colors.primary : colors.surface,
                }}
              >
                <Text
                  className="font-semibold"
                  style={{ 
                    color: activePeriod === period.key ? '#FFFFFF' : colors.text 
                  }}
                >
                  {period.label}
                </Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>

        {/* Total Earnings Card */}
        <View className="px-6 mb-6">
          <Card variant="elevated" className="items-center py-8">
            <Text className="text-sm mb-2" style={{ color: colors.textSecondary }}>
              Total Earnings ({periods.find(p => p.key === activePeriod)?.label})
            </Text>
            <Text className="text-5xl font-bold" style={{ color: colors.success }}>
              ₹0
            </Text>
            <View className="flex-row items-center mt-2">
              <Ionicons name="trending-up" size={16} color={colors.success} />
              <Text className="text-sm ml-1" style={{ color: colors.success }}>
                +0% from last period
              </Text>
            </View>
          </Card>
        </View>

        {/* Stats Grid */}
        <View className="px-6 mb-6">
          <View className="flex-row gap-3 mb-3">
            <Card variant="default" className="flex-1 p-4">
              <Ionicons name="checkmark-circle" size={24} color={colors.success} />
              <Text className="text-xl font-bold mt-2" style={{ color: colors.text }}>0</Text>
              <Text className="text-xs" style={{ color: colors.textSecondary }}>Jobs Completed</Text>
            </Card>

            <Card variant="default" className="flex-1 p-4">
              <Ionicons name="cash" size={24} color={colors.primary} />
              <Text className="text-xl font-bold mt-2" style={{ color: colors.text }}>₹0</Text>
              <Text className="text-xs" style={{ color: colors.textSecondary }}>Avg. per Job</Text>
            </Card>
          </View>

          <View className="flex-row gap-3">
            <Card variant="default" className="flex-1 p-4">
              <Ionicons name="wallet" size={24} color={colors.warning} />
              <Text className="text-xl font-bold mt-2" style={{ color: colors.text }}>₹0</Text>
              <Text className="text-xs" style={{ color: colors.textSecondary }}>Pending Payout</Text>
            </Card>

            <Card variant="default" className="flex-1 p-4">
              <Ionicons name="card" size={24} color={colors.success} />
              <Text className="text-xl font-bold mt-2" style={{ color: colors.text }}>₹0</Text>
              <Text className="text-xs" style={{ color: colors.textSecondary }}>Paid Out</Text>
            </Card>
          </View>
        </View>

        {/* Payout Button */}
        <View className="px-6 mb-6">
          <Pressable className="active:opacity-70">
            <View 
              className="rounded-xl py-4 items-center"
              style={{ backgroundColor: colors.primary }}
            >
              <View className="flex-row items-center">
                <Ionicons name="download-outline" size={20} color="#FFFFFF" />
                <Text className="ml-2 text-base font-semibold text-white">
                  Request Payout
                </Text>
              </View>
            </View>
          </Pressable>
        </View>

        {/* Transaction History */}
        <View className="px-6 mb-6">
          <Text className="text-lg font-bold mb-3" style={{ color: colors.text }}>
            Transaction History
          </Text>

          <Card variant="default" className="items-center py-8">
            <Ionicons name="receipt-outline" size={48} color={colors.textSecondary} />
            <Text className="mt-4 text-base" style={{ color: colors.textSecondary }}>
              No transactions yet
            </Text>
            <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
              Complete jobs to see earnings
            </Text>
          </Card>
        </View>

        <View className="h-6" />
      </ScrollView>
    </Container>
  );
});

export default ProviderEarningsScreen;

