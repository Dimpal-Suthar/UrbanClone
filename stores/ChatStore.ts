import { Conversation, Message } from '@/types/chat';
import { makeAutoObservable, runInAction } from 'mobx';

class ChatStore {
  // Active conversations
  conversations: Map<string, Conversation> = new Map();
  
  // Messages by conversation ID
  messagesByConversation: Map<string, Message[]> = new Map();
  
  // Active conversation ID
  activeConversationId: string | null = null;
  
  // Typing indicators
  typingUsers: Map<string, Set<string>> = new Map(); // conversationId -> Set of userIds
  
  // Unread counts
  unreadCounts: Map<string, number> = new Map(); // conversationId -> count
  totalUnreadCount: number = 0;

  constructor() {
    makeAutoObservable(this);
  }

  // ============ Conversations ============

  setConversations(conversations: Conversation[]) {
    runInAction(() => {
      conversations.forEach(conv => {
        this.conversations.set(conv.id, conv);
      });
    });
  }

  setConversation(conversation: Conversation) {
    runInAction(() => {
      this.conversations.set(conversation.id, conversation);
    });
  }

  getConversation(id: string): Conversation | undefined {
    return this.conversations.get(id);
  }

  getAllConversations(): Conversation[] {
    return Array.from(this.conversations.values()).sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
    );
  }

  // ============ Messages ============

  setMessages(conversationId: string, messages: Message[]) {
    runInAction(() => {
      this.messagesByConversation.set(conversationId, messages);
    });
  }

  addMessage(conversationId: string, message: Message) {
    runInAction(() => {
      const existing = this.messagesByConversation.get(conversationId) || [];
      
      // Check if message already exists
      const exists = existing.some(m => m.id === message.id);
      if (!exists) {
        this.messagesByConversation.set(conversationId, [...existing, message]);
      }
    });
  }

  addMessages(conversationId: string, messages: Message[]) {
    runInAction(() => {
      const existing = this.messagesByConversation.get(conversationId) || [];
      const existingIds = new Set(existing.map(m => m.id));
      
      // Filter out duplicates
      const newMessages = messages.filter(m => !existingIds.has(m.id));
      
      if (newMessages.length > 0) {
        this.messagesByConversation.set(conversationId, [...existing, ...newMessages]);
      }
    });
  }

  getMessages(conversationId: string): Message[] {
    return this.messagesByConversation.get(conversationId) || [];
  }

  // ============ Active Conversation ============

  setActiveConversation(conversationId: string | null) {
    runInAction(() => {
      this.activeConversationId = conversationId;
    });
  }

  get activeConversation(): Conversation | undefined {
    if (!this.activeConversationId) return undefined;
    return this.conversations.get(this.activeConversationId);
  }

  get activeMessages(): Message[] {
    if (!this.activeConversationId) return [];
    return this.getMessages(this.activeConversationId);
  }

  // ============ Typing Indicators ============

  setUserTyping(conversationId: string, userId: string, isTyping: boolean) {
    runInAction(() => {
      if (isTyping) {
        // Add user to typing set
        if (!this.typingUsers.has(conversationId)) {
          this.typingUsers.set(conversationId, new Set());
        }
        this.typingUsers.get(conversationId)!.add(userId);
      } else {
        // Remove user from typing set
        const typingSet = this.typingUsers.get(conversationId);
        if (typingSet) {
          typingSet.delete(userId);
          if (typingSet.size === 0) {
            this.typingUsers.delete(conversationId);
          }
        }
      }
    });
  }

  isUserTyping(conversationId: string, userId: string): boolean {
    const typingSet = this.typingUsers.get(conversationId);
    return typingSet ? typingSet.has(userId) : false;
  }

  getTypingUsers(conversationId: string): string[] {
    const typingSet = this.typingUsers.get(conversationId);
    return typingSet ? Array.from(typingSet) : [];
  }

  // ============ Unread Counts ============

  setUnreadCount(conversationId: string, count: number) {
    runInAction(() => {
      this.unreadCounts.set(conversationId, count);
      this.updateTotalUnreadCount();
    });
  }

  incrementUnreadCount(conversationId: string) {
    runInAction(() => {
      const current = this.unreadCounts.get(conversationId) || 0;
      this.unreadCounts.set(conversationId, current + 1);
      this.updateTotalUnreadCount();
    });
  }

  resetUnreadCount(conversationId: string) {
    runInAction(() => {
      this.unreadCounts.set(conversationId, 0);
      this.updateTotalUnreadCount();
    });
  }

  getUnreadCount(conversationId: string): number {
    return this.unreadCounts.get(conversationId) || 0;
  }

  private updateTotalUnreadCount() {
    this.totalUnreadCount = Array.from(this.unreadCounts.values()).reduce(
      (sum, count) => sum + count,
      0
    );
  }

  // ============ Utilities ============

  clear() {
    runInAction(() => {
      this.conversations.clear();
      this.messagesByConversation.clear();
      this.activeConversationId = null;
      this.typingUsers.clear();
      this.unreadCounts.clear();
      this.totalUnreadCount = 0;
    });
  }
}

export const chatStore = new ChatStore();

