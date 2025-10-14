import { ServiceCard } from '@/components/ServiceCard';
import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';
import { SERVICE_CATEGORIES } from '@/constants/ServiceCategories';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { useActiveServices } from '@/hooks/useServices';
import { ServiceCategory } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

const HomeScreen = observer(() => {
  const router = useRouter();
  const { colors } = useTheme();
  const { userProfile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
  
  // Fetch active services
  const { data: services = [], isLoading } = useActiveServices();

  // Filter services based on search and category
  const filteredServices = services.filter((service) => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleCategoryPress = (categoryId: ServiceCategory) => {
    setSelectedCategory(selectedCategory === categoryId ? null : categoryId);
  };

  const handleServicePress = (serviceId: string) => {
    router.push(`/service/${serviceId}`);
  };

  return (
    <Container>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-2 pb-6">
          <View className="flex-row items-center justify-between mb-6">
            <View>
              <Text className="text-2xl font-bold" style={{ color: colors.text }}>
                {getGreeting()}! 👋
              </Text>
              <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                Hi {userProfile?.displayName || 'there'}, what service do you need?
              </Text>
            </View>
            <Pressable
              onPress={() => {/* Navigate to notifications */}}
              className="w-12 h-12 rounded-full items-center justify-center active:opacity-70"
              style={{ backgroundColor: colors.surface }}
            >
              <Ionicons name="notifications-outline" size={24} color={colors.text} />
            </Pressable>
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
              <Pressable onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
              </Pressable>
            )}
          </View>

          {/* Location */}
          <Pressable className="flex-row items-center active:opacity-70">
            <Ionicons name="location" size={16} color={colors.primary} />
            <Text className="ml-2 text-sm font-medium" style={{ color: colors.text }}>
              {userProfile?.city || 'Select Location'}
            </Text>
            <Ionicons name="chevron-down" size={16} color={colors.text} style={{ marginLeft: 4 }} />
          </Pressable>
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
            className="gap-3"
          >
            {SERVICE_CATEGORIES.map((category) => (
              <Pressable
                key={category.id}
                onPress={() => handleCategoryPress(category.id)}
                className="mr-3 active:opacity-70"
              >
                <View
                  className="w-24 rounded-2xl p-4 items-center"
                  style={{
                    backgroundColor: selectedCategory === category.id ? `${category.color}20` : colors.surface,
                    borderWidth: 2,
                    borderColor: selectedCategory === category.id ? category.color : 'transparent',
                  }}
                >
                  <View
                    className="w-14 h-14 rounded-full items-center justify-center mb-2"
                    style={{ backgroundColor: `${category.color}20` }}
                  >
                    <Ionicons name={category.icon as any} size={28} color={category.color} />
                  </View>
                  <Text
                    className="text-xs font-semibold text-center"
                    style={{ color: colors.text }}
                    numberOfLines={2}
                  >
                    {category.name}
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Selected Category Indicator */}
        {selectedCategory && (
          <View className="px-6 mb-4">
            <Card variant="default" className="flex-row items-center justify-between py-2 px-3">
              <View className="flex-row items-center">
                <Text className="text-sm font-medium" style={{ color: colors.text }}>
                  Filtered by:
                </Text>
                <View
                  className="ml-2 px-3 py-1 rounded-full"
                  style={{ backgroundColor: `${colors.primary}20` }}
                >
                  <Text className="text-sm font-bold" style={{ color: colors.primary }}>
                    {SERVICE_CATEGORIES.find(c => c.id === selectedCategory)?.name}
                  </Text>
                </View>
              </View>
              <Pressable onPress={() => setSelectedCategory(null)}>
                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
              </Pressable>
            </Card>
          </View>
        )}

        {/* Services */}
        <View className="px-6 mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold" style={{ color: colors.text }}>
              {searchQuery ? 'Search Results' : selectedCategory ? 'Filtered Services' : 'Available Services'}
            </Text>
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              {filteredServices.length} {filteredServices.length === 1 ? 'service' : 'services'}
            </Text>
          </View>

          {isLoading ? (
            <View className="items-center py-12">
              <ActivityIndicator size="large" color={colors.primary} />
              <Text className="mt-4" style={{ color: colors.textSecondary }}>
                Loading services...
              </Text>
            </View>
          ) : filteredServices.length === 0 ? (
            <Card variant="default" className="items-center py-8">
              <Ionicons
                name={searchQuery ? 'search-outline' : 'construct-outline'}
                size={48}
                color={colors.textSecondary}
              />
              <Text className="mt-4 text-base font-medium" style={{ color: colors.text }}>
                {searchQuery ? 'No services found' : 'No services available'}
              </Text>
              <Text className="text-sm mt-1 text-center px-8" style={{ color: colors.textSecondary }}>
                {searchQuery
                  ? 'Try searching with different keywords'
                  : 'Check back later for new services'}
              </Text>
              {(searchQuery || selectedCategory) && (
                <Pressable
                  onPress={() => {
                    setSearchQuery('');
                    setSelectedCategory(null);
                  }}
                  className="mt-4 px-6 py-2 rounded-full active:opacity-70"
                  style={{ backgroundColor: `${colors.primary}20` }}
                >
                  <Text className="font-semibold" style={{ color: colors.primary }}>
                    Clear Filters
                  </Text>
                </Pressable>
              )}
            </Card>
          ) : (
            filteredServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onPress={() => handleServicePress(service.id)}
              />
            ))
          )}
        </View>

        <View className="h-6" />
      </ScrollView>
    </Container>
  );
});

export default HomeScreen;
