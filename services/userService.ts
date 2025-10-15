import { db } from '@/config/firebase';
import { UpdateUserInput, User } from '@/types';
import {
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';

/**
 * Get user by ID
 */
export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return {
        id: userDoc.id,
        ...userDoc.data(),
        createdAt: userDoc.data().createdAt?.toDate() || new Date(),
        updatedAt: userDoc.data().updatedAt?.toDate() || new Date(),
      } as User;
    }
    return null;
  } catch (error) {
    console.error('❌ Error getting user:', error);
    throw error;
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (
  userId: string,
  updates: UpdateUserInput
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    
    // Filter out undefined values to avoid Firebase error
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined && value !== null && value !== '')
    );
    
    const updateData = {
      ...filteredUpdates,
      updatedAt: serverTimestamp(),
    };
    
    await updateDoc(userRef, updateData);
    console.log('✅ User profile updated:', userId);
  } catch (error) {
    console.error('❌ Error updating user profile:', error);
    throw error;
  }
};

/**
 * Update user phone number
 */
export const updateUserPhone = async (
  userId: string,
  phone: string
): Promise<void> => {
  try {
    await updateUserProfile(userId, { phone });
    console.log('✅ User phone updated:', userId);
  } catch (error) {
    console.error('❌ Error updating user phone:', error);
    throw error;
  }
};

/**
 * Update user availability (for providers)
 */
export const updateUserAvailability = async (
  userId: string,
  isAvailable: boolean
): Promise<void> => {
  try {
    await updateUserProfile(userId, { isAvailable });
    console.log('✅ User availability updated:', userId);
  } catch (error) {
    console.error('❌ Error updating user availability:', error);
    throw error;
  }
};

/**
 * Update user bio (for providers)
 */
export const updateUserBio = async (
  userId: string,
  bio: string
): Promise<void> => {
  try {
    await updateUserProfile(userId, { bio });
    console.log('✅ User bio updated:', userId);
  } catch (error) {
    console.error('❌ Error updating user bio:', error);
    throw error;
  }
};

/**
 * Update user experience (for providers)
 */
export const updateUserExperience = async (
  userId: string,
  experience: number
): Promise<void> => {
  try {
    await updateUserProfile(userId, { experience });
    console.log('✅ User experience updated:', userId);
  } catch (error) {
    console.error('❌ Error updating user experience:', error);
    throw error;
  }
};
