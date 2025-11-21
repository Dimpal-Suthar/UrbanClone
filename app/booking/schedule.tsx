import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { useTheme } from '@/contexts/ThemeContext';
import { useAvailableSlots } from '@/hooks/useAvailability';
import { useProvidersForService } from '@/hooks/useProviders';
import { useService } from '@/hooks/useServices';
import { TimeSlot } from '@/types';
import { showWarningMessage } from '@/utils/toast';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// All possible time slots (will be filtered based on provider availability)
const ALL_TIME_SLOTS: TimeSlot[] = [
  '08:00 AM - 09:00 AM',
  '09:00 AM - 10:00 AM',
  '10:00 AM - 11:00 AM',
  '11:00 AM - 12:00 PM',
  '12:00 PM - 01:00 PM',
  '01:00 PM - 02:00 PM',
  '02:00 PM - 03:00 PM',
  '03:00 PM - 04:00 PM',
  '04:00 PM - 05:00 PM',
  '05:00 PM - 06:00 PM',
  '06:00 PM - 07:00 PM',
  '07:00 PM - 08:00 PM',
];

export default function ScheduleBookingScreen() {
  const { serviceId, providerId: preselectedProviderId } = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [selectedProviderId, setSelectedProviderId] = useState<string>(
    (preselectedProviderId as string) || ''
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  const { data: service, isLoading: loadingService } = useService(serviceId as string);
  const { data: providers = [], isLoading: loadingProviders } = useProvidersForService(
    serviceId as string
  );

  // Auto-select first provider if none preselected and providers are loaded
  // Use a ref to prevent multiple auto-selections
  const hasAutoSelected = React.useRef(false);
  React.useEffect(() => {
    if (!selectedProviderId && providers.length > 0 && !hasAutoSelected.current) {
      console.log('🔧 Auto-selecting first provider:', providers[0].id);
      setSelectedProviderId(providers[0].id);
      hasAutoSelected.current = true;
    }
  }, [providers.length, selectedProviderId]);

  // Get available slots for selected provider and date
  const { data: availabilityCheck, isLoading: loadingAvailability } = useAvailableSlots(
    selectedProviderId || null,
    selectedDate
  );

  // Debug logging
  React.useEffect(() => {
    if (selectedProviderId && selectedDate) {
      console.log('🔍 Booking Schedule Debug:');
      console.log('  selectedProviderId:', selectedProviderId);
      console.log('  selectedDate:', selectedDate);
      console.log('  availabilityCheck:', availabilityCheck);
      console.log('  loadingAvailability:', loadingAvailability);
    }
  }, [selectedProviderId, selectedDate, availabilityCheck, loadingAvailability]);

  // Generate next 7 days for date selection
  const getNextDays = (count: number) => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to midnight
    for (let i = 0; i < count; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      date.setHours(0, 0, 0, 0); // Ensure each date is at midnight
      days.push(date);
    }
    console.log('📅 Generated dates:', days.map(d => ({ date: d.toISOString(), local: d.toString() })));
    return days;
  };

  const dates = getNextDays(7);

  const handleContinue = () => {
    if (!selectedProviderId) {
      showWarningMessage('Select Professional', 'Please select a professional to continue');
      return;
    }
    if (!selectedDate) {
      showWarningMessage('Select Date', 'Please select a date for the service');
      return;
    }
    if (!selectedSlot) {
      showWarningMessage('Select Time', 'Please select a time slot for the service');
      return;
    }

    // Navigate to address screen with booking data
      router.push({
      pathname: '/booking/address',
      params: {
        serviceId: serviceId as string,
        providerId: selectedProviderId,
        scheduledDate: selectedDate.toISOString().split('T')[0], // Store only date part: YYYY-MM-DD
        scheduledSlot: selectedSlot,
      },
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (date: Date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return {
      day: days[date.getDay()],
      date: date.getDate(),
      month: months[date.getMonth()],
    };
  };

  if (loadingService || loadingProviders) {
    return (
      <Container safeArea edges={['top']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-4 text-base" style={{ color: colors.textSecondary }}>
            Loading booking details...
          </Text>
        </View>
      </Container>
    );
  }

  if (!service) {
    return (
      <Container safeArea edges={['top']}>
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="alert-circle-outline" size={64} color={colors.textSecondary} />
          <Text className="mt-4 text-xl font-bold text-center" style={{ color: colors.text }}>
            Service Not Found
          </Text>
          <Button title="Go Back" onPress={() => router.back()} variant="outline" className="mt-6" />
        </View>
      </Container>
    );
  }

  const selectedProvider = providers.find(p => p.id === selectedProviderId);
  const price = selectedProvider?.offering?.customPrice || service.basePrice;

  return (
    <Container safeArea edges={['top']}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.background,
        }}
      >
        <Pressable 
          onPress={() => router.back()} 
          style={{ padding: 8, marginRight: 8 }}
          className="active:opacity-70"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>
            Book {service.name}
          </Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
            Step 1 of 3 - Select Details
          </Text>
        </View>
      </View>

      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-5 pt-5">
          {/* Step 1: Select Professional */}
          <View className="mb-6">
            <Text className="text-xl font-bold mb-4" style={{ color: colors.text }}>
              1. Select Professional
            </Text>

            {providers.length === 0 ? (
              <View className="items-center py-8 px-6 rounded-2xl" style={{ backgroundColor: colors.background }}>
                <Ionicons name="person-outline" size={48} color={colors.textSecondary} />
                <Text className="mt-2 text-base" style={{ color: colors.text }}>
                  No professionals available
                </Text>
              </View>
            ) : (
              providers.map(provider => {
                const providerName =
                  provider.name || provider.displayName || provider.email?.split('@')[0] || 'Professional';
                const isSelected = selectedProviderId === provider.id;

                return (
                  <Pressable
                    key={provider.id}
                    onPress={() => setSelectedProviderId(provider.id)}
                    className="active:opacity-70"
                  >
                    <View
                      className="mb-4 p-5 rounded-2xl"
                      style={{
                        borderWidth: isSelected ? 2 : 0,
                        borderColor: isSelected ? colors.primary : 'transparent',
                        backgroundColor: colors.background,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.08,
                        shadowRadius: 12,
                        elevation: 3,
                      }}
                    >
                      <View className="flex-row items-center">
                        {provider.photoURL ? (
                          <Image
                            source={{ uri: provider.photoURL }}
                            className="w-14 h-14 rounded-full"
                          />
                        ) : (
                          <View
                            className="w-14 h-14 rounded-full items-center justify-center"
                            style={{ backgroundColor: colors.primary }}
                          >
                            <Text className="text-white font-bold text-lg">
                              {getInitials(providerName)}
                            </Text>
                          </View>
                        )}
                        <View className="flex-1 ml-4">
                          <Text className="text-base font-semibold mb-1" style={{ color: colors.text }}>
                            {providerName}
                          </Text>
                          <View className="flex-row items-center mb-1">
                            <Ionicons name="star" size={14} color="#FFB800" />
                            <Text className="text-sm ml-1" style={{ color: colors.text }}>
                              {provider.rating?.toFixed(1) || '0.0'}
                            </Text>
                            <Text className="text-xs ml-2" style={{ color: colors.textSecondary }}>
                              ({provider.reviewCount || 0} reviews)
                            </Text>
                          </View>
                          <Text className="text-xs" style={{ color: colors.textSecondary }}>
                            {provider.experience || 0} years experience • {provider.completedJobs || 0} jobs
                          </Text>
                        </View>
                        {isSelected && (
                          <View
                            className="w-6 h-6 rounded-full items-center justify-center"
                            style={{ backgroundColor: colors.primary }}
                          >
                            <Ionicons name="checkmark" size={16} color="white" />
                          </View>
                        )}
                      </View>
                    </View>
                  </Pressable>
                );
              })
            )}
          </View>

          {/* Step 2: Select Date */}
          <View className="mb-6">
            <Text className="text-xl font-bold mb-4" style={{ color: colors.text }}>
              2. Select Date
            </Text>

            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 4 }}
            >
              {dates.map((date, index) => {
                const formatted = formatDate(date);
                const isSelected = selectedDate?.toDateString() === date.toDateString();
                const isToday = index === 0;

                return (
                  <Pressable
                    key={index}
                    onPress={() => {
                      const normalizedDate = new Date(date);
                      normalizedDate.setHours(0, 0, 0, 0); // Ensure midnight
                      console.log('🎯 Date clicked:', {
                        original: date.toISOString(),
                        normalized: normalizedDate.toISOString(),
                        localTime: normalizedDate.toString(),
                        isToday: index === 0
                      });
                      setSelectedDate(normalizedDate);
                      setSelectedSlot(null); // Reset slot selection
                    }}
                    className="active:opacity-70 mr-3 py-1"
                  >
                    <View
                      className="px-10 py-3 items-center justify-center rounded-xl"
                      style={{
                        borderWidth: isSelected ? 2 : 0,
                        borderColor: isSelected ? colors.primary : 'transparent',
                        backgroundColor:  colors.background,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.06,
                        shadowRadius: 8,
                        elevation: 2,
                      }}
                    >
                      <Text
                        className="text-[11px] font-semibold mb-0.5"
                        style={{ color: isSelected ? colors.primary : colors.textSecondary }}
                      >
                        {formatted.day}
                      </Text>
                      <Text
                        className="text-xl font-bold mb-0.5"
                        style={{ color: isSelected ? colors.primary : colors.text }}
                      >
                        {formatted.date}
                      </Text>
                      <Text
                        className="text-[10px] font-medium"
                        style={{ color: isSelected ? colors.primary : colors.textSecondary }}
                      >
                        {formatted.month}
                      </Text>
                      {isToday && (
                        <View
                          className="absolute top-1 right-1 h-2 w-2 rounded-full"
                          style={{ backgroundColor: colors.success }}
                        >
                        </View>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Step 3: Select Time Slot */}
          <View className="mb-6">
            <Text className="text-xl font-bold mb-4" style={{ color: colors.text }}>
              3. Select Time Slot
            </Text>

            {loadingAvailability ? (
              <View className="items-center py-8">
                <ActivityIndicator size="small" color={colors.primary} />
                <Text className="text-sm mt-2" style={{ color: colors.textSecondary }}>
                  Loading available slots...
                </Text>
              </View>
            ) : !selectedProviderId || !selectedDate ? (
              <View className="items-center py-8">
                <Ionicons name="time-outline" size={48} color={colors.textSecondary} />
                <Text className="text-sm mt-2" style={{ color: colors.textSecondary }}>
                  Select a professional and date first
                </Text>
              </View>
            ) : !availabilityCheck ? (
              <View className="items-center py-8 px-6">
                <Ionicons name="calendar-outline" size={48} color={colors.textSecondary} />
                <Text className="text-base font-semibold mt-4" style={{ color: colors.text }}>
                  Loading Availability...
                </Text>
                <Text className="text-sm mt-2 text-center" style={{ color: colors.textSecondary }}>
                  Please wait while we check availability
                </Text>
              </View>
            ) : !availabilityCheck.isAvailable || availabilityCheck.availableSlots.length === 0 ? (
              <View className="items-center py-8 px-6">
                <Ionicons name="calendar-outline" size={48} color={colors.textSecondary} />
                <Text className="text-base font-semibold mt-4" style={{ color: colors.text }}>
                  No Available Slots
                </Text>
                <Text className="text-sm mt-2 text-center" style={{ color: colors.textSecondary }}>
                  {availabilityCheck.reason || 'Please select another date or provider'}
                </Text>
              </View>
            ) : (
              <>
                <Text className="text-sm mb-3" style={{ color: colors.success }}>
                  ✓ {availabilityCheck.availableSlots.length} slots available
                  {availabilityCheck.reason?.includes('default availability') && (
                    <Text className="text-xs" style={{ color: colors.textSecondary }}>
                      {' '}(Default schedule)
                    </Text>
                  )}
                </Text>
                <View className="flex-row flex-wrap gap-2.5">
                  {availabilityCheck.availableSlots.map(slot => {
                    const isSelected = selectedSlot === slot;
                    const [startTime, endTime] = slot.split(' - ');
                    const isMorning = startTime.includes('AM') && !startTime.includes('12');
                    const isAfternoon = startTime.includes('PM') && !startTime.includes('12');

                    return (
                      <Pressable
                        key={slot}
                        onPress={() => setSelectedSlot(slot)}
                        className="active:opacity-70 w-[48%]"
                      >
                    <View
                      className="py-3.5 px-4 items-center rounded-lg"
                      style={{
                        borderWidth: isSelected ? 2 : 0,
                        borderColor: isSelected ? colors.primary : 'transparent',
                        backgroundColor:colors.background,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.04,
                        shadowRadius: 6,
                        elevation: 1,
                      }}
                    >
                      <Text
                        className={`text-sm text-center ${isSelected ? 'font-semibold' : 'font-medium'}`}
                        style={{ color: isSelected ? colors.primary : colors.text }}
                      >
                        {startTime}
                      </Text>
                      <Text
                        className="text-[11px] font-normal mt-0.5"
                        style={{ color: isSelected ? colors.primary : colors.textSecondary }}
                      >
                        to {endTime}
                      </Text>
                      {isMorning && (
                        <View
                          className="mt-1 px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: `${colors.success}20` }}
                        >
                          <Text className="text-[8px] font-medium" style={{ color: colors.success }}>
                            Morning
                          </Text>
                        </View>
                      )}
                      {isAfternoon && (
                        <View
                          className="mt-1 px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: `${colors.warning}20` }}
                        >
                          <Text className="text-[8px] font-medium" style={{ color: colors.warning }}>
                            Afternoon
                          </Text>
                        </View>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
              </>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action - Fixed SafeArea */}
      <View
        className="px-5 pt-4 border-t"
        style={{
          paddingBottom: Math.max(insets.bottom + 16, 16),
          borderTopColor: colors.border,
          backgroundColor: colors.background,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <View className="flex-row justify-between mb-3">
          <Text className="text-sm" style={{ color: colors.textSecondary }}>Total Amount</Text>
          <Text className="text-2xl font-bold" style={{ color: colors.primary }}>₹{price}</Text>
        </View>
        <Button 
          title="Continue to Address" 
          onPress={handleContinue}
          icon="arrow-forward"
          variant="primary"
          size="lg"
        />
      </View>
    </Container>
  );
}

