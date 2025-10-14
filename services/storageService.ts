import { app } from '@/config/firebase';
import { deleteObject, getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';

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
    
    // Generate unique filename if not provided
    const uniqueFileName = fileName || `${Date.now()}_${Math.random().toString(36).substring(2)}.jpg`;
    
    // Create storage reference
    const storageRef = ref(storage, `${path}/${uniqueFileName}`);
    
    // Upload the blob
    const snapshot = await uploadBytes(storageRef, blob);
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error('Failed to upload image');
  }
};

/**
 * Upload multiple images to Firebase Storage
 */
export const uploadImages = async (
  imageUris: string[],
  path: string
): Promise<string[]> => {
  try {
    const uploadPromises = imageUris.map((uri, index) => 
      uploadImage(uri, path, `image_${index}_${Date.now()}.jpg`)
    );
    
    const downloadURLs = await Promise.all(uploadPromises);
    return downloadURLs;
  } catch (error) {
    console.error('Upload multiple images error:', error);
    throw new Error('Failed to upload images');
  }
};

/**
 * Delete image from Firebase Storage
 */
export const deleteImage = async (imageUrl: string): Promise<void> => {
  try {
    // Extract path from URL
    const url = new URL(imageUrl);
    const path = decodeURIComponent(url.pathname.split('/o/')[1].split('?')[0]);
    
    const imageRef = ref(storage, path);
    await deleteObject(imageRef);
  } catch (error) {
    console.error('Delete image error:', error);
    // Don't throw error for delete operations to avoid breaking the app
    console.warn('Failed to delete image from storage:', imageUrl);
  }
};

/**
 * Delete multiple images from Firebase Storage
 */
export const deleteImages = async (imageUrls: string[]): Promise<void> => {
  try {
    const deletePromises = imageUrls.map(url => deleteImage(url));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Delete multiple images error:', error);
    console.warn('Some images may not have been deleted from storage');
  }
};

/**
 * Get storage path for different types of images
 */
export const getStoragePath = {
  serviceImages: (serviceId: string) => `services/${serviceId}/images`,
  providerOfferingImages: (providerId: string, offeringId: string) => `providers/${providerId}/offerings/${offeringId}/images`,
  userAvatars: (userId: string) => `users/${userId}/avatar`,
  reviewImages: (reviewId: string) => `reviews/${reviewId}/images`,
};
