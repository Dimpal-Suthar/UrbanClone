import { useAuth } from '@/hooks/useAuth';
import { createServiceReview, getCustomerReviews, getProviderReviews, getServiceReviews } from '@/services/reviewService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Get reviews for a specific service
export const useServiceReviews = (serviceId: string) => {
  return useQuery({
    queryKey: ['service-reviews', serviceId],
    queryFn: () => getServiceReviews(serviceId),
    enabled: !!serviceId,
  });
};

// Get reviews for a specific provider
export const useProviderReviews = (providerId: string) => {
  return useQuery({
    queryKey: ['provider-reviews', providerId],
    queryFn: () => getProviderReviews(providerId),
    enabled: !!providerId,
  });
};

// Get reviews by a specific customer
export const useCustomerReviews = (customerId: string) => {
  return useQuery({
    queryKey: ['customer-reviews', customerId],
    queryFn: () => getCustomerReviews(customerId),
    enabled: !!customerId,
  });
};

// Create a new review
export const useCreateReview = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({
      serviceId,
      providerId,
      bookingId,
      rating,
      comment,
      images,
    }: {
      serviceId: string;
      providerId: string;
      bookingId: string;
      rating: number;
      comment: string;
      images?: string[];
    }) => {
      if (!user?.uid) {
        throw new Error('User must be logged in to create a review');
      }
      return createServiceReview(
        bookingId,    // 1st: bookingId
        providerId,   // 2nd: providerId
        user.uid,     // 3rd: customerId
        serviceId,    // 4th: serviceId
        rating,       // 5th: rating
        comment,      // 6th: comment
        images        // 7th: images
      );
    },
    onSuccess: (_, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['service-reviews', variables.serviceId] });
      queryClient.invalidateQueries({ queryKey: ['provider-reviews', variables.providerId] });
      queryClient.invalidateQueries({ queryKey: ['customer-reviews', user?.uid] });
    },
  });
};