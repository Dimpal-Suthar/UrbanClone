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
  DocumentSnapshot,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

const convertTypingMap = (typing: any): Conversation['typing'] | undefined => {
  if (!typing) return undefined;

  const converted: Conversation['typing'] = {};

  Object.entries(typing).forEach(([userId, value]) => {
    const entry = value as any;
    if (entry && typeof entry === 'object') {
      converted[userId] = {
        isTyping: !!entry.isTyping,
        updatedAt: entry.updatedAt?.toDate?.() || entry.timestamp?.toDate?.() || undefined,
      };
    } else {
      converted[userId] = {
        isTyping: Boolean(value),
      };
    }
  });

  return converted;
};

const buildConversationFromDoc = (id: string, data: any): Conversation => {
  return {
    id,
    ...data,
    typing: convertTypingMap(data.typing),
    lastMessage: data.lastMessage
      ? {
          ...data.lastMessage,
          timestamp: data.lastMessage.timestamp?.toDate() || new Date(),
        }
      : null,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  } as Conversation;
};

/**
 * Get or create a conversation between customer and provider
 * @param input - Conversation input data
 * @param currentUserId - The ID of the user making the request (must be either customerId or providerId)
 */
export const getOrCreateConversation = async (
  input: CreateConversationInput,
  currentUserId: string
): Promise<Conversation> => {
  try {
    // Validate that currentUserId is one of the participants
    if (currentUserId !== input.customerId && currentUserId !== input.providerId) {
      throw new Error('Current user must be either customer or provider');
    }

    // Check if conversation already exists FIRST
    // IMPORTANT: Query by currentUserId to ensure security rules pass
    // Security rules check: request.auth.uid in resource.data.participants
    // So we must query by the current user's ID
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', currentUserId)
    );

    const snapshot = await getDocs(q);
    
    // Find conversation that has both customer and provider
    const existingConv = snapshot.docs.find((doc) => {
      const data = doc.data();
      return data.participants.includes(input.customerId) && 
             data.participants.includes(input.providerId);
    });

    if (existingConv) {
      // For existing conversations, allow access even if users are deleted
      // Try to fetch fresh user data, but use existing participantsData as fallback
      const [customerDoc, providerDoc] = await Promise.all([
        getDoc(doc(db, 'users', input.customerId)).catch(() => null),
        getDoc(doc(db, 'users', input.providerId)).catch(() => null),
      ]);

      const customerData = customerDoc?.exists() ? customerDoc.data() : {};
      const providerData = providerDoc?.exists() ? providerDoc.data() : {};
      const data = existingConv.data();
      const existingParticipantsData = data.participantsData || {};
      
      // Update with fresh participant data, but keep existing data as fallback
      const updatedParticipantsData = {
        [input.customerId]: {
          name: customerData.displayName || customerData.name || existingParticipantsData[input.customerId]?.name || input.customerName,
          photo: customerData.photoURL || customerData.photo || existingParticipantsData[input.customerId]?.photo || input.customerPhoto,
          role: 'customer' as const,
        },
        [input.providerId]: {
          name: providerData.displayName || providerData.name || existingParticipantsData[input.providerId]?.name || input.providerName,
          photo: providerData.photoURL || providerData.photo || existingParticipantsData[input.providerId]?.photo || input.providerPhoto,
          role: 'provider' as const,
        },
      };

      return buildConversationFromDoc(existingConv.id, {
        ...data,
        participantsData: updatedParticipantsData,
      });
    }

    // Only validate user existence when CREATING a new conversation
    const [customerDoc, providerDoc] = await Promise.all([
      getDoc(doc(db, 'users', input.customerId)),
      getDoc(doc(db, 'users', input.providerId)),
    ]);

    if (!customerDoc.exists()) {
      throw new Error('Customer account not found. The account may have been deleted.');
    }

    if (!providerDoc.exists()) {
      throw new Error('Provider account not found. The account may have been deleted.');
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
      typing: {
        [input.customerId]: {
          isTyping: false,
          updatedAt: Timestamp.now(),
        },
        [input.providerId]: {
          isTyping: false,
          updatedAt: Timestamp.now(),
        },
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(conversationsRef, newConversation);
    
    return buildConversationFromDoc(docRef.id, newConversation);
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
      const existingParticipantsData = data.participantsData || {};
      
      // Build participants data from userMap, with fallback to existing data
      const updatedParticipantsData: any = {};
      participantIds.forEach((participantId: string) => {
        if (userMap.has(participantId)) {
          // Use fresh user data if available
          const userData = userMap.get(participantId);
          updatedParticipantsData[participantId] = {
            name: userData.name,
            photo: userData.photo,
            role: userData.role,
          };
        } else if (existingParticipantsData[participantId]) {
          // Use existing participantsData as fallback (for deleted users)
          updatedParticipantsData[participantId] = existingParticipantsData[participantId];
        } else {
          // Last resort: use generic data
          updatedParticipantsData[participantId] = {
            name: 'User',
            photo: null,
            role: 'customer' as const,
          };
        }
      });
      
      conversations.push(
        buildConversationFromDoc(docSnapshot.id, {
          ...data,
          participantsData: updatedParticipantsData,
        })
      );
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
        imageUrls: data.imageUrls || (data.imageUrl ? [data.imageUrl] : []),
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
      imageUrls: input.imageUrls || (input.imageUrl ? [input.imageUrl] : []),
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
          text:
            input.type === 'image'
              ? input.imageUrls && input.imageUrls.length > 1
                ? '📷 Photos'
                : '📷 Image'
              : input.type === 'location'
              ? '📍 Location'
              : input.text,
          senderId,
          timestamp: serverTimestamp(),
          type: input.type || 'text',
        },
        [`unreadCount.${otherUserId}`]: (conversationData.unreadCount?.[otherUserId] || 0) + 1,
        updatedAt: Timestamp.now(),
        [`typing.${senderId}`]: {
          isTyping: false,
          updatedAt: serverTimestamp(),
        },
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

export const setTypingStatus = async (
  conversationId: string,
  userId: string,
  isTyping: boolean
): Promise<void> => {
  try {
    const conversationRef = doc(db, 'conversations', conversationId);
    await updateDoc(conversationRef, {
      [`typing.${userId}`]: {
        isTyping,
        updatedAt: serverTimestamp(),
      },
    });
  } catch (error) {
    console.error('Error updating typing status:', error);
  }
};

/**
 * Get a single conversation by ID
 */
export const getConversation = async (conversationId: string): Promise<Conversation | null> => {
  try {
    const conversationDoc = await getDoc(doc(db, 'conversations', conversationId));
    if (!conversationDoc.exists()) {
      return null;
    }
    return buildConversationFromDoc(conversationDoc.id, conversationDoc.data());
  } catch (error) {
    console.error('Error getting conversation:', error);
    return null;
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
        const conversation = buildConversationFromDoc(snapshot.id, data);
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
  callback: (message: Message, changeType: 'added' | 'modified' | 'removed') => void
): (() => void) => {
  const messagesRef = collection(db, 'conversations', conversationId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(50));

  return onSnapshot(
    q,
    (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const data = change.doc.data();
        const message: Message = {
          id: change.doc.id,
          ...data,
          imageUrls: data.imageUrls || (data.imageUrl ? [data.imageUrl] : []),
          createdAt: data.createdAt?.toDate() || new Date(),
          readAt: data.readAt?.toDate() || null,
        } as Message;
        callback(message, change.type);
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
  callback: (conversation: Conversation, changeType: 'added' | 'modified' | 'removed') => void
): (() => void) => {
  const conversationsRef = collection(db, 'conversations');
  const q = query(
    conversationsRef,
    where('participants', 'array-contains', userId),
    orderBy('updatedAt', 'desc'),
    limit(30)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const conversation = buildConversationFromDoc(change.doc.id, change.doc.data());
        callback(conversation, change.type);
      });
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

