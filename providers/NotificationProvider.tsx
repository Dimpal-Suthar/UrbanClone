import { useAuth } from '@/hooks/useAuth';
import { useUnreadCount } from '@/hooks/useConversations';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { setBadgeCount } from '@/services/fcmService';
import { observer } from 'mobx-react-lite';
import React, { useEffect } from 'react';

export const NotificationProvider = observer(({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { expoPushToken, clearAllBadges } = usePushNotifications();
  
  // Get unread message count (for badge)
  const { data: unreadMessagesCount = 0 } = useUnreadCount(user?.uid || null);

  // Update badge count based on unread messages
  useEffect(() => {
    if (unreadMessagesCount > 0) {
      setBadgeCount(unreadMessagesCount);
    }
  }, [unreadMessagesCount]);

  // Clear badges when app is opened
  useEffect(() => {
    return () => {
      clearAllBadges();
    };
  }, [clearAllBadges]);

  return <>{children}</>;
});
