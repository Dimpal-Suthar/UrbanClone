import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, TextInput, View } from 'react-native';

interface ChatInputProps {
  onSendText: (text: string) => void;
  onSendImage?: (imageUri: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendText,
  onSendImage,
  placeholder = 'Type a message...',
  disabled = false,
}) => {
  const { colors } = useTheme();
  const [text, setText] = useState('');
  const [sendingImage, setSendingImage] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  const handleSend = async () => {
    if (disabled) return;
    if (selectedImages.length > 0 && onSendImage) {
      for (const uri of selectedImages) {
        // Send each image as a separate message
        // If you want to bundle, change sender to accept multiple
        // Sequential to keep order
        // eslint-disable-next-line no-await-in-loop
        await onSendImage(uri);
      }
      setSelectedImages([]);
    }
    if (text.trim()) {
      onSendText(text.trim());
      setText('');
    }
  };

  const handlePickImage = async () => {
    try {
      setSendingImage(true);

      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to send images!');
        setSendingImage(false);
        return;
      }

      // Pick image(s)
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        allowsMultipleSelection: true,
        selectionLimit: 10,
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uris = result.assets.map(a => a.uri).filter(Boolean) as string[];
        setSelectedImages(prev => {
          // Avoid duplicates
          const set = new Set([...prev, ...uris]);
          return Array.from(set);
        });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      alert('Failed to pick image');
    } finally {
      setSendingImage(false);
    }
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.background,
      }}
    >
      {/* Image Picker Button */}
      {onSendImage && (
        <Pressable
          onPress={handlePickImage}
          disabled={disabled || sendingImage}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 8,
            opacity: disabled || sendingImage ? 0.5 : 1,
          }}
        >
          {sendingImage ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="image-outline" size={24} color={colors.textSecondary} />
          )}
        </Pressable>
      )}

      {/* Text Input + Image Preview(s) */}
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surface,
          borderRadius: 20,
          paddingHorizontal: 16,
          paddingVertical: 8,
        }}
      >
        {selectedImages.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginRight: 8 }}>
            {selectedImages.map((uri, idx) => (
              <View key={uri + idx} style={{ marginRight: 8, position: 'relative' }}>
                <Image source={{ uri }} style={{ width: 44, height: 44, borderRadius: 8 }} />
                <Pressable
                  onPress={() => setSelectedImages(prev => prev.filter((_, i) => i !== idx))}
                  hitSlop={8}
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    width: 20,
                    height: 20,
                    borderRadius: 10,
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
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          style={{
            flex: 1,
            fontSize: 15,
            color: colors.text,
            maxHeight: 100,
          }}
          multiline
          editable={!disabled}
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />
      </View>

      {/* Send Button */}
      <Pressable
        onPress={handleSend}
        disabled={(!text.trim() && selectedImages.length === 0) || disabled}
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: 8,
          backgroundColor: (text.trim() || selectedImages.length > 0) && !disabled ? colors.primary : colors.surface,
        }}
      >
        <Ionicons
          name="send"
          size={18}
          color={(text.trim() || selectedImages.length > 0) && !disabled ? 'white' : colors.textSecondary}
        />
      </Pressable>
    </View>
  );
};

