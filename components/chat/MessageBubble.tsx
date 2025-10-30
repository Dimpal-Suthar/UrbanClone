import { useTheme } from '@/contexts/ThemeContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Message } from '@/types/chat';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
  onImagePress?: (imageUrl: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  showAvatar = true,
  onImagePress,
}) => {
  const { colors } = useTheme();
  
  // FIX: Fetch fresh sender data for other user's messages
  const { data: senderProfile } = useUserProfile(isOwn ? null : message.senderId);
  
  // Use fresh sender data with fallback to stored data
  const displaySenderName = senderProfile?.displayName || message.senderName;
  const displaySenderPhoto = senderProfile?.photoURL || message.senderPhoto;

  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
  };

  return (
    <View
      style={{
        flexDirection: isOwn ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
        marginBottom: 12,
        paddingHorizontal: 16,
      }}
    >
      {/* Avatar */}
      {showAvatar && !isOwn && (
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: colors.surface,
            marginRight: 8,
            overflow: 'hidden',
          }}
        >
          {displaySenderPhoto ? (
            <Image
              source={{ uri: displaySenderPhoto }}
              style={{ width: 32, height: 32 }}
            />
          ) : (
            <View
              style={{
                width: 32,
                height: 32,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.primary,
              }}
            >
              <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
                {displaySenderName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Message Content */}
      <View style={{ maxWidth: '75%' }}>
        {/* Sender Name (if not own message) */}
        {!isOwn && (
          <Text
            style={{
              fontSize: 12,
              color: colors.textSecondary,
              marginBottom: 4,
              marginLeft: 12,
            }}
          >
            {displaySenderName}
          </Text>
        )}

        {/* Message Bubble */}
        <View
          style={{
            backgroundColor: isOwn ? colors.primary : colors.surface,
            borderRadius: 16,
            borderTopLeftRadius: isOwn ? 16 : 4,
            borderTopRightRadius: isOwn ? 4 : 16,
            padding: 12,
          }}
        >
          {/* Image Message */}
          {message.type === 'image' && message.imageUrl && (
            <Pressable onPress={() => onImagePress?.(message.imageUrl!)}>
              <Image
                source={{ uri: message.imageUrl }}
                style={{
                  width: 200,
                  height: 200,
                  borderRadius: 8,
                  marginBottom: message.text ? 8 : 0,
                }}
                resizeMode="cover"
              />
            </Pressable>
          )}

          {/* Location Message */}
          {message.type === 'location' && message.location && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: message.text ? 8 : 0,
              }}
            >
              <Ionicons
                name="location"
                size={20}
                color={isOwn ? 'white' : colors.primary}
              />
              <Text
                style={{
                  marginLeft: 4,
                  color: isOwn ? 'white' : colors.text,
                  fontSize: 14,
                }}
              >
                Location shared
              </Text>
            </View>
          )}

          {/* Text Content */}
          {message.text && (
            <Text
              style={{
                fontSize: 15,
                color: isOwn ? 'white' : colors.text,
                lineHeight: 20,
              }}
            >
              {message.text}
            </Text>
          )}

          {/* Time & Read Status */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'flex-end',
              marginTop: 4,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                color: isOwn ? 'rgba(255,255,255,0.7)' : colors.textSecondary,
              }}
            >
              {formatTime(message.createdAt)}
            </Text>

            {/* Read Receipt (only for own messages) */}
            {isOwn && (
              <Ionicons
                name={message.isRead ? 'checkmark-done' : 'checkmark'}
                size={16}
                color={message.isRead ? '#4FC3F7' : 'rgba(255,255,255,0.7)'}
                style={{ marginLeft: 4 }}
              />
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

