import { db } from '@/config/firebase';
import {
  acceptBooking,
  cancelBooking,
  completeBooking,
  createBooking,
  getAllBookings,
  getBookingById,
  getCustomerBookingCount,
  getCustomerBookings,
  getCustomerBookingsByStatus,
  getProviderBookingCount,
  getProviderBookings,
  getProviderBookingsByStatus,
  markOnTheWay,
  rejectBooking,
  rescheduleBooking,
  startService,
  updateBooking,
  updateBookingStatus,
} from '@/services/bookingService';
import { Booking, BookingStatus } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { collection, doc, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { useEffect } from 'react';

/**
 * Hook to get count of customer bookings by status (optimized using getCountFromServer)
 * Use this for badge counts instead of fetching all bookings
 */
export const useCustomerBookingCount = (
  customerId: string | null,
  statuses: BookingStatus[]
) => {
  return useQuery({
    queryKey: ['customer-booking-count', customerId, statuses],
    queryFn: () => {
      if (!customerId || statuses.length === 0) return 0;
      return getCustomerBookingCount(customerId, statuses);
    },
    enabled: !!customerId && statuses.length > 0,
    staleTime: 30000, // Cache for 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
};

/**
 * Hook to get count of provider bookings by status (optimized using getCountFromServer)
 * Use this for badge counts instead of fetching all bookings
 */
export const useProviderBookingCount = (
  providerId: string | null,
  statuses: BookingStatus[]
) => {
  return useQuery({
    queryKey: ['provider-booking-count', providerId, statuses],
    queryFn: () => {
      if (!providerId || statuses.length === 0) return 0;
      return getProviderBookingCount(providerId, statuses);
    },
    enabled: !!providerId && statuses.length > 0,
    staleTime: 30000, // Cache for 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
};

/**
 * Hook to get a single booking by ID with real-time updates
 */
export const useBooking = (bookingId: string | null) => {
  const queryClient = useQueryClient();

  // Set up real-time listener
  useEffect(() => {
    if (!bookingId) return;

    const unsubscribe = onSnapshot(
      doc(db, 'bookings', bookingId),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const booking: Booking = {
            id: docSnapshot.id,
            ...docSnapshot.data(),
            createdAt: docSnapshot.data().createdAt?.toDate() || new Date(),
            updatedAt: docSnapshot.data().updatedAt?.toDate() || new Date(),
            completedAt: docSnapshot.data().completedAt?.toDate() || null,
          } as Booking;
          queryClient.setQueryData(['booking', bookingId], booking);
        }
      },
      (error) => {
        console.error('❌ Error listening to booking:', error);
      }
    );

    return () => unsubscribe();
  }, [bookingId, queryClient]);

  return useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => {
      if (!bookingId) return null;
      return getBookingById(bookingId);
    },
    enabled: !!bookingId,
  });
};

/**
 * Hook to get all bookings for a customer with real-time updates
 */
export const useCustomerBookings = (customerId: string | null) => {
  const queryClient = useQueryClient();

  // Set up real-time listener
  useEffect(() => {
    if (!customerId) return;

    const q = query(
      collection(db, 'bookings'),
      where('customerId', '==', customerId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const bookings: Booking[] = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          completedAt: doc.data().completedAt?.toDate() || null,
        })) as Booking[];
        queryClient.setQueryData(['customer-bookings', customerId], bookings);
      },
      (error) => {
        console.error('❌ Error listening to customer bookings:', error);
      }
    );

    return () => unsubscribe();
  }, [customerId, queryClient]);

  return useQuery({
    queryKey: ['customer-bookings', customerId],
    queryFn: () => {
      if (!customerId) return [];
      return getCustomerBookings(customerId);
    },
    enabled: !!customerId,
  });
};

/**
 * Hook to get bookings by status for a customer
 */
export const useCustomerBookingsByStatus = (
  customerId: string | null,
  statuses: BookingStatus[]
) => {
  return useQuery({
    queryKey: ['customer-bookings', customerId, statuses],
    queryFn: () => {
      if (!customerId) return [];
      return getCustomerBookingsByStatus(customerId, statuses);
    },
    enabled: !!customerId && statuses.length > 0,
  });
};

/**
 * Hook to get all bookings for a provider with real-time updates
 */
export const useProviderBookings = (providerId: string | null) => {
  const queryClient = useQueryClient();

  // Set up real-time listener
  useEffect(() => {
    if (!providerId) return;

    const q = query(
      collection(db, 'bookings'),
      where('providerId', '==', providerId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const bookings: Booking[] = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          completedAt: doc.data().completedAt?.toDate() || null,
        })) as Booking[];
        queryClient.setQueryData(['provider-bookings', providerId], bookings);
      },
      (error) => {
        console.error('❌ Error listening to provider bookings:', error);
      }
    );

    return () => unsubscribe();
  }, [providerId, queryClient]);

  return useQuery({
    queryKey: ['provider-bookings', providerId],
    queryFn: () => {
      if (!providerId) return [];
      return getProviderBookings(providerId);
    },
    enabled: !!providerId,
  });
};

