import { useAuth } from '@/hooks/useAuth';
import {
  getOrCreateConversation,
  getUserConversations,
  getTotalUnreadCount,
  markMessagesAsRead,
} from '@/services/chatService';
import { Conversation, CreateConversationInput } from '@/types/chat';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DocumentSnapshot } from 'firebase/firestore';
import { useEffect } from 'react';
import { subscribeToUserConversations } from '@/services/chatService';

// Query keys
export const conversationKeys = {
  all: ['conversations'] as const,
  lists: () => [...conversationKeys.all, 'list'] as const,
  list: (userId: string) => [...conversationKeys.lists(), userId] as const,
  detail: (id: string) => [...conversationKeys.all, 'detail', id] as const,
  unreadCount: (userId: string) => [...conversationKeys.all, 'unread', userId] as const,
};

/**
 * Hook to get user's conversations with infinite scroll
 */
export const useConversations = (userId: string | null) => {
  return useInfiniteQuery({
    queryKey: conversationKeys.list(userId || ''),
    queryFn: async ({ pageParam }) => {
      if (!userId) return { conversations: [], lastDoc: null };
      return getUserConversations(userId, 20, pageParam as DocumentSnapshot | undefined);
    },
    enabled: !!userId,
    getNextPageParam: (lastPage) => lastPage.lastDoc,
    initialPageParam: undefined,
  });
};

/**
 * Hook to get or create a conversation
 */
export const useGetOrCreateConversation = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (input: CreateConversationInput) => getOrCreateConversation(input),
    onSuccess: (conversation) => {
      // Update conversations list cache
      if (user?.uid) {
        queryClient.invalidateQueries({ 
          queryKey: conversationKeys.list(user.uid) 
        });
      }

      // Add to detail cache
      queryClient.setQueryData(
        conversationKeys.detail(conversation.id),
        conversation
      );
    },
  });
};

/**
 * Hook to get total unread count
 */
export const useUnreadCount = (userId: string | null) => {
  return useQuery({
    queryKey: conversationKeys.unreadCount(userId || ''),
    queryFn: () => (userId ? getTotalUnreadCount(userId) : Promise.resolve(0)),
    enabled: !!userId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

/**
 * Hook to mark messages as read
 */
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ conversationId, userId }: { conversationId: string; userId: string }) =>
      markMessagesAsRead(conversationId, userId),
    onSuccess: (_, variables) => {
      // Invalidate conversations list
      if (user?.uid) {
        queryClient.invalidateQueries({ 
          queryKey: conversationKeys.list(user.uid) 
        });
      }

      // Invalidate unread count
      if (variables.userId) {
        queryClient.invalidateQueries({ 
          queryKey: conversationKeys.unreadCount(variables.userId) 
        });
      }

      // Invalidate conversation detail
      queryClient.invalidateQueries({ 
        queryKey: conversationKeys.detail(variables.conversationId) 
      });
    },
  });
};

/**
 * Hook to subscribe to conversation updates (real-time)
 */
export const useConversationRealtime = (conversationId: string | null) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!conversationId) return;

    // Import the subscription function dynamically to avoid circular dependencies
    const subscribeToConversation = require('@/services/chatService').subscribeToConversation;

    const unsubscribe = subscribeToConversation(
      conversationId,
      (conversation: Conversation | null) => {
        if (conversation) {
          queryClient.setQueryData(
            conversationKeys.detail(conversationId),
            conversation
          );
        }
      }
    );

    return () => unsubscribe();
  }, [conversationId, queryClient]);
};

/**
 * Hook to refresh the conversations list in real-time for a user
 */
export const useConversationsListRealtime = (userId: string | null) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;
    const unsubscribe = subscribeToUserConversations(userId, () => {
      queryClient.invalidateQueries({ queryKey: conversationKeys.list(userId) });
    });
    return () => unsubscribe();
  }, [userId, queryClient]);
};

