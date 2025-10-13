import { View, Text, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Container } from '@/components/ui/Container';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useState } from 'react';

const BOOKING_TABS = ['Upcoming', 'Completed', 'Cancelled'];

const SAMPLE_BOOKINGS = [
  {
    id: '1',
    service: 'Bathroom Deep Cleaning',
    professional: 'Rahul Sharma',
    date: '15 Oct 2025',
    time: '10:00 AM',
    status: 'confirmed',
    price: 499,
  },
  {
    id: '2',
    service: 'AC Service & Repair',
    professional: 'Sanjay Verma',
    date: '18 Oct 2025',
    time: '02:00 PM',
    status: 'pending',
    price: 699,
  },
];

export default function BookingsScreen() {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState('Upcoming');

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
        {SAMPLE_BOOKINGS.map((booking) => (
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
        ))}
        <View className="h-6" />
      </ScrollView>
    </Container>
  );
}

