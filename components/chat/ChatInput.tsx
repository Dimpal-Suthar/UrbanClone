import { ImagePickerBottomSheet } from '@/components/ui/ImagePickerBottomSheet';
import { useTheme } from '@/contexts/ThemeContext';
import { showFailedMessage } from '@/utils/toast';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';

interface ChatInputProps {
  onSend: (payload: { text: string; imageUris: string[] }) => Promise<void> | void;
  placeholder?: string;
  disabled?: boolean;
  onTypingChange?: (isTyping: boolean) => void;
}

const MAX_IMAGES = 4;

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  placeholder = 'Type a message...',
  disabled = false,
  onTypingChange,
}) => {
  const { colors } = useTheme();
  const [text, setText] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | number | null>(null);
  const isTypingRef = useRef(false);

  const notifyTyping = (value: boolean) => {
    if (onTypingChange && isTypingRef.current !== value) {
      isTypingRef.current = value;
      onTypingChange(value);
    }
  };

  const scheduleTypingStop = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      notifyTyping(false);
    }, 2000);
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      notifyTyping(false);
    };
  }, []);

  const handleTextChange = (value: string) => {
    setText(value);
    if (disabled) return;

    if (value.trim().length > 0) {
      notifyTyping(true);
      scheduleTypingStop();
    } else {
      notifyTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    }
  };

  const handleSend = async () => {
    if (disabled || isSending) return;

    const payload = {
      text: text.trim(),
      imageUris: [...selectedImages],
    };

    if (!payload.text && payload.imageUris.length === 0) {
      notifyTyping(false);
      return;
    }

    const previousText = text;
    const previousImages = [...selectedImages];
    setText('');
    setSelectedImages([]);
    try {
      setIsSending(true);
      await onSend(payload);
    } catch (error) {
      setText(previousText);
      setSelectedImages(previousImages);
      console.error('Failed to send chat message:', error);
    } finally {
      setIsSending(false);
      if (!payload.text && payload.imageUris.length === 0) {
        setText(previousText);
        setSelectedImages(previousImages);
      }
    }
    notifyTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  const handlePickImage = () => {
    setShowImagePicker(true);
  };

  const handleImageSelected = (imageUri: string) => {
    setSelectedImages((prev) => {
      if (prev.some((uri) => uri === imageUri)) {
        setShowImagePicker(false);
        return prev;
      }
      if (prev.length >= MAX_IMAGES) {
        showFailedMessage('Limit Reached', `You can attach up to ${MAX_IMAGES} images per message.`);
        setShowImagePicker(false);
        return prev;
      }
      const updated = [...prev, imageUri];
      setShowImagePicker(false);
      return updated;
    });
  };

  return (
    <View
      style={{
        paddingHorizontal: 12,
        paddingTop: 10,
        paddingBottom: 12,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.background,
      }}
    >
      <ImagePickerBottomSheet
        visible={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onImageSelected={handleImageSelected}
        title="Select Image"
      />

      {selectedImages.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 10 }}
          contentContainerStyle={{ alignItems: 'center' }}
        >
          {selectedImages.map((uri, idx) => (
            <View key={`${uri}-${idx}`} style={{ marginRight: 10, position: 'relative' }}>
              <Image source={{ uri }} style={{ width: 56, height: 56, borderRadius: 10 }} />
              <Pressable
                onPress={() =>
                  setSelectedImages((prev) => prev.filter((_, index) => index !== idx))
                }
                hitSlop={8}
                style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.background,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Ionicons name="close" size={12} color={colors.text} />
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Pressable
          onPress={handlePickImage}
          disabled={disabled || isSending || selectedImages.length >= MAX_IMAGES}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 10,
            opacity: disabled || isSending || selectedImages.length >= MAX_IMAGES ? 0.5 : 1,
          }}
        >
          <Ionicons name="image-outline" size={24} color={colors.textSecondary} />
        </Pressable>

        <View
          style={{
            flex: 1,
            backgroundColor: colors.background,
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: Platform.OS === 'ios' ? 8 : 4,
            borderWidth: 1,
            borderColor: colors.border,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <TextInput
            value={text}
            onChangeText={handleTextChange}
            placeholder={placeholder}
            placeholderTextColor={colors.textSecondary}
            style={{
              flex: 1,
              fontSize: 15,
              color: colors.text,
              maxHeight: 120,
            }}
            multiline
            editable={!disabled && !isSending}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            maxLength={500}
          />
        </View>

        <Pressable
          onPress={handleSend}
          disabled={(!text.trim() && selectedImages.length === 0) || disabled || isSending}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 10,
            backgroundColor:
              isSending
                ? colors.primary
                : (text.trim() || selectedImages.length > 0) && !disabled
                ? colors.primary
                : colors.surface,
          }}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons
              name="send"
              size={18}
              color={
                (text.trim() || selectedImages.length > 0) && !disabled
                  ? 'white'
                  : colors.textSecondary
              }
            />
          )}
        </Pressable>
      </View>
    </View>
  );
};