/**
 * Hook to get bookings by status for a provider
 */
export const useProviderBookingsByStatus = (
  providerId: string | null,
  statuses: BookingStatus[]
) => {
  return useQuery({
    queryKey: ['provider-bookings', providerId, statuses],
    queryFn: () => {
      if (!providerId) return [];
      return getProviderBookingsByStatus(providerId, statuses);
    },
    enabled: !!providerId && statuses.length > 0,
  });
};

/**
 * Hook to get all bookings (admin only)
 */
export const useAllBookings = () => {
  return useQuery({
    queryKey: ['all-bookings'],
    queryFn: getAllBookings,
  });
};

/**
 * Hook to create a booking
 */
export const useCreateBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      input,
      customerData,
      providerData,
      serviceData,
    }: {
      input: any;
      customerData: { name: string; phone: string; photo?: string };
      providerData: { name: string; phone: string; photo?: string };
      serviceData: { name: string; category: string; price: number };
    }) => createBooking(input, customerData, providerData, serviceData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['provider-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['all-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['available-slots'] });
      queryClient.invalidateQueries({ queryKey: ['customer-booking-count'] });
      queryClient.invalidateQueries({ queryKey: ['provider-booking-count'] });
    },
  });
};

/**
 * Hook to update a booking
 */
export const useUpdateBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bookingId, updates }: { bookingId: string; updates: any }) =>
      updateBooking(bookingId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking'] });
      queryClient.invalidateQueries({ queryKey: ['customer-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['provider-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['all-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['available-slots'] });
      queryClient.invalidateQueries({ queryKey: ['customer-booking-count'] });
      queryClient.invalidateQueries({ queryKey: ['provider-booking-count'] });
    },
  });
};

/**
 * Hook to update booking status
 */
export const useUpdateBookingStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      bookingId,
      status,
      reason,
    }: {
      bookingId: string;
      status: BookingStatus;
      reason?: string;
    }) => updateBookingStatus(bookingId, status, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking'] });
      queryClient.invalidateQueries({ queryKey: ['customer-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['provider-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['all-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['available-slots'] });
      queryClient.invalidateQueries({ queryKey: ['customer-booking-count'] });
      queryClient.invalidateQueries({ queryKey: ['provider-booking-count'] });
    },
  });
};

/**
 * Hook to cancel a booking
 */
export const useCancelBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      bookingId, 
      reason, 
      cancelledByUserId 
    }: { 
      bookingId: string; 
      reason: string;
      cancelledByUserId?: string;
    }) =>
      cancelBooking(bookingId, reason, cancelledByUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking'] });
      queryClient.invalidateQueries({ queryKey: ['customer-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['provider-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['all-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['available-slots'] });
      queryClient.invalidateQueries({ queryKey: ['customer-booking-count'] });
      queryClient.invalidateQueries({ queryKey: ['provider-booking-count'] });
    },
  });
};

/**
 * Hook to accept a booking (provider)
 */
export const useAcceptBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId: string) => acceptBooking(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking'] });
      queryClient.invalidateQueries({ queryKey: ['provider-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['all-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['available-slots'] });
    },
  });
};

/**
 * Hook to reject a booking (provider)
 */
export const useRejectBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bookingId, reason }: { bookingId: string; reason: string }) =>
      rejectBooking(bookingId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking'] });
      queryClient.invalidateQueries({ queryKey: ['provider-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['all-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['available-slots'] });
    },
  });
};

/**
 * Hook to start service (provider)
 */
export const useStartService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId: string) => startService(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking'] });
      queryClient.invalidateQueries({ queryKey: ['provider-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['all-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['available-slots'] });
    },
  });
};

/**
 * Hook to complete a booking
 */
export const useCompleteBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bookingId, images }: { bookingId: string; images?: string[] }) =>
      completeBooking(bookingId, images),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking'] });
      queryClient.invalidateQueries({ queryKey: ['customer-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['provider-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['all-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['available-slots'] });
      queryClient.invalidateQueries({ queryKey: ['customer-booking-count'] });
      queryClient.invalidateQueries({ queryKey: ['provider-booking-count'] });
    },
  });
};

/**
 * Hook to mark provider as on the way
 */
export const useMarkOnTheWay = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId: string) => markOnTheWay(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking'] });
      queryClient.invalidateQueries({ queryKey: ['provider-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['all-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['available-slots'] });
    },
  });
};

/**
 * Hook to reschedule a booking
 */
export const useRescheduleBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      bookingId,
      scheduledDate,
      scheduledTime,
      scheduledSlot,
    }: {
      bookingId: string;
      scheduledDate: string;
      scheduledTime: string;
      scheduledSlot: string;
    }) => rescheduleBooking(bookingId, scheduledDate, scheduledTime, scheduledSlot),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking'] });
      queryClient.invalidateQueries({ queryKey: ['customer-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['provider-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['all-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['available-slots'] });
      queryClient.invalidateQueries({ queryKey: ['customer-booking-count'] });
      queryClient.invalidateQueries({ queryKey: ['provider-booking-count'] });
    },
  });
};

