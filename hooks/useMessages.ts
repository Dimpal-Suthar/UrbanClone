import { useAuth } from '@/hooks/useAuth';
import { getMessages, sendMessage } from '@/services/chatService';
import { sendPushNotification } from '@/services/notificationService';
import { CreateMessageInput, Message } from '@/types/chat';
import { showFailedMessage, showSuccessMessage } from '@/utils/toast';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DocumentSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { conversationKeys } from './useConversations';

// Query keys
export const messageKeys = {
  all: ['messages'] as const,
  lists: () => [...messageKeys.all, 'list'] as const,
  list: (conversationId: string) => [...messageKeys.lists(), conversationId] as const,
};

/**
 * Hook to get messages with infinite scroll (pagination)
 */
export const useMessages = (conversationId: string | null) => {
  return useInfiniteQuery({
    queryKey: messageKeys.list(conversationId || ''),
    queryFn: async ({ pageParam }) => {
      if (!conversationId) return { messages: [], lastDoc: null };
      return getMessages(conversationId, 50, pageParam || undefined);
    },
    enabled: !!conversationId,
    getNextPageParam: (lastPage) => lastPage.lastDoc,
    initialPageParam: undefined as DocumentSnapshot | undefined,
  });
};

/**
 * Hook to send a message
 */
export const useSendMessage = () => {
  const queryClient = useQueryClient();
  const { user, userProfile } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      input, 
      recipientId, 
      recipientName 
    }: { 
      input: CreateMessageInput; 
      recipientId: string;
      recipientName: string;
    }) => {
      if (!user?.uid || !userProfile) {
        throw new Error('User not authenticated');
      }

      const message = await sendMessage(
        input,
        user.uid,
        userProfile.displayName || user.email?.split('@')[0] || 'User',
        userProfile.photoURL || null
      );

      // Send push notification to recipient
      try {
        const notificationBody = input.type === 'image' 
          ? '📷 Sent an image' 
          : input.type === 'location'
          ? '📍 Shared location'
          : input.text;

        await sendPushNotification(
          recipientId,
          userProfile.displayName || user.email?.split('@')[0] || 'New Message',
          notificationBody,
          {
            type: 'message',
            conversationId: input.conversationId,
            senderId: user.uid,
          }
        );
      } catch (error) {
        console.error('Error sending push notification:', error);
      }

      return message;
    },
    onSuccess: (message, variables) => {
      // Invalidate messages list
      queryClient.invalidateQueries({ 
        queryKey: messageKeys.list(message.conversationId) 
      });

      // Invalidate conversation (to update last message)
      queryClient.invalidateQueries({ 
        queryKey: conversationKeys.detail(message.conversationId) 
      });

      // Invalidate conversations list
      if (user?.uid) {
        queryClient.invalidateQueries({ 
          queryKey: conversationKeys.list(user.uid) 
        });
      }
    },
    onError: (error: Error) => {
      console.error('Error sending message:', error);
      showFailedMessage('Send Failed', 'Failed to send message. Please try again.');
    },
  });
};

/**
 * Hook to subscribe to new messages (real-time)
 */
export const useMessagesRealtime = (conversationId: string | null) => {
  const queryClient = useQueryClient();
  const [newMessageCount, setNewMessageCount] = useState(0);

  useEffect(() => {
    if (!conversationId) return;

    // Import the subscription function dynamically
    const subscribeToMessages = require('@/services/chatService').subscribeToMessages;

    const unsubscribe = subscribeToMessages(
      conversationId,
      (message: Message) => {
        // Add new message to cache
        queryClient.setQueryData(
          messageKeys.list(conversationId),
          (old: any) => {
            if (!old) return old;

            // Check if message already exists
            const allMessages = old.pages.flatMap((page: any) => page.messages);
            const exists = allMessages.some((m: Message) => m.id === message.id);

            if (exists) return old;

            // Add to first page (prepend, not append, since FlatList is inverted)
            const newPages = [...old.pages];
            if (newPages[0]) {
              newPages[0] = {
                ...newPages[0],
                messages: [message, ...newPages[0].messages],
              };
            }

            setNewMessageCount(prev => prev + 1);

            return {
              ...old,
              pages: newPages,
            };
          }
        );

        // Invalidate conversation to update last message
        queryClient.invalidateQueries({ 
          queryKey: conversationKeys.detail(conversationId) 
        });
      }
    );

    return () => {
      unsubscribe();
      setNewMessageCount(0);
    };
  }, [conversationId, queryClient]);

  return { newMessageCount };
};

