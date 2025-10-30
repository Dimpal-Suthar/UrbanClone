import { db } from '@/config/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { useQuery, useQueryClient, useQueries } from '@tanstack/react-query';
import { useEffect } from 'react';

/**
 * Get user profile by ID with caching
 * Uses TanStack Query for automatic caching and invalidation
 */
export const getUserProfile = async (userId: string) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      return null;
    }

    const userData = userDoc.data();
    return {
      id: userId,
      ...userData,
      phone: userData.phone || userData.phoneNumber || null,
      photoURL: userData.photoURL || userData.photo || null,
      displayName: userData.displayName || userData.name || 'User',
      role: userData.role || 'customer',
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

/**
 * Hook to fetch and cache a single user profile
 * 
 * Features:
 * - Automatic caching (5 min stale time)
 * - Shared across all components
 * - Prevents duplicate fetches
 * 
 * @param userId User ID to fetch
 * @returns User profile data with loading/error states
 * 
 * Usage:
 * const { data: user, isLoading } = useUserProfile(userId);
 */
export const useUserProfile = (userId: string | null) => {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => getUserProfile(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes (gcTime replaces cacheTime in TanStack Query v5)
  });
};

/**
 * Hook to subscribe to real-time user profile updates
 * 
 * Automatically updates cache when user data changes in Firestore
 * 
 * @param userId User ID to subscribe to
 * 
 * Usage:
 * useUserProfileRealtime(userId);
 * 
 * This will automatically sync changes to all components using useUserProfile
 */
export const useUserProfileRealtime = (userId: string | null) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = onSnapshot(
      doc(db, 'users', userId),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = {
            id: userId,
            ...docSnapshot.data(),
            phone: docSnapshot.data().phone || docSnapshot.data().phoneNumber || null,
            photoURL: docSnapshot.data().photoURL || docSnapshot.data().photo || null,
            displayName: docSnapshot.data().displayName || docSnapshot.data().name || 'User',
            role: docSnapshot.data().role || 'customer',
          };
          // Update cache automatically
          queryClient.setQueryData(['user', userId], userData);
        } else {
          queryClient.setQueryData(['user', userId], null);
        }
      },
      (error) => {
        console.error('Error listening to user profile:', error);
      }
    );

    return () => unsubscribe();
  }, [userId, queryClient]);
};

/**
 * Hook to fetch multiple user profiles efficiently
 * Uses TanStack Query's useQueries for parallel fetching
 * 
 * Features:
 * - Fetches all users in parallel
 * - Respects existing cache
 * - No duplicate fetches for already cached users
 * 
 * @param userIds Array of user IDs to fetch
 * @returns Array of query results with loading/error states
 * 
 * Usage:
 * const results = useUserProfiles(['userId1', 'userId2']);
 * results.forEach(result => {
 *   console.log(result.data);
 * });
 */
export const useUserProfiles = (userIds: string[]) => {
  const queries = useQueries({
    queries: userIds.map(userId => ({
      queryKey: ['user', userId],
      queryFn: () => getUserProfile(userId),
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
    })),
  });

  return queries;
};

/**
 * Batch fetch user profiles in one Firestore call
 * More efficient than multiple individual fetches
 * 
 * Note: This requires Firestore batch get support
 * Currently using Promise.all as fallback
 * 
 * @param userIds Array of user IDs to fetch
 * @returns Promise resolving to Map of userId -> userData
 * 
 * Usage:
 * const userMap = await batchGetUserProfiles(['id1', 'id2']);
 * const user1 = userMap.get('id1');
 */
export const batchGetUserProfiles = async (userIds: string[]): Promise<Map<string, any>> => {
  const uniqueIds = Array.from(new Set(userIds)); // Remove duplicates
  
  try {
    // Firestore doesn't have native batch get in web SDK
    // Using Promise.all for now
    const userDocs = await Promise.all(
      uniqueIds.map(userId => getDoc(doc(db, 'users', userId)))
    );

    const userMap = new Map<string, any>();
    userDocs.forEach((userDoc, index) => {
      const userId = uniqueIds[index];
      if (userDoc.exists()) {
        const data = userDoc.data();
        userMap.set(userId, {
          id: userId,
          ...data,
          phone: data.phone || data.phoneNumber || null,
          photoURL: data.photoURL || data.photo || null,
          displayName: data.displayName || data.name || 'User',
          role: data.role || 'customer',
        });
      }
    });

    return userMap;
  } catch (error) {
    console.error('Error batch fetching user profiles:', error);
    throw error;
  }
};

