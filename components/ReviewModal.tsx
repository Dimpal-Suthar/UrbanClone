import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';
import { ImagePickerBottomSheet } from '@/components/ui/ImagePickerBottomSheet';
import { useTheme } from '@/contexts/ThemeContext';
import { useUploadImage } from '@/hooks/useImageUpload';
import { showFailedMessage } from '@/utils/toast';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

interface ReviewModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string, images: string[]) => Promise<void>;
  isLoading?: boolean;
  serviceName?: string;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  visible,
  onClose,
  onSubmit,
  isLoading = false,
  serviceName = 'this service',
}) => {
  const { colors } = useTheme();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);
  const [images, setImages] = useState<string[]>([]);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  
  const uploadImageMutation = useUploadImage();

  const handleImageSelected = (imageUri: string) => {
    // Just add the local URI to the array, don't upload yet
    setImages(prev => [...prev, imageUri]);
    setShowImagePicker(false);
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      showFailedMessage('Rating Required', 'Please select a rating before submitting your review.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload all images to Firebase Storage first
      let uploadedImageUrls: string[] = [];
      
      if (images.length > 0) {
        console.log('📸 Uploading', images.length, 'images to Firebase Storage...');
        setUploadProgress({ current: 0, total: images.length });
        
        // Upload images one by one
        for (let i = 0; i < images.length; i++) {
          const imageUri = images[i];
          try {
            setUploadProgress({ current: i + 1, total: images.length });
            const uploadedUrl = await uploadImageMutation.mutateAsync({
              imageUri,
              path: 'review-images'
            });
            uploadedImageUrls.push(uploadedUrl);
            console.log(`✅ Image ${i + 1}/${images.length} uploaded:`, uploadedUrl);
          } catch (error) {
            console.error('❌ Failed to upload image:', imageUri, error);
            // Continue with other images even if one fails
          }
        }
        
        console.log('📸 All images uploaded:', uploadedImageUrls);
        setUploadProgress({ current: 0, total: 0 });
      }
      
      // Submit review with uploaded image URLs
      await onSubmit(rating, comment, uploadedImageUrls);
      
      // Reset form after successful submission
      setRating(0);
      setComment('');
      setImages([]);
      setIsSubmitting(false);
      // Close modal after successful submission
      onClose();
    } catch (error) {
      console.error('Error submitting review:', error);
      setIsSubmitting(false);
      showFailedMessage('Error', 'Failed to submit review. Please try again.');
    }
  };

  const handleClose = () => {
    setRating(0);
    setComment('');
    setImages([]);
    onClose();
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => {
      const starNumber = index + 1;
      const isFilled = starNumber <= rating;
      const isHovered = starNumber <= hoveredRating;
      
      return (
        <Pressable
          key={index}
          onPress={() => setRating(starNumber)}
          onPressIn={() => setHoveredRating(starNumber)}
          onPressOut={() => setHoveredRating(0)}
          className="mr-2"
        >
          <Ionicons
            name={isFilled || isHovered ? 'star' : 'star-outline'}
            size={32}
            color={isFilled || isHovered ? '#FFD700' : colors.textSecondary}
          />
        </Pressable>
      );
    });
  };

  const getRatingText = () => {
    if (rating === 0) return 'Tap to rate';
    if (rating === 1) return 'Poor';
    if (rating === 2) return 'Fair';
    if (rating === 3) return 'Good';
    if (rating === 4) return 'Very Good';
    if (rating === 5) return 'Excellent';
    return '';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <Container safeArea edges={['top', 'bottom']}>
        {/* Header */}
        <View 
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
          }}
        >
          <Pressable onPress={handleClose} style={{ padding: 8 }} className="active:opacity-70">
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>
            Write a Review
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Service Info Card */}
          <Card variant="elevated" style={{ marginBottom: 20, padding: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 4 }}>
              How was your experience?
            </Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 20 }}>
              Your feedback helps other customers make informed decisions.
            </Text>
          </Card>

          {/* Rating Section */}
          <Card variant="elevated" style={{ marginBottom: 20, padding: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 16 }}>
              Overall Rating *
            </Text>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              {renderStars()}
            </View>
            
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.primary }}>
              {getRatingText()}
            </Text>
          </Card>

          {/* Comment Section */}
          <Card variant="elevated" style={{ marginBottom: 20, padding: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 12 }}>
              Share Your Experience (Optional)
            </Text>
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="Share details about your experience..."
              multiline
              numberOfLines={5}
              maxLength={500}
              style={{
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                padding: 16,
                color: colors.text,
                fontSize: 15,
                minHeight: 120,
                textAlignVertical: 'top',
              }}
              placeholderTextColor={colors.textSecondary}
            />
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 8 }}>
              {comment.length}/500 characters
            </Text>
          </Card>

          {/* Photo Upload Section */}
          <Card variant="elevated" style={{ marginBottom: 20, padding: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 12 }}>
              Add Photos (Optional)
            </Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 16 }}>
              Share photos of the completed service
            </Text>

            {/* Image Preview */}
            {images.length > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16, gap: 12 }}>
                {images.map((uri, index) => (
                  <View key={index} style={{ position: 'relative' }}>
                    <Image
                      source={{ uri }}
                      style={{
                        width: 100,
                        height: 100,
                        borderRadius: 12,
                        backgroundColor: colors.surface,
                      }}
                    />
                    <Pressable
                      onPress={() => handleRemoveImage(index)}
                      style={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        backgroundColor: colors.error,
                        borderRadius: 12,
                        width: 24,
                        height: 24,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      className="active:opacity-70"
                    >
                      <Ionicons name="close" size={16} color="white" />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            {/* Add Photo Button */}
            {images.length < 5 && (
              <Pressable
                onPress={() => setShowImagePicker(true)}
                disabled={isSubmitting}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: colors.border,
                  borderStyle: 'dashed',
                  borderRadius: 12,
                  padding: 20,
                  backgroundColor: colors.background,
                }}
                className="active:opacity-70"
              >
                <Ionicons name="camera" size={24} color={colors.primary} />
                <Text style={{ fontSize: 15, fontWeight: '600', color: colors.primary, marginLeft: 8 }}>
                  Add Photo ({images.length}/5)
                </Text>
              </Pressable>
            )}
          </Card>

          {/* Review Guidelines */}
          <Card
            variant="default" 
            style={{
              marginBottom: 20,
              padding: 16,
              backgroundColor: `${colors.primary}10`,
              borderWidth: 1,
              borderColor: `${colors.primary}30`,
            }}
          >
            <View style={{ flexDirection: 'row', marginBottom: 8 }}>
              <Ionicons name="information-circle" size={20} color={colors.primary} />
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text, marginLeft: 8 }}>
                Review Guidelines
              </Text>
            </View>
            <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 20 }}>
              • Be honest and specific about your experience{'\n'}
              • Focus on the service quality and provider{'\n'}
              • Avoid personal or inappropriate content
            </Text>
          </Card>
        </ScrollView>

        {/* Bottom Actions */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.surface,
            gap: 12,
          }}
        >
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Button
                title="Cancel"
                onPress={handleClose}
                variant="outline"
                disabled={isSubmitting}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                title={
                  isSubmitting 
                    ? (uploadProgress.total > 0 
                        ? `Uploading Photos (${uploadProgress.current}/${uploadProgress.total})...` 
                        : "Submitting...") 
                    : "Submit Review"
                }
                onPress={handleSubmit}
                disabled={rating === 0 || isSubmitting}
                loading={isSubmitting}
              />
            </View>
          </View>
        </View>

        {/* Image Picker Bottom Sheet */}
        <ImagePickerBottomSheet
          visible={showImagePicker}
          onClose={() => setShowImagePicker(false)}
          onImageSelected={handleImageSelected}
          title="Add Photo"
        />
      </Container>
    </Modal>
  );
};
