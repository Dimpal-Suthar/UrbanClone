import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { useTheme } from '@/contexts/ThemeContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Conversation } from '@/types/chat';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

interface ConversationCardProps {
  conversation: Conversation;
  currentUserId: string;
  onPress: () => void;
}

export const ConversationCard: React.FC<ConversationCardProps> = ({
  conversation,
  currentUserId,
  onPress,
}) => {
  const { colors } = useTheme();

  // Get other participant (not current user)
  const otherUserId = conversation.participants.find(id => id !== currentUserId);
  
  // Get fallback data from conversation
  const fallbackParticipant = otherUserId ? conversation.participantsData[otherUserId] : null;
  
  // FIX: Fetch fresh user data instead of using stale participantsData
  const { data: userProfile } = useUserProfile(otherUserId || null);
  
  // Use fresh data with fallback to stored data
  const otherParticipant = userProfile ? {
    name: userProfile.displayName || fallbackParticipant?.name || 'User',
    photo: userProfile.photoURL || fallbackParticipant?.photo || null,
    role: userProfile.role || fallbackParticipant?.role || 'customer',
  } : fallbackParticipant;

  if (!otherParticipant || !otherUserId) return null;

  const unreadCount = conversation.unreadCount[currentUserId] || 0;
  const hasUnread = unreadCount > 0;
  const typingEntry = conversation.typing?.[otherUserId];
  const isTyping = typingEntry?.isTyping;

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMins < 1) return 'Just now';
    if (diffInMins < 60) return `${diffInMins}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getLastMessagePreview = () => {
    if (isTyping) return 'Typing…';
    if (!conversation.lastMessage) return 'No messages yet';
    
    const { text, type, senderId } = conversation.lastMessage;
    const isOwnMessage = senderId === currentUserId;
    const prefix = isOwnMessage ? 'You: ' : '';

    if (type === 'image') return `${prefix}📷 Image`;
    if (type === 'location') return `${prefix}📍 Location`;
    return `${prefix}${text}`;
  };

  return (
    <Pressable onPress={onPress} className="active:opacity-70">
      <Card variant="default" className="mb-3">
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* Avatar */}
          <Avatar
            uri={otherParticipant.photo}
            name={otherParticipant.name}
            size={50}
          />

          {/* Content */}
          <View style={{ flex: 1, marginLeft: 12 }}>
            {/* Name & Time */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: hasUnread ? '700' : '600',
                  color: colors.text,
                  flex: 1,
                }}
                numberOfLines={1}
              >
                {otherParticipant.name}
              </Text>
              
              {conversation.lastMessage && (
                <Text
                  style={{
                    fontSize: 12,
                    color: hasUnread ? colors.primary : colors.textSecondary,
                    fontWeight: hasUnread ? '600' : '400',
                  }}
                >
                  {formatTime(conversation.lastMessage.timestamp)}
                </Text>
              )}
            </View>

            {/* Last Message & Unread Badge */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text
                style={{
                  fontSize: 14,
                  color: isTyping ? colors.primary : hasUnread ? colors.text : colors.textSecondary,
                  fontWeight: isTyping ? '600' : hasUnread ? '500' : '400',
                  flex: 1,
                }}
                numberOfLines={1}
              >
                {getLastMessagePreview()}
              </Text>

              {/* Unread Badge */}
              {hasUnread && (
                <View
                  style={{
                    backgroundColor: colors.primary,
                    borderRadius: 10,
                    minWidth: 20,
                    height: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 6,
                    marginLeft: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '700',
                      color: 'white',
                    }}
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>

            {/* Role Badge */}
            <View
              style={{
                marginTop: 4,
                alignSelf: 'flex-start',
              }}
            >
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 4,
                  backgroundColor: `${colors.primary}15`,
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '600',
                    color: colors.primary,
                    textTransform: 'uppercase',
                  }}
                >
                  {otherParticipant.role}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Card>
    </Pressable>
  );
};

