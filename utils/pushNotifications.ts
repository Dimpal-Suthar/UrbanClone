import { getUserTokens } from '@/services/fcmService';

/**
 * Centralized push notification service
 * Sends push notifications for app events (bookings, services, etc.)
 * 
 * Note: This sends notifications via Expo Push Notifications API
 * You'll need a backend endpoint to actually send the push notification
 * For now, it logs what would be sent
 */

export type NotificationType =
  | 'booking_accepted'
  | 'booking_rejected'
  | 'booking_completed'
  | 'booking_cancelled'
  | 'booking_on_the_way'
  | 'booking_started'
  | 'booking_created'
  | 'service_approved'
  | 'service_rejected'
  | 'review_received';

interface NotificationData {
  type: NotificationType;
  bookingId?: string;
  serviceId?: string;
  reviewId?: string;
  [key: string]: any;
}

/**
 * Send push notification to user
 */
export const sendPushNotification = async (
  userId: string,
  title: string,
  body: string,
  data: NotificationData
): Promise<void> => {
  try {
    // Get user's device tokens
    const tokens = await getUserTokens(userId);

    if (tokens.length === 0) {
      console.log('📱 No device tokens found for user:', userId);
      return;
    }

    console.log('📱 Sending push notification:', {
      userId,
      tokens,
      title,
      body,
      data,
    });

    // TODO: Call your backend API to send push notification via Expo Push Notifications
    // Example:
    // await fetch('YOUR_BACKEND_URL/api/notifications/send', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     to: tokens,
    //     title,
    //     body,
    //     data,
    //     sound: 'default',
    //     badge: 1,
    //   }),
    // });

    // For now, log what would be sent
    // In production, this should call your backend which uses Expo Push Notifications API
  } catch (error) {
    console.error('❌ Error sending push notification:', error);
    // Don't throw - notifications are best-effort
  }
};

/**
 * Notify customer when provider accepts booking
 */
export const notifyBookingAccepted = async (
  customerId: string,
  bookingId: string,
  providerName: string,
  serviceName: string
): Promise<void> => {
  await sendPushNotification(
    customerId,
    'Booking Accepted! 🎉',
    `${providerName} has accepted your booking for ${serviceName}`,
    {
      type: 'booking_accepted',
      bookingId,
    }
  );
};

/**
 * Notify customer when provider rejects booking
 */
export const notifyBookingRejected = async (
  customerId: string,
  bookingId: string,
  providerName: string,
  serviceName: string,
  reason?: string
): Promise<void> => {
  await sendPushNotification(
    customerId,
    'Booking Rejected',
    `${providerName} has rejected your booking for ${serviceName}${reason ? `: ${reason}` : ''}`,
    {
      type: 'booking_rejected',
      bookingId,
      reason,
    }
  );
};

/**
 * Notify customer when booking is completed
 */
export const notifyBookingCompleted = async (
  customerId: string,
  bookingId: string,
  providerName: string,
  serviceName: string
): Promise<void> => {
  await sendPushNotification(
    customerId,
    'Service Completed! ✅',
    `${providerName} has completed ${serviceName}. Please rate your experience.`,
    {
      type: 'booking_completed',
      bookingId,
    }
  );
};

/**
 * Notify customer when booking is cancelled
 */
export const notifyBookingCancelled = async (
  recipientId: string,
  bookingId: string,
  cancelledByName: string,
  serviceName: string,
  reason?: string
): Promise<void> => {
  await sendPushNotification(
    recipientId,
    'Booking Cancelled',
    `${cancelledByName} cancelled the booking for ${serviceName}${reason ? `: ${reason}` : ''}`,
    {
      type: 'booking_cancelled',
      bookingId,
      reason,
    }
  );
};

/**
 * Notify customer when provider is on the way
 */
export const notifyBookingOnTheWay = async (
  customerId: string,
  bookingId: string,
  providerName: string,
  serviceName: string
): Promise<void> => {
  await sendPushNotification(
    customerId,
    'Provider On The Way! 🚗',
    `${providerName} is on the way for ${serviceName}`,
    {
      type: 'booking_on_the_way',
      bookingId,
    }
  );
};

/**
 * Notify customer when service starts
 */
export const notifyBookingStarted = async (
  customerId: string,
  bookingId: string,
  providerName: string,
  serviceName: string
): Promise<void> => {
  await sendPushNotification(
    customerId,
    'Service Started',
    `${providerName} has started ${serviceName}`,
    {
      type: 'booking_started',
      bookingId,
    }
  );
};

/**
 * Notify provider when new booking is created
 */
export const notifyBookingCreated = async (
  providerId: string,
  bookingId: string,
  customerName: string,
  serviceName: string
): Promise<void> => {
  await sendPushNotification(
    providerId,
    'New Booking Request! 📅',
    `${customerName} requested ${serviceName}`,
    {
      type: 'booking_created',
      bookingId,
    }
  );
};

/**
 * Notify provider when service is approved by admin
 */
export const notifyServiceApproved = async (
  providerId: string,
  serviceId: string,
  serviceName: string
): Promise<void> => {
  const isProviderApplication = serviceId === 'provider-application';
  
  await sendPushNotification(
    providerId,
    isProviderApplication ? 'Provider Application Approved! ✅' : 'Service Approved! ✅',
    isProviderApplication 
      ? `Congratulations! Your provider application has been approved. You can now access the Provider App.`
      : `Your service "${serviceName}" has been approved`,
    {
      type: 'service_approved',
      serviceId,
    }
  );
};

/**
 * Notify provider when service is rejected by admin
 */
export const notifyServiceRejected = async (
  providerId: string,
  serviceId: string,
  serviceName: string,
  reason?: string
): Promise<void> => {
  const isProviderApplication = serviceId === 'provider-application';
  
  await sendPushNotification(
    providerId,
    isProviderApplication ? 'Provider Application Rejected' : 'Service Rejected',
    isProviderApplication
      ? `Your provider application was rejected${reason ? `: ${reason}` : ''}. Please contact support for more information.`
      : `Your service "${serviceName}" was rejected${reason ? `: ${reason}` : ''}`,
    {
      type: 'service_rejected',
      serviceId,
      reason,
    }
  );
};

/**
 * Notify provider when they receive a review
 */
export const notifyReviewReceived = async (
  providerId: string,
  reviewId: string,
  customerName: string,
  rating: number
): Promise<void> => {
  await sendPushNotification(
    providerId,
    'New Review Received ⭐',
    `${customerName} left you a ${rating}-star review`,
    {
      type: 'review_received',
      reviewId,
      rating,
    }
  );
};

