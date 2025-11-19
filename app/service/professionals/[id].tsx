import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';
import { useTheme } from '@/contexts/ThemeContext';
import { useProvidersForService } from '@/hooks/useProviders';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';

export default function AllProfessionalsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useTheme();

  const { data: providers = [], isLoading: loadingProviders } = useProvidersForService(id as string);

  if (loadingProviders) {
    return (
      <Container safeArea={true} edges={['top']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-4 text-base" style={{ color: colors.textSecondary }}>
            Loading professionals...
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
        backgroundColor: colors.background,
      }}>
        <Pressable onPress={() => router.back()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text, marginLeft: 16 }}>
          All Professionals ({providers.length})
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 24, paddingVertical: 16 }}>
          {providers.length === 0 ? (
            <Card variant="default" style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Ionicons name="person-outline" size={64} color={colors.textSecondary} />
              <Text style={{ marginTop: 16, fontSize: 18, color: colors.text }}>
                No professionals available
              </Text>
              <Text style={{ marginTop: 8, fontSize: 14, color: colors.textSecondary, textAlign: 'center' }}>
                Check back later for available providers
              </Text>
            </Card>
          ) : (
            (() => {
              // Create a Map to ensure uniqueness by provider ID
              const uniqueProvidersMap = new Map();
              providers.forEach((provider) => {
                if (provider?.id && !uniqueProvidersMap.has(provider.id)) {
                  uniqueProvidersMap.set(provider.id, provider);
                }
              });
              const uniqueProviders = Array.from(uniqueProvidersMap.values());
              
              return uniqueProviders.map((provider, mapIndex) => {
              const offering = provider.offering;
              const providerName = provider.name || provider.displayName || provider.email?.split('@')[0] || 'Professional Provider';
              
              // Helper function to get initials
              const getInitials = (name: string) => {
                return name
                  .split(' ')
                  .map(word => word.charAt(0))
                  .join('')
                  .toUpperCase()
                  .slice(0, 2);
              };
              
              return (
                <Pressable 
                  key={`professional-${provider.id}-${mapIndex}`}
                  onPress={() => {
                    router.push(`/provider/${provider.id}`);
                  }}
                  className="active:opacity-70"
                >
                  <Card variant="default" style={{ marginBottom: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      {/* Provider Profile Image with Initials */}
                      {provider.photoURL ? (
                        <Image
                          source={{ uri: provider.photoURL }}
                          style={{ width: 64, height: 64, borderRadius: 32 }}
                        />
                      ) : (
                        <View style={{
                          width: 64,
                          height: 64,
                          borderRadius: 32,
                          backgroundColor: colors.primary,
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Text style={{ color: 'white', fontWeight: '700', fontSize: 20 }}>
                            {getInitials(providerName)}
                          </Text>
                        </View>
                      )}
                      <View style={{ flex: 1, marginLeft: 16 }}>
                        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 4, color: colors.text }}>
                          {providerName}
                        </Text>
                      <Text style={{ fontSize: 14, marginBottom: 4, color: colors.textSecondary }} numberOfLines={2}>
                        {offering?.description || provider.bio || 'Professional service provider'}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                        <Ionicons name="star" size={14} color="#FFB800" />
                        <Text style={{ fontSize: 14, marginLeft: 4, color: colors.text }}>
                          {offering?.rating?.toFixed(1) || provider.rating?.toFixed(1) || '0.0'}
                        </Text>
                        <Text style={{ fontSize: 12, marginLeft: 8, color: colors.textSecondary }}>
                          ({offering?.reviewCount || provider.reviewCount || 0} reviews)
                        </Text>
                        <Text style={{ fontSize: 12, marginLeft: 8, color: colors.textSecondary }}>
                          • {offering?.completedJobs || provider.completedJobs || 0} jobs
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                          <Text style={{ fontSize: 12, marginLeft: 4, color: colors.textSecondary }}>
                            {offering?.experience || provider.experience || 0} years exp
                          </Text>
                        </View>
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.primary }}>
                          ₹{offering?.customPrice || 0}
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                  </View>
                  
                  {/* Provider Work Examples Images */}
                  {offering?.images && offering.images.length > 0 && (
                    <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', marginBottom: 8, color: colors.textSecondary }}>
                        Work Examples ({offering.images.length})
                      </Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
                        {offering.images.map((imageUri, imgIndex) => (
                          <View key={`${provider.id}-image-${imgIndex}-${imageUri?.slice(-20) || imgIndex}`} style={{ marginRight: 8 }}>
                            <Image
                              source={{ uri: imageUri }}
                              style={{ 
                                width: 60, 
                                height: 60, 
                                borderRadius: 6
                              }}
                              resizeMode="cover"
                            />
                          </View>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </Card>
                </Pressable>
              );
            });
            })()
          )}
        </View>
      </ScrollView>
    </Container>
  );
}
