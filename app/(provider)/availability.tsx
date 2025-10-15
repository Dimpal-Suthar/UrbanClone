import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import {
  useCreateProviderAvailability,
  useProviderAvailability,
  useUpdateProviderAvailability
} from '@/hooks/useAvailability';
import { DayOfWeek, TimeSlot, WeeklySchedule } from '@/types';
import { showFailedMessage, showSuccessMessage } from '@/utils/toast';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { observer } from 'mobx-react-lite';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View
} from 'react-native';

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

const DAYS_OF_WEEK: { key: DayOfWeek; label: string }[] = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

const ProviderAvailabilityScreen = observer(() => {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();

  const { data: availability, isLoading } = useProviderAvailability(user?.uid || null);
  const createAvailability = useCreateProviderAvailability();
  const updateAvailability = useUpdateProviderAvailability();

  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('monday');
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule | null>(null);
  const [isAcceptingBookings, setIsAcceptingBookings] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize schedule from availability data
  useEffect(() => {
    if (availability) {
      setWeeklySchedule(availability.weeklySchedule);
      setIsAcceptingBookings(availability.isAcceptingBookings);
    }
  }, [availability]);

  // Create availability if it doesn't exist
  useEffect(() => {
    if (!isLoading && !availability && user?.uid) {
      createAvailability.mutate(user.uid);
    }
  }, [isLoading, availability, user?.uid]);

  const handleToggleDay = (day: DayOfWeek) => {
    if (!weeklySchedule) return;

    setWeeklySchedule({
      ...weeklySchedule,
      [day]: {
        ...weeklySchedule[day],
        isAvailable: !weeklySchedule[day].isAvailable,
      },
    });
  };

  const handleToggleSlot = (day: DayOfWeek, slot: TimeSlot) => {
    if (!weeklySchedule) return;

    const currentSlots = weeklySchedule[day].slots;
    const newSlots = currentSlots.includes(slot)
      ? currentSlots.filter(s => s !== slot)
      : [...currentSlots, slot].sort((a, b) => {
          const aIndex = ALL_TIME_SLOTS.indexOf(a);
          const bIndex = ALL_TIME_SLOTS.indexOf(b);
          return aIndex - bIndex;
        });

    setWeeklySchedule({
      ...weeklySchedule,
      [day]: {
        ...weeklySchedule[day],
        slots: newSlots,
      },
    });
  };

  const handleSelectAllSlots = (day: DayOfWeek) => {
    if (!weeklySchedule) return;

    setWeeklySchedule({
      ...weeklySchedule,
      [day]: {
        ...weeklySchedule[day],
        slots: [...ALL_TIME_SLOTS],
      },
    });
  };

  const handleClearAllSlots = (day: DayOfWeek) => {
    if (!weeklySchedule) return;

    setWeeklySchedule({
      ...weeklySchedule,
      [day]: {
        ...weeklySchedule[day],
        slots: [],
      },
    });
  };

  const handleCopyToAllDays = () => {
    if (!weeklySchedule || !selectedDay) return;

    const selectedDaySchedule = weeklySchedule[selectedDay];
    const newSchedule: WeeklySchedule = {} as WeeklySchedule;

    DAYS_OF_WEEK.forEach(({ key }) => {
      newSchedule[key] = {
        isAvailable: selectedDaySchedule.isAvailable,
        slots: [...selectedDaySchedule.slots],
      };
    });

    setWeeklySchedule(newSchedule);
    showSuccessMessage('Success', 'Schedule copied to all days');
  };

  const handleSave = async () => {
    if (!user?.uid || !weeklySchedule) return;

    try {
      setIsSaving(true);

      await updateAvailability.mutateAsync({
        providerId: user.uid,
        updates: {
          weeklySchedule,
          isAcceptingBookings,
        },
      });

      showSuccessMessage('Success', 'Availability updated successfully');
      setTimeout(() => router.back(), 800);
    } catch (error) {
      console.error('Error updating availability:', error);
      showFailedMessage('Error', 'Failed to update availability');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !weeklySchedule) {
    return (
      <Container safeArea edges={['top', 'bottom']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 16, color: colors.textSecondary }}>
            Loading availability...
          </Text>
        </View>
      </Container>
    );
  }

  const selectedDaySchedule = weeklySchedule[selectedDay];

  return (
    <Container safeArea edges={['top', 'bottom']}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.surface,
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
            Manage Availability
          </Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
            Set your working hours and days
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-5 pt-5">
          {/* Accepting Bookings Toggle */}
          <Card variant="default" style={{ padding: 16, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
                  Accepting Bookings
                </Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>
                  Turn off to stop receiving new bookings
                </Text>
              </View>
              <Switch
                value={isAcceptingBookings}
                onValueChange={setIsAcceptingBookings}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          </Card>

          {/* Day Selector */}
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 12 }}>
            Select Day
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 20 }}
            contentContainerStyle={{ gap: 8 }}
          >
            {DAYS_OF_WEEK.map(({ key, label }) => {
              const isSelected = selectedDay === key;
              const daySchedule = weeklySchedule[key];
              
              return (
                <Pressable
                  key={key}
                  onPress={() => setSelectedDay(key)}
                  className="active:opacity-70"
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 12,
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    borderWidth: 1,
                    borderColor: isSelected ? colors.primary : colors.border,
                    minWidth: 100,
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: isSelected ? '#FFFFFF' : colors.text,
                      marginBottom: 4,
                    }}
                  >
                    {label}
                  </Text>
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: daySchedule.isAvailable ? colors.success : colors.error,
                    }}
                  />
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Day Toggle and Actions */}
          <Card variant="default" style={{ padding: 16, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
                  {DAYS_OF_WEEK.find(d => d.key === selectedDay)?.label}
                </Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>
                  {selectedDaySchedule.isAvailable ? 'Available' : 'Not available'}
                </Text>
              </View>
              <Switch
                value={selectedDaySchedule.isAvailable}
                onValueChange={() => handleToggleDay(selectedDay)}
                trackColor={{ false: colors.border, true: colors.success }}
                thumbColor="#FFFFFF"
              />
            </View>

            {/* Quick Actions */}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable
                onPress={() => handleSelectAllSlots(selectedDay)}
                disabled={!selectedDaySchedule.isAvailable}
                className="flex-1 active:opacity-70"
                style={{
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: selectedDaySchedule.isAvailable ? `${colors.primary}20` : colors.border,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: selectedDaySchedule.isAvailable ? colors.primary : colors.textSecondary }}>
                  Select All
                </Text>
              </Pressable>

              <Pressable
                onPress={() => handleClearAllSlots(selectedDay)}
                disabled={!selectedDaySchedule.isAvailable}
                className="flex-1 active:opacity-70"
                style={{
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: selectedDaySchedule.isAvailable ? `${colors.error}20` : colors.border,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: selectedDaySchedule.isAvailable ? colors.error : colors.textSecondary }}>
                  Clear All
                </Text>
              </Pressable>

              <Pressable
                onPress={handleCopyToAllDays}
                className="flex-1 active:opacity-70"
                style={{
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: `${colors.success}20`,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.success }}>
                  Copy to All
                </Text>
              </Pressable>
            </View>
          </Card>

          {/* Time Slots */}
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 12 }}>
            Available Time Slots ({selectedDaySchedule.slots.length})
          </Text>

          <View style={{ gap: 8 }}>
            {ALL_TIME_SLOTS.map((slot) => {
              const isSelected = selectedDaySchedule.slots.includes(slot);
              const isDisabled = !selectedDaySchedule.isAvailable;

              return (
                <Pressable
                  key={slot}
                  onPress={() => handleToggleSlot(selectedDay, slot)}
                  disabled={isDisabled}
                  className="active:opacity-70"
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 16,
                    borderRadius: 12,
                    backgroundColor: isDisabled
                      ? colors.border
                      : isSelected
                      ? `${colors.primary}15`
                      : colors.surface,
                    borderWidth: 1,
                    borderColor: isDisabled ? colors.border : isSelected ? colors.primary : colors.border,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: isSelected ? '600' : '400',
                      color: isDisabled ? colors.textSecondary : colors.text,
                    }}
                  >
                    {slot}
                  </Text>
                  {isSelected && !isDisabled && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: Platform.OS === 'ios' ? 12 : 16,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.surface,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Button
          title={isSaving ? 'Saving...' : 'Save Availability'}
          onPress={handleSave}
          disabled={isSaving}
          icon="checkmark"
        />
      </View>
    </Container>
  );
});

export default ProviderAvailabilityScreen;

