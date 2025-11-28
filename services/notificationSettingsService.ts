import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_SETTINGS_KEY = '@urban_clone_notifications_enabled';

/**
 * Get notification enabled preference
 * Defaults to true if not set
 */
export const getNotificationEnabled = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    if (value === null) {
      // Default to enabled if not set
      return true;
    }
    return value === 'true';
  } catch (error) {
    console.error('Error getting notification preference:', error);
    // Default to enabled on error
    return true;
  }
};

/**
 * Set notification enabled preference
 */
export const setNotificationEnabled = async (enabled: boolean): Promise<void> => {
  try {
    await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, enabled ? 'true' : 'false');
    console.log('✅ Notification preference saved:', enabled);
  } catch (error) {
    console.error('Error saving notification preference:', error);
    throw error;
  }
};

/**
 * Get notification enabled preference synchronously (for initial state)
 * Returns null if not set (use async version for actual value)
 */
export const getNotificationEnabledSync = (): boolean | null => {
  try {
    // Note: AsyncStorage.getItem is async, so this is a fallback
    // For initial state, we'll use the async version
    return null;
  } catch (error) {
    return null;
  }
};

