import { useAuth } from '@/hooks/useAuth';
import {
  clearBadges,
  getExpoPushToken,
  getNativePushToken,
  removeAllDeviceTokens,
  requestNotificationPermissions,
  saveFCMToken,
  saveNativePushToken,
  setBadgeCount,
  setupNotificationListeners,
} from '@/services/fcmService';
import { getNotificationEnabled } from '@/services/notificationSettingsService';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

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

  // Function to register for push notifications
  const registerForPushNotifications = useCallback(async () => {
    console.log('🔔 Starting push notification registration...');
    console.log('🔔 User UID:', user?.uid);
    
    if (!user?.uid) {
      console.log('🔔 No user UID available');
      return;
    }
    
    try {
      // Check if notifications are enabled in user preferences
      const notificationsEnabled = await getNotificationEnabled();
      if (!notificationsEnabled) {
        console.log('🔔 Notifications disabled by user preference, skipping registration');
        // Remove any existing tokens if disabled (clear all tokens for this user)
        try {
          await removeAllDeviceTokens(user.uid, true); // clearAllTokens = true
          console.log('✅ Removed device tokens (notifications disabled)');
          setExpoPushToken(null);
        } catch (error) {
          console.error('Error removing tokens:', error);
        }
        return;
      }
      
      console.log('🔔 Requesting notification permissions...');
      const hasPermission = await requestNotificationPermissions();
      if (!hasPermission) {
        console.log('❌ No permission for notifications - continuing without push notifications');
        // Don't show alert here - permission denial is handled gracefully
        // User can enable notifications later from settings
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
    } catch (error) {
      console.error('❌ Error registering for push notifications:', error);
    }
  }, [user?.uid]);

  // Register when user logs in
  useEffect(() => {
    if (user?.uid) {
      console.log('🔔 User authenticated, checking notification preference...');
      registerForPushNotifications();
    } else {
      console.log('🔔 No user yet, waiting...');
    }
  }, [user?.uid, registerForPushNotifications]);

  // Re-check preference when app comes to foreground (in case user changed it in settings)
  useEffect(() => {
    if (!user?.uid) return;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App came to foreground, re-check notification preference
        console.log('🔔 App came to foreground, re-checking notification preference...');
        // Small delay to ensure any preference changes are saved
        setTimeout(() => {
          registerForPushNotifications();
        }, 1000);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [user?.uid, registerForPushNotifications]);

  /**
   * Handle notification tap/response
   */
  const handleNotificationResponse = useCallback((response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data;

    // Navigate based on notification type
    if (data.type === 'message' && data.conversationId) {
      router.push(`/chat/${data.conversationId}`);
    } else if (data.type === 'booking' && data.bookingId) {
      router.push(`/booking/${data.bookingId}`);
    }
  }, [router]);

  // CRITICAL FIX: Handle notification when app is launched from killed state
  useEffect(() => {
    // Check if app was opened from a notification (killed state)
    Notifications.getLastNotificationResponseAsync()
      .then(response => {
        if (response) {
          console.log('🚀 App launched from notification (killed state):', response);
          handleNotificationResponse(response);
        }
      })
      .catch(error => {
        console.error('Error getting last notification response:', error);
      });
  }, [handleNotificationResponse]);

  // Handle notifications when app is running (foreground/background)
  useEffect(() => {
    // Setup notification listeners
    const cleanup = setupNotificationListeners(
      // When notification is received (foreground)
      (notification) => {
        console.log('📱 Notification received (foreground):', notification);
        setNotification(notification);
      },
      // When user taps on notification (background/foreground)
      (response) => {
        console.log('👆 Notification tapped (app running):', response);
        handleNotificationResponse(response);
      }
    );

    return cleanup;
  }, [handleNotificationResponse]);

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
