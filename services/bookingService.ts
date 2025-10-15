import { db } from '@/config/firebase';
import { Booking, BookingStatus, CreateBookingInput, UpdateBookingInput } from '@/types';
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
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
        updatedAt: docSnap.data().updatedAt?.toDate() || new Date(),
        completedAt: docSnap.data().completedAt?.toDate() || null,
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
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      completedAt: doc.data().completedAt?.toDate() || null,
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
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      completedAt: doc.data().completedAt?.toDate() || null,
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
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      completedAt: doc.data().completedAt?.toDate() || null,
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
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      completedAt: doc.data().completedAt?.toDate() || null,
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
  reason: string
): Promise<void> => {
  try {
    await updateBookingStatus(bookingId, 'cancelled', reason);
    console.log('✅ Booking cancelled:', bookingId);
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
    const updates: UpdateBookingInput = {
      status: 'completed',
    };
    if (images && images.length > 0) {
      updates.images = images;
    }
    await updateBooking(bookingId, updates);
    console.log('✅ Booking completed:', bookingId);
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
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      completedAt: doc.data().completedAt?.toDate() || null,
    })) as Booking[];
  } catch (error) {
    console.error('❌ Error getting all bookings:', error);
    throw error;
  }
};

