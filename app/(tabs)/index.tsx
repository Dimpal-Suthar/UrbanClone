import { View, Text, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { CATEGORIES, SAMPLE_SERVICES } from '@/constants/Categories';
import { CategoryCard } from '@/components/CategoryCard';
import { ServiceCard } from '@/components/ServiceCard';
import { Container } from '@/components/ui/Container';
import { useState } from 'react';

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <Container>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-2 pb-6">
          <View className="flex-row items-center justify-between mb-6">
            <View>
              <Text className="text-2xl font-bold" style={{ color: colors.text }}>
                Good Morning! 👋
              </Text>
              <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                What service do you need today?
              </Text>
            </View>
            <View className="w-12 h-12 rounded-full items-center justify-center" style={{ backgroundColor: colors.surface }}>
              <Ionicons name="notifications-outline" size={24} color={colors.text} />
            </View>
          </View>

          {/* Search Bar */}
          <View className="flex-row items-center rounded-xl px-4 py-3 mb-6" style={{ backgroundColor: colors.surface }}>
            <Ionicons name="search" size={20} color={colors.textSecondary} />
            <TextInput
              className="flex-1 ml-3 text-base"
              style={{ color: colors.text }}
              placeholder="Search for services..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery !== '' && (
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} onPress={() => setSearchQuery('')} />
            )}
          </View>

          {/* Location */}
          <View className="flex-row items-center">
            <Ionicons name="location" size={16} color={colors.primary} />
            <Text className="ml-2 text-sm font-medium" style={{ color: colors.text }}>
              Mumbai, Maharashtra
            </Text>
            <Ionicons name="chevron-down" size={16} color={colors.text} style={{ marginLeft: 4 }} />
          </View>
        </View>

        {/* Categories */}
        <View className="mb-6">
          <Text className="text-lg font-bold px-6 mb-4" style={{ color: colors.text }}>
            Categories
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24 }}
            className="gap-4"
          >
            {CATEGORIES.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                onPress={() => console.log(`Selected ${category.name}`)}
              />
            ))}
          </ScrollView>
        </View>

        {/* AI Recommendations */}
        <View className="px-6 py-4 mx-6 rounded-2xl mb-6" style={{ backgroundColor: `${colors.primary}15` }}>
          <View className="flex-row items-center mb-2">
            <Ionicons name="bulb" size={20} color={colors.primary} />
            <Text className="ml-2 text-sm font-semibold" style={{ color: colors.primary }}>
              AI Recommendation for you
            </Text>
          </View>
          <Text className="text-sm" style={{ color: colors.text }}>
            Based on your history, try <Text className="font-semibold">Deep Home Cleaning</Text>
          </Text>
        </View>

        {/* Popular Services */}
        <View className="px-6 mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold" style={{ color: colors.text }}>
              Popular Services
            </Text>
            <Text className="text-sm font-medium" style={{ color: colors.primary }}>
              See All
            </Text>
          </View>
          {SAMPLE_SERVICES.slice(0, 4).map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onPress={() => router.push(`/service/${service.id}`)}
            />
          ))}
        </View>

        {/* Bottom Padding */}
        <View className="h-6" />
      </ScrollView>
    </Container>
  );
}

