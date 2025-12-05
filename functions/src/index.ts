import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { logger, setGlobalOptions } from 'firebase-functions/v2';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

setGlobalOptions({ region: 'us-central1', memory: '256MiB', timeoutSeconds: 60 });

try { initializeApp(); } catch {}
const db = getFirestore();
const messaging = getMessaging();
const auth = getAuth();

/**
 * OPTIMIZED: Get all tokens for a user in a single read
 * Returns both FCM and Expo tokens from one Firestore document read
 */
async function getUserTokens(userId: string): Promise<{ fcmTokens: string[]; expoTokens: string[] }> {
  const snap = await db.collection('users').doc(userId).get();
  if (!snap.exists) return { fcmTokens: [], expoTokens: [] };
  
  const data = (snap.data() || {}) as any;
  
  // FCM tokens (native push)
  const fcmTokens = new Set<string>();
  if (data.fcmToken) fcmTokens.add(String(data.fcmToken));
  if (Array.isArray(data.fcmTokens)) data.fcmTokens.forEach((t: string) => t && fcmTokens.add(String(t)));
  
  // Expo tokens (for development/Expo Go)
  const expoTokens: string[] = Array.isArray(data.deviceTokens) ? data.deviceTokens.filter(Boolean) : [];
  
  return {
    fcmTokens: Array.from(fcmTokens),
    expoTokens
  };
}

/**
 * OPTIMIZED: Get tokens for multiple users in parallel
 */
async function getMultipleUserTokens(userIds: string[]): Promise<{ fcmTokens: string[]; expoTokens: string[] }> {
  const tokenResults = await Promise.all(userIds.map(getUserTokens));
  
  return {
    fcmTokens: tokenResults.flatMap(r => r.fcmTokens),
    expoTokens: tokenResults.flatMap(r => r.expoTokens)
  };
}

async function sendExpoPush(tokens: string[], title: string, body: string, data: Record<string, string>) {
  if (tokens.length === 0) return;
  const chunks: string[][] = [];
  for (let i = 0; i < tokens.length; i += 90) chunks.push(tokens.slice(i, i + 90));
  for (const chunk of chunks) {
    try {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chunk.map((to) => ({ to, title, body, data }))),
      });
    } catch (e) {
      logger.error('Expo push send error', e);
    }
  }
}

async function getAdminUserIds(): Promise<string[]> {
  const snap = await db.collection('users').where('role', '==', 'admin').get();
  return snap.docs.map((d) => d.id);
}

/**
 * OPTIMIZED: Get all admin tokens in one efficient operation
 */
async function getAdminTokens(): Promise<{ fcmTokens: string[]; expoTokens: string[] }> {
  const admins = await getAdminUserIds();
  return getMultipleUserTokens(admins);
}

export const onMessageCreated = onDocumentCreated('conversations/{conversationId}/messages/{messageId}', async (event) => {
  const message = event.data?.data() as any;
  const conversationId = event.params.conversationId as string;
    try {
      const convSnap = await db.collection('conversations').doc(conversationId).get();
      if (!convSnap.exists) return;
      const conv = convSnap.data() as any;
      const participants: string[] = conv.participants || [];
      const recipients = participants.filter((uid) => uid !== message.senderId);
      
      // OPTIMIZED: Get all tokens in one efficient call
      const { fcmTokens, expoTokens } = await getMultipleUserTokens(recipients);

      if (fcmTokens.length === 0 && expoTokens.length === 0) return;

      const notificationData = { type: 'message', conversationId, senderId: String(message.senderId || '') };
      const title = message.senderName || 'New message';
      const body = message.type === 'image' ? '📷 Image' : message.type === 'location' ? '📍 Location' : message.text || 'New message';

      // OPTIMIZED: Send FCM and Expo notifications in PARALLEL (not sequential)
      await Promise.all([
        fcmTokens.length > 0 ? messaging.sendEachForMulticast({
          tokens: fcmTokens,
          notification: { title, body },
          data: notificationData,
        }) : Promise.resolve(),
        expoTokens.length > 0 ? sendExpoPush(expoTokens, title, body, notificationData) : Promise.resolve(),
      ]);
    } catch (e) {
      logger.error('onMessageCreated error', e);
    }
});

