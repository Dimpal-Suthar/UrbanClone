import { db } from '@/config/firebase';
import { Booking, BookingStatus, CreateBookingInput, UpdateBookingInput } from '@/types';
import {
  notifyBookingAccepted,
  notifyBookingCancelled,
  notifyBookingCompleted,
  notifyBookingCreated,
  notifyBookingOnTheWay,
  notifyBookingRejected,
  notifyBookingStarted,
} from '@/utils/pushNotifications';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  increment,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

/**
 * Helper function to safely convert Firestore timestamps or ISO strings to Date
 * This handles both old data (ISO strings) and new data (Firestore Timestamps)
 */
const safeToDate = (value: any): Date => {
  if (!value) return new Date();
  
  // If it's a Firestore Timestamp with toDate method
  if (value && typeof value.toDate === 'function') {
    return value.toDate();
  }
  
  // If it's an ISO string
  if (typeof value === 'string') {
    return new Date(value);
  }
  
  // If it's already a Date
  if (value instanceof Date) {
    return value;
  }
  
  // Fallback
  return new Date();
};


/**
 * Create a new booking
 */
export const createBooking = async (
  input: CreateBookingInput,
  customerData: { name: string; phone: string; photo?: string },
  providerData: { name: string; phone: string; photo?: string },
  serviceData: { name: string; category: string; price: number }
): Promise<string> => {
  try {
    const bookingData = {
      customerId: input.customerId,
      customerName: customerData.name,
      customerPhone: customerData.phone,
      customerPhoto: customerData.photo || null,
      providerId: input.providerId,
      providerName: providerData.name,
      providerPhone: providerData.phone,
      providerPhoto: providerData.photo || null,
      serviceId: input.serviceId,
      serviceName: serviceData.name,
      serviceCategory: serviceData.category,
      status: 'pending' as BookingStatus,
      scheduledDate: input.scheduledDate,
      scheduledTime: input.scheduledTime,
      scheduledSlot: input.scheduledSlot,
      address: input.address,
      price: serviceData.price,
      notes: input.notes || null,
      images: [],
      cancellationReason: null,
      completedAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'bookings'), bookingData);
    console.log('✅ Booking created with ID:', docRef.id);

    // Send push notification to provider
    await notifyBookingCreated(
      input.providerId,
      docRef.id,
      customerData.name,
      serviceData.name
    );

    return docRef.id;
  } catch (error) {
    console.error('❌ Error creating booking:', error);
    throw error;
  }
};

/**
 * Get a booking by ID
 */
export const getBookingById = async (bookingId: string): Promise<Booking | null> => {
  try {
    const docRef = doc(db, 'bookings', bookingId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: safeToDate(docSnap.data().createdAt),
        updatedAt: safeToDate(docSnap.data().updatedAt),
        completedAt: docSnap.data().completedAt ? safeToDate(docSnap.data().completedAt) : null,
      } as Booking;
    }

    return null;
  } catch (error) {
    console.error('❌ Error getting booking:', error);
    throw error;
  }
};

/**
 * Get all bookings for a customer
 */
export const getCustomerBookings = async (customerId: string): Promise<Booking[]> => {
  try {
    const q = query(
      collection(db, 'bookings'),
      where('customerId', '==', customerId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: safeToDate(doc.data().createdAt),
      updatedAt: safeToDate(doc.data().updatedAt),
      completedAt: doc.data().completedAt ? safeToDate(doc.data().completedAt) : null,
    })) as Booking[];
  } catch (error) {
    console.error('❌ Error getting customer bookings:', error);
    throw error;
  }
};

/**
 * Get all bookings for a provider
 */
export const getProviderBookings = async (providerId: string): Promise<Booking[]> => {
  try {
    const q = query(
      collection(db, 'bookings'),
      where('providerId', '==', providerId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: safeToDate(doc.data().createdAt),
      updatedAt: safeToDate(doc.data().updatedAt),
      completedAt: doc.data().completedAt ? safeToDate(doc.data().completedAt) : null,
    })) as Booking[];
  } catch (error) {
    console.error('❌ Error getting provider bookings:', error);
    throw error;
  }
};

/**
 * Get bookings by status for a customer
 */
export const getCustomerBookingsByStatus = async (
  customerId: string,
  statuses: BookingStatus[]
): Promise<Booking[]> => {
  try {
    const q = query(
      collection(db, 'bookings'),
      where('customerId', '==', customerId),
      where('status', 'in', statuses),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: safeToDate(doc.data().createdAt),
      updatedAt: safeToDate(doc.data().updatedAt),
      completedAt: doc.data().completedAt ? safeToDate(doc.data().completedAt) : null,
    })) as Booking[];
  } catch (error) {
    console.error('❌ Error getting customer bookings by status:', error);
    throw error;
  }
};

/**
 * Get bookings by status for a provider
 */
