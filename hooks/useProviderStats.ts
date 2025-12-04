import { useAuth } from '@/hooks/useAuth';
import { useProviderBookings } from '@/hooks/useBookings';
import { useProviderReviews } from '@/hooks/useReviews';
import { parseLocalDate } from '@/utils/dateHelpers';
import { useMemo } from 'react';

interface ProviderStats {
  todaysBookings: number;
  completedBookings: number;
  totalEarnings: number;
  averageRating: number;
  totalBookings: number;
}

export const useProviderStats = () => {
  const { user } = useAuth();
  const { data: providerBookings = [], isLoading: loadingBookings } = useProviderBookings(user?.uid || null);
  const { data: providerReviews = [], isLoading: loadingReviews } = useProviderReviews(user?.uid || null);

  const stats = useMemo((): ProviderStats => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Today's bookings
    const todaysBookings = providerBookings.filter(booking => {
      const bookingDate = parseLocalDate(booking.scheduledDate);
      bookingDate.setHours(0, 0, 0, 0);
      return bookingDate.getTime() === today.getTime();
    }).length;

    // Completed bookings
    const completedBookings = providerBookings.filter(booking => booking.status === 'completed').length;

    // Total earnings from completed bookings
    const totalEarnings = providerBookings
      .filter(booking => booking.status === 'completed')
      .reduce((total, booking) => total + (booking.totalAmount || 0), 0);

    // Average rating from reviews
    const averageRating = providerReviews.length > 0
      ? providerReviews.reduce((sum, review) => sum + review.rating, 0) / providerReviews.length
      : 0;

    return {
      todaysBookings,
      completedBookings,
      totalEarnings,
      averageRating,
      totalBookings: providerBookings.length,
    };
  }, [providerBookings, providerReviews]);

  return {
    stats,
    isLoading: loadingBookings || loadingReviews,
  };
};
