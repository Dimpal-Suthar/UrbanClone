import { db } from '@/config/firebase';
import { SavedAddress } from '@/types/savedAddress';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

/**
 * Get all saved addresses for a user
 */
export const getSavedAddresses = async (userId: string): Promise<SavedAddress[]> => {
  try {
    const q = query(
      collection(db, 'savedAddresses'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as SavedAddress[];
  } catch (error) {
    console.error('❌ Error getting saved addresses:', error);
    throw error;
  }
};

/**
 * Get a saved address by ID
 */
export const getSavedAddressById = async (addressId: string): Promise<SavedAddress | null> => {
  try {
    const docRef = doc(db, 'savedAddresses', addressId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
        updatedAt: docSnap.data().updatedAt?.toDate() || new Date(),
      } as SavedAddress;
    }

    return null;
  } catch (error) {
    console.error('❌ Error getting saved address:', error);
    throw error;
  }
};

/**
 * Create a new saved address
 */
export const createSavedAddress = async (
  userId: string,
  addressData: Omit<SavedAddress, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    // If this is set as default, unset all other defaults
    if (addressData.isDefault) {
      const existingAddresses = await getSavedAddresses(userId);
      const defaultAddresses = existingAddresses.filter(addr => addr.isDefault);
      
      for (const addr of defaultAddresses) {
        await updateDoc(doc(db, 'savedAddresses', addr.id), {
          isDefault: false,
          updatedAt: serverTimestamp(),
        });
      }
    }

    const newAddress = {
      userId,
      ...addressData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'savedAddresses'), newAddress);
    console.log('✅ Saved address created:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error creating saved address:', error);
    throw error;
  }
};

/**
 * Update a saved address
 */
export const updateSavedAddress = async (
  addressId: string,
  updates: Partial<Omit<SavedAddress, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<void> => {
  try {
    // If setting as default, unset all other defaults for this user
    if (updates.isDefault) {
      const address = await getSavedAddressById(addressId);
      if (address) {
        const existingAddresses = await getSavedAddresses(address.userId);
        const defaultAddresses = existingAddresses.filter(addr => addr.isDefault && addr.id !== addressId);
        
        for (const addr of defaultAddresses) {
          await updateDoc(doc(db, 'savedAddresses', addr.id), {
            isDefault: false,
            updatedAt: serverTimestamp(),
          });
        }
      }
    }

    const docRef = doc(db, 'savedAddresses', addressId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    console.log('✅ Saved address updated:', addressId);
  } catch (error) {
    console.error('❌ Error updating saved address:', error);
    throw error;
  }
};

/**
 * Delete a saved address
 */
export const deleteSavedAddress = async (addressId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'savedAddresses', addressId));
    console.log('✅ Saved address deleted:', addressId);
  } catch (error) {
    console.error('❌ Error deleting saved address:', error);
    throw error;
  }
};

