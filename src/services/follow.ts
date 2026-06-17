import { api } from './api';

export interface FollowStatusResponse {
  success: boolean;
  following: boolean;
}

export interface FollowActionResponse {
  success: boolean;
  following: boolean;
  requested?: boolean;
  followersCount?: number;
  followingCount?: number;
  message?: string;
}

export interface UserProfileResponse {
  success: boolean;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    bio: string | null;
    isVerified: boolean;
    isPrivate: boolean;
    followersCount: number;
    followingCount: number;
    postsCount: number;
    isFollowing: boolean;
    isRequested: boolean;
  };
}

export const followService = {
  async followUser(targetId: string): Promise<FollowActionResponse> {
    const res = await api.post(`/auth/users/${targetId}/follow`);
    return res.data;
  },

  async unfollowUser(targetId: string): Promise<FollowActionResponse> {
    const res = await api.delete(`/auth/users/${targetId}/follow`);
    return res.data;
  },

  async getFollowStatus(targetId: string): Promise<FollowStatusResponse> {
    const res = await api.get(`/auth/users/${targetId}/follow-status`);
    return res.data;
  },

  async getUserProfile(targetId: string): Promise<UserProfileResponse> {
    const res = await api.get(`/auth/users/${targetId}/profile`);
    return res.data;
  },

  async cancelFollowRequest(targetId: string): Promise<{ success: boolean; message: string }> {
    const res = await api.delete(`/auth/users/${targetId}/follow-request`);
    return res.data;
  },

  async getFollowRequests(): Promise<{ success: boolean; data: any[] }> {
    const res = await api.get('/auth/users/follow-requests');
    return res.data;
  },

  async acceptFollowRequest(requestId: string): Promise<{ success: boolean }> {
    const res = await api.patch(`/auth/users/follow-requests/${requestId}/accept`);
    return res.data;
  },

  async declineFollowRequest(requestId: string): Promise<{ success: boolean }> {
    const res = await api.patch(`/auth/users/follow-requests/${requestId}/decline`);
    return res.data;
  },
};
