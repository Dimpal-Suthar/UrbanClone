import { db } from '@/config/firebase';
import { ProviderReview } from '@/types';
import { addDoc, collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp, where } from 'firebase/firestore';

// Reviews are for providers (professionals), following Urban Company's model
const COLLECTION_NAME = 'providerReviews';

// Create a provider review
// NOTE: In production, this should ONLY be called from booking completion screen
// The bookingId should be a real booking ID, not a temporary one
// This function will be properly integrated when the booking system is implemented
export const createProviderReview = async (
  bookingId: string,
  providerId: string,
  customerId: string,
  serviceId: string,
  rating: number,
  comment: string
): Promise<ProviderReview> => {
  console.log('📝 Creating provider review:', {
    bookingId,
    providerId,
    customerId,
    serviceId,
    rating,
    comment: comment.trim(),
    collection: COLLECTION_NAME
  });

  const reviewData = {
    bookingId,
    providerId,
    customerId,
    serviceId,
    rating,
    comment: comment.trim(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, COLLECTION_NAME), reviewData);
  
  console.log('✅ Created review with ID:', docRef.id);
  
  // Fetch customer details for the response
  let customerName = 'Anonymous User';
  let customerPhoto = null;
  
  try {
    const customerDoc = await getDoc(doc(db, 'users', customerId));
    if (customerDoc.exists()) {
      const customerData = customerDoc.data();
      customerName = customerData.name || customerData.displayName || customerData.email?.split('@')[0] || 'Anonymous User';
      customerPhoto = customerData.photoURL || null;
    }
  } catch (error) {
    console.error('Error fetching customer details for response:', error);
  }
  
  return {
    id: docRef.id,
    ...reviewData,
    customerName,
    customerPhoto,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as ProviderReview;
};

// Backward compatibility alias
export const createServiceReview = createProviderReview;

// Get all reviews for providers offering a specific service
export const getServiceReviews = async (serviceId: string): Promise<ProviderReview[]> => {
  console.log('🔍 getServiceReviews - serviceId:', serviceId);
  
  try {
    // Get all reviews for providers who offer this service
    const q = query(
      collection(db, COLLECTION_NAME),
      where('serviceId', '==', serviceId)
    );

    console.log('📋 Query created, executing...');
    const querySnapshot = await getDocs(q);
    console.log('📄 Query snapshot size:', querySnapshot.docs.length);
    
    // Fetch customer details for each review
    const reviewsWithCustomerDetails = await Promise.all(
      querySnapshot.docs.map(async (reviewDoc) => {
        const data = reviewDoc.data();
        console.log('📝 Review document data:', reviewDoc.id, data);
        
        // Fetch customer details
        let customerName = 'Anonymous User';
        let customerPhoto = null;
        
        try {
          const customerDoc = await getDoc(doc(db, 'users', data.customerId));
          if (customerDoc.exists()) {
            const customerData = customerDoc.data();
            customerName = customerData.name || customerData.displayName || customerData.email?.split('@')[0] || 'Anonymous User';
            customerPhoto = customerData.photoURL || null;
          }
        } catch (error) {
          console.error('Error fetching customer details:', error);
        }
        
        return {
          id: reviewDoc.id,
          ...data,
          customerName,
          customerPhoto,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        };
      })
    );
    
    console.log('📊 getServiceReviews - found reviews with customer details:', reviewsWithCustomerDetails.length, reviewsWithCustomerDetails);
    return reviewsWithCustomerDetails as ProviderReview[];
  } catch (error) {
    console.error('❌ Error fetching service reviews:', error);
    throw error;
  }
};

// Get all reviews for a specific provider
export const getProviderReviews = async (providerId: string): Promise<ProviderReview[]> => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('providerId', '==', providerId),
    orderBy('createdAt', 'desc')
  );

  const querySnapshot = await getDocs(q);
  
  // Fetch customer details for each review
  const reviewsWithCustomerDetails = await Promise.all(
    querySnapshot.docs.map(async (reviewDoc) => {
      const data = reviewDoc.data();
      
      // Fetch customer details
      let customerName = 'Anonymous User';
      let customerPhoto = null;
      
      try {
        const customerDoc = await getDoc(doc(db, 'users', data.customerId));
        if (customerDoc.exists()) {
          const customerData = customerDoc.data();
          customerName = customerData.name || customerData.displayName || customerData.email?.split('@')[0] || 'Anonymous User';
          customerPhoto = customerData.photoURL || null;
        }
      } catch (error) {
        console.error('Error fetching customer details:', error);
      }
      
      return {
        id: reviewDoc.id,
        ...data,
        customerName,
        customerPhoto,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    })
  );
  
  return reviewsWithCustomerDetails as ProviderReview[];
};

// Get all reviews written by a specific customer
export const getCustomerReviews = async (customerId: string): Promise<ProviderReview[]> => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('customerId', '==', customerId),
    orderBy('createdAt', 'desc')
  );

  const querySnapshot = await getDocs(q);
  
  // Fetch customer details for each review
  const reviewsWithCustomerDetails = await Promise.all(
    querySnapshot.docs.map(async (reviewDoc) => {
      const data = reviewDoc.data();
      
      // Fetch customer details
      let customerName = 'Anonymous User';
      let customerPhoto = null;
      
      try {
        const customerDoc = await getDoc(doc(db, 'users', data.customerId));
        if (customerDoc.exists()) {
          const customerData = customerDoc.data();
          customerName = customerData.name || customerData.displayName || customerData.email?.split('@')[0] || 'Anonymous User';
          customerPhoto = customerData.photoURL || null;
        }
      } catch (error) {
        console.error('Error fetching customer details:', error);
      }
      
      return {
        id: reviewDoc.id,
        ...data,
        customerName,
        customerPhoto,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    })
  );
  
  return reviewsWithCustomerDetails as ProviderReview[];
};