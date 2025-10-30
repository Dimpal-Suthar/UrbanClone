import { db } from '@/config/firebase';
import {
  Conversation,
  CreateConversationInput,
  CreateMessageInput,
  Message,
} from '@/types/chat';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  updateDoc,
  where,
  writeBatch,
  Timestamp,
  DocumentSnapshot,
} from 'firebase/firestore';

/**
 * Get or create a conversation between customer and provider
 */
export const getOrCreateConversation = async (
  input: CreateConversationInput
): Promise<Conversation> => {
  try {
    // Check if conversation already exists
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', input.customerId)
    );

    const snapshot = await getDocs(q);
    const existingConv = snapshot.docs.find((doc) => {
      const data = doc.data();
      return data.participants.includes(input.providerId);
    });

    if (existingConv) {
      // Fetch fresh user data to get updated names and photos
      const [customerDoc, providerDoc] = await Promise.all([
        getDoc(doc(db, 'users', input.customerId)),
        getDoc(doc(db, 'users', input.providerId)),
      ]);

      const customerData = customerDoc.exists() ? customerDoc.data() : {};
      const providerData = providerDoc.exists() ? providerDoc.data() : {};

      const data = existingConv.data();
      
      // Update with fresh participant data
      const updatedParticipantsData = {
        [input.customerId]: {
          name: customerData.displayName || customerData.name || input.customerName,
          photo: customerData.photoURL || customerData.photo || input.customerPhoto,
          role: 'customer' as const,
        },
        [input.providerId]: {
          name: providerData.displayName || providerData.name || input.providerName,
          photo: providerData.photoURL || providerData.photo || input.providerPhoto,
          role: 'provider' as const,
        },
      };

      return {
        id: existingConv.id,
        ...data,
        participantsData: updatedParticipantsData,
        lastMessage: data.lastMessage
          ? {
              ...data.lastMessage,
              timestamp: data.lastMessage.timestamp?.toDate() || new Date(),
            }
          : null,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Conversation;
    }

    // Create new conversation
    const newConversation = {
      participants: [input.customerId, input.providerId],
      participantsData: {
        [input.customerId]: {
          name: input.customerName,
          photo: input.customerPhoto,
          role: 'customer' as const,
        },
        [input.providerId]: {
          name: input.providerName,
          photo: input.providerPhoto,
          role: 'provider' as const,
        },
      },
      bookingId: input.bookingId,
      lastMessage: null,
      unreadCount: {
        [input.customerId]: 0,
        [input.providerId]: 0,
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(conversationsRef, newConversation);
    
    return {
      id: docRef.id,
      ...newConversation,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Conversation;
  } catch (error) {
    console.error('Error getting/creating conversation:', error);
    throw error;
  }
};

/**
 * Get user's conversations with pagination
 */
export const getUserConversations = async (
  userId: string,
  pageSize: number = 20,
  lastDoc?: DocumentSnapshot
): Promise<{ conversations: Conversation[]; lastDoc: DocumentSnapshot | null }> => {
  try {
    const conversationsRef = collection(db, 'conversations');
    let q = query(
      conversationsRef,
      where('participants', 'array-contains', userId),
      where('updatedAt', '!=', null),
      orderBy('updatedAt', 'desc'),
      limit(pageSize)
    );

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const snapshot = await getDocs(q);
    const conversations: Conversation[] = [];
    
    // OPTIMIZATION: Collect ALL unique user IDs first to batch fetch
    // This reduces from O(N × M) to O(N + U) where U = unique users
    const allUserIds = new Set<string>();
    snapshot.docs.forEach(docSnapshot => {
      const data = docSnapshot.data();
      const participantIds = data.participants || [];
      participantIds.forEach((id: string) => allUserIds.add(id));
    });
    
    // Fetch ALL unique users in parallel (single batch)
    const uniqueUserIds = Array.from(allUserIds);
    const userPromises = uniqueUserIds.map(userId => getDoc(doc(db, 'users', userId)));
    const userDocs = await Promise.all(userPromises);
    
    // Create a map for O(1) lookup
    const userMap = new Map<string, any>();
    userDocs.forEach((userDoc, index) => {
      const userId = uniqueUserIds[index];
      if (userDoc.exists()) {
        const userData = userDoc.data();
        userMap.set(userId, {
          name: userData.displayName || userData.name || 'User',
          photo: userData.photoURL || userData.photo || null,
          role: userData.role || 'customer',
        });
      }
    });
    
    // Build conversations using the cached user map
    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data();
      const participantIds = data.participants || [];
      
      // Build participants data from userMap
      const updatedParticipantsData: any = {};
      participantIds.forEach((participantId: string) => {
        if (userMap.has(participantId)) {
          updatedParticipantsData[participantId] = userMap.get(participantId);
        }
      });
      
      conversations.push({
        id: docSnapshot.id,
        ...data,
        participantsData: updatedParticipantsData,
        lastMessage: data.lastMessage
          ? {
              ...data.lastMessage,
              timestamp: data.lastMessage.timestamp?.toDate() || new Date(),
            }
          : null,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Conversation);
    }

    const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;

    return { conversations, lastDoc: lastVisible };
  } catch (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }
};

/**
 * Get messages for a conversation with pagination
 */
export const getMessages = async (
  conversationId: string,
  pageSize: number = 50,
  lastDoc?: DocumentSnapshot
): Promise<{ messages: Message[]; lastDoc: DocumentSnapshot | null }> => {
  try {
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    let q = query(
      messagesRef,
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    );

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const snapshot = await getDocs(q);
    const messages: Message[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        readAt: data.readAt?.toDate() || null,
      } as Message;
    });
    // No reverse needed - FlatList is inverted, so newest-first data shows correctly

    const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;

    return { messages, lastDoc: lastVisible };
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
};

/**
 * Send a message
 */
export const sendMessage = async (
  input: CreateMessageInput,
  senderId: string,
  senderName: string,
  senderPhoto: string | null
): Promise<Message> => {
  try {
    const batch = writeBatch(db);

    // Create message
    const messagesRef = collection(db, 'conversations', input.conversationId, 'messages');
    const messageDoc = doc(messagesRef);
    
    const messageData = {
      conversationId: input.conversationId,
      senderId,
      senderName,
      senderPhoto,
      text: input.text,
      type: input.type || 'text',
      imageUrl: input.imageUrl || null,
      location: input.location || null,
      isRead: false,
      readAt: null,
      createdAt: serverTimestamp(),
    };

    batch.set(messageDoc, messageData);

    // Update conversation
    const conversationRef = doc(db, 'conversations', input.conversationId);
    const conversationSnap = await getDoc(conversationRef);
    
    if (conversationSnap.exists()) {
      const conversationData = conversationSnap.data();
      const otherUserId = conversationData.participants.find((id: string) => id !== senderId);

      batch.update(conversationRef, {
        lastMessage: {
          text: input.type === 'image' ? '📷 Image' : input.type === 'location' ? '📍 Location' : input.text,
          senderId,
          timestamp: serverTimestamp(),
          type: input.type || 'text',
        },
        [`unreadCount.${otherUserId}`]: (conversationData.unreadCount?.[otherUserId] || 0) + 1,
      updatedAt: Timestamp.now(),
      });
    }

    await batch.commit();

    return {
      id: messageDoc.id,
      ...messageData,
      createdAt: new Date(),
    } as Message;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

/**
 * Mark messages as read
 */
export const markMessagesAsRead = async (
  conversationId: string,
  userId: string
): Promise<void> => {
  try {
    const batch = writeBatch(db);

    // Get unread messages
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(
      messagesRef,
      where('senderId', '!=', userId),
      where('isRead', '==', false)
    );

    const snapshot = await getDocs(q);

    // Mark each message as read
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {
        isRead: true,
        readAt: serverTimestamp(),
      });
    });

    // Reset unread count in conversation
    const conversationRef = doc(db, 'conversations', conversationId);
    batch.update(conversationRef, {
      [`unreadCount.${userId}`]: 0,
    });

    await batch.commit();
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw error;
  }
};

/**
 * Subscribe to conversation updates (real-time)
 */
export const subscribeToConversation = (
  conversationId: string,
  callback: (conversation: Conversation | null) => void
): (() => void) => {
  const conversationRef = doc(db, 'conversations', conversationId);

  return onSnapshot(
    conversationRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const conversation: Conversation = {
          id: snapshot.id,
          ...data,
          lastMessage: data.lastMessage
            ? {
                ...data.lastMessage,
                timestamp: data.lastMessage.timestamp?.toDate() || new Date(),
              }
            : null,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Conversation;
        callback(conversation);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('Error in conversation subscription:', error);
      callback(null);
    }
  );
};

/**
 * Subscribe to new messages (real-time)
 */
export const subscribeToMessages = (
  conversationId: string,
  callback: (message: Message) => void
): (() => void) => {
  const messagesRef = collection(db, 'conversations', conversationId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(1));

  return onSnapshot(
    q,
    (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          const message: Message = {
            id: change.doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            readAt: data.readAt?.toDate() || null,
          } as Message;
          callback(message);
        }
      });
    },
    (error) => {
      console.error('Error in messages subscription:', error);
    }
  );
};

/**
 * Subscribe to user's conversations (used to refresh list in real-time)
 * Triggers callback on any change; consumer can invalidate queries.
 */
export const subscribeToUserConversations = (
  userId: string,
  callback: () => void
): (() => void) => {
  const conversationsRef = collection(db, 'conversations');
  // Listen to latest updates; any change will trigger a refresh
  const q = query(
    conversationsRef,
    where('participants', 'array-contains', userId),
    where('updatedAt', '!=', null),
    orderBy('updatedAt', 'desc'),
    limit(1)
  );

  return onSnapshot(
    q,
    () => {
      callback();
    },
    (error) => {
      console.error('Error in user conversations subscription:', error);
    }
  );
};

/**
 * Get total unread count for user
 */
export const getTotalUnreadCount = async (userId: string): Promise<number> => {
  try {
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', userId)
    );

    const snapshot = await getDocs(q);
    let totalUnread = 0;

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      totalUnread += data.unreadCount?.[userId] || 0;
    });

    return totalUnread;
  } catch (error) {
    console.error('Error getting total unread count:', error);
    return 0;
  }
};

