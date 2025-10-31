import { ProviderCategoryModal } from '@/components/ProviderCategoryModal';
import { ServiceOfferingModal } from '@/components/ServiceOfferingModal';
import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';
import { FloatingActionButton } from '@/components/ui/FloatingActionButton';
import { db } from '@/config/firebase';
import { getCategoryColor, getCategoryIcon, getCategoryName } from '@/constants/ServiceCategories';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { useUploadImages } from '@/hooks/useImageUpload';
import { useUpdateProviderCategories } from '@/hooks/useProviderCategories';
import { useCreateProviderServiceOffering, useDeleteProviderServiceOffering, useProviderServiceOfferings, useToggleProviderServiceAvailability, useUpdateProviderServiceOffering } from '@/hooks/useProviderServices';
import { useActiveServices } from '@/hooks/useServices';
import { getStoragePath } from '@/services/storageService';
import { ProviderServiceOffering, ServiceCategory } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { doc, onSnapshot } from 'firebase/firestore';
import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';

const ProviderServicesScreen = observer(() => {
  const { colors } = useTheme();
  const { user } = useAuth();
  
  // Track loading state for each action
  const [loadingAction, setLoadingAction] = useState<{ id: string; action: 'toggle' | 'delete' } | null>(null);
  
  // Modal state
  const [showOfferingModal, setShowOfferingModal] = useState(false);
  const [editingOffering, setEditingOffering] = useState<ProviderServiceOffering | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Fetch provider data with real-time updates
  const [providerData, setProviderData] = useState<any>(null);
  const [loadingProvider, setLoadingProvider] = useState(true);

  React.useEffect(() => {
    if (!user?.uid) {
      setLoadingProvider(false);
      return;
    }

    setLoadingProvider(true);
    
    // Set up real-time listener for provider data
    const unsubscribe = onSnapshot(
      doc(db, 'providers', user.uid),
      (snapshot) => {
        if (snapshot.exists()) {
          setProviderData(snapshot.data());
        } else {
          setProviderData(null);
        }
        setLoadingProvider(false);
      },
      (error) => {
        console.error('Error listening to provider data:', error);
        setLoadingProvider(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // Fetch provider's service offerings
  const { data: providerOfferings = [], isLoading: loadingOfferings } = useProviderServiceOfferings();
  
  // Fetch all active services for reference
  const { data: allServices = [], isLoading: loadingServices } = useActiveServices();

  // Get provider's service categories
  const providerServiceCategories = providerData?.services || [];

  const isLoading = loadingProvider || loadingOfferings || loadingServices;

  // Debug logging
  React.useEffect(() => {
    console.log('🔍 Provider Services Debug:');
    console.log('  - User ID:', user?.uid);
    console.log('  - Provider Offerings Count:', providerOfferings.length);
    console.log('  - Provider Offerings Data:', providerOfferings);
    console.log('  - Loading Offerings:', loadingOfferings);
    console.log('  - All Services Count:', allServices.length);
    console.log('  - Provider Categories:', providerServiceCategories);
  }, [user?.uid, providerOfferings.length, loadingOfferings, allServices.length, providerServiceCategories]);

  // Mutations
  const createMutation = useCreateProviderServiceOffering();
  const updateMutation = useUpdateProviderServiceOffering();
  const deleteMutation = useDeleteProviderServiceOffering();
  const toggleMutation = useToggleProviderServiceAvailability();
  const updateCategoriesMutation = useUpdateProviderCategories();
  const uploadImagesMutation = useUploadImages();

  const handleDeleteOffering = (offering: ProviderServiceOffering) => {
    Alert.alert(
      'Delete Service Offering',
      `Are you sure you want to delete this service offering?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoadingAction({ id: offering.id, action: 'delete' });
            try {
              await deleteMutation.mutateAsync(offering.id);
            } finally {
              setLoadingAction(null);
            }
          },
        },
      ]
    );
  };

  const handleToggleAvailability = (offering: ProviderServiceOffering) => {
    const action = offering.isAvailable ? 'deactivate' : 'activate';
    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} Service`,
      `Are you sure you want to ${action} this service offering?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          onPress: async () => {
            setLoadingAction({ id: offering.id, action: 'toggle' });
            try {
              await toggleMutation.mutateAsync({ id: offering.id, isAvailable: !offering.isAvailable });
            } finally {
              setLoadingAction(null);
            }
          },
        },
      ]
    );
  };

  const handleCreateOffering = () => {
    setEditingOffering(null);
    setShowOfferingModal(true);
  };

  const handleEditOffering = (offering: ProviderServiceOffering) => {
    setEditingOffering(offering);
    setShowOfferingModal(true);
  };

  const handleSubmitOffering = async (data: {
    serviceId: string;
    customPrice: number;
    description: string;
    experience: number;
    images?: string[];
  }) => {
    if (!user?.uid) return;

    try {
      let finalImages = data.images || [];

      // Upload new images to Firebase Storage (only local URIs need uploading)
      if (finalImages.length > 0) {
        const localImages = finalImages.filter(uri => uri.startsWith('file://'));
        if (localImages.length > 0) {
          // Generate temporary ID for new offerings or use existing ID
          const tempOfferingId = editingOffering?.id || `temp_${Date.now()}`;
          const path = getStoragePath.providerOfferingImages(user.uid, tempOfferingId);
          
          // Upload local images to Firebase Storage
          const uploadedUrls = await uploadImagesMutation.mutateAsync({ 
            imageUris: localImages, 
            path 
          });
          
          // Replace local URIs with Firebase URLs
          finalImages = finalImages.map(uri => {
            if (uri.startsWith('file://')) {
              const index = localImages.indexOf(uri);
              return uploadedUrls[index];
            }
            return uri;
          });
        }
      }

      if (editingOffering) {
        // Update existing offering
        await updateMutation.mutateAsync({
          id: editingOffering.id,
          updates: {
            customPrice: data.customPrice,
            description: data.description,
            experience: data.experience,
            images: finalImages.length > 0 ? finalImages : undefined,
          },
        });
      } else {
        // Create new offering
        console.log('🚀 Creating new offering with data:', {
          providerId: user.uid,
          serviceId: data.serviceId,
          data: {
            customPrice: data.customPrice,
            description: data.description,
            experience: data.experience,
            images: finalImages.length > 0 ? finalImages : [],
          },
        });
        
        const newOffering = await createMutation.mutateAsync({
          providerId: user.uid,
          serviceId: data.serviceId,
          data: {
            customPrice: data.customPrice,
            description: data.description,
            experience: data.experience,
            images: finalImages.length > 0 ? finalImages : [],
          },
        });
        
        console.log('✅ Created offering:', newOffering);
      }
    } catch (error) {
      console.error('Submit offering error:', error);
      Alert.alert('Error', 'Failed to save offering. Please try again.');
    }
  };

  const handleUpdateCategories = async (categories: ServiceCategory[]) => {
    if (!user?.uid) return;
    
    await updateCategoriesMutation.mutateAsync({
      providerId: user.uid,
      categories,
    });
  };

  return (
    <Container safeArea edges={['top', 'bottom']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-4 pb-4">
          <Text className="text-2xl font-bold" style={{ color: colors.text }}>
            My Services
          </Text>
          <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
            {providerOfferings.length} services offered
          </Text>
        </View>

        {/* Status Card */}
        <View className="px-6 mb-6">
          <Card variant="elevated">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-base font-bold mb-1" style={{ color: colors.text }}>
                  Provider Status
                </Text>
                <Text className="text-sm" style={{ color: colors.textSecondary }}>
                  {providerData?.approvalStatus === 'approved' ? 'Active & Approved' : 'Pending Approval'}
                </Text>
              </View>
              <View
                className="px-3 py-1.5 rounded-full"
                style={{
                  backgroundColor:
                    providerData?.approvalStatus === 'approved'
                      ? `${colors.success}20`
                      : `${colors.warning}20`,
                }}
              >
                <Text
                  className="text-xs font-bold"
                  style={{
                    color:
                      providerData?.approvalStatus === 'approved'
                        ? colors.success
                        : colors.warning,
                  }}
                >
                  {providerData?.approvalStatus?.toUpperCase() || 'UNKNOWN'}
                </Text>
              </View>
            </View>
          </Card>
        </View>

        {/* My Services Stats */}
        <View className="flex-row px-6 mb-6 gap-3">
          <Card variant="elevated" className="flex-1 items-center py-3">
            <Text className="text-2xl font-bold mb-1" style={{ color: colors.primary }}>
              {providerOfferings.length}
            </Text>
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              Service Offerings
            </Text>
          </Card>
          <Card variant="elevated" className="flex-1 items-center py-3">
            <Text className="text-2xl font-bold mb-1" style={{ color: colors.success }}>
              {providerOfferings.filter(o => o.isAvailable).length}
            </Text>
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              Available
            </Text>
          </Card>
        </View>


        {/* Services List */}
        <View className="px-6 mb-6">
          <Text className="text-lg font-bold mb-3" style={{ color: colors.text }}>
            Your Service Offerings
          </Text>

          {isLoading ? (
            <View className="items-center py-12">
              <ActivityIndicator size="large" color={colors.primary} />
              <Text className="mt-4" style={{ color: colors.textSecondary }}>
                Loading services...
              </Text>
            </View>
          ) : providerOfferings.length === 0 ? (
            <Card variant="default" className="items-center py-8">
              <Ionicons name="construct-outline" size={48} color={colors.textSecondary} />
              <Text className="mt-4 text-base font-medium" style={{ color: colors.text }}>
                No service offerings yet
              </Text>
              <Text className="text-sm mt-1 text-center" style={{ color: colors.textSecondary }}>
                Add service offerings to start receiving bookings
              </Text>
            </Card>
          ) : (
            providerOfferings.map((offering) => {
              const service = allServices.find(s => s.id === offering.serviceId);
              if (!service) return null;
              
              return (
                <Card key={offering.id} variant="default" className="mb-3">
                  <View className="flex-row">
                    {/* Service Image */}
                    <View className="w-16 h-16 rounded-xl overflow-hidden mr-4">
                      {offering.images && offering.images.length > 0 ? (
                        <Image 
                          source={{ uri: offering.images[0] }} 
                          className="w-full h-full"
                          resizeMode="cover"
                        />
                      ) : service.imageUrl ? (
                        <Image 
                          source={{ uri: service.imageUrl }} 
                          className="w-full h-full"
                          resizeMode="cover"
                        />
                      ) : (
                        <View className="w-full h-full items-center justify-center" style={{ backgroundColor: colors.surface }}>
                          <Ionicons name="construct" size={24} color={colors.textSecondary} />
                        </View>
                      )}
                    </View>

                    {/* Service Info */}
                    <View className="flex-1">
                      <Text className="text-base font-bold mb-1" style={{ color: colors.text }}>
                        {service.name}
                      </Text>
                      <Text className="text-sm mb-2" style={{ color: colors.textSecondary }} numberOfLines={2}>
                        {offering.description}
                      </Text>
                      
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                          <Text className="text-lg font-bold" style={{ color: colors.primary }}>
                            ₹{offering.customPrice}
                          </Text>
                          <Text className="text-sm ml-1" style={{ color: colors.textSecondary }}>
                            /{service.duration}min
                          </Text>
                        </View>
                        
                        <View className="flex-row items-center">
                          <View 
                            className="w-2 h-2 rounded-full mr-2"
                            style={{ backgroundColor: offering.isAvailable ? colors.success : colors.error }}
                          />
                          <Text className="text-xs" style={{ color: colors.textSecondary }}>
                            {offering.isAvailable ? 'Available' : 'Unavailable'}
                          </Text>
                        </View>
                      </View>

                      {/* Experience */}
                      <View className="flex-row items-center mt-1">
                        <Ionicons name="star" size={14} color={colors.warning} />
                        <Text className="text-xs ml-1" style={{ color: colors.textSecondary }}>
                          {offering.experience} years experience
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View className="flex-row gap-2 mt-3">
                    <Pressable
                      onPress={() => handleToggleAvailability(offering)}
                      disabled={loadingAction?.id === offering.id}
                      className="flex-1 py-2 rounded-lg items-center active:opacity-70"
                      style={{ 
                        backgroundColor: offering.isAvailable ? `${colors.warning}20` : `${colors.success}20`,
                        opacity: loadingAction?.id === offering.id ? 0.6 : 1
                      }}
                    >
                      {loadingAction?.id === offering.id && loadingAction.action === 'toggle' ? (
                        <ActivityIndicator 
                          size="small" 
                          color={offering.isAvailable ? colors.warning : colors.success} 
                        />
                      ) : (
                        <Text
                          className="font-semibold text-sm"
                          style={{ color: offering.isAvailable ? colors.warning : colors.success }}
                        >
                          {offering.isAvailable ? 'Deactivate' : 'Activate'}
                        </Text>
                      )}
                    </Pressable>

                    <Pressable
                      onPress={() => handleEditOffering(offering)}
                      className="flex-1 py-2 rounded-lg items-center active:opacity-70"
                      style={{ backgroundColor: `${colors.primary}20` }}
                    >
                      <Text className="font-semibold text-sm" style={{ color: colors.primary }}>
                        Edit
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => handleDeleteOffering(offering)}
                      disabled={loadingAction?.id === offering.id}
                      className="flex-1 py-2 rounded-lg items-center active:opacity-70"
                      style={{ 
                        backgroundColor: `${colors.error}20`,
                        opacity: loadingAction?.id === offering.id ? 0.6 : 1
                      }}
                    >
                      {loadingAction?.id === offering.id && loadingAction.action === 'delete' ? (
                        <ActivityIndicator size="small" color={colors.error} />
                      ) : (
                        <Text className="font-semibold text-sm" style={{ color: colors.error }}>
                          Delete
                        </Text>
                      )}
                    </Pressable>
                  </View>
                </Card>
              );
            })
          )}
        </View>

        {/* Service Categories You Offer */}
        <View className="px-6 mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold" style={{ color: colors.text }}>
              Your Service Categories
            </Text>
            <Pressable
              onPress={() => setShowCategoryModal(true)}
              className="px-3 py-1 rounded-lg active:opacity-70"
              style={{ backgroundColor: `${colors.primary}20` }}
            >
              <Text className="text-sm font-semibold" style={{ color: colors.primary }}>
                Manage
              </Text>
            </Pressable>
          </View>
          
          {providerServiceCategories.length > 0 ? (
            <View className="flex-row flex-wrap gap-2">
              {providerServiceCategories.map((categoryId: string) => {
                const color = getCategoryColor(categoryId as any);
                const icon = getCategoryIcon(categoryId as any);
                const name = getCategoryName(categoryId as any);
                
                return (
                  <View
                    key={categoryId}
                    className="px-4 py-2 rounded-full flex-row items-center"
                    style={{ backgroundColor: `${color}20` }}
                  >
                    <Ionicons name={icon as any} size={18} color={color} />
                    <Text className="ml-2 font-semibold" style={{ color }}>
                      {name}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <Card variant="default" className="items-center py-4">
              <Ionicons name="construct-outline" size={48} color={colors.textSecondary} />
              <Text className="text-base font-medium mt-2" style={{ color: colors.text }}>
                No categories selected
              </Text>
              <Text className="text-sm mt-1 text-center" style={{ color: colors.textSecondary }}>
                Tap "Manage" to select service categories
              </Text>
            </Card>
          )}
        </View>

        {/* Info Card */}
        <View className="px-6 mb-8">
          <Card variant="default">
            <View className="flex-row items-start">
              <View
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: `${colors.primary}20` }}
              >
                <Ionicons name="information-circle" size={24} color={colors.primary} />
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-sm font-bold mb-1" style={{ color: colors.text }}>
                  How it works
                </Text>
                <Text className="text-sm" style={{ color: colors.textSecondary }}>
                  You can manage your service categories anytime. Add or remove categories to control which services you can offer.
                </Text>
              </View>
            </View>
          </Card>
        </View>

        <View className="h-6" />
      </ScrollView>

      {/* Floating Action Button */}
      <FloatingActionButton
        onPress={handleCreateOffering}
        icon="add"
        position="bottom-right"
      />

      {/* Service Offering Modal */}
      <ServiceOfferingModal
        visible={showOfferingModal}
        offering={editingOffering}
        onClose={() => setShowOfferingModal(false)}
        onSubmit={handleSubmitOffering}
        isLoading={createMutation.isPending || updateMutation.isPending || uploadImagesMutation.isPending}
      />

      {/* Category Management Modal */}
      <ProviderCategoryModal
        visible={showCategoryModal}
        currentCategories={providerServiceCategories}
        onClose={() => setShowCategoryModal(false)}
        onSave={handleUpdateCategories}
        isLoading={updateCategoriesMutation.isPending}
      />
    </Container>
  );
});

export default ProviderServicesScreen;
