import { setGlobalOptions, logger } from 'firebase-functions/v2';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

setGlobalOptions({ region: 'us-central1', memory: '256MiB', timeoutSeconds: 60 });

try { initializeApp(); } catch {}
const db = getFirestore();
const messaging = getMessaging();

async function getUserFcmTokens(userId: string): Promise<string[]> {
  const snap = await db.collection('users').doc(userId).get();
  if (!snap.exists) return [];
  const data = (snap.data() || {}) as any;
  const tokens = new Set<string>();
  if (data.fcmToken) tokens.add(String(data.fcmToken));
  if (Array.isArray(data.fcmTokens)) data.fcmTokens.forEach((t: string) => t && tokens.add(String(t)));
  return Array.from(tokens);
}

async function getUserExpoTokens(userId: string): Promise<string[]> {
  const snap = await db.collection('users').doc(userId).get();
  if (!snap.exists) return [];
  const data = (snap.data() || {}) as any;
  const tokens: string[] = Array.isArray(data.deviceTokens) ? data.deviceTokens.filter(Boolean) : [];
  return tokens;
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

async function getAdminFcmTokens(): Promise<string[]> {
  const admins = await getAdminUserIds();
  const tokenArrays = await Promise.all(admins.map(getUserFcmTokens));
  return tokenArrays.flat();
}

async function getAdminExpoTokens(): Promise<string[]> {
  const admins = await getAdminUserIds();
  const tokenArrays = await Promise.all(admins.map(getUserExpoTokens));
  return tokenArrays.flat();
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
      const [fcmTokens, expoTokens] = await Promise.all([
        Promise.all(recipients.map(getUserFcmTokens)).then((x) => x.flat()),
        Promise.all(recipients.map(getUserExpoTokens)).then((x) => x.flat()),
      ]);

      if (fcmTokens.length === 0 && expoTokens.length === 0) return;

      // FCM
      if (fcmTokens.length > 0) {
        await messaging.sendEachForMulticast({
          tokens: fcmTokens,
          notification: {
            title: message.senderName || 'New message',
            body: message.type === 'image' ? '📷 Image' : message.type === 'location' ? '📍 Location' : message.text || 'New message',
          },
          data: { type: 'message', conversationId, senderId: String(message.senderId || '') },
        });
      }
      // Expo
      if (expoTokens.length > 0) {
        await sendExpoPush(
          expoTokens,
          message.senderName || 'New message',
          message.type === 'image' ? '📷 Image' : message.type === 'location' ? '📍 Location' : message.text || 'New message',
          { type: 'message', conversationId, senderId: String(message.senderId || '') }
        );
      }
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
  let recipients: string[] = [];
  let title = 'Booking Update';
  let body = `Your booking is ${after.status}`;
  recipients = [after.customerId];

  const [fcmTokens, expoTokens] = await Promise.all([
    Promise.all(recipients.map(getUserFcmTokens)).then((x) => x.flat()),
    Promise.all(recipients.map(getUserExpoTokens)).then((x) => x.flat()),
  ]);
  if (fcmTokens.length === 0 && expoTokens.length === 0) return;

  try {
    if (fcmTokens.length > 0) {
      await messaging.sendEachForMulticast({
        tokens: fcmTokens,
        notification: { title, body },
        data: { type: 'booking', bookingId, status: String(after.status || '') },
      });
    }
    if (expoTokens.length > 0) {
      await sendExpoPush(expoTokens, title, body, { type: 'booking', bookingId, status: String(after.status || '') });
    }
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

  const title = 'New Booking Request';
  const body = `${booking.customerName || 'Customer'} requested ${booking.serviceName || 'a service'}`;
  const bookingId = event.params.bookingId as string;

  try {
    const [fcmTokens, expoTokens, adminFcm, adminExpo] = await Promise.all([
      getUserFcmTokens(providerId),
      getUserExpoTokens(providerId),
      getAdminFcmTokens(),
      getAdminExpoTokens(),
    ]);

    if (fcmTokens.length > 0) {
      await messaging.sendEachForMulticast({
        tokens: fcmTokens,
        notification: { title, body },
        data: { type: 'booking', bookingId, status: String(booking.status || 'pending') },
      });
    }
    if (expoTokens.length > 0) {
      await sendExpoPush(expoTokens, title, body, { type: 'booking', bookingId, status: String(booking.status || 'pending') });
    }

    // Notify admins as well about new booking
    const adminTitle = 'New Booking Created';
    const adminBody = `${booking.customerName || 'Customer'} booked ${booking.serviceName || 'a service'} for provider ${booking.providerName || ''}`;
    if (adminFcm.length > 0) {
      await messaging.sendEachForMulticast({
        tokens: adminFcm,
        notification: { title: adminTitle, body: adminBody },
        data: { type: 'booking', bookingId, status: String(booking.status || 'pending') },
      });
    }
    if (adminExpo.length > 0) {
      await sendExpoPush(adminExpo, adminTitle, adminBody, { type: 'booking', bookingId, status: String(booking.status || 'pending') });
    }
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
    
    // Get tokens only for actual admins (excluding provider)
    const [adminFcm, adminExpo] = await Promise.all([
      Promise.all(filteredAdminIds.map(getUserFcmTokens)).then((x) => x.flat()),
      Promise.all(filteredAdminIds.map(getUserExpoTokens)).then((x) => x.flat()),
    ]);
    
    if (adminFcm.length > 0) {
      await messaging.sendEachForMulticast({
        tokens: adminFcm,
        notification: { title, body },
        data: { type: 'provider_application', providerId },
      });
    }
    if (adminExpo.length > 0) {
      await sendExpoPush(adminExpo, title, body, { type: 'provider_application', providerId });
    }
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
    const [fcm, expo] = await Promise.all([getUserFcmTokens(providerId), getUserExpoTokens(providerId)]);
    
    logger.info('Got tokens', { fcmCount: fcm.length, expoCount: expo.length });
    
    if (fcm.length > 0) {
      await messaging.sendEachForMulticast({
        tokens: fcm,
        notification: { title, body },
        data: { type: 'provider_application_status', status },
      });
      logger.info('FCM notification sent');
    }
    if (expo.length > 0) {
      await sendExpoPush(expo, title, body, { type: 'provider_application_status', status });
      logger.info('Expo notification sent');
    }
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
  try {
    const [adminFcm, adminExpo] = await Promise.all([getAdminFcmTokens(), getAdminExpoTokens()]);
    if (adminFcm.length > 0) {
      await messaging.sendEachForMulticast({ tokens: adminFcm, notification: { title, body }, data: { type: 'provider_service', serviceId: event.params.serviceId as string } });
    }
    if (adminExpo.length > 0) {
      await sendExpoPush(adminExpo, title, body, { type: 'provider_service', serviceId: event.params.serviceId as string });
    }
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
  const title = status === 'approved' ? 'Service Approved' : 'Service Rejected';
  const body = status === 'approved' ? `Your service "${after.name || ''}" is approved` : `Your service "${after.name || ''}" was rejected`;
  try {
    const [fcm, expo] = await Promise.all([getUserFcmTokens(providerId), getUserExpoTokens(providerId)]);
    if (fcm.length > 0) {
      await messaging.sendEachForMulticast({ tokens: fcm, notification: { title, body }, data: { type: 'provider_service_status', status } });
    }
    if (expo.length > 0) {
      await sendExpoPush(expo, title, body, { type: 'provider_service_status', status });
    }
  } catch (e) {
    logger.error('onProviderServiceUpdated error', e);
  }
});

