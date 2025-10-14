import { getAllProviders, getProviderById, getProvidersForService } from '@/services/providerService';
import { useQuery } from '@tanstack/react-query';

/**
 * Get all providers who offer a specific service
 */
export const useProvidersForService = (serviceId: string) => {
  return useQuery({
    queryKey: ['providers-for-service', serviceId],
    queryFn: () => getProvidersForService(serviceId),
    enabled: !!serviceId,
  });
};

/**
 * Get provider by ID
 */
export const useProvider = (providerId: string) => {
  return useQuery({
    queryKey: ['provider', providerId],
    queryFn: () => getProviderById(providerId),
    enabled: !!providerId,
  });
};

/**
 * Get all active providers
 */
export const useAllProviders = () => {
  return useQuery({
    queryKey: ['all-providers'],
    queryFn: getAllProviders,
  });
};
