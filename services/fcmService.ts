import { db } from '@/config/firebase';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { Platform } from 'react-native';

/**
 * Configure notification behavior
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    // Allow in simulator/Expo Go for development
    console.log('🔔 Device check:', Device.isDevice);
    
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    console.log('🔔 Existing permission status:', existingStatus);
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      console.log('🔔 Requesting permissions...');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log('🔔 New permission status:', finalStatus);
    }

    if (finalStatus !== 'granted') {
      console.log('❌ Permission not granted');
      return false;
    }

    console.log('✅ Permission granted');
    return true;
  } catch (error) {
    console.error('❌ Error requesting notification permissions:', error);
    return false;
  }
};

/**
 * Get Expo Push Token
 */
export const getExpoPushToken = async (): Promise<string | null> => {
  try {
    // Allow in simulator/Expo Go for development
    console.log('🔔 Device check:', Device.isDevice);
    
    // For Android, set notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    console.log('🔔 Getting Expo push token...');
    
    // Try to get project ID from Constants (for EAS builds)
    // In Expo Go, we can call without projectId and it works fine
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const isValidUUID = projectId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId);
    
    console.log('🔔 Project ID:', projectId || 'none (Expo Go mode)');
    
    try {
      // If we have a valid UUID project ID, use it (EAS builds)
      // Otherwise, call without projectId (works in Expo Go)
      const token = isValidUUID
        ? await Notifications.getExpoPushTokenAsync({ projectId })
        : await Notifications.getExpoPushTokenAsync();
      
      console.log('📱 Expo Push Token:', token.data);
      return token.data;
    } catch (error) {
      console.error('❌ Error getting push token:', error);
      return null;
    }
  } catch (error) {
    console.error('❌ Error getting push token:', error);
    return null;
  }
};

/**
 * Get native device push token (FCM on Android, APNs on iOS)
 */
export const getNativePushToken = async (): Promise<{ token: string; type: 'fcm' | 'apns' } | null> => {
  try {
    const deviceToken = await Notifications.getDevicePushTokenAsync();
    // On Android, deviceToken.type is usually 'fcm'; on iOS it's 'apns'
    const type = (deviceToken.type === 'ios' || deviceToken.type === 'apns') ? 'apns' : 'fcm';
    return { token: deviceToken.data, type };
  } catch (error) {
    console.error('❌ Error getting native device push token:', error);
    return null;
  }
};

/**
 * Save FCM token to Firestore (stored in users collection)
 */
export const saveFCMToken = async (
  userId: string,
  token: string
): Promise<void> => {
  try {
    console.log('🔔 saveFCMToken called with:', { userId, token });
    const userRef = doc(db, 'users', userId);
    
    // Check if document exists
    console.log('🔔 Fetching user document...');
    const docSnap = await getDoc(userRef);
    console.log('🔔 Document exists:', docSnap.exists());

    if (docSnap.exists()) {
      const data = docSnap.data();
      const tokens = data.deviceTokens || [];
      console.log('🔔 Current device tokens:', tokens);
      
      // Add token if it doesn't exist
      if (!tokens.includes(token)) {
        const updatedTokens = [...tokens, token];
        console.log('🔔 Adding new token. Updated tokens:', updatedTokens);
        
        await updateDoc(userRef, {
          deviceTokens: updatedTokens,
          updatedAt: serverTimestamp(),
        });
        console.log('✅ FCM token saved successfully to Firestore');
      } else {
        console.log('✅ Token already exists, skipping');
      }
    } else {
      // Create minimal user document with token if missing (signup race-safe)
      console.log('ℹ️ User document missing; creating with token');
      await setDoc(userRef, {
        uid: userId,
        deviceTokens: [token],
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      }, { merge: true });
      console.log('✅ Created user doc and saved token');
    }
  } catch (error) {
    console.error('❌ Error saving FCM token:', error);
    throw error;
  }
};

/**
 * Save native push token (FCM/APNs) to Firestore on user doc
 * Fields:
 *  - fcmToken (Android)
 *  - apnsToken (iOS)
 */
export const saveNativePushToken = async (
  userId: string,
  token: string,
  type: 'fcm' | 'apns'
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userRef);

    // Create document if missing to avoid race during signup
    if (!docSnap.exists()) {
      await setDoc(userRef, {
        uid: userId,
        createdAt: serverTimestamp(),
      }, { merge: true });
    }

    const update: any = { updatedAt: serverTimestamp() };
    if (type === 'fcm') update.fcmToken = token;
    if (type === 'apns') update.apnsToken = token;

    await updateDoc(userRef, update);
    console.log('✅ Saved native push token', type);
  } catch (error) {
    console.error('❌ Error saving native push token:', error);
    throw error;
  }
};

