import {
  createProviderServiceOffering,
  deleteProviderServiceOffering,
  getProviderServiceOffering,
  getProviderServiceOfferings,
  toggleProviderServiceAvailability,
  updateProviderServiceOffering,
} from '@/services/providerServiceService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';

export const useProviderServiceOfferings = (providerId?: string) => {
  const { user } = useAuth();
  const id = providerId || user?.uid;

  return useQuery({
    queryKey: ['provider-service-offerings', id],
    queryFn: () => getProviderServiceOfferings(id!),
    enabled: !!id,
  });
};

export const useProviderServiceOffering = (id: string) => {
  return useQuery({
    queryKey: ['provider-service-offering', id],
    queryFn: () => getProviderServiceOffering(id),
    enabled: !!id,
  });
};

export const useCreateProviderServiceOffering = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ providerId, serviceId, data }: {
      providerId: string;
      serviceId: string;
      data: {
        customPrice: number;
        experience: number;
        description: string;
        images: string[];
      };
    }) => createProviderServiceOffering(providerId, serviceId, data),
    onSuccess: () => {
      // Invalidate all provider service offerings queries
      queryClient.invalidateQueries({ queryKey: ['provider-service-offerings'] });
      console.log('🔄 Invalidated provider service offerings queries');
    },
  });
};

export const useUpdateProviderServiceOffering = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      updateProviderServiceOffering(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['provider-service-offering', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['provider-service-offerings'] });
    },
  });
};

export const useDeleteProviderServiceOffering = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProviderServiceOffering,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-service-offerings'] });
    },
  });
};

export const useToggleProviderServiceAvailability = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isAvailable }: { id: string; isAvailable: boolean }) =>
      toggleProviderServiceAvailability(id, isAvailable),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-service-offerings'] });
    },
  });
};
