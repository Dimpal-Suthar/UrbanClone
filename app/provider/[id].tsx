import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';
import { ImageCarousel } from '@/components/ui/ImageCarousel';
import { useTheme } from '@/contexts/ThemeContext';
import { useProvidersForService } from '@/hooks/useProviders';
import { useProviderReviews } from '@/hooks/useReviews';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';

export default function ProviderDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useTheme();

  // For now, we'll get the provider from the service providers
  // In a real app, you'd have a direct provider lookup
  const { data: providers = [], isLoading: loadingProviders } = useProvidersForService('NYcfW3AUGAGrdLx3jcaw'); // You'll need to pass the service ID
  
  const provider = providers.find(p => p.id === id);
  
  // Fetch provider reviews
  const { data: reviews = [], isLoading: loadingReviews } = useProviderReviews(id as string);

  // Debug logging
  React.useEffect(() => {
    console.log('🔍 Provider Details Debug:');
    console.log('  - Provider ID:', id);
    console.log('  - Provider found:', !!provider);
    console.log('  - Reviews loading:', loadingReviews);
    console.log('  - Reviews count:', reviews.length);
    console.log('  - Reviews data:', reviews);
  }, [id, provider, loadingReviews, reviews]);

  // Calculate average rating from reviews
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length) 
    : 0;

  // Debug: Log review data to see what we're getting
  React.useEffect(() => {
    if (reviews.length > 0) {
      console.log('🔍 Review Debug Data:');
      reviews.forEach((review, index) => {
        console.log(`Review ${index + 1}:`, {
          id: review.id,
          customerName: review.customerName,
          customerPhoto: review.customerPhoto,
          customerId: review.customerId,
          providerId: review.providerId,
          rating: review.rating,
          comment: review.comment?.substring(0, 50) + '...',
        });
      });
    }
  }, [reviews]);

  // Helper function to get initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loadingProviders) {
    return (
      <Container safeArea={true} edges={['top']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-4 text-base" style={{ color: colors.textSecondary }}>
            Loading provider details...
          </Text>
        </View>
      </Container>
    );
  }

  if (!provider) {
    return (
      <Container safeArea={true} edges={['top']}>
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="person-outline" size={64} color={colors.textSecondary} />
          <Text className="mt-4 text-xl font-bold text-center" style={{ color: colors.text }}>
            Provider Not Found
          </Text>
          <Text className="mt-2 text-base text-center" style={{ color: colors.textSecondary }}>
            The provider you're looking for doesn't exist or has been removed.
          </Text>
          <Button
            title="Go Back"
            onPress={() => router.back()}
            variant="outline"
            className="mt-6"
          />
        </View>
      </Container>
    );
  }

  const offering = provider.offering;
  const providerName = provider.name || provider.displayName || provider.email?.split('@')[0] || 'Professional Provider';

  return (
    <Container safeArea={true} edges={['top']}>
      {/* Header */}
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingHorizontal: 24, 
        paddingVertical: 16, 
        borderBottomWidth: 1, 
        borderBottomColor: colors.border,
        backgroundColor: colors.background,
      }}>
        <Pressable onPress={() => router.back()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text, marginLeft: 16 }}>
          Provider Details
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 24, paddingVertical: 16 }}>
          {/* Provider Profile Card */}
          <Card variant="default" style={{ 
            marginBottom: 24, 
            padding: 20,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              {/* Provider Profile Image with Initials */}
              {provider.photoURL ? (
                <Image
                  source={{ uri: provider.photoURL }}
                  style={{ width: 80, height: 80, borderRadius: 40 }}
                />
              ) : (
                <View style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Text style={{ color: 'white', fontWeight: '700', fontSize: 24 }}>
                    {getInitials(providerName)}
                  </Text>
                </View>
              )}
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 4, color: colors.text }}>
                  {providerName}
                </Text>
                <Text style={{ fontSize: 16, marginBottom: 8, color: colors.textSecondary }}>
                  Professional Service Provider
                </Text>
                {reviews.length > 0 ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="star" size={16} color="#FFD700" />
                    <Text style={{ fontSize: 16, marginLeft: 4, fontWeight: '600', color: colors.text }}>
                      {averageRating.toFixed(1)}
                    </Text>
                    <Text style={{ fontSize: 14, marginLeft: 8, color: colors.textSecondary }}>
                      ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                    </Text>
                  </View>
                ) : (
                  <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                    No reviews yet
                  </Text>
                )}
              </View>
            </View>

            {/* Provider Stats */}
            <View style={{ 
              flexDirection: 'row', 
              justifyContent: 'space-around',
              paddingTop: 16,
              borderTopWidth: 1,
              borderTopColor: colors.border
            }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: colors.primary }}>
                  {offering?.completedJobs || provider.completedJobs || 0}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                  Jobs Completed
                </Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: colors.primary }}>
                  {offering?.experience || provider.experience || 0}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                  Years Experience
                </Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: colors.primary }}>
                  ₹{offering?.customPrice || 0}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                  Starting Price
                </Text>
              </View>
            </View>
          </Card>

          {/* Service Description */}
          {offering?.description && (
            <Card variant="default" style={{ marginBottom: 24, padding: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8, color: colors.text }}>
                About This Service
              </Text>
              <Text style={{ fontSize: 14, lineHeight: 20, color: colors.textSecondary }}>
                {offering.description}
              </Text>
            </Card>
          )}

          {/* Work Examples */}
          {offering?.images && offering.images.length > 0 && (
            <Card variant="default" style={{ marginBottom: 24, padding: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 12, color: colors.text }}>
                Work Examples ({offering.images.length})
              </Text>
              <ImageCarousel
                images={offering.images}
                height={200}
                showIndicators={true}
                showFullScreen={true}
              />
            </Card>
          )}

          {/* Reviews Section */}
          <Card variant="elevated" style={{ marginBottom: 24, padding: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>
                Reviews & Ratings
              </Text>
              {reviews.length > 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="star" size={18} color="#FFD700" />
                  <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginLeft: 4 }}>
                    {(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)}
                  </Text>
                  <Text style={{ fontSize: 14, color: colors.textSecondary, marginLeft: 4 }}>
                    ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                  </Text>
                </View>
              )}
            </View>

            {loadingReviews ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 8 }}>
                  Loading reviews...
                </Text>
              </View>
            ) : reviews.length === 0 ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <Ionicons name="chatbox-outline" size={48} color={colors.textSecondary} />
                <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginTop: 12 }}>
                  No Reviews Yet
                </Text>
                <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 4, textAlign: 'center' }}>
                  Be the first to review this provider
                </Text>
              </View>
            ) : (
              <View>
                {reviews.slice(0, 3).map((review, index) => (
                  <View
                    key={review.id}
                    style={{
                      paddingVertical: 16,
                      borderTopWidth: index > 0 ? 1 : 0,
                      borderTopColor: colors.border,
                    }}
                  >
                    {/* Review Header */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        {/* Customer Avatar */}
                        {review.customerPhoto ? (
                          <Image
                            source={{ uri: review.customerPhoto }}
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 20,
                              backgroundColor: colors.background,
                            }}
                          />
                        ) : (
                          <View
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 20,
                              backgroundColor: colors.primary,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Text style={{ fontSize: 16, fontWeight: '600', color: 'white' }}>
                              {getInitials(review.customerName && review.customerName !== 'Anonymous User' 
                                ? review.customerName 
                                : 'Anonymous Customer')}
                            </Text>
                          </View>
                        )}
                        <View style={{ marginLeft: 12, flex: 1 }}>
                          <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text }}>
                            {review.customerName && review.customerName !== 'Anonymous User' 
                              ? review.customerName 
                              : 'Anonymous Customer'}
                          </Text>
                          <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                            {new Date(review.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                      {/* Rating Stars */}
                      <View style={{ flexDirection: 'row' }}>
                        {Array.from({ length: 5 }, (_, i) => (
                          <Ionicons
                            key={i}
                            name={i < review.rating ? 'star' : 'star-outline'}
                            size={16}
                            color="#FFD700"
                            style={{ marginLeft: 2 }}
                          />
                        ))}
                      </View>
                    </View>

                    {/* Review Comment */}
                    {review.comment && (
                      <Text style={{ fontSize: 14, color: colors.text, lineHeight: 20 }}>
                        {review.comment}
                      </Text>
                    )}

                    {/* Review Images */}
                    {review.images && review.images.length > 0 && (
                      <View style={{ marginTop: 12 }}>
                        <ImageCarousel
                          images={review.images}
                          height={120}
                          showIndicators={true}
                          showFullScreen={true}
                        />
                      </View>
                    )}
                  </View>
                ))}

                {/* View All Reviews Button */}
                {reviews.length > 3 && (
                  <Pressable
                    onPress={() => {
                      router.push(`/provider/reviews/${id}`);
                    }}
                    style={{
                      paddingVertical: 12,
                      alignItems: 'center',
                      marginTop: 12,
                      borderTopWidth: 1,
                      borderTopColor: colors.border,
                    }}
                    className="active:opacity-70"
                  >
                    <Text style={{ fontSize: 15, fontWeight: '600', color: colors.primary }}>
                      View All {reviews.length} Reviews →
                    </Text>
                  </Pressable>
                )}
              </View>
            )}
          </Card>

          {/* Contact Actions */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
            <Button
              title="Book Service"
              onPress={() => {
                // Navigate to booking flow with preselected provider
                router.push({
                  pathname: '/booking/schedule',
                  params: {
                    serviceId: offering?.serviceId || 'default-service',
                    providerId: provider.id,
                    providerName: providerName,
                    serviceName: 'Professional Service',
                    price: offering?.customPrice || 0
                  }
                });
              }}
              className="flex-1"
            />
            <Button
              title="Message"
              variant="outline"
              onPress={() => {
                // Navigate to chat screen with provider
                router.push(`/chat/${provider.id}`);
              }}
              className="flex-1"
            />
          </View>
        </View>
      </ScrollView>
    </Container>
  );
}
