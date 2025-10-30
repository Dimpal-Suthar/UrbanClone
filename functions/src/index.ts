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
    const [fcmTokens, expoTokens] = await Promise.all([
      getUserFcmTokens(providerId),
      getUserExpoTokens(providerId),
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
  } catch (e) {
    logger.error('onBookingCreated error', e);
  }
});

