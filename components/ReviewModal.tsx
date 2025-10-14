import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Input } from '@/components/ui/Input';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';

interface ReviewModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => Promise<void>;
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

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a rating before submitting your review.');
      return;
    }

    try {
      await onSubmit(rating, comment);
      // Reset form
      setRating(0);
      setComment('');
      onClose();
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    }
  };

  const handleClose = () => {
    setRating(0);
    setComment('');
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
      <Container className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 border-b" style={{ borderBottomColor: colors.border }}>
          <Pressable onPress={handleClose} className="p-2">
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
          <Text className="text-lg font-semibold" style={{ color: colors.text }}>
            Write a Review
          </Text>
          <View className="w-10" />
        </View>

        <ScrollView className="flex-1 p-4">
          {/* Service Info */}
          <View className="mb-6">
            <Text className="text-base font-medium mb-2" style={{ color: colors.text }}>
              How was your experience with {serviceName}?
            </Text>
            <Text className="text-sm" style={{ color: colors.textSecondary }}>
              Your feedback helps other customers make informed decisions.
            </Text>
          </View>

          {/* Rating Section */}
          <View className="mb-6">
            <Text className="text-base font-semibold mb-4" style={{ color: colors.text }}>
              Overall Rating *
            </Text>
            
            <View className="flex-row items-center mb-2">
              {renderStars()}
            </View>
            
            <Text className="text-sm font-medium" style={{ color: colors.primary }}>
              {getRatingText()}
            </Text>
          </View>

          {/* Comment Section */}
          <View className="mb-6">
            <Text className="text-base font-semibold mb-3" style={{ color: colors.text }}>
              Tell us more (Optional)
            </Text>
            <Input
              value={comment}
              onChangeText={setComment}
              placeholder="Share details about your experience..."
              multiline
              numberOfLines={4}
              className="p-4 rounded-xl"
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1.5,
                borderColor: colors.border,
                color: colors.text,
                minHeight: 100,
                textAlignVertical: 'top',
              }}
              placeholderTextColor={colors.textSecondary}
            />
            <Text className="text-xs mt-2" style={{ color: colors.textSecondary }}>
              {comment.length}/500 characters
            </Text>
          </View>

          {/* Review Guidelines */}
          <View 
            className="p-4 rounded-xl mb-6"
            style={{ backgroundColor: colors.surface }}
          >
            <Text className="text-sm font-semibold mb-2" style={{ color: colors.text }}>
              Review Guidelines:
            </Text>
            <Text className="text-xs leading-5" style={{ color: colors.textSecondary }}>
              • Be honest and specific about your experience{'\n'}
              • Focus on the service quality and provider performance{'\n'}
              • Avoid personal information or inappropriate content{'\n'}
              • Your review will be visible to other customers
            </Text>
          </View>
        </ScrollView>

        {/* Bottom Actions */}
        <View className="p-4 border-t" style={{ borderTopColor: colors.border }}>
          <View className="flex-row space-x-3">
            <Button
              title="Cancel"
              onPress={handleClose}
              variant="outline"
              className="flex-1"
            />
            <Button
              title={isLoading ? "Submitting..." : "Submit Review"}
              onPress={handleSubmit}
              disabled={rating === 0 || isLoading}
              className="flex-1"
            />
          </View>
        </View>
      </Container>
    </Modal>
  );
};
