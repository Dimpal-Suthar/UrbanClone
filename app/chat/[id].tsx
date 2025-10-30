import { ChatInput } from '@/components/chat/ChatInput';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { Avatar } from '@/components/ui/Avatar';
import { Container } from '@/components/ui/Container';
import { ImageCarousel } from '@/components/ui/ImageCarousel';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { useConversationRealtime } from '@/hooks/useConversations';
import { useUploadImage } from '@/hooks/useImageUpload';
import { useMarkAsRead } from '@/hooks/useConversations';
import { useMessages, useMessagesRealtime, useSendMessage } from '@/hooks/useMessages';
import { conversationKeys } from '@/hooks/useConversations';
import { showFailedMessage } from '@/utils/toast';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { observer } from 'mobx-react-lite';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useUserProfile, useUserProfileRealtime } from '@/hooks/useUserProfile';
import { makeCall } from '@/utils/callHelpers';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';

const ChatDetailScreen = observer(() => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { user, userProfile: currentUserProfile } = useAuth();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const flatListRef = useRef<FlatList>(null);

  const [isTyping, setIsTyping] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Get conversation data
  const conversation = queryClient.getQueryData(conversationKeys.detail(id || ''));

  // Subscribe to conversation updates
  useConversationRealtime(id || null);

  // Fetch messages with pagination
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useMessages(id || null);

  // Subscribe to new messages (real-time)
  const { newMessageCount } = useMessagesRealtime(id || null);

  // Mutations
  const sendMessageMutation = useSendMessage();
  const markAsReadMutation = useMarkAsRead();
  const uploadImageMutation = useUploadImage();

  // Flatten all pages into single array
  const messages = data?.pages.flatMap(page => page.messages) || [];

  // Get other participant
  const otherUserId = conversation?.participants?.find((uid: string) => uid !== user?.uid);
  
  // OPTIMIZATION: Use shared user profile cache instead of manual fetching
  // This uses TanStack Query caching and shares data across components
  const { data: otherUserProfile, isLoading: isLoadingParticipant } = useUserProfile(otherUserId || null);
  useUserProfileRealtime(otherUserId || null); // Real-time updates
  
  // Handle call functionality
  const handleCall = async (phoneNumber?: string) => {
    if (!phoneNumber) {
      showFailedMessage('Error', 'Phone number not available for this user');
      return;
    }
    
    try {
      await makeCall(phoneNumber);
    } catch (error) {
      console.error('Error making call:', error);
      showFailedMessage('Error', 'Failed to make call. Please try again.');
    }
  };
  
  // Map otherUserProfile to otherParticipant format
  const otherParticipant = otherUserProfile ? {
    name: otherUserProfile.displayName || 'User',
    photo: otherUserProfile.photoURL || null,
    role: otherUserProfile.role || 'customer',
    phone: otherUserProfile.phone || null,
  } : null;

  // Mark messages as read when screen is focused
  useFocusEffect(
    useCallback(() => {
      if (id && user?.uid) {
        markAsReadMutation.mutate({ conversationId: id, userId: user.uid });
      }
    }, [id, user?.uid])
  );

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (newMessageCount > 0 && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
    }
  }, [newMessageCount]);

  // Handle sending text message
  const handleSendText = async (text: string) => {
    if (!id || !user?.uid || !otherUserId) return;

    try {
      await sendMessageMutation.mutateAsync({
        input: {
          conversationId: id,
          text,
          type: 'text',
        },
        recipientId: otherUserId,
        recipientName: otherParticipant?.name || 'User',
      });

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Handle sending image
  const handleSendImage = async (imageUri: string) => {
    if (!id || !user?.uid || !otherUserId) return;

    try {
      // Upload image to Firebase Storage
      const path = `chats/${id}/${Date.now()}`;
      const imageUrl = await uploadImageMutation.mutateAsync({ imageUri, path });

      // Send message with image
      await sendMessageMutation.mutateAsync({
        input: {
          conversationId: id,
          text: '', // Can add caption later
          type: 'image',
          imageUrl,
        },
        recipientId: otherUserId,
        recipientName: otherParticipant?.name || 'User',
      });

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending image:', error);
      showFailedMessage('Upload Failed', 'Failed to send image. Please try again.');
    }
  };

  // Handle load more messages
  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const renderMessage = ({ item, index }: { item: any; index: number }) => {
    const isOwn = item.senderId === user?.uid;
    const prevMessage = messages[index - 1];
    const showAvatar = !prevMessage || prevMessage.senderId !== item.senderId;

    return (
      <MessageBubble
        message={item}
        isOwn={isOwn}
        showAvatar={showAvatar}
        onImagePress={(imageUrl) => setSelectedImage(imageUrl)}
      />
    );
  };

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={{ paddingVertical: 20, alignItems: 'center' }}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 8 }}>
          Loading older messages...
        </Text>
      </View>
    );
  };

  if (!conversation || isLoadingParticipant) {
    return (
      <Container safeArea edges={['top']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="text-sm mt-4" style={{ color: colors.textSecondary }}>
            Loading conversation...
          </Text>
        </View>
      </Container>
    );
  }
  
  // Fallback if otherParticipant is null
  if (!otherParticipant) {
    return (
      <Container safeArea edges={['top']}>
        <View className="flex-1 items-center justify-center">
          <Text className="text-sm" style={{ color: colors.textSecondary }}>
            User not found
          </Text>
        </View>
      </Container>
    );
  }

  return (
    <Container safeArea edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.bottom : 0}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: colors.surface,
          }}
        >
          <Pressable onPress={() => router.back()} className="mr-3 active:opacity-70">
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>

          <Avatar
            uri={otherParticipant.photo}
            name={otherParticipant.name}
            size={40}
          />

          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: colors.text,
              }}
              numberOfLines={1}
            >
              {otherParticipant.name}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: colors.success,
                  marginRight: 4,
                }}
              />
              <Text
                style={{
                  fontSize: 12,
                  color: colors.textSecondary,
                  textTransform: 'capitalize',
                }}
              >
                {otherParticipant.role}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {/* Call Button - Only show if phone number exists */}
            {otherParticipant?.phone && (
              <Pressable
                onPress={() => handleCall(otherParticipant.phone)}
                className="w-10 h-10 rounded-full items-center justify-center active:opacity-70"
                style={{ backgroundColor: `${colors.primary}15` }}
              >
                <Ionicons name="call" size={20} color={colors.primary} />
              </Pressable>
            )}

            <Pressable
              onPress={() => {
                // TODO: Open booking details
                if (conversation.bookingId) {
                  router.push(`/booking/${conversation.bookingId}`);
                }
              }}
              className="w-10 h-10 rounded-full items-center justify-center active:opacity-70"
              style={{ backgroundColor: `${colors.primary}15` }}
            >
              <Ionicons name="information-circle" size={20} color={colors.primary} />
            </Pressable>
          </View>
        </View>

        {/* Messages List */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="text-sm mt-4" style={{ color: colors.textSecondary }}>
              Loading messages...
            </Text>
          </View>
        ) : messages.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6">
            <Ionicons name="chatbubble-outline" size={64} color={colors.textSecondary} />
            <Text className="text-lg font-semibold mt-4" style={{ color: colors.text }}>
              No messages yet
            </Text>
            <Text className="text-sm mt-2 text-center" style={{ color: colors.textSecondary }}>
              Send a message to start the conversation
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            inverted // Show latest messages at bottom
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            contentContainerStyle={{ paddingTop: 16 }}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Typing Indicator */}
        {isTyping && <TypingIndicator userName={otherParticipant.name} />}

        {/* Chat Input */}
        <View style={{ paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 0) }}>
          <ChatInput
            onSendText={handleSendText}
            onSendImage={handleSendImage}
            placeholder={`Message ${otherParticipant.name}...`}
            disabled={sendMessageMutation.isPending || uploadImageMutation.isPending}
          />
        </View>

        {/* Image Viewer Modal */}
        {selectedImage && (
          <Modal
            visible={true}
            transparent
            animationType="fade"
            onRequestClose={() => setSelectedImage(null)}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: 'rgba(0,0,0,0.9)',
              }}
            >
              {/* Close Button */}
              <Pressable
                onPress={() => setSelectedImage(null)}
                style={{
                  position: 'absolute',
                  top: 50,
                  right: 20,
                  zIndex: 10,
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="close" size={24} color="white" />
              </Pressable>

              {/* Image */}
              <ImageCarousel
                images={[selectedImage]}
                height={600}
                showIndicators={false}
                showFullScreen={false}
              />
            </View>
          </Modal>
        )}
      </KeyboardAvoidingView>
    </Container>
  );
});

export default ChatDetailScreen;