export const onBookingUpdated = onDocumentUpdated('bookings/{bookingId}', async (event) => {
  const before = event.data?.before.data() as any;
  const after = event.data?.after.data() as any;
  if (!before || !after) return;
  if (before.status === after.status) return;

  const bookingId = event.params.bookingId as string;
  const recipients: string[] = [after.customerId];
  const title = 'Booking Update';
  const body = `Your booking is ${after.status}`;

  // OPTIMIZED: Get all tokens efficiently
  const { fcmTokens, expoTokens } = await getMultipleUserTokens(recipients);
  if (fcmTokens.length === 0 && expoTokens.length === 0) return;

  const notificationData = { type: 'booking', bookingId, status: String(after.status || '') };

  try {
    // OPTIMIZED: Send in parallel
    await Promise.all([
      fcmTokens.length > 0 ? messaging.sendEachForMulticast({
        tokens: fcmTokens,
        notification: { title, body },
        data: notificationData,
      }) : Promise.resolve(),
      expoTokens.length > 0 ? sendExpoPush(expoTokens, title, body, notificationData) : Promise.resolve(),
    ]);
  } catch (e) {
    logger.error('onBookingUpdated error', e);
  }
});

// Notify provider when a new booking is created by a customer
export const onBookingCreated = onDocumentCreated('bookings/{bookingId}', async (event) => {
  const booking = event.data?.data() as any;
  if (!booking) return;

  const providerId = booking.providerId as string;
  if (!providerId) return;

  const bookingId = event.params.bookingId as string;
  const notificationData = { type: 'booking', bookingId, status: String(booking.status || 'pending') };

  try {
    // OPTIMIZED: Fetch provider and admin tokens in parallel
    const [providerTokens, adminTokens] = await Promise.all([
      getUserTokens(providerId),
      getAdminTokens(),
    ]);

    const providerTitle = 'New Booking Request';
    const providerBody = `${booking.customerName || 'Customer'} requested ${booking.serviceName || 'a service'}`;
    
    const adminTitle = 'New Booking Created';
    const adminBody = `${booking.customerName || 'Customer'} booked ${booking.serviceName || 'a service'} for provider ${booking.providerName || ''}`;

    // OPTIMIZED: Send all notifications in parallel
    await Promise.all([
      // Provider notifications
      providerTokens.fcmTokens.length > 0 ? messaging.sendEachForMulticast({
        tokens: providerTokens.fcmTokens,
        notification: { title: providerTitle, body: providerBody },
        data: notificationData,
      }) : Promise.resolve(),
      providerTokens.expoTokens.length > 0 ? sendExpoPush(providerTokens.expoTokens, providerTitle, providerBody, notificationData) : Promise.resolve(),
      
      // Admin notifications
      adminTokens.fcmTokens.length > 0 ? messaging.sendEachForMulticast({
        tokens: adminTokens.fcmTokens,
        notification: { title: adminTitle, body: adminBody },
        data: notificationData,
      }) : Promise.resolve(),
      adminTokens.expoTokens.length > 0 ? sendExpoPush(adminTokens.expoTokens, adminTitle, adminBody, notificationData) : Promise.resolve(),
    ]);
  } catch (e) {
    logger.error('onBookingCreated error', e);
  }
});

// Notify admins when a provider application is submitted
export const onProviderApplicationCreated = onDocumentCreated('providers/{providerId}', async (event) => {
  const provider = event.data?.data() as any;
  if (!provider) return;

  const providerId = event.params.providerId as string;
  const title = 'New Provider Application';
  const body = `${provider.name || 'User'} applied to become a provider`;

  try {
    // Get all admin users
    const adminIds = await getAdminUserIds();
    
    // Filter out the provider themselves from notifications
    const filteredAdminIds = adminIds.filter(id => id !== providerId);
    
    if (filteredAdminIds.length === 0) {
      logger.warn('No admins to notify (excluding the provider themselves)');
      return;
    }
    
    logger.info('Filtered admin IDs (excluding provider)', { filteredAdminIds, excludedProviderId: providerId });
    
    // OPTIMIZED: Get tokens for all admins efficiently
    const { fcmTokens: adminFcm, expoTokens: adminExpo } = await getMultipleUserTokens(filteredAdminIds);
    
    const notificationData = { type: 'provider_application', providerId };
    
    // OPTIMIZED: Send in parallel
    await Promise.all([
      adminFcm.length > 0 ? messaging.sendEachForMulticast({
        tokens: adminFcm,
        notification: { title, body },
        data: notificationData,
      }) : Promise.resolve(),
      adminExpo.length > 0 ? sendExpoPush(adminExpo, title, body, notificationData) : Promise.resolve(),
    ]);
  } catch (e) {
    logger.error('onProviderApplicationCreated error', e);
  }
});