export const getProviderBookingsByStatus = async (
  providerId: string,
  statuses: BookingStatus[]
): Promise<Booking[]> => {
  try {
    const q = query(
      collection(db, 'bookings'),
      where('providerId', '==', providerId),
      where('status', 'in', statuses),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: safeToDate(doc.data().createdAt),
      updatedAt: safeToDate(doc.data().updatedAt),
      completedAt: doc.data().completedAt ? safeToDate(doc.data().completedAt) : null,
    })) as Booking[];
  } catch (error) {
    console.error('❌ Error getting provider bookings by status:', error);
    throw error;
  }
};

/**
 * Update a booking
 */
export const updateBooking = async (
  bookingId: string,
  updates: UpdateBookingInput
): Promise<void> => {
  try {
    const docRef = doc(db, 'bookings', bookingId);
    const updateData: any = {
      ...updates,
      updatedAt: serverTimestamp(),
    };

    // Add completedAt timestamp when status is set to completed
    if (updates.status === 'completed') {
      updateData.completedAt = serverTimestamp();
    }

    await updateDoc(docRef, updateData);
    console.log('✅ Booking updated:', bookingId);
  } catch (error) {
    console.error('❌ Error updating booking:', error);
    throw error;
  }
};

/**
 * Update booking status
 */
export const updateBookingStatus = async (
  bookingId: string,
  status: BookingStatus,
  reason?: string
): Promise<void> => {
  try {
    const updates: UpdateBookingInput = { status };
    if (reason) {
      updates.cancellationReason = reason;
    }
    await updateBooking(bookingId, updates);
  } catch (error) {
    console.error('❌ Error updating booking status:', error);
    throw error;
  }
};

/**
 * Cancel a booking
 */
export const cancelBooking = async (
  bookingId: string,
  reason: string,
  cancelledByUserId?: string
): Promise<void> => {
  try {
    await updateBookingStatus(bookingId, 'cancelled', reason);
    console.log('✅ Booking cancelled:', bookingId);

    // Send push notification to the other party
    const booking = await getBookingById(bookingId);
    if (booking) {
      const recipientId = cancelledByUserId === booking.customerId
        ? booking.providerId // Customer cancelled - notify provider
        : booking.customerId; // Provider cancelled - notify customer

      const cancelledByName = cancelledByUserId === booking.customerId
        ? booking.customerName || 'Customer'
        : booking.providerName || 'Provider';

      await notifyBookingCancelled(
        recipientId,
        bookingId,
        cancelledByName,
        booking.serviceName || 'Service',
        reason
      );
    }
  } catch (error) {
    console.error('❌ Error cancelling booking:', error);
    throw error;
  }
};

/**
 * Accept a booking (provider)
 */
export const acceptBooking = async (bookingId: string): Promise<void> => {
  try {
    await updateBookingStatus(bookingId, 'accepted');
    console.log('✅ Booking accepted:', bookingId);

    // Send push notification to customer
    const booking = await getBookingById(bookingId);
    if (booking) {
      await notifyBookingAccepted(
        booking.customerId,
        bookingId,
        booking.providerName || 'Provider',
        booking.serviceName || 'Service'
      );
    }
  } catch (error) {
    console.error('❌ Error accepting booking:', error);
    throw error;
  }
};

/**
 * Reject a booking (provider)
 */
export const rejectBooking = async (bookingId: string, reason: string): Promise<void> => {
  try {
    await updateBookingStatus(bookingId, 'rejected', reason);
    console.log('✅ Booking rejected:', bookingId);

    // Send push notification to customer
    const booking = await getBookingById(bookingId);
    if (booking) {
      await notifyBookingRejected(
        booking.customerId,
        bookingId,
        booking.providerName || 'Provider',
        booking.serviceName || 'Service',
        reason
      );
    }
  } catch (error) {
    console.error('❌ Error rejecting booking:', error);
    throw error;
  }
};

/**
 * Start service (provider marks as in-progress)
 */
export const startService = async (bookingId: string): Promise<void> => {
  try {
    await updateBookingStatus(bookingId, 'in-progress');
    console.log('✅ Service started:', bookingId);

    // Send push notification to customer
    const booking = await getBookingById(bookingId);
    if (booking) {
      await notifyBookingStarted(
        booking.customerId,
        bookingId,
        booking.providerName || 'Provider',
        booking.serviceName || 'Service'
      );
    }
  } catch (error) {
    console.error('❌ Error starting service:', error);
    throw error;
  }
};

/**
 * Complete a booking
 */
