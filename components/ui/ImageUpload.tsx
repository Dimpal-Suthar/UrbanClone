import { ImagePickerBottomSheet } from '@/components/ui/ImagePickerBottomSheet';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  View
} from 'react-native';

interface ImageUploadProps {
  onImageSelect: (uri: string) => void;
  currentImage?: string;
  placeholder?: string;
  loading?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageSelect,
  currentImage,
  placeholder = "Select Image",
  loading = false
}) => {
  const { colors } = useTheme();
  const [showPicker, setShowPicker] = useState(false);

  console.log('🖼️ ImageUpload Debug:');
  console.log('currentImage prop:', currentImage);
  console.log('currentImage type:', typeof currentImage);
  console.log('currentImage length:', currentImage?.length);

  const handleImageSelect = (uri: string) => {
    onImageSelect(uri);
    setShowPicker(false);
  };

  return (
    <>
      <View className="pt-4 mb-4" style={{ backgroundColor: colors.background }}> 
        <View className="relative self-center mb-4">
          {currentImage && currentImage.length > 0 ? (
            <Image 
              source={{ uri: currentImage }} 
              className="w-32 h-32 rounded-full"
              onError={(error) => {
                console.log('❌ Image load error:', error);
                console.log('Failed URL:', currentImage);
              }}
              onLoad={() => {
                console.log('✅ Image loaded successfully:', currentImage);
              }}
            />
          ) : (
            <View 
              className="w-32 h-32 rounded-full items-center justify-center"
              style={{ backgroundColor: colors.border }}
            >
              <Ionicons name="person" size={48} color={colors.textSecondary} />
            </View>
          )}
          
          <Pressable
            className="absolute bottom-0 right-0 w-10 h-10 rounded-full items-center justify-center border-2 border-white active:opacity-70"
            style={{ backgroundColor: `${colors.primary}20` }}
            onPress={() => setShowPicker(true)}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="camera" size={24} color={colors.primary} />
            )}
          </Pressable>
        </View>
        
        {/* <Button
          title={currentImage ? "Change Photo" : placeholder}
          onPress={() => setShowPicker(true)}
          variant="outline"
          size="sm"
          className="self-center"
          disabled={loading}
        /> */}
      </View>

      <ImagePickerBottomSheet
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        onImageSelected={handleImageSelect}
        title="Upload Profile Photo"
      />
    </>
  );
};