// Notify provider on approval/rejection of application
export const onProviderApplicationUpdated = onDocumentUpdated('providers/{providerId}', async (event) => {
  const before = event.data?.before.data() as any;
  const after = event.data?.after.data() as any;
  
  logger.info('onProviderApplicationUpdated triggered', {
    providerId: event.params.providerId,
    before: before,
    after: after,
  });
  
  if (!before || !after) {
    logger.warn('Missing before or after data');
    return;
  }
  
  // Check for approvalStatus field (used in the app)
  const beforeStatus = before.approvalStatus || before.status;
  const afterStatus = after.approvalStatus || after.status;
  
  logger.info('Status comparison', { beforeStatus, afterStatus });
  
  if (beforeStatus === afterStatus) {
    logger.info('Status unchanged, skipping notification');
    return;
  }

  const status = String(afterStatus || '');
  if (!['approved', 'rejected'].includes(status)) {
    logger.info('Status not approved or rejected, skipping', { status });
    return;
  }

  const providerId = event.params.providerId as string;
  
  let title = '';
  let body = '';
  
  if (status === 'approved') {
    title = 'Provider Application Approved! 🎉';
    body = 'Congratulations! Your provider application has been approved. You can now access provider features and start accepting bookings.';
  } else {
    title = 'Provider Application Update';
    body = 'Unfortunately, your provider application was not approved at this time. Please review your application details and reapply, or contact support for assistance.';
  }

  logger.info('Sending notification', { providerId, status, title });

  try {
    // OPTIMIZED: Get tokens efficiently
    const { fcmTokens: fcm, expoTokens: expo } = await getUserTokens(providerId);
    
    logger.info('Got tokens', { fcmCount: fcm.length, expoCount: expo.length });
    
    const notificationData = { type: 'provider_application_status', status, providerId };
    
    // OPTIMIZED: Send in parallel
    await Promise.all([
      fcm.length > 0 ? messaging.sendEachForMulticast({
        tokens: fcm,
        notification: { title, body },
        data: notificationData,
      }).then(() => logger.info('FCM notification sent')) : Promise.resolve(),
      expo.length > 0 ? sendExpoPush(expo, title, body, notificationData).then(() => logger.info('Expo notification sent')) : Promise.resolve(),
    ]);
  } catch (e) {
    logger.error('onProviderApplicationUpdated error', e);
  }
});

// Notify admins when a provider creates a new service (pending approval)
export const onProviderServiceCreated = onDocumentCreated('providerServices/{serviceId}', async (event) => {
  const svc = event.data?.data() as any;
  if (!svc) return;
  const title = 'New Provider Service';
  const body = `${svc.providerName || 'Provider'} created service ${svc.name || ''}`;
  const serviceId = event.params.serviceId as string;
  const notificationData = { type: 'provider_service', serviceId, providerId: svc.providerId || '' };
  
  try {
    // OPTIMIZED: Get admin tokens efficiently
    const { fcmTokens: adminFcm, expoTokens: adminExpo } = await getAdminTokens();
    
    // OPTIMIZED: Send in parallel
    await Promise.all([
      adminFcm.length > 0 ? messaging.sendEachForMulticast({ tokens: adminFcm, notification: { title, body }, data: notificationData }) : Promise.resolve(),
      adminExpo.length > 0 ? sendExpoPush(adminExpo, title, body, notificationData) : Promise.resolve(),
    ]);
  } catch (e) {
    logger.error('onProviderServiceCreated error', e);
  }
});

