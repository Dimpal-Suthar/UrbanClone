import { db } from '@/config/firebase';
import { ProviderServiceOffering, User } from '@/types';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

/**
 * Get all providers who offer a specific service
 * This fetches providers from the users collection and their service offerings
 */
export const getProvidersForService = async (serviceId: string): Promise<Array<User & { offering: ProviderServiceOffering }>> => {
  try {
    // First, get all provider service offerings for this service
    const offeringsQuery = query(
      collection(db, 'providerServices'),
      where('serviceId', '==', serviceId),
      where('isAvailable', '==', true)
    );
    
    const offeringsSnapshot = await getDocs(offeringsQuery);
    
    // Then fetch the provider user data for each offering
    const providers = await Promise.all(
      offeringsSnapshot.docs.map(async (offeringDoc) => {
        const offering = {
          id: offeringDoc.id,
          ...offeringDoc.data(),
        } as ProviderServiceOffering;
        
        // Get the provider user data
        const userDoc = await getDoc(doc(db, 'users', offering.providerId));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Get provider-specific review count (reviews are for providers, not services)
          const reviewsQuery = query(
            collection(db, 'providerReviews'),
            where('providerId', '==', offering.providerId)
          );
          const reviewsSnapshot = await getDocs(reviewsQuery);
          
          // Calculate average rating for this provider
          let providerRating = 0;
          let providerReviewCount = reviewsSnapshot.docs.length;
          
          if (providerReviewCount > 0) {
            const totalRating = reviewsSnapshot.docs.reduce((sum, reviewDoc) => {
              return sum + (reviewDoc.data().rating || 0);
            }, 0);
            providerRating = totalRating / providerReviewCount;
          }
          
          return {
            id: userDoc.id,
            ...userData,
            rating: providerRating, // Override with calculated provider rating
            reviewCount: providerReviewCount, // Override with provider review count
            offering, // Include the service offering details
          } as User & { offering: ProviderServiceOffering };
        }
        
        return null;
      })
    );
    
    // Filter out any null values and return
    return providers.filter((provider): provider is User & { offering: ProviderServiceOffering } => provider !== null);
  } catch (error) {
    console.error('Error fetching providers for service:', error);
    throw new Error('Failed to fetch providers');
  }
};

/**
 * Get provider by ID
 */
export const getProviderById = async (providerId: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', providerId));
    
    if (userDoc.exists() && userDoc.data().role === 'provider') {
      return {
        id: userDoc.id,
        ...userDoc.data(),
      } as User;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching provider:', error);
    throw new Error('Failed to fetch provider');
  }
};

/**
 * Get all active providers
 */
export const getAllProviders = async (): Promise<User[]> => {
  try {
    const providersQuery = query(
      collection(db, 'users'),
      where('role', '==', 'provider')
    );
    
    const providersSnapshot = await getDocs(providersQuery);
    
    return providersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as User[];
  } catch (error) {
    console.error('Error fetching providers:', error);
    throw new Error('Failed to fetch providers');
  }
};

/**
 * Update provider service categories
 */
export const updateProviderCategories = async (
  providerId: string, 
  categories: string[]
): Promise<void> => {
  try {
    const providerRef = doc(db, 'providers', providerId);
    await updateDoc(providerRef, {
      services: categories,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating provider categories:', error);
    throw new Error('Failed to update categories');
  }
};
