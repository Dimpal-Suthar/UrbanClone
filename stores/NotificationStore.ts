import { Notification } from '@/types/chat';
import { makeAutoObservable, runInAction } from 'mobx';

class NotificationStore {
  // All notifications
  notifications: Notification[] = [];
  
  // Unread count
  unreadCount: number = 0;
  
  // Badge count (for app icon)
  badgeCount: number = 0;

  constructor() {
    makeAutoObservable(this);
  }

  // ============ Notifications ============

  setNotifications(notifications: Notification[]) {
    runInAction(() => {
      this.notifications = notifications.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );
      this.updateUnreadCount();
    });
  }

  addNotification(notification: Notification) {
    runInAction(() => {
      // Check if notification already exists
      const exists = this.notifications.some(n => n.id === notification.id);
      if (!exists) {
        this.notifications = [notification, ...this.notifications];
        this.updateUnreadCount();
      }
    });
  }

  removeNotification(id: string) {
    runInAction(() => {
      this.notifications = this.notifications.filter(n => n.id !== id);
      this.updateUnreadCount();
    });
  }

  markAsRead(id: string) {
    runInAction(() => {
      const notification = this.notifications.find(n => n.id === id);
      if (notification) {
        notification.isRead = true;
        this.updateUnreadCount();
      }
    });
  }

  markAllAsRead() {
    runInAction(() => {
      this.notifications.forEach(n => {
        n.isRead = true;
      });
      this.updateUnreadCount();
    });
  }

  clearAll() {
    runInAction(() => {
      this.notifications = [];
      this.unreadCount = 0;
      this.badgeCount = 0;
    });
  }

  // ============ Unread Count ============

  private updateUnreadCount() {
    this.unreadCount = this.notifications.filter(n => !n.isRead).length;
    this.badgeCount = this.unreadCount;
  }

  setUnreadCount(count: number) {
    runInAction(() => {
      this.unreadCount = count;
      this.badgeCount = count;
    });
  }

  // ============ Getters ============

  get unreadNotifications(): Notification[] {
    return this.notifications.filter(n => !n.isRead);
  }

  get readNotifications(): Notification[] {
    return this.notifications.filter(n => n.isRead);
  }

  getNotificationsByType(type: Notification['type']): Notification[] {
    return this.notifications.filter(n => n.type === type);
  }

  getNotification(id: string): Notification | undefined {
    return this.notifications.find(n => n.id === id);
  }
}

export const notificationStore = new NotificationStore();

