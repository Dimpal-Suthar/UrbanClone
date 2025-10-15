import {
  addCustomDayOff,
  createProviderAvailability,
  getAvailableSlots,
  getProviderAvailability,
  removeCustomDayOff,
  updateProviderAvailability
} from '@/services/availabilityService';
import { AvailabilityCheckResult, UpdateAvailabilityInput } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/**
 * Hook to get provider availability
 */
export const useProviderAvailability = (providerId: string | null) => {
  return useQuery({
    queryKey: ['availability', providerId],
    queryFn: () => {
      if (!providerId) return null;
      return getProviderAvailability(providerId);
    },
    enabled: !!providerId,
  });
};

/**
 * Hook to create provider availability
 */
export const useCreateProviderAvailability = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (providerId: string) => createProviderAvailability(providerId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['availability', data.providerId] });
    },
  });
};

/**
 * Hook to update provider availability
 */
export const useUpdateProviderAvailability = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ providerId, updates }: { providerId: string; updates: UpdateAvailabilityInput }) =>
      updateProviderAvailability(providerId, updates),
    onSuccess: (_, { providerId }) => {
      queryClient.invalidateQueries({ queryKey: ['availability', providerId] });
    },
  });
};

/**
 * Hook to get available slots for a specific date
 */
export const useAvailableSlots = (providerId: string | null, date: Date | null) => {
  console.log('🔍 useAvailableSlots called with:', { providerId, date });
  
  return useQuery({
    queryKey: ['available-slots', providerId, date?.toISOString()],
    queryFn: async (): Promise<AvailabilityCheckResult> => {
      console.log('🔍 useAvailableSlots queryFn called');
      if (!providerId || !date) {
        console.log('  ❌ Missing providerId or date');
        return {
          isAvailable: false,
          availableSlots: [],
          reason: 'Provider or date not specified',
        };
      }
      console.log('  ✅ Calling getAvailableSlots');
      const result = await getAvailableSlots(providerId, date);
      console.log('  result:', result);
      return result;
    },
    enabled: !!providerId && !!date,
  });
};

/**
 * Hook to add a custom day off
 */
export const useAddCustomDayOff = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ providerId, date }: { providerId: string; date: Date }) =>
      addCustomDayOff(providerId, date),
    onSuccess: (_, { providerId }) => {
      queryClient.invalidateQueries({ queryKey: ['availability', providerId] });
    },
  });
};

/**
 * Hook to remove a custom day off
 */
export const useRemoveCustomDayOff = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ providerId, date }: { providerId: string; date: Date }) =>
      removeCustomDayOff(providerId, date),
    onSuccess: (_, { providerId }) => {
      queryClient.invalidateQueries({ queryKey: ['availability', providerId] });
    },
  });
};

