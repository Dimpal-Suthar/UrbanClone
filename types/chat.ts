
/**
 * Message types that can be sent in chat
 */
export type MessageType = 'text' | 'image' | 'location';

/**
 * Individual message in a conversation
 */
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderPhoto: string | null;
  text: string;
  type: MessageType;
  imageUrl?: string;
  imageUrls?: string[];
  location?: {
    lat: number;
    lng: number;
  };
  isRead: boolean;
  readAt?: Date | null;
  createdAt: Date;
}

/**
 * Participant data in a conversation
 */
export interface ParticipantData {
  name: string;
  photo: string | null;
  role: 'customer' | 'provider';
}

/**
 * Last message preview in conversation list
 */
export interface LastMessage {
  text: string;
  senderId: string;
  timestamp: Date;
  type: MessageType;
}

/**
 * Conversation between customer and provider
 */
export interface Conversation {
  id: string;
  participants: string[]; // [customerId, providerId]
  participantsData: {
    [userId: string]: ParticipantData;
  };
  bookingId: string;
  lastMessage: LastMessage | null;
  unreadCount: {
    [userId: string]: number;
  };
  typing?: {
    [userId: string]: {
      isTyping: boolean;
      updatedAt?: Date;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input for creating a new message
 */
export interface CreateMessageInput {
  conversationId: string;
  text: string;
  type?: MessageType;
  imageUrl?: string;
  imageUrls?: string[];
  location?: {
    lat: number;
    lng: number;
  };
}

/**
 * Input for creating a new conversation
 */
export interface CreateConversationInput {
  customerId: string;
  providerId: string;
  customerName: string;
  customerPhoto: string | null;
  providerName: string;
  providerPhoto: string | null;
  bookingId: string;
}

/**
 * Notification types
 */
export type NotificationType = 'message' | 'booking' | 'review' | 'payment' | 'system';

/**
 * Notification data payloads
 */
export interface NotificationData {
  conversationId?: string;
  bookingId?: string;
  senderId?: string;
  messageId?: string;
  [key: string]: any;
}

/**
 * Notification document
 */
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data: NotificationData;
  isRead: boolean;
  createdAt: Date;
}

/**
 * Input for creating notification
 */
export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: NotificationData;
}

/**
 * FCM Token for push notifications
 */
export interface UserToken {
  userId: string;
  tokens: string[];
  platform: 'ios' | 'android' | 'web';
  updatedAt: Date;
}

/**
 * Typing indicator
 */
export interface TypingStatus {
  conversationId: string;
  userId: string;
  isTyping: boolean;
  timestamp: Date;
}

