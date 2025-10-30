import { db } from '@/config/firebase';
import { CreateNotificationInput, Notification } from '@/types/chat';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

/**
 * Create a notification
 */
export const createNotification = async (
  input: CreateNotificationInput
): Promise<Notification> => {
  try {
    const notificationsRef = collection(db, 'notifications');
    
    const notificationData = {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      data: input.data || {},
      isRead: false,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(notificationsRef, notificationData);

    return {
      id: docRef.id,
      ...notificationData,
      createdAt: new Date(),
    } as Notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Get user's notifications
 */
export const getUserNotifications = async (
  userId: string,
  limitCount: number = 50
): Promise<Notification[]> => {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    const notifications: Notification[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as Notification;
    });

    return notifications;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

/**
 * Get unread notifications count
 */
export const getUnreadNotificationsCount = async (
  userId: string
): Promise<number> => {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('isRead', '==', false)
    );

    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (
  notificationId: string
): Promise<void> => {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      isRead: true,
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async (
  userId: string
): Promise<void> => {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('isRead', '==', false)
    );

    const snapshot = await getDocs(q);
    const batch = writeBatch(db);

    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { isRead: true });
    });

    await batch.commit();
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

/**
 * Delete notification
 */
export const deleteNotification = async (
  notificationId: string
): Promise<void> => {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await deleteDoc(notificationRef);
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

/**
 * Delete all notifications for user
 */
export const deleteAllNotifications = async (
  userId: string
): Promise<void> => {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId)
    );

    const snapshot = await getDocs(q);
    const batch = writeBatch(db);

    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    throw error;
  }
};

/**
 * Subscribe to notifications (real-time)
 */
export const subscribeToNotifications = (
  userId: string,
  callback: (notifications: Notification[]) => void
): (() => void) => {
  const notificationsRef = collection(db, 'notifications');
  const q = query(
    notificationsRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(50)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const notifications: Notification[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Notification;
      });
      callback(notifications);
    },
    (error) => {
      console.error('Error in notifications subscription:', error);
      callback([]);
    }
  );
};

/**
 * Send notification to user via FCM (Firebase Cloud Messaging)
 */
export const sendPushNotification = async (
  userId: string,
  title: string,
  body: string,
  data: any = {}
): Promise<void> => {
  try {
    // First, create the notification in Firestore
    await createNotification({
      userId,
      type: data.type || 'system',
      title,
      body,
      data,
    });

    // Get user's FCM tokens from users collection
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      console.log('User not found:', userId);
      return;
    }

    const userData = userSnap.data();
    const tokens = userData.deviceTokens || [];

    if (tokens.length === 0) {
      console.log('User has no active tokens');
      return;
    }

    // Note: In a real app, you would call your backend API here
    // to send the push notification via Firebase Admin SDK
    // For now, we'll just log it
    console.log('📱 Would send push notification to:', {
      tokens,
      title,
      body,
      data,
    });

    // TODO: Implement actual FCM push via your backend
    // Example:
    // await fetch('YOUR_BACKEND_URL/send-notification', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ tokens, title, body, data }),
    // });

  } catch (error) {
    console.error('Error sending push notification:', error);
  }
};

