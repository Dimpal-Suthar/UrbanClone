import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';
import { FloatingActionButton } from '@/components/ui/FloatingActionButton';
import { ImagePickerBottomSheet } from '@/components/ui/ImagePickerBottomSheet';
import { Input } from '@/components/ui/Input';
import { SERVICE_CATEGORIES } from '@/constants/ServiceCategories';
import { useTheme } from '@/contexts/ThemeContext';
import { useUploadImage } from '@/hooks/useImageUpload';
import { useAllServices, useCreateService, useDeleteService, useToggleServiceStatus, useUpdateService } from '@/hooks/useServices';
import { CreateServiceInput, Service, ServiceCategory } from '@/types';
import { showFailedMessage, showWarningMessage } from '@/utils/toast';
import { Ionicons } from '@expo/vector-icons';
import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

const AdminServicesScreen = observer(() => {
  const { colors } = useTheme();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  
  // Track loading state for each action
  const [loadingAction, setLoadingAction] = useState<{ id: string; action: 'toggle' | 'delete' } | null>(null);
  
  // Fetch services
  const { data: services = [], isLoading, refetch } = useAllServices();
  
  // Mutations
  const createMutation = useCreateService();
  const updateMutation = useUpdateService();
  const deleteMutation = useDeleteService();
  const toggleMutation = useToggleServiceStatus();
  const uploadImageMutation = useUploadImage();

  const handleCreate = () => {
    setEditingService(null);
    setShowCreateModal(true);
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setShowCreateModal(true);
  };

  const handleDelete = async (service: Service) => {
    setLoadingAction({ id: service.id, action: 'delete' });
    try {
      await deleteMutation.mutateAsync(service.id);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleToggleStatus = async (service: Service) => {
    setLoadingAction({ id: service.id, action: 'toggle' });
    try {
      await toggleMutation.mutateAsync({ serviceId: service.id, isActive: !service.isActive });
    } finally {
      setLoadingAction(null);
    }
  };

  const activeCount = services.filter((s) => s.isActive).length;
  const inactiveCount = services.filter((s) => !s.isActive).length;
  
  return (
    <Container>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Clean Header */}
        <View className="px-6 pt-4 pb-4">
          <Text className="text-2xl font-bold mb-1" style={{ color: colors.text }}>
          Service Management
        </Text>
          <Text className="text-sm" style={{ color: colors.textSecondary }}>
            {services.length} total services
          </Text>
        </View>

        {/* Simple Stats */}
        <View className="flex-row px-6 mb-4 gap-3">
          <Card variant="elevated" className="flex-1 items-center py-3">
            <Text className="text-2xl font-bold mb-1" style={{ color: colors.success }}>
              {activeCount}
            </Text>
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              Active
            </Text>
          </Card>
          <Card variant="elevated" className="flex-1 items-center py-3">
            <Text className="text-2xl font-bold mb-1" style={{ color: colors.error }}>
              {inactiveCount}
            </Text>
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              Inactive
            </Text>
          </Card>
        </View>


        {/* Services List */}
        <View className="px-6">
          {isLoading ? (
            <View className="items-center py-12">
              <ActivityIndicator size="large" color={colors.primary} />
              <Text className="mt-4" style={{ color: colors.textSecondary }}>
                Loading services...
              </Text>
            </View>
          ) : services.length === 0 ? (
            <Card variant="default" className="items-center py-8">
              <Ionicons name="construct-outline" size={48} color={colors.textSecondary} />
              <Text className="mt-4 text-base" style={{ color: colors.textSecondary }}>
                No services yet
              </Text>
              <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                Add your first service to get started
              </Text>
            </Card>
          ) : (
            services.map((service) => (
              <Card key={service.id} variant="elevated" className="mb-4">
                {/* Service Details - Clickable for edit */}
                <Pressable 
                  onPress={() => handleEdit(service)} 
                  className="active:opacity-70"
                >
                  <View className="flex-row">
                    {/* Service Image */}
                    <View className="w-20 h-20 rounded-2xl overflow-hidden mr-4">
                      {service.imageUrl ? (
                        <Image source={{ uri: service.imageUrl }} className="w-full h-full" resizeMode="cover" />
                      ) : (
                        <View className="w-full h-full items-center justify-center" style={{ backgroundColor: colors.background }}>
                          <Ionicons name="image-outline" size={24} color={colors.textSecondary} />
                        </View>
                      )}
                    </View>

                    {/* Service Info */}
                    <View className="flex-1">
                      <View className="flex-row items-start justify-between mb-2">
                        <Text className="text-lg font-bold flex-1" style={{ color: colors.text }} numberOfLines={1}>
                          {service.name}
                        </Text>
                        <View 
                          className="px-3 py-1 rounded-full"
                          style={{ backgroundColor: service.isActive ? `${colors.success}20` : `${colors.error}20` }}
                        >
                          <Text 
                            className="text-xs font-semibold"
                            style={{ color: service.isActive ? colors.success : colors.error }}
                          >
                            {service.isActive ? 'ACTIVE' : 'INACTIVE'}
                          </Text>
                        </View>
                      </View>
                      
                      <Text className="text-sm mb-2" style={{ color: colors.textSecondary }} numberOfLines={2}>
                        {service.description}
                      </Text>
                      
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                          <Text className="text-lg font-bold" style={{ color: colors.primary }}>
                            ₹{service.basePrice}
                          </Text>
                          <Text className="text-sm ml-1" style={{ color: colors.textSecondary }}>
                            /{service.duration}min
                          </Text>
                        </View>
                        <View className="flex-row items-center">
                          <Ionicons name="construct" size={16} color={colors.textSecondary} />
                          <Text className="text-sm ml-1" style={{ color: colors.textSecondary }}>
                            {SERVICE_CATEGORIES.find(c => c.id === service.category)?.name}
        </Text>
      </View>
                      </View>
                    </View>
                  </View>
                </Pressable>

                {/* Action Buttons */}
                <View className="flex-row gap-2 mt-3">
                  <Pressable
                    onPress={() => handleToggleStatus(service)}
                    disabled={loadingAction?.id === service.id}
                    className="flex-1 py-2 rounded-lg items-center active:opacity-70"
                    style={{ 
                      backgroundColor: service.isActive ? `${colors.warning}20` : `${colors.success}20`,
                      opacity: loadingAction?.id === service.id ? 0.6 : 1
                    }}
                  >
                    {loadingAction?.id === service.id && loadingAction.action === 'toggle' ? (
                      <ActivityIndicator 
                        size="small" 
                        color={service.isActive ? colors.warning : colors.success} 
                      />
                    ) : (
                      <Text
                        className="font-semibold text-sm"
                        style={{ color: service.isActive ? colors.warning : colors.success }}
                      >
                        {service.isActive ? 'Deactivate' : 'Activate'}
                      </Text>
                    )}
                  </Pressable>

                  <Pressable
                    onPress={() => handleEdit(service)}
                    className="flex-1 py-2 rounded-lg items-center active:opacity-70"
                    style={{ backgroundColor: `${colors.primary}20` }}
                  >
                    <Text className="font-semibold text-sm" style={{ color: colors.primary }}>
                      Edit
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => handleDelete(service)}
                    disabled={loadingAction?.id === service.id}
                    className="flex-1 py-2 rounded-lg items-center active:opacity-70"
                    style={{ 
                      backgroundColor: `${colors.error}20`,
                      opacity: loadingAction?.id === service.id ? 0.6 : 1
                    }}
                  >
                    {loadingAction?.id === service.id && loadingAction.action === 'delete' ? (
                      <ActivityIndicator size="small" color={colors.error} />
                    ) : (
                      <Text className="font-semibold text-sm" style={{ color: colors.error }}>
                        Delete
                      </Text>
                    )}
                  </Pressable>
                </View>
              </Card>
            ))
          )}
        </View>

        <View className="h-6" />
      </ScrollView>

      {/* Floating Action Button */}
      <FloatingActionButton
        onPress={handleCreate}
        icon="add"
        position="bottom-right"
      />

      {/* Create/Edit Modal */}
      <ServiceFormModal
        visible={showCreateModal}
        service={editingService}
        onClose={() => {
          setShowCreateModal(false);
          setEditingService(null);
        }}
        onCreate={async (data) => {
          await createMutation.mutateAsync(data);
          setShowCreateModal(false);
          refetch();
        }}
        onUpdate={async (id, data) => {
          await updateMutation.mutateAsync({ serviceId: id, updates: data });
          setShowCreateModal(false);
          setEditingService(null);
          refetch();
        }}
        isLoading={createMutation.isPending || updateMutation.isPending || uploadImageMutation.isPending}
        uploadImageMutation={uploadImageMutation}
      />
    </Container>
  );
});