/**
 * Remove FCM token from Firestore (stored in users collection)
 * Removes Expo push token from deviceTokens array
 */
export const removeFCMToken = async (
  userId: string,
  token: string
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const tokens = data.deviceTokens || [];
      const updatedTokens = tokens.filter((t: string) => t !== token);

      await updateDoc(userRef, {
        deviceTokens: updatedTokens.length > 0 ? updatedTokens : [],
        updatedAt: serverTimestamp(),
      });
      console.log('✅ Expo push token removed from deviceTokens array');
    } else {
      console.warn('⚠️ User document does not exist, cannot remove token');
    }
  } catch (error) {
    console.error('Error removing FCM token:', error);
    throw error;
  }
};

/**
 * Remove all device tokens for current device on logout
 * Clears both deviceTokens array and fcmToken/apnsToken fields
 */
export const removeAllDeviceTokens = async (userId: string): Promise<void> => {
  try {
    console.log('🔔 removeAllDeviceTokens called for userId:', userId);
    const userRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log('🔔 Current fcmToken in DB:', data.fcmToken);
      console.log('🔔 Current apnsToken in DB:', data.apnsToken);
      console.log('🔔 Current deviceTokens:', data.deviceTokens);
      
      // Get current device tokens
      const expoToken = await getExpoPushToken();
      const nativeToken = await getNativePushToken();
      
      console.log('🔔 Current device Expo token:', expoToken);
      console.log('🔔 Current device native token:', nativeToken);
      
      const tokens = data.deviceTokens || [];
      
      // Remove current device's Expo token from array
      const updatedTokens = expoToken 
        ? tokens.filter((t: string) => t !== expoToken)
        : tokens;

      // Prepare update - clear all device-specific tokens
      const update: any = {
        deviceTokens: updatedTokens.length > 0 ? updatedTokens : [],
        updatedAt: serverTimestamp(),
      };
      
      // CRITICAL: Always clear fcmToken and apnsToken if they exist
      // We clear them regardless of match because on logout, we want to remove
      // all tokens for this device, and if there's a token stored, it's likely from this device
      if (data.fcmToken) {
        update.fcmToken = null;
        console.log('🔔 Clearing fcmToken field on logout:', data.fcmToken);
      }
      if (data.apnsToken) {
        update.apnsToken = null;
        console.log('🔔 Clearing apnsToken field on logout:', data.apnsToken);
      }

      console.log('🔔 Updating user document with:', update);
      await updateDoc(userRef, update);
      console.log('✅ All device tokens removed successfully on logout');
    } else {
      console.warn('⚠️ User document does not exist, cannot remove tokens');
    }
  } catch (error) {
    console.error('❌ Error removing all device tokens:', error);
    throw error;
  }
};

/**
 * Get all tokens for a user (stored in users collection)
 */
export const getUserTokens = async (userId: string): Promise<string[]> => {
  try {
    const userRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      // Return Expo tokens as well for dev banners; native tokens used by backend
      const expoTokens: string[] = data.deviceTokens || [];
      return expoTokens;
    }

    return [];
  } catch (error) {
    console.error('Error getting user tokens:', error);
    return [];
  }
};

/**
 * Setup notification listeners
 */
export const setupNotificationListeners = (
  onNotificationReceived: (notification: Notifications.Notification) => void,
  onNotificationResponse: (response: Notifications.NotificationResponse) => void
) => {
  // Listener for when notification is received (foreground)
  const receivedListener = Notifications.addNotificationReceivedListener(onNotificationReceived);

  // Listener for when user taps on notification
  const responseListener = Notifications.addNotificationResponseReceivedListener(onNotificationResponse);

  // Return cleanup function
  return () => {
    receivedListener.remove();
    responseListener.remove();
  };
};

/**
 * Schedule a local notification
 */
export const scheduleLocalNotification = async (
  title: string,
  body: string,
  data?: any
): Promise<string> => {
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null, // Show immediately
    });

    return id;
  } catch (error) {
    console.error('Error scheduling local notification:', error);
    throw error;
  }
};

/**
 * Cancel all local notifications
 */
export const cancelAllNotifications = async (): Promise<void> => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error canceling notifications:', error);
  }
};

/**
 * Get notification badge count
 */
export const getBadgeCount = async (): Promise<number> => {
  try {
    return await Notifications.getBadgeCountAsync();
  } catch (error) {
    console.error('Error getting badge count:', error);
    return 0;
  }
};

/**
 * Set notification badge count
 */
export const setBadgeCount = async (count: number): Promise<void> => {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    console.error('Error setting badge count:', error);
  }
};

/**
 * Clear all badges
 */
export const clearBadges = async (): Promise<void> => {
  try {
    await Notifications.setBadgeCountAsync(0);
  } catch (error) {
    console.error('Error clearing badges:', error);
  }
};

