import { useTheme } from '@/contexts/ThemeContext';
import { showFailedMessage } from '@/utils/toast';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

interface ImagePickerBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onImageSelected: (imageUri: string) => void;
  title?: string;
}

export const ImagePickerBottomSheet: React.FC<ImagePickerBottomSheetProps> = ({
  visible,
  onClose,
  onImageSelected,
  title = 'Select Image',
}) => {
  const { colors } = useTheme();

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
      showFailedMessage(
        'Permission Required',
        'Camera and photo library permissions are required to upload images.'
      );
      return false;
    }
    return true;
  };

  const openCamera = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onImageSelected(result.assets[0].uri);
        onClose();
      }
    } catch (error) {
      console.error('Camera error:', error);
      showFailedMessage('Error', 'Failed to take photo. Please try again.');
    }
  };

  const openGallery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onImageSelected(result.assets[0].uri);
        onClose();
      }
    } catch (error) {
      console.error('Gallery error:', error);
      showFailedMessage('Error', 'Failed to select image. Please try again.');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <Pressable className="flex-1" onPress={onClose} />
        
        <View 
          className="rounded-t-3xl px-6 pt-6 pb-8"
          style={{ backgroundColor: colors.surface }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-xl font-bold" style={{ color: colors.text }}>
              {title}
            </Text>
            <Pressable
              onPress={onClose}
              className="w-8 h-8 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.background }}
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </Pressable>
          </View>

          {/* Options */}
          <View>
            {/* Camera Option */}
            <Pressable
              onPress={openCamera}
              className="flex-row items-center p-4 rounded-2xl active:opacity-70 mb-3"
              style={{ backgroundColor: colors.background }}
            >
              <View 
                className="w-12 h-12 rounded-full items-center justify-center mr-4"
                style={{ backgroundColor: `${colors.primary}20` }}
              >
                <Ionicons name="camera" size={24} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-semibold" style={{ color: colors.text }}>
                  Take Photo
                </Text>
                <Text className="text-sm" style={{ color: colors.textSecondary }}>
                  Use camera to take a new photo
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </Pressable>

            {/* Gallery Option */}
            <Pressable
              onPress={openGallery}
              className="flex-row items-center p-4 rounded-2xl active:opacity-70"
              style={{ backgroundColor: colors.background }}
            >
              <View 
                className="w-12 h-12 rounded-full items-center justify-center mr-4"
                style={{ backgroundColor: `${colors.success}20` }}
              >
                <Ionicons name="images" size={24} color={colors.success} />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-semibold" style={{ color: colors.text }}>
                  Choose from Gallery
                </Text>
                <Text className="text-sm" style={{ color: colors.textSecondary }}>
                  Select an existing photo from your gallery
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Cancel Button */}
          <Pressable
            onPress={onClose}
            className="mt-6 py-4 rounded-2xl items-center active:opacity-70"
            style={{ backgroundColor: colors.background }}
          >
            <Text className="text-lg font-semibold" style={{ color: colors.text }}>
              Cancel
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};