// Service Form Modal Component
interface ServiceFormModalProps {
  visible: boolean;
  service: Service | null;
  onClose: () => void;
  onCreate: (data: CreateServiceInput) => Promise<void>;
  onUpdate: (id: string, data: CreateServiceInput) => Promise<void>;
  isLoading: boolean;
  uploadImageMutation: ReturnType<typeof useUploadImage>;
}

const ServiceFormModal = ({
  visible,
  service,
  onClose,
  onCreate,
  onUpdate,
  isLoading,
  uploadImageMutation,
}: ServiceFormModalProps) => {
  const { colors } = useTheme();
  const [name, setName] = useState(service?.name || '');
  const [description, setDescription] = useState(service?.description || '');
  const [basePrice, setBasePrice] = useState(service?.basePrice.toString() || '');
  const [duration, setDuration] = useState(service?.duration.toString() || '');
  const [category, setCategory] = useState<ServiceCategory>(service?.category || 'cleaning');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [imageUri, setImageUri] = useState(service?.imageUrl || '');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [whatsIncluded, setWhatsIncluded] = useState<string[]>(service?.whatsIncluded || []);
  const [newIncludedItem, setNewIncludedItem] = useState('');

  // Update form when service changes
  React.useEffect(() => {
    if (service) {
      setName(service.name);
      setDescription(service.description);
      setBasePrice(service.basePrice.toString());
      setDuration(service.duration.toString());
      setCategory(service.category);
      setImageUri(service.imageUrl || '');
      setWhatsIncluded(service.whatsIncluded || []);
    } else {
      setName('');
      setDescription('');
      setBasePrice('');
      setDuration('');
      setCategory('cleaning');
      setImageUri('');
      setWhatsIncluded([]);
    }
  }, [service]);

  const handleImageSelected = (uri: string) => {
    setImageUri(uri);
  };

  const handleSubmit = async () => {
    if (!name || !description || !basePrice || !duration) {
      showWarningMessage('Missing Fields', 'Please fill in all required fields');
      return;
    }

    try {
      let finalImageUrl = imageUri;

      // Upload image to Firebase Storage if it's a local URI
      if (imageUri && imageUri.startsWith('file://')) {
        const tempServiceId = service?.id || `temp_${Date.now()}`;
        const path = `services/${tempServiceId}/image`;
        const uploadedUrl = await uploadImageMutation.mutateAsync({ 
          imageUri, 
          path 
        });
        finalImageUrl = uploadedUrl;
      }

      const data: CreateServiceInput = {
        name,
        description,
        basePrice: parseFloat(basePrice),
        duration: parseInt(duration),
        category,
        imageUrl: finalImageUrl || undefined,
        whatsIncluded,
        isActive: true,
      };

      if (service) {
        await onUpdate(service.id, data);
      } else {
        await onCreate(data);
      }
    } catch (error) {
      console.error('Submit service error:', error);
      showFailedMessage('Save Failed', 'Failed to save service. Please try again.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View className="flex-1" style={{ backgroundColor: colors.background }}>
        {/* Modern Header */}
        <View className="pt-12 px-6 pb-6" style={{ backgroundColor: colors.background }}>
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-2xl font-bold" style={{ color: colors.text }}>
                {service ? 'Edit Service' : 'Add New Service'}
              </Text>
              <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                {service ? 'Update service details' : 'Create a new service offering'}
              </Text>
            </View>
            <Pressable 
              onPress={onClose}
              className="w-10 h-10 rounded-full items-center justify-center active:opacity-70"
              style={{ backgroundColor: colors.background }}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>
        </View>

        <ScrollView className="flex-1 px-6 pt-6">
          {/* Service Image - Modern Design */}
          <View className="mb-6">
            <Text className="text-base font-semibold mb-3" style={{ color: colors.text }}>
              Service Image
            </Text>
            <Pressable onPress={() => setShowImagePicker(true)} className="mb-3">
              <View 
                className="h-40 rounded-2xl items-center justify-center border-2 border-dashed overflow-hidden"
                style={{ 
                  backgroundColor: imageUri ? 'transparent' : colors.surface,
                  borderColor: imageUri ? colors.primary : colors.border,
                }}
              >
                {imageUri ? (
                  <View className="relative w-full h-full">
                    <Image source={{ uri: imageUri }} className="w-full h-full rounded-2xl" />
                    <View className="absolute inset-0 bg-black/20 items-center justify-center">
                      <View className="w-12 h-12 rounded-full items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.9)' }}>
                        <Ionicons name="camera" size={24} color={colors.primary} />
                      </View>
                    </View>
                  </View>
                ) : (
                  <View className="items-center">
                    <View className="w-16 h-16 rounded-full items-center justify-center mb-3" style={{ backgroundColor: `${colors.primary}20` }}>
                      <Ionicons name="camera-outline" size={32} color={colors.primary} />
                    </View>
                    <Text className="text-base font-medium mb-1" style={{ color: colors.text }}>
                      Add Service Image
                    </Text>
                    <Text className="text-sm text-center" style={{ color: colors.textSecondary }}>
                      Tap to select from gallery or camera
                    </Text>
                  </View>
                )}
              </View>
            </Pressable>
            {imageUri && (
              <Pressable 
                onPress={() => setImageUri('')} 
                className="self-end flex-row items-center px-3 py-2 rounded-lg active:opacity-70"
                style={{ backgroundColor: `${colors.error}20` }}
              >
                <Ionicons name="trash-outline" size={16} color={colors.error} />
                <Text className="text-sm font-medium ml-2" style={{ color: colors.error }}>
                  Remove Image
                </Text>
              </Pressable>
            )}
          </View>

          <Input
            label="Service Name"
            placeholder="e.g., Deep Home Cleaning"
            value={name}
            onChangeText={setName}
          />

          <View className="mb-4">
            <Text className="text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
              Description
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Describe the service..."
              multiline
              numberOfLines={4}
              className="p-4 rounded-xl"
              style={{
                backgroundColor: colors.background,
                borderWidth: 1.5,
                borderColor: colors.border,
                color: colors.text,
                minHeight: 100,
                textAlignVertical: 'top',
              }}
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          {/* Category Selection - Modern Design */}
          <View className="mb-6">
            <Text className="text-base font-semibold mb-3" style={{ color: colors.text }}>
              Service Category
            </Text>
            <Pressable 
              onPress={() => setShowCategoryPicker(!showCategoryPicker)}
              className="p-4 rounded-2xl flex-row items-center justify-between active:opacity-70"
              style={{ 
                backgroundColor: colors.background, 
                borderWidth: 2, 
                borderColor: showCategoryPicker ? colors.primary : colors.border 
              }}
            >
              <View className="flex-row items-center">
                <View 
                  className="w-10 h-10 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: `${SERVICE_CATEGORIES.find((c) => c.id === category)?.color}20` }}
                >
                  <Ionicons 
                    name={SERVICE_CATEGORIES.find((c) => c.id === category)?.icon as any} 
                    size={20} 
                    color={SERVICE_CATEGORIES.find((c) => c.id === category)?.color} 
                  />
                </View>
                <View>
                  <Text className="text-base font-medium" style={{ color: colors.text }}>
                    {SERVICE_CATEGORIES.find((c) => c.id === category)?.name}
                  </Text>
                  <Text className="text-sm" style={{ color: colors.textSecondary }}>
                    {SERVICE_CATEGORIES.find((c) => c.id === category)?.description}
                  </Text>
                </View>
              </View>
              <Ionicons 
                name={showCategoryPicker ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={colors.textSecondary} 
              />
            </Pressable>

            {showCategoryPicker && (
              <View className="mt-3 rounded-2xl overflow-hidden" style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}>
                {SERVICE_CATEGORIES.map((cat, index) => (
                  <Pressable
                    key={cat.id}
                    onPress={() => {
                      setCategory(cat.id);
                      setShowCategoryPicker(false);
                    }}
                    className="p-4 flex-row items-center active:opacity-70"
                    style={{
                      backgroundColor: category === cat.id ? `${colors.primary}10` : 'transparent',
                      borderBottomWidth: index < SERVICE_CATEGORIES.length - 1 ? 1 : 0,
                      borderBottomColor: colors.border,
                    }}
                  >
                    <View 
                      className="w-10 h-10 rounded-full items-center justify-center mr-3"
                      style={{ backgroundColor: `${cat.color}20` }}
                    >
                      <Ionicons name={cat.icon as any} size={20} color={cat.color} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-medium" style={{ color: colors.text }}>
                        {cat.name}
                      </Text>
                      <Text className="text-sm" style={{ color: colors.textSecondary }}>
                        {cat.description}
                      </Text>
                    </View>
                    {category === cat.id && (
                      <View 
                        className="w-6 h-6 rounded-full items-center justify-center"
                        style={{ backgroundColor: colors.primary }}
                      >
                        <Ionicons name="checkmark" size={16} color="white" />
                      </View>
                    )}
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          <Input
            label="Base Price (₹)"
            placeholder="e.g., 500"
            value={basePrice}
            onChangeText={setBasePrice}
            keyboardType="numeric"
          />

          <Input
            label="Duration (minutes)"
            placeholder="e.g., 120"
            value={duration}
            onChangeText={setDuration}
            keyboardType="numeric"
          />

          {/* What's Included Section */}
          <View className="mb-6">
            <Text className="text-base font-semibold mb-3" style={{ color: colors.text }}>
              What's Included
            </Text>
            
            {/* Add new item input */}
            <View className="flex-row gap-2 mb-3">
              <TextInput
                value={newIncludedItem}
                onChangeText={setNewIncludedItem}
                placeholder="e.g., Deep cleaning of all rooms"
                className="flex-1 p-4 rounded-xl"
                style={{
                  backgroundColor: colors.background,
                  borderWidth: 1.5,
                  borderColor: colors.border,
                  color: colors.text,
                }}
                placeholderTextColor={colors.textSecondary}
              />
              <Pressable
                onPress={() => {
                  if (newIncludedItem.trim()) {
                    setWhatsIncluded([...whatsIncluded, newIncludedItem.trim()]);
                    setNewIncludedItem('');
                  }
                }}
                className="px-4 py-4 rounded-xl items-center justify-center active:opacity-70"
                style={{ backgroundColor: colors.primary }}
              >
                <Ionicons name="add" size={20} color="white" />
              </Pressable>
            </View>

            {/* List of included items */}
            {whatsIncluded.length > 0 && (
              <View className="space-y-2">
                {whatsIncluded.map((item, index) => (
                  <View
                    key={index}
                    className="flex-row items-center justify-between p-3 rounded-xl"
                    style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}
                  >
                    <View className="flex-row items-center flex-1">
                      <View 
                        className="w-6 h-6 rounded-full items-center justify-center mr-3"
                        style={{ backgroundColor: `${colors.success}20` }}
                      >
                        <Ionicons name="checkmark" size={14} color={colors.success} />
                      </View>
                      <Text className="flex-1 text-sm" style={{ color: colors.text }}>
                        {item}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => {
                        const newItems = whatsIncluded.filter((_, i) => i !== index);
                        setWhatsIncluded(newItems);
                      }}
                      className="p-2 rounded-lg active:opacity-70"
                      style={{ backgroundColor: `${colors.error}20` }}
                    >
                      <Ionicons name="close" size={16} color={colors.error} />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View className="h-6" />
        </ScrollView>

        {/* Modern Footer */}
        <View className="px-6 pb-8 pt-6" style={{ backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border }}>
          <View className="flex-row gap-3">
            <Pressable
              onPress={onClose}
              className="flex-1 py-4 rounded-2xl items-center justify-center active:opacity-70"
              style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}
            >
              <Text className="text-lg font-semibold" style={{ color: colors.text }}>
                Cancel
              </Text>
            </Pressable>
            <Button
              title={service ? 'Update Service' : 'Create Service'}
              onPress={handleSubmit}
              disabled={isLoading}
              loading={isLoading}
              variant="primary"
              size="lg"
              className="flex-1"
            />
          </View>
        </View>
      </View>

      {/* Image Picker Bottom Sheet */}
      <ImagePickerBottomSheet
        visible={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onImageSelected={handleImageSelected}
        title="Select Service Image"
      />
    </Modal>
  );
};

export default AdminServicesScreen;
