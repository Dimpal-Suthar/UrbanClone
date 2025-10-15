import { app } from '@/config/firebase';
import { deleteObject, getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';

const storage = getStorage(app);

/**
 * Upload image to Firebase Storage
 */
export const uploadImage = async (
  imageUri: string,
  path: string
): Promise<string> => {
  try {
    // Convert image URI to blob
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Create storage reference
    const storageRef = ref(storage, path);

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