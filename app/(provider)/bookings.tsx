import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

type BookingTab = 'new' | 'upcoming' | 'completed' | 'cancelled';

const ProviderBookingsScreen = observer(() => {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<BookingTab>('new');

  const tabs: { key: BookingTab; label: string; count: number }[] = [
    { key: 'new', label: 'New', count: 0 },
    { key: 'upcoming', label: 'Upcoming', count: 0 },
    { key: 'completed', label: 'Completed', count: 0 },
    { key: 'cancelled', label: 'Cancelled', count: 0 },
  ];

  return (
    <Container>
      <View className="flex-1">
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
          className="px-6 mb-4"
        >
          {tabs.map((tab) => (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              className="mr-3"
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
        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          {/* Empty State */}
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

          <View className="h-6" />
        </ScrollView>
      </View>
    </Container>
  );
});

export default ProviderBookingsScreen;

