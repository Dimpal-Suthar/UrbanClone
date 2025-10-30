import { useAuth } from '@/hooks/useAuth';
import {
  deleteAllNotifications,
  deleteNotification,
  getUserNotifications,
  getUnreadNotificationsCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '@/services/notificationService';
import { Notification } from '@/types/chat';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

// Query keys
export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (userId: string) => [...notificationKeys.lists(), userId] as const,
  unreadCount: (userId: string) => [...notificationKeys.all, 'unread', userId] as const,
};

/**
 * Hook to get user's notifications
 */
export const useUserNotifications = (userId: string | null) => {
  return useQuery({
    queryKey: notificationKeys.list(userId || ''),
    queryFn: () => (userId ? getUserNotifications(userId) : Promise.resolve([])),
    enabled: !!userId,
  });
};

/**
 * Hook to get unread notifications count
 */
export const useUnreadNotificationsCount = (userId: string | null) => {
  return useQuery({
    queryKey: notificationKeys.unreadCount(userId || ''),
    queryFn: () => (userId ? getUnreadNotificationsCount(userId) : Promise.resolve(0)),
    enabled: !!userId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

/**
 * Hook to mark notification as read
 */
export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (notificationId: string) => markNotificationAsRead(notificationId),
    onSuccess: () => {
      // Invalidate notifications list
      if (user?.uid) {
        queryClient.invalidateQueries({ 
          queryKey: notificationKeys.list(user.uid) 
        });
        queryClient.invalidateQueries({ 
          queryKey: notificationKeys.unreadCount(user.uid) 
        });
      }
    },
  });
};

/**
 * Hook to mark all notifications as read
 */
export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (userId: string) => markAllNotificationsAsRead(userId),
    onSuccess: () => {
      // Invalidate notifications list
      if (user?.uid) {
        queryClient.invalidateQueries({ 
          queryKey: notificationKeys.list(user.uid) 
        });
        queryClient.invalidateQueries({ 
          queryKey: notificationKeys.unreadCount(user.uid) 
        });
      }
    },
  });
};

/**
 * Hook to delete notification
 */
export const useDeleteNotification = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (notificationId: string) => deleteNotification(notificationId),
    onSuccess: () => {
      // Invalidate notifications list
      if (user?.uid) {
        queryClient.invalidateQueries({ 
          queryKey: notificationKeys.list(user.uid) 
        });
        queryClient.invalidateQueries({ 
          queryKey: notificationKeys.unreadCount(user.uid) 
        });
      }
    },
  });
};

/**
 * Hook to delete all notifications
 */
export const useDeleteAllNotifications = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (userId: string) => deleteAllNotifications(userId),
    onSuccess: () => {
      // Invalidate notifications list
      if (user?.uid) {
        queryClient.invalidateQueries({ 
          queryKey: notificationKeys.list(user.uid) 
        });
        queryClient.invalidateQueries({ 
          queryKey: notificationKeys.unreadCount(user.uid) 
        });
      }
    },
  });
};

/**
 * Hook to subscribe to notifications (real-time)
 */
export const useNotificationsRealtime = (userId: string | null) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    // Import the subscription function dynamically
    const subscribeToNotifications = require('@/services/notificationService').subscribeToNotifications;

    const unsubscribe = subscribeToNotifications(
      userId,
      (notifications: Notification[]) => {
        queryClient.setQueryData(
          notificationKeys.list(userId),
          notifications
        );

        // Update unread count
        const unreadCount = notifications.filter(n => !n.isRead).length;
        queryClient.setQueryData(
          notificationKeys.unreadCount(userId),
          unreadCount
        );
      }
    );

    return () => unsubscribe();
  }, [userId, queryClient]);
};

