import { db } from '@/config/firebase';
import {
  createSavedAddress,
  deleteSavedAddress,
  getSavedAddresses,
  updateSavedAddress,
} from '@/services/savedAddressService';
import { SavedAddress } from '@/types/savedAddress';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { useEffect } from 'react';

/**
 * Hook to get all saved addresses for a user with real-time updates
 */
export const useSavedAddresses = (userId: string | null) => {
  const queryClient = useQueryClient();

  // Set up real-time listener
  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, 'savedAddresses'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const addresses: SavedAddress[] = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as SavedAddress[];
        queryClient.setQueryData(['saved-addresses', userId], addresses);
      },
      (error) => {
        console.error('❌ Error listening to saved addresses:', error);
      }
    );

    return () => unsubscribe();
  }, [userId, queryClient]);

  return useQuery({
    queryKey: ['saved-addresses', userId],
    queryFn: () => {
      if (!userId) return [];
      return getSavedAddresses(userId);
    },
    enabled: !!userId,
  });
};

/**
 * Hook to create a saved address
 */
export const useCreateSavedAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      addressData,
    }: {
      userId: string;
      addressData: Omit<SavedAddress, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
    }) => createSavedAddress(userId, addressData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['saved-addresses', variables.userId] });
    },
  });
};

/**
 * Hook to update a saved address
 */
export const useUpdateSavedAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      addressId,
      updates,
      userId,
    }: {
      addressId: string;
      updates: Partial<Omit<SavedAddress, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;
      userId: string;
    }) => updateSavedAddress(addressId, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['saved-addresses', variables.userId] });
    },
  });
};

/**
 * Hook to delete a saved address
 */
export const useDeleteSavedAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ addressId, userId }: { addressId: string; userId: string }) =>
      deleteSavedAddress(addressId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['saved-addresses', variables.userId] });
    },
  });
};

