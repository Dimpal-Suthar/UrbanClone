import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Alert, Linking, Platform } from 'react-native';

/**
 * Permission Utility Service
 * Provides graceful handling for all permission denials with user-friendly messages
 */

export type PermissionType = 'notifications' | 'location' | 'camera' | 'mediaLibrary';

/**
 * Open device settings
 */
export const openSettings = async (): Promise<void> => {
  try {
    if (Platform.OS === 'ios') {
      await Linking.openURL('app-settings:');
    } else {
      await Linking.openSettings();
    }
  } catch (error) {
    console.error('Error opening settings:', error);
    Alert.alert(
      'Open Settings',
      'Please go to Settings > Apps > ServiceSquad > Permissions to enable permissions manually.',
      [{ text: 'OK' }]
    );
  }
};

/**
 * Check if permission is permanently denied (user selected "Don't ask again")
 */
export const isPermissionPermanentlyDenied = async (
  type: PermissionType
): Promise<boolean> => {
  try {
    switch (type) {
      case 'notifications': {
        const { status, canAskAgain } = await Notifications.getPermissionsAsync();
        return status === 'denied' && !canAskAgain;
      }
      case 'location': {
        const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
        return status === 'denied' && !canAskAgain;
      }
      case 'camera': {
        const { status, canAskAgain } = await ImagePicker.getCameraPermissionsAsync();
        return status === 'denied' && !canAskAgain;
      }
      case 'mediaLibrary': {
        const { status, canAskAgain } = await ImagePicker.getMediaLibraryPermissionsAsync();
        return status === 'denied' && !canAskAgain;
      }
      default:
        return false;
    }
  } catch (error) {
    console.error('Error checking permission status:', error);
    return false;
  }
};

/**
 * Show permission denied alert with option to open settings
 */
export const showPermissionDeniedAlert = (
  permissionType: PermissionType,
  onOpenSettings?: () => void
): void => {
  const messages: Record<PermissionType, { title: string; message: string }> = {
    notifications: {
      title: 'Notification Permission Required',
      message: 'To receive booking updates and messages, please enable notifications in Settings.',
    },
    location: {
      title: 'Location Permission Required',
      message: 'Location access is needed to find nearby services and track your bookings. Please enable location in Settings.',
    },
    camera: {
      title: 'Camera Permission Required',
      message: 'Camera access is needed to take photos for your profile or service listings. Please enable camera in Settings.',
    },
    mediaLibrary: {
      title: 'Photo Library Permission Required',
      message: 'Photo library access is needed to select images for your profile or service listings. Please enable photo library in Settings.',
    },
  };

  const { title, message } = messages[permissionType];

  Alert.alert(
    title,
    message,
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Open Settings',
        onPress: async () => {
          if (onOpenSettings) {
            onOpenSettings();
          } else {
            await openSettings();
          }
        },
      },
    ],
    { cancelable: true }
  );
};

/**
 * Show permission denied message (non-blocking, for non-critical permissions)
 */
export const showPermissionDeniedMessage = (permissionType: PermissionType): void => {
  const messages: Record<PermissionType, string> = {
    notifications: 'Notifications are disabled. You can enable them in Settings.',
    location: 'Location access is disabled. Some features may not work properly.',
    camera: 'Camera access is disabled. You can still select photos from your gallery.',
    mediaLibrary: 'Photo library access is disabled. You can still take new photos.',
  };

  // This can be replaced with a toast notification if you prefer
  console.log('ℹ️', messages[permissionType]);
};

/**
 * Request permission with automatic alert handling
 * This is a unified function that handles the entire permission flow:
 * 1. Check if permanently denied -> show settings alert
 * 2. Request permission
 * 3. If denied -> show retry alert
 * 4. Return true if granted, false otherwise
 */
export const requestPermissionWithAlert = async (
  permissionType: PermissionType,
  requestFn: () => Promise<boolean>,
  onGranted?: () => void | Promise<void>,
  customDeniedMessage?: string
): Promise<boolean> => {
  try {
    // Check if permanently denied first
    const isPermanentlyDenied = await isPermissionPermanentlyDenied(permissionType);
    if (isPermanentlyDenied) {
      showPermissionDeniedAlert(permissionType);
      return false;
    }

    // Request permission
    const hasPermission = await requestFn();
    
    if (hasPermission) {
      // Permission granted
      if (onGranted) {
        await onGranted();
      }
      return true;
    }

    // Permission denied - show retry alert
    const messages: Record<PermissionType, { title: string; message: string }> = {
      notifications: {
        title: 'Notification Permission Required',
        message: customDeniedMessage || 'To receive push notifications, please grant notification permission when prompted.',
      },
      location: {
        title: 'Location Permission Required',
        message: customDeniedMessage || 'Location permission is needed to use this feature. Please grant permission to continue.',
      },
      camera: {
        title: 'Camera Permission Required',
        message: customDeniedMessage || 'Camera permission is needed to take photos. Please grant permission to continue.',
      },
      mediaLibrary: {
        title: 'Photo Library Permission Required',
        message: customDeniedMessage || 'Photo library permission is needed to select images. Please grant permission to continue.',
      },
    };

    const { title, message } = messages[permissionType];

    return new Promise((resolve) => {
      Alert.alert(
        title,
        message,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: 'Grant Permission',
            onPress: async () => {
              // Retry requesting permission
              const retryPermission = await requestFn();
              if (retryPermission && onGranted) {
                await onGranted();
              }
              resolve(retryPermission);
            },
          },
        ],
        { cancelable: true, onDismiss: () => resolve(false) }
      );
    });
  } catch (error) {
    console.error('Error requesting permission:', error);
    Alert.alert('Error', 'Failed to request permission. Please try again.');
    return false;
  }
};

