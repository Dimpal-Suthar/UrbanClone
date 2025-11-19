import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Dimensions, Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';

interface ImageCarouselProps {
  images: string[];
  height?: number;
  showIndicators?: boolean;
  showFullScreen?: boolean;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const ImageCarousel: React.FC<ImageCarouselProps> = ({
  images,
  height = 200,
  showIndicators = true,
  showFullScreen = true,
}) => {
  const { colors } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<Record<string, { width: number; height: number }>>({});

  useEffect(() => {
    images.forEach((uri) => {
      if (!imageDimensions[uri]) {
        Image.getSize(
          uri,
          (width, heightValue) => {
            setImageDimensions((prev) => {
              if (prev[uri]) return prev;
              return { ...prev, [uri]: { width, height: heightValue } };
            });
          },
          () => {}
        );
      }
    });
  }, [images, imageDimensions]);

  if (!images || images.length === 0) {
    return (
      <View 
        className="rounded-2xl items-center justify-center"
        style={{ 
          height, 
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Ionicons name="image-outline" size={48} color={colors.textSecondary} />
        <Text className="mt-2 text-sm" style={{ color: colors.textSecondary }}>
          No images available
        </Text>
      </View>
    );
  }

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / screenWidth);
    setCurrentIndex(index);
  };

  const openFullScreen = () => {
    if (showFullScreen) {
      setShowModal(true);
    }
  };

  return (
    <>
      <View className="relative">
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          className="rounded-2xl overflow-hidden"
        >
          {images.map((imageUri, index) => (
            <Pressable
              key={index}
              onPress={openFullScreen}
              className="active:opacity-90"
            >
              <Image
                source={{ uri: imageUri }}
                style={{ width: screenWidth, height }}
                resizeMode="cover"
              />
            </Pressable>
          ))}
        </ScrollView>

        {/* Image Counter */}
        {images.length > 1 && (
          <View 
            className="absolute top-3 right-3 px-2 py-1 rounded-full"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          >
            <Text className="text-white text-xs font-medium">
              {currentIndex + 1} / {images.length}
            </Text>
          </View>
        )}

        {/* Dots Indicator */}
        {showIndicators && images.length > 1 && (
          <View className="absolute bottom-3 left-0 right-0 flex-row justify-center">
            {images.map((_, index) => (
              <View
                key={index}
                className="w-2 h-2 rounded-full mx-1"
                style={{
                  backgroundColor: index === currentIndex ? colors.primary : 'rgba(255,255,255,0.4)',
                }}
              />
            ))}
          </View>
        )}

        {/* Full Screen Button */}
        {showFullScreen && images.length > 0 && (
          <Pressable
            onPress={openFullScreen}
            className="absolute bottom-3 right-3 w-8 h-8 rounded-full items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          >
            <Ionicons name="expand" size={16} color="white" />
          </Pressable>
        )}
      </View>

      {/* Full Screen Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View className="flex-1 bg-black">
          {/* Header */}
          <View className="flex-row items-center justify-between p-4 pt-12">
            <Pressable
              onPress={() => setShowModal(false)}
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
            >
              <Ionicons name="close" size={24} color="white" />
            </Pressable>
            <Text className="text-white text-lg font-semibold">
              {currentIndex + 1} of {images.length}
            </Text>
            <View className="w-10" />
          </View>

          {/* Image Gallery */}
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScroll}
            className="flex-1"
          >
            {images.map((imageUri, index) => (
              <View
                key={index}
                style={{
                  width: screenWidth,
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {(() => {
                  const dims = imageDimensions[imageUri];
                  const maxWidth = screenWidth;
                  const headerOffset = 140; // approximate space for header + indicators
                  const maxHeight = Math.max(screenHeight - headerOffset, screenHeight * 0.75);

                  if (!dims) {
                    return (
                      <Image
                        source={{ uri: imageUri }}
                        style={{ width: screenWidth, height: maxHeight, resizeMode: 'contain' as const }}
                      />
                    );
                  }

                  const widthScale = maxWidth / dims.width;
                  const heightScale = maxHeight / dims.height;
                  const scale = Math.min(widthScale, heightScale);

                  const fittedWidth = dims.width * scale;
                  const fittedHeight = dims.height * scale;

                  return (
                    <Image
                      source={{ uri: imageUri }}
                      style={{ width: fittedWidth, height: fittedHeight }}
                      resizeMode="contain"
                    />
                  );
                })()}
              </View>
            ))}
          </ScrollView>

          {/* Bottom Dots */}
          <View className="flex-row justify-center pb-8">
            {images.map((_, index) => (
              <View
                key={index}
                className="w-3 h-3 rounded-full mx-1"
                style={{
                  backgroundColor: index === currentIndex ? colors.primary : 'rgba(255,255,255,0.4)',
                }}
              />
            ))}
          </View>
        </View>
      </Modal>
    </>
  );
};
