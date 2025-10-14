import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';
import { ImageCarousel } from '@/components/ui/ImageCarousel';
import { useTheme } from '@/contexts/ThemeContext';
import { useProvidersForService } from '@/hooks/useProviders';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';

export default function ProviderDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useTheme();

  // For now, we'll get the provider from the service providers
  // In a real app, you'd have a direct provider lookup
  const { data: providers = [], isLoading: loadingProviders } = useProvidersForService('NYcfW3AUGAGrdLx3jcaw'); // You'll need to pass the service ID
  
  const provider = providers.find(p => p.id === id);

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
        backgroundColor: colors.surface,
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
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3
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
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="star" size={16} color="#FFB800" />
                  <Text style={{ fontSize: 16, marginLeft: 4, color: colors.text }}>
                    {offering?.rating?.toFixed(1) || provider.rating?.toFixed(1) || '0.0'}
                  </Text>
                  <Text style={{ fontSize: 14, marginLeft: 8, color: colors.textSecondary }}>
                    ({offering?.reviewCount || provider.reviewCount || 0} reviews)
                  </Text>
                </View>
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

          {/* Contact Actions */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
            <Button
              title="Book Service"
              onPress={() => {
                // TODO: Navigate to booking screen
                console.log('Book service with provider:', provider.id);
              }}
              className="flex-1"
            />
            <Button
              title="Message"
              variant="outline"
              onPress={() => {
                // TODO: Navigate to chat screen
                console.log('Message provider:', provider.id);
              }}
              className="flex-1"
            />
          </View>
        </View>
      </ScrollView>
    </Container>
  );
}
