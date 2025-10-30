import { useAuth } from '@/hooks/useAuth';
import {
  clearBadges,
  getExpoPushToken,
  getNativePushToken,
  requestNotificationPermissions,
  saveFCMToken,
  saveNativePushToken,
  setBadgeCount,
  setupNotificationListeners,
} from '@/services/fcmService';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

/**
 * Hook to manage push notifications
 */
export const usePushNotifications = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | undefined>();
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  useEffect(() => {
    const registerForPushNotifications = async () => {
      console.log('🔔 Starting push notification registration...');
      console.log('🔔 User UID:', user?.uid);
      
      try {
        console.log('🔔 Requesting notification permissions...');
        const hasPermission = await requestNotificationPermissions();
        if (!hasPermission) {
          console.log('❌ No permission for notifications');
          return;
        }
        console.log('✅ Notification permission granted');

        console.log('🔔 Getting Expo push token...');
        const token = await getExpoPushToken();
        
        if (!token) {
          console.log('❌ Failed to get push token');
          return;
        }

        console.log('✅ Token received:', token);
        setExpoPushToken(token);

        if (user?.uid) {
          console.log('🔔 Saving Expo token to Firestore for user:', user.uid);
          await saveFCMToken(user.uid, token);
          console.log('✅ Expo token saved');

          // Also get native device token (FCM/APNs) for production push via Firebase/Admin
          console.log('🔔 Getting native device push token...');
          const native = await getNativePushToken();
          if (native?.token) {
            await saveNativePushToken(user.uid, native.token, native.type);
            console.log('✅ Native push token saved:', native.type);
          } else {
            console.log('❌ Failed to get native token');
          }
        } else {
          console.log('❌ No user UID available');
        }
      } catch (error) {
        console.error('❌ Error registering for push notifications:', error);
      }
    };

    if (user?.uid) {
      console.log('🔔 User authenticated, starting token registration');
      registerForPushNotifications();
    } else {
      console.log('🔔 No user yet, waiting...');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  useEffect(() => {
    // Setup notification listeners
    const cleanup = setupNotificationListeners(
      // When notification is received (foreground)
      (notification) => {
        console.log('📱 Notification received (foreground):', notification);
        setNotification(notification);
      },
      // When user taps on notification
      (response) => {
        console.log('👆 Notification tapped:', response);
        handleNotificationResponse(response);
      }
    );

    return cleanup;
  }, []);

  /**
   * Handle notification tap/response
   */
  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data;

    // Navigate based on notification type
    if (data.type === 'message' && data.conversationId) {
      router.push(`/chat/${data.conversationId}`);
    } else if (data.type === 'booking' && data.bookingId) {
      router.push(`/booking/${data.bookingId}`);
    }
  };

  /**
   * Update badge count
   */
  const updateBadgeCount = async (count: number) => {
    try {
      await setBadgeCount(count);
    } catch (error) {
      console.error('Error updating badge count:', error);
    }
  };

  /**
   * Clear all badges
   */
  const clearAllBadges = async () => {
    try {
      await clearBadges();
    } catch (error) {
      console.error('Error clearing badges:', error);
    }
  };

  return {
    expoPushToken,
    notification,
    updateBadgeCount,
    clearAllBadges,
  };
};
