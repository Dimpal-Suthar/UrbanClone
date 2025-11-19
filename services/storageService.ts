import { getApp } from 'firebase/app';
import { deleteObject, getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';

const app = getApp();
const storage = getStorage(app);

/**
 * Upload image to Firebase Storage
 */
export const uploadImage = async (
  imageUri: string,
  path: string,
  fileName?: string
): Promise<string> => {
  try {
    // Convert image URI to blob
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Create storage reference with optional fileName
    const fullPath = fileName ? `${path}/${fileName}` : path;
    const storageRef = ref(storage, fullPath);

    // Upload file
    const snapshot = await uploadBytes(storageRef, blob);
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log('✅ Image uploaded successfully:', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('❌ Error uploading image:', error);
    throw error;
  }
};

/**
 * Upload user profile image
 */
export const uploadProfileImage = async (
  userId: string,
  imageUri: string
): Promise<string> => {
  const path = `profile-images/${userId}-${Date.now()}.jpg`;
  return uploadImage(imageUri, path);
};

/**
 * Upload service images
 */
export const uploadServiceImages = async (
  serviceId: string,
  imageUris: string[]
): Promise<string[]> => {
  const uploadPromises = imageUris.map((uri, index) => {
    const path = `service-images/${serviceId}/${index}-${Date.now()}.jpg`;
    return uploadImage(uri, path);
  });

  return Promise.all(uploadPromises);
};

/**
 * Upload booking images
 */
export const uploadBookingImages = async (
  bookingId: string,
  imageUris: string[]
): Promise<string[]> => {
  const uploadPromises = imageUris.map((uri, index) => {
    const path = `booking-images/${bookingId}/${index}-${Date.now()}.jpg`;
    return uploadImage(uri, path);
  });

  return Promise.all(uploadPromises);
};

/**
 * Upload multiple images to Firebase Storage
 */
export const uploadImages = async (
  imageUris: string[],
  basePath: string
): Promise<string[]> => {
  const uploadPromises = imageUris.map((uri, index) => {
    const fileName = `${index}-${Date.now()}.jpg`;
    const path = basePath ? `${basePath}/${fileName}` : fileName;
    return uploadImage(uri, path);
  });

  return Promise.all(uploadPromises);
};

/**
 * Delete image from Firebase Storage
 */
export const deleteImage = async (imageUrl: string): Promise<void> => {
  try {
    const imageRef = ref(storage, imageUrl);
    await deleteObject(imageRef);
    console.log('✅ Image deleted successfully');
  } catch (error) {
    console.error('❌ Error deleting image:', error);
    throw error;
  }
};

/**
 * Delete multiple images from Firebase Storage
 */
export const deleteImages = async (imageUrls: string[]): Promise<void> => {
  const deletePromises = imageUrls.map(url => deleteImage(url));
  await Promise.all(deletePromises);
};

/**
 * Storage Path Utility
 * Generates consistent storage paths for different resources
 */
export const getStoragePath = {
  /**
   * Get storage path for provider offering images
   * Format: provider-offerings/{providerId}/{offeringId}/...
   */
  providerOfferingImages: (providerId: string, offeringId: string): string => {
    return `provider-offerings/${providerId}/${offeringId}`;
  },
  
  /**
   * Get storage path for profile images
   */
  profileImage: (userId: string): string => {
    return `profile-images/${userId}`;
  },
  
  /**
   * Get storage path for service images
   */
  serviceImages: (serviceId: string): string => {
    return `service-images/${serviceId}`;
  },
  
  /**
   * Get storage path for booking images
   */
  bookingImages: (bookingId: string): string => {
    return `booking-images/${bookingId}`;
  },
};