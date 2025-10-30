import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useUnreadCount } from '@/hooks/useConversations';
import { useAuth } from '@/hooks/useAuth';
import { setBadgeCount } from '@/services/fcmService';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import React from 'react';

export const NotificationProvider = observer(({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  console.log('🔔 NotificationProvider rendered, user:', user?.uid);
  
  const { expoPushToken, clearAllBadges } = usePushNotifications();
  console.log('🔔 expoPushToken in NotificationProvider:', expoPushToken);
  
  // Get unread message count (for badge)
  const { data: unreadMessagesCount = 0 } = useUnreadCount(user?.uid || null);

  // Update badge count based on unread messages
  useEffect(() => {
    setBadgeCount(unreadMessagesCount);
  }, [unreadMessagesCount]);

  // Clear badges when app is opened
  useEffect(() => {
    return () => {
      // Cleanup on unmount
      clearAllBadges();
    };
  }, []);

  return <>{children}</>;
});
