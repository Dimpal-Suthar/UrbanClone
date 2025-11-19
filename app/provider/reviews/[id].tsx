import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';
import { ImageCarousel } from '@/components/ui/ImageCarousel';
import { useTheme } from '@/contexts/ThemeContext';
import { useProviderReviews } from '@/hooks/useReviews';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';

export default function ProviderReviewsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useTheme();

  // Fetch all provider reviews
  const { data: reviews = [], isLoading } = useProviderReviews(id as string);

  // Calculate average rating
  const averageRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length)
    : 0;

  // Get rating distribution
  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length,
    percentage: reviews.length > 0 
      ? (reviews.filter(r => r.rating === rating).length / reviews.length) * 100 
      : 0,
  }));

  // Helper function to get initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <Container safeArea edges={['top']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-4 text-base" style={{ color: colors.textSecondary }}>
            Loading reviews...
          </Text>
        </View>
      </Container>
    );
  }

  return (
    <Container safeArea edges={['top']}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.background,
        }}
      >
        <Pressable onPress={() => router.back()} style={{ padding: 8 }} className="active:opacity-70">
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginLeft: 12 }}>
          Reviews & Ratings
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Rating Summary Card */}
        <Card variant="elevated" style={{ margin: 20, padding: 24 }}>
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ fontSize: 48, fontWeight: '700', color: colors.text, marginBottom: 8 }}>
              {averageRating.toFixed(1)}
            </Text>
            <View style={{ flexDirection: 'row', marginBottom: 8 }}>
              {Array.from({ length: 5 }, (_, i) => (
                <Ionicons
                  key={i}
                  name={i < Math.round(averageRating) ? 'star' : 'star-outline'}
                  size={24}
                  color="#FFD700"
                  style={{ marginHorizontal: 2 }}
                />
              ))}
            </View>
            <Text style={{ fontSize: 14, color: colors.textSecondary }}>
              Based on {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
            </Text>
          </View>

          {/* Rating Distribution */}
          {reviews.length > 0 && (
            <View style={{ marginTop: 16 }}>
              {ratingDistribution.map(({ rating, count, percentage }) => (
                <View
                  key={rating}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 8,
                  }}
                >
                  <Text style={{ fontSize: 14, color: colors.text, width: 30 }}>
                    {rating} ★
                  </Text>
                  <View
                    style={{
                      flex: 1,
                      height: 8,
                      backgroundColor: colors.background,
                      borderRadius: 4,
                      marginHorizontal: 12,
                      overflow: 'hidden',
                    }}
                  >
                    <View
                      style={{
                        width: `${percentage}%`,
                        height: '100%',
                        backgroundColor: colors.primary,
                        borderRadius: 4,
                      }}
                    />
                  </View>
                  <Text style={{ fontSize: 14, color: colors.textSecondary, width: 40, textAlign: 'right' }}>
                    {count}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* All Reviews */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 16 }}>
            All Reviews
          </Text>

          {reviews.length === 0 ? (
            <Card variant="elevated" style={{ padding: 40, alignItems: 'center' }}>
              <Ionicons name="chatbox-outline" size={64} color={colors.textSecondary} />
              <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text, marginTop: 16 }}>
                No Reviews Yet
              </Text>
              <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 8, textAlign: 'center' }}>
                Be the first to review this provider
              </Text>
            </Card>
          ) : (
            reviews.map((review, index) => (
              <Card
                key={review.id}
                variant="elevated"
                style={{ marginBottom: 16, padding: 20 }}
              >
                {/* Review Header */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    {/* Customer Avatar */}
                    {review.customerPhoto ? (
                      <Image
                        source={{ uri: review.customerPhoto }}
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 24,
                          backgroundColor: colors.background,
                        }}
                      />
                    ) : (
                      <View
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 24,
                          backgroundColor: colors.primary,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{ fontSize: 18, fontWeight: '600', color: 'white' }}>
                          {getInitials(review.customerName && review.customerName !== 'Anonymous User' 
                            ? review.customerName 
                            : 'Anonymous Customer')}
                        </Text>
                      </View>
                    )}
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
                        {review.customerName && review.customerName !== 'Anonymous User' 
                          ? review.customerName 
                          : 'Anonymous Customer'}
                      </Text>
                      <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                        {new Date(review.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Rating Stars */}
                <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <Ionicons
                      key={i}
                      name={i < review.rating ? 'star' : 'star-outline'}
                      size={20}
                      color="#FFD700"
                      style={{ marginRight: 4 }}
                    />
                  ))}
                  <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text, marginLeft: 8 }}>
                    {review.rating}.0
                  </Text>
                </View>

                {/* Review Comment */}
                {review.comment && (
                  <Text style={{ fontSize: 15, color: colors.text, lineHeight: 22 }}>
                    {review.comment}
                  </Text>
                )}

                {/* Review Images */}
                {review.images && review.images.length > 0 && (
                  <View style={{ marginTop: 12 }}>
                    <ImageCarousel
                      images={review.images}
                      height={150}
                      showIndicators={true}
                      showFullScreen={true}
                    />
                  </View>
                )}
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </Container>
  );
}

