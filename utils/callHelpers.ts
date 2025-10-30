import * as Linking from 'expo-linking';

/**
 * Centralized call functionality
 * 
 * Opens the native phone dialer with the provided phone number.
 * Works in both Expo Go and native builds.
 * 
 * @param phoneNumber - Phone number to dial
 * @returns Promise that resolves when the dialer opens
 * 
 * @example
 * ```typescript
 * import { makeCall } from '@/utils/callHelpers';
 * 
 * const handleCall = async () => {
 *   try {
 *     await makeCall('1234567890');
 *   } catch (error) {
 *     console.error('Failed to make call:', error);
 *   }
 * };
 * ```
 */
export const makeCall = async (phoneNumber: string): Promise<void> => {
  if (!phoneNumber || phoneNumber.trim() === '') {
    throw new Error('Phone number is required');
  }

  // Clean phone number (remove spaces, dashes, etc)
  const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
  
  // Open the dialer
  const url = `tel:${cleanPhone}`;
  
  // In Expo Go, Linking.openURL works for tel: even without canOpenURL check
  // This is simpler and more reliable than checking canOpenURL first
  await Linking.openURL(url);
};

