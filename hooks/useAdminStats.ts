import { db } from '@/config/firebase';
import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, where } from 'firebase/firestore';

interface AdminStats {
  totalUsers: number;
  totalProviders: number;
  totalBookings: number;
  totalRevenue: number;
}

export const useAdminStats = () => {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async (): Promise<AdminStats> => {
      try {
        // Get all users
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const totalUsers = usersSnapshot.docs.length;

        // Get providers (users with role 'provider')
        const providersQuery = query(collection(db, 'users'), where('role', '==', 'provider'));
        const providersSnapshot = await getDocs(providersQuery);
        const totalProviders = providersSnapshot.docs.length;

        // Get all bookings
        const bookingsSnapshot = await getDocs(collection(db, 'bookings'));
        const totalBookings = bookingsSnapshot.docs.length;

        // Calculate total revenue from completed bookings
        let totalRevenue = 0;
        bookingsSnapshot.docs.forEach(doc => {
          const booking = doc.data();
          if (booking.status === 'completed' && booking.totalAmount) {
            totalRevenue += booking.totalAmount;
          }
        });

        return {
          totalUsers,
          totalProviders,
          totalBookings,
          totalRevenue,
        };
      } catch (error) {
        console.error('Error fetching admin stats:', error);
        return {
          totalUsers: 0,
          totalProviders: 0,
          totalBookings: 0,
          totalRevenue: 0,
        };
      }
    },
  });
};
