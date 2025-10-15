import { db } from '@/config/firebase';
import {
  AvailabilityCheckResult,
  DayOfWeek,
  ProviderAvailability,
  TimeSlot,
  UpdateAvailabilityInput,
  WeeklySchedule
} from '@/types';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from 'firebase/firestore';

// Default weekly schedule - all days available with standard hours
const DEFAULT_WEEKLY_SCHEDULE: WeeklySchedule = {
  monday: {
    isAvailable: true,
    slots: [
      '09:00 AM - 10:00 AM',
      '10:00 AM - 11:00 AM',
      '11:00 AM - 12:00 PM',
      '12:00 PM - 01:00 PM',
      '02:00 PM - 03:00 PM',
      '03:00 PM - 04:00 PM',
      '04:00 PM - 05:00 PM',
      '05:00 PM - 06:00 PM',
    ],
  },
  tuesday: {
    isAvailable: true,
    slots: [
      '09:00 AM - 10:00 AM',
      '10:00 AM - 11:00 AM',
      '11:00 AM - 12:00 PM',
      '12:00 PM - 01:00 PM',
      '02:00 PM - 03:00 PM',
      '03:00 PM - 04:00 PM',
      '04:00 PM - 05:00 PM',
      '05:00 PM - 06:00 PM',
    ],
  },
  wednesday: {
    isAvailable: true,
    slots: [
      '09:00 AM - 10:00 AM',
      '10:00 AM - 11:00 AM',
      '11:00 AM - 12:00 PM',
      '12:00 PM - 01:00 PM',
      '02:00 PM - 03:00 PM',
      '03:00 PM - 04:00 PM',
      '04:00 PM - 05:00 PM',
      '05:00 PM - 06:00 PM',
    ],
  },
  thursday: {
    isAvailable: true,
    slots: [
      '09:00 AM - 10:00 AM',
      '10:00 AM - 11:00 AM',
      '11:00 AM - 12:00 PM',
      '12:00 PM - 01:00 PM',
      '02:00 PM - 03:00 PM',
      '03:00 PM - 04:00 PM',
      '04:00 PM - 05:00 PM',
      '05:00 PM - 06:00 PM',
    ],
  },
  friday: {
    isAvailable: true,
    slots: [
      '09:00 AM - 10:00 AM',
      '10:00 AM - 11:00 AM',
      '11:00 AM - 12:00 PM',
      '12:00 PM - 01:00 PM',
      '02:00 PM - 03:00 PM',
      '03:00 PM - 04:00 PM',
      '04:00 PM - 05:00 PM',
      '05:00 PM - 06:00 PM',
    ],
  },
  saturday: {
    isAvailable: true,
    slots: [
      '10:00 AM - 11:00 AM',
      '11:00 AM - 12:00 PM',
      '12:00 PM - 01:00 PM',
      '02:00 PM - 03:00 PM',
      '03:00 PM - 04:00 PM',
      '04:00 PM - 05:00 PM',
    ],
  },
  sunday: {
    isAvailable: false,
    slots: [],
  },
};

/**
 * Get provider's availability settings
 */
export const getProviderAvailability = async (
  providerId: string
): Promise<ProviderAvailability | null> => {
  try {
    const availabilityDoc = await getDoc(doc(db, 'availability', providerId));
    
    if (availabilityDoc.exists()) {
      return {
        id: availabilityDoc.id,
        ...availabilityDoc.data(),
      } as ProviderAvailability;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error getting provider availability:', error);
    throw error;
  }
};

/**
 * Create or initialize provider availability with defaults
 */
export const createProviderAvailability = async (
  providerId: string
): Promise<ProviderAvailability> => {
  try {
    const availabilityData: ProviderAvailability = {
      id: providerId,
      providerId,
      weeklySchedule: DEFAULT_WEEKLY_SCHEDULE,
      customDaysOff: [],
      bookingBuffer: 30, // 30 minutes buffer
      advanceBookingDays: 30, // Can book 30 days ahead
      isAcceptingBookings: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'availability', providerId), availabilityData);
    
    console.log('✅ Provider availability created:', providerId);
    return availabilityData;
  } catch (error) {
    console.error('❌ Error creating provider availability:', error);
    throw error;
  }
};

/**
 * Update provider availability
 */
