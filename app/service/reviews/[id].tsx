import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';
import { useTheme } from '@/contexts/ThemeContext';
import { useServiceReviews } from '@/hooks/useReviews';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';

export default function AllReviewsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useTheme();

  const { data: reviews = [], isLoading: loadingReviews } = useServiceReviews(id as string);

  // Helper function to get initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loadingReviews) {
    return (
      <Container safeArea={true} edges={['top']}>
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
    <Container safeArea={true} edges={['top']}>
      {/* Header */}
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingHorizontal: 24, 
        paddingVertical: 16, 
        borderBottomWidth: 1, 
        borderBottomColor: colors.border,
        backgroundColor: colors.surface,
      }}>
        <Pressable onPress={() => router.back()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text, marginLeft: 16 }}>
          All Reviews ({reviews.length})
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 24, paddingVertical: 16 }}>
          {reviews.length === 0 ? (
            <Card variant="default" style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Ionicons name="chatbubble-outline" size={64} color={colors.textSecondary} />
              <Text style={{ marginTop: 16, fontSize: 18, color: colors.text }}>
                No reviews yet
              </Text>
              <Text style={{ marginTop: 8, fontSize: 14, color: colors.textSecondary, textAlign: 'center' }}>
                Reviews will appear here after customers complete bookings
              </Text>
            </Card>
          ) : (
            <>
              {reviews.map((review) => (
                <Card key={review.id} variant="default" style={{ marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    {/* Customer Avatar with Initials */}
                    {review.customerPhoto ? (
                      <Image
                        source={{ uri: review.customerPhoto }}
                        style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }}
                      />
                    ) : (
                      <View style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: colors.primary,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12
                      }}>
                        <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>
                          {getInitials(review.customerName || 'Anonymous User')}
                        </Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginRight: 8 }}>
                          {review.customerName || 'Anonymous User'}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          {[...Array(5)].map((_, i) => (
                            <Ionicons
                              key={i}
                              name={i < review.rating ? "star" : "star-outline"}
                              size={14}
                              color="#FFB800"
                            />
                          ))}
                        </View>
                      </View>
                      <Text style={{ fontSize: 14, color: colors.text, marginBottom: 8 }}>
                        {review.comment}
                      </Text>
                      <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                        {new Date(review.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                </Card>
              ))}
            </>
          )}
        </View>
      </ScrollView>
    </Container>
  );
}
