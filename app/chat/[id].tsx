import { ChatInput } from '@/components/chat/ChatInput';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { Avatar } from '@/components/ui/Avatar';
import { Container } from '@/components/ui/Container';
import { ImageCarousel } from '@/components/ui/ImageCarousel';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { conversationKeys, useMarkAsRead } from '@/hooks/useConversations';
import { useUploadImage } from '@/hooks/useImageUpload';
import { useMessages, useMessagesRealtime, useSendMessage } from '@/hooks/useMessages';
import { useUserProfile, useUserProfileRealtime } from '@/hooks/useUserProfile';
import { setTypingStatus, subscribeToConversation } from '@/services/chatService';
import type { Conversation } from '@/types/chat';
import { makeCall } from '@/utils/callHelpers';
import { showFailedMessage } from '@/utils/toast';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { observer } from 'mobx-react-lite';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  Text,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const typingStateRef = useRef(false);

  // Get conversation data
  const conversation = queryClient.getQueryData<Conversation>(conversationKeys.detail(id || ''));

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

  useEffect(() => {
    if (!id) return;
    const unsubscribe = subscribeToConversation(id, (conv) => {
      if (conv) {
        queryClient.setQueryData(conversationKeys.detail(id), conv);
        if (otherUserId) {
          const typingEntry = conv.typing?.[otherUserId];
          setIsTyping(!!typingEntry?.isTyping);
        }
      } else {
        setIsTyping(false);
      }
    });

    return () => {
      unsubscribe();
      setIsTyping(false);
    };
  }, [id, otherUserId, queryClient]);

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


  const handleSendMessage = async ({ text, imageUris }: { text: string; imageUris: string[] }) => {
    if (!id || !user?.uid || !otherUserId) return;

    try {
      let uploadedUrls: string[] = [];

      if (imageUris.length > 0) {
        uploadedUrls = await Promise.all(
          imageUris.map((uri, idx) => {
            const path = `chats/${id}/${Date.now()}_${idx}`;
            return uploadImageMutation.mutateAsync({ imageUri: uri, path });
          })
        );
      }

      await sendMessageMutation.mutateAsync({
        input: {
          conversationId: id,
          text,
          type: uploadedUrls.length > 0 ? 'image' : 'text',
          imageUrls: uploadedUrls,
          imageUrl: uploadedUrls[0],
        },
        recipientId: otherUserId,
        recipientName: otherParticipant?.name || 'User',
      });

      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      showFailedMessage('Send Failed', 'Failed to send message. Please try again.');
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

  const handleTypingChange = useCallback(
    (typing: boolean) => {
      if (!id || !user?.uid) return;
      if (typingStateRef.current === typing) return;
      typingStateRef.current = typing;
      setTypingStatus(id, user.uid, typing).catch((error) => {
        console.error('Error updating typing status:', error);
      });
    },
    [id, user?.uid]
  );

  useEffect(() => {
    return () => {
      if (typingStateRef.current && id && user?.uid) {
        setTypingStatus(id, user.uid, false).catch(() => {});
      }
    };
  }, [id, user?.uid]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      // Small delay to ensure message is rendered
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
    }
  }, [messages.length]);

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
    <Container safeArea edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={'padding'} style={{ flex: 1 }} keyboardVerticalOffset={0}>
        <View style={{ flex: 1 }}>
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
              backgroundColor: colors.background,
            }}
          >
            <Pressable onPress={() => router.back()} className="mr-3 active:opacity-70">
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </Pressable>

            <Avatar uri={otherParticipant.photo} name={otherParticipant.name} size={40} />

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
              contentContainerStyle={{ paddingTop: 16, paddingBottom: 8 }}
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="never"
              keyboardDismissMode="on-drag"
              onScrollBeginDrag={() => {
                Keyboard.dismiss();
              }}
            />
          )}

          {/* Typing Indicator */}
          {isTyping && <TypingIndicator userName={otherParticipant.name} />}
        </View>

        {/* Chat Input */}
        <ChatInput
          onSend={handleSendMessage}
          placeholder={`Message ${otherParticipant.name}...`}
          disabled={false}
          onTypingChange={handleTypingChange}
        />

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