export const updateProviderAvailability = async (
  providerId: string,
  updates: UpdateAvailabilityInput
): Promise<void> => {
  try {
    const availabilityRef = doc(db, 'availability', providerId);
    
    await updateDoc(availabilityRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    
    console.log('✅ Provider availability updated:', providerId);
  } catch (error) {
    console.error('❌ Error updating provider availability:', error);
    throw error;
  }
};

/**
 * Get default availability slots when provider hasn't configured availability
 */
const getDefaultAvailabilitySlots = (date: Date): AvailabilityCheckResult => {
  console.log('🔍 getDefaultAvailabilitySlots called with date:', date);
  
  // Check if date is in the past
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  
  console.log('  today:', today);
  console.log('  checkDate:', checkDate);
  
  if (checkDate < today) {
    console.log('  ❌ Date is in the past');
    return {
      isAvailable: false,
      availableSlots: [],
      reason: 'Cannot book for past dates',
    };
  }
  
  // Check if date is too far in advance (default: 30 days)
  const daysAhead = Math.ceil((checkDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  console.log('  daysAhead:', daysAhead);
  
  if (daysAhead > 30) {
    console.log('  ❌ Date is too far in advance');
    return {
      isAvailable: false,
      availableSlots: [],
      reason: 'Bookings are only available 30 days in advance',
    };
  }
  
  // Get day of week
  const dayOfWeek = getDayOfWeek(date);
  console.log('  dayOfWeek:', dayOfWeek);
  
  // Default availability: Monday to Saturday, 9 AM to 6 PM
  const defaultWorkingDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const defaultTimeSlots: TimeSlot[] = [
    '09:00 AM - 10:00 AM',
    '10:00 AM - 11:00 AM',
    '11:00 AM - 12:00 PM',
    '12:00 PM - 01:00 PM',
    '01:00 PM - 02:00 PM',
    '02:00 PM - 03:00 PM',
    '03:00 PM - 04:00 PM',
    '04:00 PM - 05:00 PM',
    '05:00 PM - 06:00 PM',
  ];
  
  console.log('  defaultWorkingDays:', defaultWorkingDays);
  console.log('  includes dayOfWeek:', defaultWorkingDays.includes(dayOfWeek));
  
  if (!defaultWorkingDays.includes(dayOfWeek)) {
    console.log('  ❌ Day not in working days');
    return {
      isAvailable: false,
      availableSlots: [],
      reason: 'Provider is not available on this day (default schedule)',
    };
  }
  
  console.log('  ✅ Returning default time slots');
  return {
    isAvailable: true,
    availableSlots: defaultTimeSlots,
    reason: 'Using default availability (provider hasn\'t set custom schedule)',
  };
};

/**
 * Get available time slots for a provider on a specific date
 */
export const getAvailableSlots = async (
  providerId: string,
  date: Date
): Promise<AvailabilityCheckResult> => {
  try {
    console.log('🔍 getAvailableSlots called with:', { providerId, date });
    
    // Get provider's availability settings
    const availability = await getProviderAvailability(providerId);
    console.log('  availability result:', availability);
    
    if (!availability) {
      // If provider hasn't set availability, provide default availability
      console.log('⚠️ Provider availability not configured, using default availability');
      const defaultResult = getDefaultAvailabilitySlots(date);
      console.log('  default result:', defaultResult);
      return defaultResult;
    }

    // Check if provider is accepting bookings
    if (!availability.isAcceptingBookings) {
      return {
        isAvailable: false,
        availableSlots: [],
        reason: 'Provider is not accepting bookings',
      };
    }

    // Check if date is within advance booking limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    const daysAhead = Math.ceil((checkDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysAhead < 0) {
      return {
        isAvailable: false,
        availableSlots: [],
        reason: 'Cannot book for past dates',
      };
    }
    
    if (daysAhead > availability.advanceBookingDays) {
      return {
        isAvailable: false,
        availableSlots: [],
        reason: `Bookings are only available ${availability.advanceBookingDays} days in advance`,
      };
    }

    // Check if date is a custom day off
    const dateString = date.toISOString().split('T')[0];
    if (availability.customDaysOff.includes(dateString)) {
      return {
        isAvailable: false,
        availableSlots: [],
        reason: 'Provider is not available on this date',
      };
    }

    // Get day of week
    const dayOfWeek = getDayOfWeek(date);
    const daySchedule = availability.weeklySchedule[dayOfWeek];

    if (!daySchedule.isAvailable || daySchedule.slots.length === 0) {
      return {
        isAvailable: false,
        availableSlots: [],
        reason: `Provider is not available on ${dayOfWeek}s`,
      };
    }

    // Get existing bookings for this provider on this date
    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('providerId', '==', providerId),
      where('scheduledDate', '==', dateString),
      where('status', 'in', ['pending', 'accepted', 'confirmed', 'on-the-way', 'in-progress'])
    );

    console.log('📚 Fetching existing bookings for:', { providerId, dateString });
    const bookingsSnapshot = await getDocs(bookingsQuery);
    const bookedSlots = bookingsSnapshot.docs.map(doc => doc.data().scheduledSlot as TimeSlot);
    console.log('  bookedSlots:', bookedSlots);
    console.log('  daySchedule.slots:', daySchedule.slots);

    // Filter out booked slots
    const availableSlots = daySchedule.slots.filter(slot => !bookedSlots.includes(slot));
    console.log('  availableSlots after removing booked:', availableSlots);

    // Filter out past slots if it's today
    const now = new Date();
    const isToday = checkDate.getTime() === today.getTime();
    
    console.log('📅 Date filtering debug:');
    console.log('  checkDate:', checkDate);
    console.log('  today:', today);
    console.log('  isToday:', isToday);
    console.log('  now:', now);
    console.log('  availableSlots before filtering:', availableSlots);
    
    let filteredSlots = availableSlots;
    if (isToday) {
      console.log('  ⏰ Filtering past slots for today...');
      filteredSlots = availableSlots.filter(slot => {
        const slotStartTime = parseSlotTime(slot);
        const isPastSlot = slotStartTime <= now;
        console.log(`    ${slot}: slotStartTime=${slotStartTime.toLocaleTimeString()}, isPastSlot=${isPastSlot}`);
        return slotStartTime > now;
      });
      console.log('  filteredSlots after time filtering:', filteredSlots);
    }

    return {
      isAvailable: filteredSlots.length > 0,
      availableSlots: filteredSlots,
      reason: filteredSlots.length === 0 ? 'No available slots for this date' : undefined,
    };
  } catch (error) {
    console.error('❌ Error checking available slots:', error);
    throw error;
  }
};

/**
 * Helper: Get day of week from date
 */
const getDayOfWeek = (date: Date): DayOfWeek => {
  const days: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
};

/**
 * Helper: Parse slot time to Date object for comparison
 */
const parseSlotTime = (slot: TimeSlot): Date => {
  const startTime = slot.split(' - ')[0];
  const [time, period] = startTime.split(' ');
  const [hours, minutes] = time.split(':').map(Number);
  
  let hour24 = hours;
  if (period === 'PM' && hours !== 12) {
    hour24 = hours + 12;
  } else if (period === 'AM' && hours === 12) {
    hour24 = 0;
  }
  
  const now = new Date();
  now.setHours(hour24, minutes, 0, 0);
  return now;
};

/**
 * Add a custom day off
 */
export const addCustomDayOff = async (
  providerId: string,
  date: Date
): Promise<void> => {
  try {
    const availability = await getProviderAvailability(providerId);
    if (!availability) {
      throw new Error('Provider availability not found');
    }

    const dateString = date.toISOString().split('T')[0];
    
    if (!availability.customDaysOff.includes(dateString)) {
      const updatedDaysOff = [...availability.customDaysOff, dateString];
      await updateProviderAvailability(providerId, { customDaysOff: updatedDaysOff });
    }
  } catch (error) {
    console.error('❌ Error adding custom day off:', error);
    throw error;
  }
};

/**
 * Remove a custom day off
 */
export const removeCustomDayOff = async (
  providerId: string,
  date: Date
): Promise<void> => {
  try {
    const availability = await getProviderAvailability(providerId);
    if (!availability) {
      throw new Error('Provider availability not found');
    }

    const dateString = date.toISOString().split('T')[0];
    const updatedDaysOff = availability.customDaysOff.filter(d => d !== dateString);
    
    await updateProviderAvailability(providerId, { customDaysOff: updatedDaysOff });
  } catch (error) {
    console.error('❌ Error removing custom day off:', error);
    throw error;
  }
};

