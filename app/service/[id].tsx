import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';
import { ImageCarousel } from '@/components/ui/ImageCarousel';
import { db } from '@/config/firebase';
import { useTheme } from '@/contexts/ThemeContext';
import { useProvidersForService } from '@/hooks/useProviders';
import { useServiceReviews } from '@/hooks/useReviews';
import { useService } from '@/hooks/useServices';
import { ProviderServiceOffering } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import React from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useTheme();

  console.log('🔍 ServiceDetailScreen - id:', id);
  console.log('🔍 ServiceDetailScreen - id type:', typeof id);

  const { data: service, isLoading, error } = useService(id as string);
  
  // Fetch reviews for this service
  const { data: reviews = [], isLoading: loadingReviews } = useServiceReviews(id as string);
  
  console.log('🔍 ServiceDetailScreen - Reviews Debug:');
  console.log('  - Service ID:', id);
  console.log('  - Reviews Count:', reviews.length);
  console.log('  - Reviews Data:', reviews);
  console.log('  - Loading Reviews:', loadingReviews);
  
  // Fetch providers for this service (users with role='provider' who offer this service)
  const { data: providers = [], isLoading: loadingProviders } = useProvidersForService(id as string);
  
  // Legacy query - keep for backward compatibility but use providers hook above
  const { data: providerOfferings = [], isLoading: loadingOfferingsLegacy } = useQuery({
    queryKey: ['service-providers', id],
    queryFn: async () => {
      if (!id) return [];
      const q = query(
        collection(db, 'providerServices'),
        where('serviceId', '==', id),
        where('isAvailable', '==', true)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as ProviderServiceOffering[];
    },
    enabled: !!id,
  });

  // Fetch provider details for each offering
  const { data: providersData = [] } = useQuery({
    queryKey: ['providers-details', providerOfferings.map(p => p.providerId)],
    queryFn: async () => {
      const providerIds = providerOfferings.map(p => p.providerId);
      const providers = await Promise.all(
        providerIds.map(async (providerId) => {
          const providerDoc = await getDoc(doc(db, 'providers', providerId));
          return providerDoc.exists() ? { id: providerId, ...providerDoc.data() } : null;
        })
      );
      return providers.filter(Boolean);
    },
    enabled: providerOfferings.length > 0,
  });
  
  console.log('🔍 ServiceDetailScreen - service found:', !!service);
  console.log('🔍 ServiceDetailScreen - service:', service);
  console.log('🔍 ServiceDetailScreen - isLoading:', isLoading);
  console.log('🔍 ServiceDetailScreen - error:', error);
  console.log('🔍 ServiceDetailScreen - providerOfferings:', providerOfferings.length);
  
  if (isLoading) {
    return (
      <Container safeArea={true} edges={['top']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-4 text-base" style={{ color: colors.textSecondary }}>
            Loading service details...
          </Text>
        </View>
      </Container>
    );
  }
  
  if (error || !service) {
    console.log('❌ ServiceDetailScreen - No service found for id:', id);
    return (
      <Container safeArea={true} edges={['top']}>
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="alert-circle-outline" size={64} color={colors.textSecondary} />
          <Text className="mt-4 text-xl font-bold text-center" style={{ color: colors.text }}>
            Service Not Found
          </Text>
          <Text className="mt-2 text-base text-center" style={{ color: colors.textSecondary }}>
            The service you're looking for doesn't exist or has been removed.
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

  console.log('🔍 ServiceDetailScreen - providers:', providers.length);


  // Helper function to get initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Prepare images for carousel - only service images from admin
  const serviceImages = service?.imageUrl ? [service.imageUrl] : [];

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
          Service Details
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Service Images Carousel */}
        <ImageCarousel
          images={serviceImages}
          height={256}
          showIndicators={true}
          showFullScreen={true}
        />

        <View style={{ paddingHorizontal: 24, paddingVertical: 16 }}>
          {/* Service Info */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8, color: colors.text }}>
              {service.name}
            </Text>
            <Text style={{ fontSize: 16, marginBottom: 16, color: colors.textSecondary }}>
              {service.description}
            </Text>

            {/* What's Included Section */}
            {service.whatsIncluded && service.whatsIncluded.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12, color: colors.text }}>
                  What's Included
                </Text>
                <View style={{ gap: 8 }}>
                  {service.whatsIncluded.map((item, index) => (
                    <View key={index} style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View 
                        style={{ 
                          width: 20, 
                          height: 20, 
                          borderRadius: 10, 
                          backgroundColor: `${colors.success}20`, 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          marginRight: 12
                        }}
                      >
                        <Ionicons name="checkmark" size={12} color={colors.success} />
                      </View>
                      <Text style={{ fontSize: 14, color: colors.text, flex: 1 }}>
                        {item}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 24 }}>
                <Ionicons name="star" size={20} color="#FFB800" />
                <Text style={{ fontSize: 16, marginLeft: 4, fontWeight: '600', color: colors.text }}>
                  {reviews.length > 0 
                    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
                    : '0.0'
                  }
                </Text>
                <Text style={{ fontSize: 14, marginLeft: 4, color: colors.textSecondary }}>
                  ({reviews.length} reviews)
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
                <Text style={{ fontSize: 16, marginLeft: 4, color: colors.text }}>
                  {service.duration} min
                </Text>
              </View>
            </View>
          </View>

          {/* Price Card */}
          <Card variant="elevated" style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ fontSize: 14, marginBottom: 4, color: colors.textSecondary }}>
                  Service Price
                </Text>
                <Text style={{ fontSize: 32, fontWeight: 'bold', color: colors.primary }}>
                  ₹{service.basePrice}
                </Text>
              </View>
              <View style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: `${colors.success}20` }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.success }}>
                  {service.isActive ? 'Available' : 'Unavailable'}
                </Text>
              </View>
            </View>
          </Card>


          {/* Professionals */}
          <View style={{ marginBottom: 32 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>
                Available Professionals
              </Text>
              {providers.length > 3 && (
                <Pressable 
                  onPress={() => router.push(`/service/professionals/${id}`)}
                  className="active:opacity-70"
                >
                  <View style={{ 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    paddingHorizontal: 12, 
                    paddingVertical: 6,
                    borderRadius: 20,
                    backgroundColor: `${colors.primary}15`
                  }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.primary, marginRight: 4 }}>
                      View All
                    </Text>
                    <View style={{
                      backgroundColor: colors.primary,
                      borderRadius: 10,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      minWidth: 20,
                      alignItems: 'center'
                    }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: 'white' }}>
                        {providers.length}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              )}
            </View>
            
            {loadingProviders ? (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={{ marginTop: 8, color: colors.textSecondary }}>
                  Loading professionals...
                </Text>
              </View>
            ) : providers.length === 0 ? (
              <Card variant="default" style={{ alignItems: 'center', paddingVertical: 20 }}>
                <Ionicons name="person-outline" size={48} color={colors.textSecondary} />
                <Text style={{ marginTop: 8, fontSize: 16, color: colors.text }}>
                  No professionals available
                </Text>
                <Text style={{ marginTop: 4, fontSize: 14, color: colors.textSecondary }}>
                  Check back later for available providers
                </Text>
              </Card>
            ) : (
              providers.slice(0, 3).map((provider) => {
                const offering = provider.offering;
                const providerName = provider.name || provider.displayName || provider.email?.split('@')[0] || 'Professional Provider';
                
                return (
                  <Pressable 
                    key={provider.id} 
                    onPress={() => {
                      router.push(`/provider/${provider.id}`);
                    }}
                    className="active:opacity-70"
                  >
                    <Card variant="default" style={{ 
                      marginBottom: 16, 
                      padding: 16,
                      borderRadius: 16,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 8,
                      elevation: 3
                    }}>
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
                              ₹{offering?.customPrice || service?.basePrice || 0}
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
                          {offering.images.slice(0, 4).map((imageUri, index) => (
                            <View key={index} style={{ marginRight: 8 }}>
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
                          {offering.images.length > 4 && (
                            <View style={{ 
                              width: 60, 
                              height: 60, 
                              borderRadius: 6, 
                              backgroundColor: colors.surface,
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderWidth: 1,
                              borderColor: colors.border
                            }}>
                              <Text style={{ fontSize: 10, color: colors.textSecondary, fontWeight: '600' }}>
                                +{offering.images.length - 4}
                              </Text>
                            </View>
                          )}
                        </ScrollView>
                      </View>
                    )}
                  </Card>
                </Pressable>
              );
            })
          )}
          </View>

          {/* Reviews Section */}
          <View style={{ marginBottom: 32 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>
                Customer Reviews
              </Text>
              {reviews.length > 3 && (
                <Pressable 
                  onPress={() => router.push(`/service/reviews/${id}`)}
                  className="active:opacity-70"
                >
                  <View style={{ 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    paddingHorizontal: 12, 
                    paddingVertical: 6,
                    borderRadius: 20,
                    backgroundColor: `${colors.primary}15`
                  }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.primary, marginRight: 4 }}>
                      View All
                    </Text>
                    <View style={{
                      backgroundColor: colors.primary,
                      borderRadius: 10,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      minWidth: 20,
                      alignItems: 'center'
                    }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: 'white' }}>
                        {reviews.length}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              )}
            </View>
            
            {loadingReviews ? (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={{ marginTop: 8, color: colors.textSecondary }}>
                  Loading reviews...
                </Text>
              </View>
            ) : reviews.length === 0 ? (
              <Card variant="default" style={{ alignItems: 'center', paddingVertical: 20 }}>
                <Ionicons name="chatbubble-outline" size={48} color={colors.textSecondary} />
                <Text style={{ marginTop: 8, fontSize: 16, color: colors.text }}>
                  No reviews yet
                </Text>
                <Text style={{ marginTop: 4, fontSize: 14, color: colors.textSecondary, textAlign: 'center' }}>
                  Reviews will appear here after customers complete bookings
                </Text>
              </Card>
            ) : (
              <>
                {reviews.slice(0, 3).map((review) => (
                  <Card key={review.id} variant="default" style={{ marginBottom: 12 }}>
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
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View style={{ 
        paddingHorizontal: 24, 
        paddingVertical: 16, 
        borderTopWidth: 1, 
        borderTopColor: colors.border,
        backgroundColor: colors.surface,
      }}>
        <View style={{ flexDirection: 'row', gap: 12 , justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}> 
          <Button
            title="Book Now"
            onPress={() => console.log('Book service')}
          />
          </View>
          <View style={{flex:1}}> 
          <Button
            title="Track Service"
            variant="outline"
            onPress={() => {
              console.log('🚀 Button pressed - Track Service');
              console.log('🚀 Current id:', id);
              console.log('🚀 Navigation path:', `/tracking/${id}`);
              console.log('🚀 Router available:', !!router);
              
              // Terminal log - will show in Metro bundler
              console.warn('🔥 TRACKING BUTTON PRESSED - ID:', id);
              
              try {
                router.push('/tracking');
                console.log('✅ Navigation command sent successfully');
                console.warn('🔥 NAVIGATION SUCCESS - Path: /tracking');
              } catch (error) {
                console.log('❌ Navigation error:', error);
                console.warn('🔥 NAVIGATION ERROR:', error);
                Alert.alert('Navigation Error', String(error));
              }
            }}
          />
          </View>
        </View>
      </View>

    </Container>
  );
}

