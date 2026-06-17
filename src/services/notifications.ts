import { api } from './api';

export interface NotificationActor {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  isVerified: boolean;
}

export interface Notification {
  id: string;
  recipientId: string;
  actorId: string;
  type: 'FOLLOW' | 'FOLLOW_REQUEST' | 'FOLLOW_REQUEST_ACCEPTED' | 'LIKE_POST' | 'LIKE_REEL' | 'COMMENT_POST' | 'COMMENT_REEL';
  postId: string | null;
  reelId: string | null;
  commentText: string | null;
  read: boolean;
  createdAt: string;
  message: string;
  actor: NotificationActor;
}

export interface NotificationsResponse {
  success: boolean;
  notifications: Notification[];
  nextCursor: string | null;
}

export interface UnreadCountResponse {
  success: boolean;
  count: number;
}

class NotificationService {
  async getNotifications(cursor?: string, limit = 20): Promise<NotificationsResponse> {
    const params: any = { limit };
    if (cursor) params.cursor = cursor;

    const response = await api.get('/notifications', { params });
    return response.data;
  }

  async getUnreadCount(): Promise<UnreadCountResponse> {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  }

  async markAsRead(notificationIds?: string[]): Promise<{ success: boolean }> {
    const response = await api.patch('/notifications/read', { notificationIds });
    return response.data;
  }

  async markAllAsRead(): Promise<{ success: boolean }> {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  }

  async deleteNotification(notificationId: string): Promise<{ success: boolean }> {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  }
}

export const notificationService = new NotificationService();
