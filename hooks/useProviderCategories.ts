import { updateProviderCategories } from '@/services/providerService';
import { ServiceCategory } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useUpdateProviderCategories = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ providerId, categories }: { providerId: string; categories: ServiceCategory[] }) =>
      updateProviderCategories(providerId, categories),
    onSuccess: (_, variables) => {
      // Invalidate provider data queries
      queryClient.invalidateQueries({ queryKey: ['provider-data', variables.providerId] });
      queryClient.invalidateQueries({ queryKey: ['providers'] });
    },
  });
};
