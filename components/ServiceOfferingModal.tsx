import { Button } from '@/components/ui/Button';
import { ImagePickerBottomSheet } from '@/components/ui/ImagePickerBottomSheet';
import { Input } from '@/components/ui/Input';
import { getCategoryColor, getCategoryIcon } from '@/constants/ServiceCategories';
import { useTheme } from '@/contexts/ThemeContext';
import { useUploadImages } from '@/hooks/useImageUpload';
import { useActiveServices } from '@/hooks/useServices';
import { ProviderServiceOffering } from '@/types';
import { showFailedMessage } from '@/utils/toast';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Image, Keyboard, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ServiceOfferingModalProps {
  visible: boolean;
  offering?: ProviderServiceOffering | null;
  onClose: () => void;
  onSubmit: (data: {
    serviceId: string;
    customPrice: number;
    description: string;
    experience: number;
    images?: string[];
  }) => Promise<void>;
  isLoading: boolean;
}

export const ServiceOfferingModal: React.FC<ServiceOfferingModalProps> = ({
  visible,
  offering,
  onClose,
  onSubmit,
  isLoading,
}) => {
  const { colors } = useTheme();
  const { data: allServices = [] } = useActiveServices();
  const insets = useSafeAreaInsets();
  
  const [selectedServiceId, setSelectedServiceId] = useState(offering?.serviceId || '');
  const [customPrice, setCustomPrice] = useState(offering?.customPrice?.toString() || '');
  const [description, setDescription] = useState(offering?.description || '');
  const [experience, setExperience] = useState(offering?.experience?.toString() || '');
  const [images, setImages] = useState<string[]>(offering?.images || []);
  const [showServicePicker, setShowServicePicker] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
  const uploadImagesMutation = useUploadImages();

  // Listen to keyboard events
  React.useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Update form when offering changes
  React.useEffect(() => {
    if (offering) {
      setSelectedServiceId(offering.serviceId);
      setCustomPrice(offering.customPrice.toString());
      setDescription(offering.description);
      setExperience(offering.experience.toString());
      setImages(offering.images || []);
    } else {
      setSelectedServiceId('');
      setCustomPrice('');
      setDescription('');
      setExperience('');
      setImages([]);
    }
  }, [offering]);

  // Reset form when modal closes and it's not editing
  React.useEffect(() => {
    if (!visible && !offering) {
      setSelectedServiceId('');
      setCustomPrice('');
      setDescription('');
      setExperience('');
      setImages([]);
      setShowServicePicker(false);
      setShowImagePicker(false);
    }
  }, [visible, offering]);

  const selectedService = allServices.find(s => s.id === selectedServiceId);

  const handleImageSelected = async (imageUri: string) => {
    setUploadingImage(true);
    try {
      const newImages = [...images, imageUri];
      setImages(newImages);
    } catch (error) {
      showFailedMessage('Error', 'Failed to add image');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
  };

  const handleSubmit = async () => {
    if (!selectedServiceId || !customPrice || !description || !experience) {
      showFailedMessage('Error', 'Please fill in all fields');
      return;
    }

    try {
      await onSubmit({
        serviceId: selectedServiceId,
        customPrice: parseFloat(customPrice),
        description,
        experience: parseInt(experience),
        images: images.length > 0 ? images : undefined,
      });
      
      // Reset form if creating new offering (not editing)
      if (!offering) {
        setSelectedServiceId('');
        setCustomPrice('');
        setDescription('');
        setExperience('');
        setImages([]);
      }
      
      onClose();
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View className="flex-1" style={{ backgroundColor: colors.background }}>
        {/* Header */}
        <View className="px-6 pb-6" style={{ paddingTop: Math.max(insets.top + 16, 48), backgroundColor: colors.background }}>
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-2xl font-bold" style={{ color: colors.text }}>
                {offering ? 'Edit Service Offering' : 'Add Service Offering'}
              </Text>
              <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                {offering ? 'Update your service offering' : 'Create a new service offering'}
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

        <ScrollView 
          className="flex-1 px-6 pt-6" 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: keyboardVisible ? 400 : 50 }}
        >
          {/* Service Selection */}
          <View className="mb-6">
            <Text className="text-base font-semibold mb-3" style={{ color: colors.text }}>
              Select Service
            </Text>
            <Pressable 
              onPress={() => setShowServicePicker(!showServicePicker)}
              className="p-4 rounded-2xl flex-row items-center justify-between active:opacity-70"
              style={{ 
                backgroundColor: colors.background, 
                borderWidth: 2, 
                borderColor: showServicePicker ? colors.primary : colors.border 
              }}
            >
              <View className="flex-row items-center flex-1">
                {selectedService ? (
                  <>
                    <View 
                      className="w-10 h-10 rounded-full items-center justify-center mr-3"
                      style={{ backgroundColor: `${getCategoryColor(selectedService.category)}20` }}
                    >
                      <Ionicons name={getCategoryIcon(selectedService.category) as any} size={20} color={getCategoryColor(selectedService.category)} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-medium" style={{ color: colors.text }}>
                        {selectedService.name}
                      </Text>
                      <Text className="text-sm" style={{ color: colors.textSecondary }}>
                        Base Price: ₹{selectedService.basePrice} • {selectedService.duration}min
                      </Text>
                    </View>
                  </>
                ) : (
                  <Text className="text-base font-medium" style={{ color: colors.textSecondary }}>
                    Select a service to offer
                  </Text>
                )}
              </View>
              <Ionicons 
                name={showServicePicker ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={colors.textSecondary} 
              />
            </Pressable>

            {showServicePicker && (
              <View className="mt-3 rounded-2xl overflow-hidden" style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, maxHeight: 300 }}>
                <ScrollView showsVerticalScrollIndicator={true} nestedScrollEnabled={true}>
                  {allServices.map((service, index) => (
                  <Pressable
                    key={service.id}
                    onPress={() => {
                      setSelectedServiceId(service.id);
                      setShowServicePicker(false);
                      // Set default price to base price
                      if (!customPrice) {
                        setCustomPrice(service.basePrice.toString());
                      }
                    }}
                    className="p-4 flex-row items-center active:opacity-70"
                    style={{
                      backgroundColor: selectedServiceId === service.id ? `${colors.primary}10` : 'transparent',
                      borderBottomWidth: index < allServices.length - 1 ? 1 : 0,
                      borderBottomColor: colors.border,
                    }}
                  >
                    <View 
                      className="w-10 h-10 rounded-full items-center justify-center mr-3"
                      style={{ backgroundColor: `${getCategoryColor(service.category)}20` }}
                    >
                      <Ionicons name={getCategoryIcon(service.category) as any} size={20} color={getCategoryColor(service.category)} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-medium" style={{ color: colors.text }}>
                        {service.name}
                      </Text>
                      <Text className="text-sm" style={{ color: colors.textSecondary }}>
                        ₹{service.basePrice} • {service.duration}min
                      </Text>
                    </View>
                    {selectedServiceId === service.id && (
                      <View 
                        className="w-6 h-6 rounded-full items-center justify-center"
                        style={{ backgroundColor: colors.primary }}
                      >
                        <Ionicons name="checkmark" size={16} color="white" />
                      </View>
                    )}
                  </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Custom Price */}
          <Input
            label="Your Price (₹)"
            placeholder="e.g., 500"
            value={customPrice}
            onChangeText={setCustomPrice}
            keyboardType="numeric"
            leftIcon={<Ionicons name="cash-outline" size={20} color={colors.textSecondary} />}
          />

          {/* Description */}
          <View className="mb-6">
            <Text className="text-base font-semibold mb-3" style={{ color: colors.text }}>
              Your Description
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Describe your approach and what makes you special..."
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

          {/* Experience */}
          <Input
            label="Years of Experience"
            placeholder="e.g., 5"
            value={experience}
            onChangeText={setExperience}
            keyboardType="numeric"
            leftIcon={<Ionicons name="time-outline" size={20} color={colors.textSecondary} />}
          />

          {/* Images */}
          <View className="mb-6">
            <Text className="text-base font-semibold mb-3" style={{ color: colors.text }}>
              Work Examples (Optional)
            </Text>
            
            <Pressable onPress={() => setShowImagePicker(true)} className="mb-3" disabled={uploadingImage}>
              <View 
                className="rounded-2xl overflow-hidden"
                style={{ 
                  backgroundColor: colors.background,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                {images.length > 0 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row p-3">
                      {images.map((imageUri, index) => (
                        <View key={index} className="relative mr-3">
                          <Image source={{ uri: imageUri }} className="w-24 h-24 rounded-xl" />
                          <Pressable
                            onPress={() => removeImage(index)}
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full items-center justify-center"
                            style={{ backgroundColor: colors.error }}
                          >
                            <Ionicons name="close" size={14} color="white" />
                          </Pressable>
                        </View>
                      ))}
                      <Pressable
                        onPress={() => setShowImagePicker(true)}
                        disabled={uploadingImage}
                        className="w-24 h-24 rounded-xl items-center justify-center border-2 border-dashed"
                        style={{ borderColor: colors.border, backgroundColor: colors.background }}
                      >
                        {uploadingImage ? (
                          <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                          <Ionicons name="add" size={24} color={colors.textSecondary} />
                        )}
                      </Pressable>
                    </View>
                  </ScrollView>
                ) : (
                  <View className="p-6 items-center">
                    <View className="w-16 h-16 rounded-full items-center justify-center mb-3" style={{ backgroundColor: `${colors.primary}20` }}>
                      <Ionicons name="camera-outline" size={32} color={colors.primary} />
                    </View>
                    <Text className="text-base font-semibold mb-1" style={{ color: colors.text }}>
                      Add Work Examples
                    </Text>
                    <Text className="text-sm text-center" style={{ color: colors.textSecondary }}>
                      Showcase your work with photos
                    </Text>
                  </View>
                )}
              </View>
            </Pressable>
            
            {uploadingImage && (
              <View className="items-center py-2">
                <ActivityIndicator size="small" color={colors.primary} />
                <Text className="text-xs mt-1" style={{ color: colors.textSecondary }}>
                  Uploading...
                </Text>
              </View>
            )}
          </View>

          <View className="h-0" />
          
          {/* Footer */}
          <View className="pt-6" style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom + 8, 8) }}>
            <View className="flex-row gap-3">
              <Pressable
                onPress={onClose}
                className="flex-1 py-4 rounded-2xl items-center justify-center active:opacity-70"
                style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}
              >
                <Text 
                  numberOfLines={1}
                  className="text-lg font-semibold" 
                  style={{ color: colors.text }}
                >
                  Cancel
                </Text>
              </Pressable>
              <Button
                title={offering ? 'Update' : 'Create'}
                onPress={handleSubmit}
                disabled={isLoading}
                loading={isLoading}
                variant="primary"
                size="lg"
                className="flex-1"
              />
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Image Picker Bottom Sheet */}
      <ImagePickerBottomSheet
        visible={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onImageSelected={handleImageSelected}
        title="Add Work Example"
      />
    </Modal>
  );
};
