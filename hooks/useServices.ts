import serviceService from '@/services/serviceService';
import { CreateServiceInput, Service, UpdateServiceInput } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';

// Query keys for caching
export const serviceKeys = {
  all: ['services'] as const,
  lists: () => [...serviceKeys.all, 'list'] as const,
  list: (filters: string) => [...serviceKeys.lists(), filters] as const,
  active: () => [...serviceKeys.all, 'active'] as const,
  category: (category: string) => [...serviceKeys.all, 'category', category] as const,
  detail: (id: string) => [...serviceKeys.all, 'detail', id] as const,
};

/**
 * Hook to fetch all services
 */
export const useAllServices = () => {
  return useQuery<Service[], Error>({
    queryKey: serviceKeys.lists(),
    queryFn: () => serviceService.getAllServices(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
  });
};

/**
 * Hook to fetch active services only
 */
export const useActiveServices = () => {
  return useQuery<Service[], Error>({
    queryKey: serviceKeys.active(),
    queryFn: () => serviceService.getActiveServices(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

/**
 * Hook to fetch services by category
 */
export const useServicesByCategory = (category: string) => {
  return useQuery<Service[], Error>({
    queryKey: serviceKeys.category(category),
    queryFn: () => serviceService.getServicesByCategory(category),
    enabled: !!category,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

/**
 * Hook to fetch a single service
 */
export const useService = (serviceId: string) => {
  return useQuery<Service | null, Error>({
    queryKey: serviceKeys.detail(serviceId),
    queryFn: () => serviceService.getServiceById(serviceId),
    enabled: !!serviceId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

/**
 * Hook to create a new service
 */
export const useCreateService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateServiceInput) => serviceService.createService(data),
    onSuccess: (newService) => {
      // Invalidate all service queries
      queryClient.invalidateQueries({ queryKey: serviceKeys.all });
      
      // Optimistically add to cache
      queryClient.setQueryData<Service[]>(serviceKeys.lists(), (old) => {
        return old ? [newService, ...old] : [newService];
      });
      
      Alert.alert('Success', 'Service created successfully!');
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to create service');
    },
  });
};

/**
 * Hook to update a service
 */
export const useUpdateService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ serviceId, updates }: { serviceId: string; updates: UpdateServiceInput }) =>
      serviceService.updateService(serviceId, updates),
    onSuccess: (_, variables) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: serviceKeys.all });
      queryClient.invalidateQueries({ queryKey: serviceKeys.detail(variables.serviceId) });
      
      Alert.alert('Success', 'Service updated successfully!');
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to update service');
    },
  });
};

/**
 * Hook to delete a service
 */
export const useDeleteService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (serviceId: string) => serviceService.deleteService(serviceId),
    onSuccess: (_, serviceId) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: serviceKeys.all });
      
      // Remove from cache
      queryClient.removeQueries({ queryKey: serviceKeys.detail(serviceId) });
      
      Alert.alert('Success', 'Service deleted successfully!');
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to delete service');
    },
  });
};

/**
 * Hook to toggle service status
 */
export const useToggleServiceStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ serviceId, isActive }: { serviceId: string; isActive: boolean }) =>
      serviceService.toggleServiceStatus(serviceId, isActive),
    onSuccess: (_, variables) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: serviceKeys.all });
      queryClient.invalidateQueries({ queryKey: serviceKeys.detail(variables.serviceId) });
      
      const status = variables.isActive ? 'activated' : 'deactivated';
      Alert.alert('Success', `Service ${status} successfully!`);
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to toggle service status');
    },
  });
};

