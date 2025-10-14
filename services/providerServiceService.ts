import { db } from '@/config/firebase';
import { ProviderServiceOffering } from '@/types';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where
} from 'firebase/firestore';

const COLLECTION_NAME = 'providerServices';

export const createProviderServiceOffering = async (
  providerId: string,
  serviceId: string,
  data: {
    customPrice: number;
    experience: number;
    description: string;
    images: string[];
  }
): Promise<ProviderServiceOffering> => {
  console.log('📝 Creating provider service offering:', {
    providerId,
    serviceId,
    data,
    collection: COLLECTION_NAME
  });
  
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    providerId,
    serviceId,
    customPrice: data.customPrice,
    isAvailable: true,
    experience: data.experience,
    description: data.description,
    images: data.images,
    rating: 0,
    reviewCount: 0,
    completedJobs: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  
  console.log('✅ Created document with ID:', docRef.id);

  return {
    id: docRef.id,
    providerId,
    serviceId,
    customPrice: data.customPrice,
    isAvailable: true,
    experience: data.experience,
    description: data.description,
    images: data.images,
    rating: 0,
    reviewCount: 0,
    completedJobs: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

export const getProviderServiceOfferings = async (providerId: string): Promise<ProviderServiceOffering[]> => {
  console.log('🔍 Fetching provider service offerings for:', providerId);
  
  try {
    // First try without orderBy to see if that's causing issues
    const q = query(
      collection(db, COLLECTION_NAME),
      where('providerId', '==', providerId)
    );
    
    console.log('📋 Query created, executing...');
    const querySnapshot = await getDocs(q);
    console.log('📄 Query snapshot size:', querySnapshot.docs.length);
    
    const offerings = querySnapshot.docs.map(doc => {
      const data = doc.data();
      console.log('📝 Document data:', doc.id, data);
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    }) as ProviderServiceOffering[];
    
    console.log('📊 Found offerings:', offerings.length, offerings);
    return offerings;
  } catch (error) {
    console.error('❌ Error fetching provider service offerings:', error);
    throw error;
  }
};

export const getProviderServiceOffering = async (id: string): Promise<ProviderServiceOffering | null> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: docSnap.data().createdAt?.toDate() || new Date(),
      updatedAt: docSnap.data().updatedAt?.toDate() || new Date(),
    } as ProviderServiceOffering;
  }
  
  return null;
};

export const updateProviderServiceOffering = async (
  id: string,
  updates: Partial<{
    customPrice: number;
    isAvailable: boolean;
    experience: number;
    description: string;
    images: string[];
  }>
): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

export const deleteProviderServiceOffering = async (id: string): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
};

export const toggleProviderServiceAvailability = async (
  id: string,
  isAvailable: boolean
): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, {
    isAvailable,
    updatedAt: serverTimestamp(),
  });
};
