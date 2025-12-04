import { db } from '@/config/firebase';
import { useQuery } from '@tanstack/react-query';
import {
  Timestamp,
  collection,
  getCountFromServer,
  getDocs,
  orderBy,
  query,
  where
} from 'firebase/firestore';

export type RevenueFilter = 'all' | 'today' | 'week' | 'month' | 'year';

interface AdminStats {
  totalUsers: number;
  totalProviders: number;
  totalBookings: number;
  totalRevenue: number;
}

interface UseAdminStatsOptions {
  revenueFilter?: RevenueFilter;
}

/**
 * Get start timestamp for revenue filter
 */
const getRevenueFilterStartDate = (filter: RevenueFilter): Date => {
  const now = new Date();
  const start = new Date();

  switch (filter) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      return start;
    case 'week':
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      return start;
    case 'month':
      start.setMonth(now.getMonth() - 1);
      start.setHours(0, 0, 0, 0);
      return start;
    case 'year':
      start.setFullYear(now.getFullYear() - 1);
      start.setHours(0, 0, 0, 0);
      return start;
    default:
      return new Date(0); // All time
  }
};

/**
 * OPTIMIZED: Separate queries for counts and revenue
 * Counts are cached independently and don't reload when revenue filter changes
 * Only revenue query refetches when filter changes
 */
export const useAdminStats = (options: UseAdminStatsOptions = {}) => {
  const { revenueFilter = 'all' } = options;

  // OPTIMIZATION 1: Separate query for counts (cached independently)
  const { data: countsData, isLoading: isLoadingCounts } = useQuery({
    queryKey: ['admin-stats-counts'],
    queryFn: async () => {
      // Use getCountFromServer for counts (much faster, no data transfer)
      const [usersCount, providersCount, bookingsCount] = await Promise.all([
        getCountFromServer(collection(db, 'users')),
        getCountFromServer(query(collection(db, 'users'), where('role', '==', 'provider'))),
        getCountFromServer(collection(db, 'bookings')),
      ]);

      return {
        totalUsers: usersCount.data().count,
        totalProviders: providersCount.data().count,
        totalBookings: bookingsCount.data().count,
      };
    },
    staleTime: 300000, // 5 minutes - counts don't change often
    gcTime: 600000, // 10 minutes cache
    refetchOnWindowFocus: true,
    refetchInterval: 60000, // Refetch every minute
  });

  // OPTIMIZATION 2: Separate query for revenue (refetches when filter changes)
  const { data: revenueData, isLoading: isLoadingRevenue } = useQuery({
    queryKey: ['admin-stats-revenue', revenueFilter],
    queryFn: async (): Promise<number> => {
      try {
        // Build efficient revenue query
        const revenueStartDate = revenueFilter !== 'all' 
          ? getRevenueFilterStartDate(revenueFilter) 
          : null;

        let completedBookingsSnapshot;
        
        // Try server-side date filtering first (much faster)
        if (revenueStartDate) {
          try {
            const startTimestamp = Timestamp.fromDate(revenueStartDate);
            // Try to use completedAt with date filter (requires Firestore index)
            const revenueQuery = query(
              collection(db, 'bookings'),
              where('status', '==', 'completed'),
              where('completedAt', '>=', startTimestamp),
              orderBy('completedAt', 'desc')
            );
            completedBookingsSnapshot = await getDocs(revenueQuery);
          } catch (error: any) {
            // If index doesn't exist, fall back to client-side filtering
            if (error?.code === 'failed-precondition') {
              console.warn('Firestore index missing. Using client-side filtering.');
              completedBookingsSnapshot = await getDocs(
                query(collection(db, 'bookings'), where('status', '==', 'completed'))
              );
            } else {
              throw error;
            }
          }
        } else {
          // For 'all', just fetch completed bookings
          completedBookingsSnapshot = await getDocs(
            query(collection(db, 'bookings'), where('status', '==', 'completed'))
          );
        }

        // Efficient revenue calculation with proper date filtering
        const revenueStartTime = revenueStartDate?.getTime() || 0;
        let totalRevenue = 0;

        completedBookingsSnapshot.docs.forEach(doc => {
          const booking = doc.data();
          
          // Apply date filter if not 'all' (double-check for edge cases)
          if (revenueStartDate) {
            const completionTime = booking.completedAt?.toDate?.()?.getTime() 
              || booking.updatedAt?.toDate?.()?.getTime() 
              || booking.createdAt?.toDate?.()?.getTime() 
              || 0;
            
            if (completionTime < revenueStartTime) {
              return; // Skip bookings outside date range
            }
          }
          
          // Extract and validate amount
          const amount = booking.price || booking.totalAmount || 0;
          if (typeof amount === 'number' && !isNaN(amount) && amount > 0 && isFinite(amount)) {
            totalRevenue += amount;
          }
        });

        return totalRevenue;
      } catch (error: any) {
        // Handle Firestore index errors gracefully
        if (error?.code === 'failed-precondition') {
          console.warn('Firestore index required. Falling back to client-side filtering.');
          return await fetchRevenueWithClientSideFilter(revenueFilter);
        }
        
        console.error('Error fetching revenue:', error);
        return 0;
      }
    },
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes cache
    refetchOnWindowFocus: true,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Combine both queries
  return {
    data: {
      totalUsers: countsData?.totalUsers || 0,
      totalProviders: countsData?.totalProviders || 0,
      totalBookings: countsData?.totalBookings || 0,
      totalRevenue: revenueData || 0,
    },
    isLoading: isLoadingCounts || isLoadingRevenue,
    isLoadingRevenue, // Expose separate loading state for revenue
    isLoadingCounts, // Expose separate loading state for counts
  };
};

/**
 * Fallback function for client-side revenue filtering when Firestore index is missing
 */
async function fetchRevenueWithClientSideFilter(revenueFilter: RevenueFilter): Promise<number> {
  const completedBookingsSnapshot = await getDocs(
    query(collection(db, 'bookings'), where('status', '==', 'completed'))
  );

  const revenueStartDate = revenueFilter !== 'all' 
    ? getRevenueFilterStartDate(revenueFilter).getTime() 
    : 0;

  let totalRevenue = 0;
  completedBookingsSnapshot.docs.forEach(doc => {
    const booking = doc.data();
    
    if (revenueFilter !== 'all') {
      const completionTime = booking.completedAt?.toDate?.()?.getTime() 
        || booking.updatedAt?.toDate?.()?.getTime() 
        || booking.createdAt?.toDate?.()?.getTime() 
        || 0;
      
      if (completionTime < revenueStartDate) return;
    }
    
    const amount = booking.price || booking.totalAmount || 0;
    if (typeof amount === 'number' && !isNaN(amount) && amount > 0 && isFinite(amount)) {
      totalRevenue += amount;
    }
  });

  return totalRevenue;
}
