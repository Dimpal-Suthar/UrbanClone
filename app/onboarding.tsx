import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Dimensions, FlatList, Pressable, Text, View } from 'react-native';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    icon: 'home-outline',
    title: 'Book 100+ Home Services',
    description: 'From cleaning to repairs, beauty to appliance services - we have it all',
  },
  {
    id: '2',
    icon: 'shield-checkmark-outline',
    title: 'Trusted Professionals',
    description: 'All our professionals are verified, trained, and background checked',
  },
  {
    id: '3',
    icon: 'star-outline',
    title: 'Top Rated Quality',
    description: 'Enjoy best-in-class service with transparent pricing and guarantee',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      console.log('✅ Onboarding complete, going to phone auth');
      router.replace('/auth/phone'); // Go to phone auth
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      router.replace('/auth/phone');
    }
  };

  const renderSlide = ({ item }: { item: typeof SLIDES[0] }) => (
    <View style={{ width }} className="flex-1 justify-center items-center px-8">
      {/* Icon */}
      <View 
        className="w-40 h-40 rounded-full items-center justify-center mb-12"
        style={{ backgroundColor: `${colors.primary}15` }}
      >
        <Ionicons name={item.icon as any} size={80} color={colors.primary} />
      </View>

      {/* Title */}
      <Text 
        className="text-3xl font-bold text-center mb-4"
        style={{ color: colors.text }}
      >
        {item.title}
      </Text>

      {/* Description */}
      <Text 
        className="text-base text-center leading-6"
        style={{ color: colors.textSecondary }}
      >
        {item.description}
      </Text>
    </View>
  );

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Skip Button */}
      {currentIndex < SLIDES.length - 1 && (
        <Pressable 
          onPress={handleSkip}
          className="absolute top-16 right-6 z-10 px-4 py-2"
        >
          <Text className="text-base font-semibold" style={{ color: colors.primary }}>
            Skip
          </Text>
        </Pressable>
      )}

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        scrollEnabled={true}
      />

      {/* Bottom Section */}
      <View className="pb-12 px-6">
        {/* Pagination Dots */}
        <View className="flex-row justify-center mb-8">
          {SLIDES.map((_, index) => (
            <View
              key={index}
              className="h-2 rounded-full mx-1"
              style={{
                width: currentIndex === index ? 24 : 8,
                backgroundColor: currentIndex === index ? colors.primary : colors.border,
              }}
            />
          ))}
        </View>

        {/* Next/Get Started Button */}
        <Pressable
          onPress={handleNext}
          className="w-full rounded-xl py-4 items-center active:opacity-80"
          style={{ backgroundColor: colors.primary }}
        >
          <Text className="text-white text-lg font-semibold">
            {currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