// Notify provider on service approval/rejection
export const onProviderServiceUpdated = onDocumentUpdated('providerServices/{serviceId}', async (event) => {
  const before = event.data?.before.data() as any;
  const after = event.data?.after.data() as any;
  if (!before || !after) return;
  if (before.status === after.status) return;
  const status = String(after.status || '');
  if (!['approved', 'rejected'].includes(status)) return;

  const providerId = String(after.providerId || '');
  if (!providerId) return;
  const serviceId = event.params.serviceId as string;
  const title = status === 'approved' ? 'Service Approved' : 'Service Rejected';
  const body = status === 'approved' ? `Your service "${after.name || ''}" is approved` : `Your service "${after.name || ''}" was rejected`;
  const notificationData = { type: 'provider_service_status', status, serviceId, providerId };
  
  try {
    // OPTIMIZED: Get tokens efficiently
    const { fcmTokens: fcm, expoTokens: expo } = await getUserTokens(providerId);
    
    // OPTIMIZED: Send in parallel
    await Promise.all([
      fcm.length > 0 ? messaging.sendEachForMulticast({ tokens: fcm, notification: { title, body }, data: notificationData }) : Promise.resolve(),
      expo.length > 0 ? sendExpoPush(expo, title, body, notificationData) : Promise.resolve(),
    ]);
  } catch (e) {
    logger.error('onProviderServiceUpdated error', e);
  }
});


/**
 * Delete user account and cleanup data
 * - Deletes user from Authentication
 * - Deletes user profile from Firestore
 * - Anonymizes/Deletes related data (bookings, reviews, etc.)
 */
export const deleteAccount = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  const uid = request.auth.uid;
  const batch = db.batch();

  try {
    // 1. Get user data to check role
    const userSnap = await db.collection('users').doc(uid).get();
    if (!userSnap.exists) {
      // Just delete auth if user doc doesn't exist
      try {
        await auth.deleteUser(uid);
      } catch (e) {
        logger.warn('User not found in Auth during cleanup', e);
      }
      return { success: true, message: 'Account deleted (profile not found)' };
    }
    
    const userData = userSnap.data() as any;
    const role = userData.role;
    logger.info(`Deleting account for user ${uid} with role ${role}`);

    // 2. Cancel Active Bookings Only (skip for admin - admin has no bookings)
    if (role !== 'admin') {
      // Find all ACTIVE bookings where user is customer or provider
      const bookingsQuery = db.collection('bookings').where(
        role === 'provider' ? 'providerId' : 'customerId', 
        '==', 
        uid
      );
      const bookingsSnap = await bookingsQuery.get();

      bookingsSnap.docs.forEach(doc => {
        const booking = doc.data();
        const isActive = ['pending', 'accepted', 'confirmed', 'on-the-way', 'in-progress'].includes(booking.status);
        
        if (isActive) {
          // Cancel active bookings only
          batch.update(doc.ref, {
            status: 'cancelled',
            cancellationReason: `${role === 'provider' ? 'Provider' : 'Customer'} account deleted`,
            updatedAt: FieldValue.serverTimestamp()
          });
        }
        // Past bookings (completed, cancelled, rejected) are left completely unchanged
      });
    }

    // 3. Provider specific cleanup - Delete provider's own data (skip for admin)
    if (role === 'provider') {
      // Delete provider profile
      const providerRef = db.collection('providers').doc(uid);
      const providerSnap = await providerRef.get();
      if (providerSnap.exists) {
        batch.delete(providerRef);
      }
      
      // Delete provider's services (from providerServices collection)
      const servicesSnap = await db.collection('providerServices').where('providerId', '==', uid).get();
      servicesSnap.docs.forEach(doc => batch.delete(doc.ref));
      
      // Delete availability
      const availabilitySnap = await db.collection('providerAvailability').where('providerId', '==', uid).get();
      availabilitySnap.docs.forEach(doc => batch.delete(doc.ref));
    }

    // Note: Admin-created services in 'services' collection are NOT deleted
    // Services are global and not tied to a specific admin. They remain available
    // for all users even if the admin who created them is deleted.

    // 4. Delete User Profile
    batch.delete(db.collection('users').doc(uid));

    // 5. Commit all changes
    await batch.commit();
    logger.info(`Batch commit completed for user ${uid}`);

    // 6. Delete from Firebase Auth
    await auth.deleteUser(uid);

    logger.info(`Successfully deleted account for user ${uid}`);
    return { success: true };

  } catch (error) {
    logger.error('Delete account error', error);
    throw new HttpsError('internal', 'Failed to delete account');
  }
});