export const completeBooking = async (
  bookingId: string,
  images?: string[]
): Promise<void> => {
  try {
    // First get the booking to get providerId
    const booking = await getBookingById(bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    const updates: UpdateBookingInput = {
      status: 'completed',
    };
    // Note: updateBooking automatically sets completedAt when status is 'completed'
    if (images && images.length > 0) {
      updates.images = images;
    }
    await updateBooking(bookingId, updates);
    console.log('✅ Booking completed:', bookingId);

    // Update provider's completedJobs count
    if (booking.providerId) {
      try {
        const providerRef = doc(db, 'users', booking.providerId);
        await updateDoc(providerRef, {
          completedJobs: increment(1),
          updatedAt: serverTimestamp(),
        });
        console.log('✅ Updated provider completedJobs count:', booking.providerId);
      } catch (error) {
        console.error('⚠️ Error updating provider completedJobs (non-critical):', error);
        // Don't throw - booking completion should succeed even if stats update fails
      }
    }

    // Send push notification to customer
    if (booking) {
      await notifyBookingCompleted(
        booking.customerId,
        bookingId,
        booking.providerName || 'Provider',
        booking.serviceName || 'Service'
      );
    }
  } catch (error) {
    console.error('❌ Error completing booking:', error);
    throw error;
  }
};

/**
 * Mark provider as on the way
 */
export const markOnTheWay = async (bookingId: string): Promise<void> => {
  try {
    await updateBookingStatus(bookingId, 'on-the-way');
    console.log('✅ Provider marked on the way:', bookingId);

    // Send push notification to customer
    const booking = await getBookingById(bookingId);
    if (booking) {
      await notifyBookingOnTheWay(
        booking.customerId,
        bookingId,
        booking.providerName || 'Provider',
        booking.serviceName || 'Service'
      );
    }
  } catch (error) {
    console.error('❌ Error marking on the way:', error);
    throw error;
  }
};

/**
 * Reschedule a booking
 */
export const rescheduleBooking = async (
  bookingId: string,
  scheduledDate: string,
  scheduledTime: string,
  scheduledSlot: string
): Promise<void> => {
  try {
    await updateBooking(bookingId, {
      scheduledDate,
      scheduledTime,
      scheduledSlot: scheduledSlot as any,
    });
    console.log('✅ Booking rescheduled:', bookingId);
  } catch (error) {
    console.error('❌ Error rescheduling booking:', error);
    throw error;
  }
};

/**
 * Delete a booking (admin only)
 */
export const deleteBooking = async (bookingId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'bookings', bookingId));
    console.log('✅ Booking deleted:', bookingId);
  } catch (error) {
    console.error('❌ Error deleting booking:', error);
    throw error;
  }
};

/**
 * Get all bookings (admin only)
 */
export const getAllBookings = async (): Promise<Booking[]> => {
  try {
    const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: safeToDate(doc.data().createdAt),
      updatedAt: safeToDate(doc.data().updatedAt),
      completedAt: doc.data().completedAt ? safeToDate(doc.data().completedAt) : null,
    })) as Booking[];
  } catch (error) {
    console.error('❌ Error getting all bookings:', error);
    throw error;
  }
};

/**
 * Get count of customer bookings by status using optimized getCountFromServer
 * This is much more efficient than fetching all documents
 */
export const getCustomerBookingCount = async (
  customerId: string,
  statuses: BookingStatus[]
): Promise<number> => {
  try {
    if (!customerId || statuses.length === 0) return 0;

    // If single status, use direct query
    if (statuses.length === 1) {
      const q = query(
        collection(db, 'bookings'),
        where('customerId', '==', customerId),
        where('status', '==', statuses[0])
      );
      const snapshot = await getCountFromServer(q);
      return snapshot.data().count;
    }

    // For multiple statuses, we need to query each and sum
    // Note: Firestore doesn't support OR queries efficiently, so we query each status
    const countPromises = statuses.map(status => {
      const q = query(
        collection(db, 'bookings'),
        where('customerId', '==', customerId),
        where('status', '==', status)
      );
      return getCountFromServer(q);
    });

    const snapshots = await Promise.all(countPromises);
    return snapshots.reduce((total, snapshot) => total + snapshot.data().count, 0);
  } catch (error) {
    console.error('❌ Error getting customer booking count:', error);
    return 0;
  }
};

/**
 * Get count of provider bookings by status using optimized getCountFromServer
 * This is much more efficient than fetching all documents
 */
export const getProviderBookingCount = async (
  providerId: string,
  statuses: BookingStatus[]
): Promise<number> => {
  try {
    if (!providerId || statuses.length === 0) return 0;

    // If single status, use direct query
    if (statuses.length === 1) {
      const q = query(
        collection(db, 'bookings'),
        where('providerId', '==', providerId),
        where('status', '==', statuses[0])
      );
      const snapshot = await getCountFromServer(q);
      return snapshot.data().count;
    }

    // For multiple statuses, query each and sum
    const countPromises = statuses.map(status => {
      const q = query(
        collection(db, 'bookings'),
        where('providerId', '==', providerId),
        where('status', '==', status)
      );
      return getCountFromServer(q);
    });

    const snapshots = await Promise.all(countPromises);
    return snapshots.reduce((total, snapshot) => total + snapshot.data().count, 0);
  } catch (error) {
    console.error('❌ Error getting provider booking count:', error);
    return 0;
  }
};

