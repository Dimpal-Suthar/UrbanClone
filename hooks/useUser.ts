import {
  getUserById,
  updateUserAvailability,
  updateUserBio,
  updateUserExperience,
  updateUserPhone,
  updateUserProfile,
} from '@/services/userService';
import { UpdateUserInput } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';

/**
 * Hook to get a user by ID
 */
export const useUser = (userId: string | null) => {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => {
      if (!userId) return null;
      return getUserById(userId);
    },
    enabled: !!userId,
  });
};

/**
 * Hook to update user profile
 */
export const useUpdateUserProfile = () => {
  const queryClient = useQueryClient();
  const { refreshUserProfile } = useAuth();

  return useMutation({
    mutationFn: ({ userId, updates }: { userId: string; updates: UpdateUserInput }) =>
      updateUserProfile(userId, updates),
    onSuccess: async (_, { userId }) => {
      // Invalidate React Query cache
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      
      // Refresh MobX AuthStore to update profile display
      await refreshUserProfile();
      console.log('✅ Profile updated and refreshed in AuthStore');
    },
  });
};

/**
 * Hook to update user phone
 */
export const useUpdateUserPhone = () => {
  const queryClient = useQueryClient();
  const { refreshUserProfile } = useAuth();

  return useMutation({
    mutationFn: ({ userId, phone }: { userId: string; phone: string }) =>
      updateUserPhone(userId, phone),
    onSuccess: async (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      await refreshUserProfile();
    },
  });
};

/**
 * Hook to update user availability (for providers)
 */
export const useUpdateUserAvailability = () => {
  const queryClient = useQueryClient();
  const { refreshUserProfile } = useAuth();

  return useMutation({
    mutationFn: ({ userId, isAvailable }: { userId: string; isAvailable: boolean }) =>
      updateUserAvailability(userId, isAvailable),
    onSuccess: async (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      await refreshUserProfile();
    },
  });
};

/**
 * Hook to update user bio (for providers)
 */
export const useUpdateUserBio = () => {
  const queryClient = useQueryClient();
  const { refreshUserProfile } = useAuth();

  return useMutation({
    mutationFn: ({ userId, bio }: { userId: string; bio: string }) =>
      updateUserBio(userId, bio),
    onSuccess: async (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      await refreshUserProfile();
    },
  });
};

/**
 * Hook to update user experience (for providers)
 */
export const useUpdateUserExperience = () => {
  const queryClient = useQueryClient();
  const { refreshUserProfile } = useAuth();

  return useMutation({
    mutationFn: ({ userId, experience }: { userId: string; experience: number }) =>
      updateUserExperience(userId, experience),
    onSuccess: async (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      await refreshUserProfile();
    },
  });
};
