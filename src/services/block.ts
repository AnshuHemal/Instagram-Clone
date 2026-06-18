import { api } from './api';

export interface BlockedUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface MutualFollower {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

export const blockService = {
  async blockUser(targetId: string): Promise<{ success: boolean; blocked: boolean }> {
    const res = await api.post(`/auth/users/${targetId}/block`);
    return res.data;
  },
  async unblockUser(targetId: string): Promise<{ success: boolean; blocked: boolean }> {
    const res = await api.delete(`/auth/users/${targetId}/block`);
    return res.data;
  },
  async getBlockedUsers(): Promise<{ success: boolean; data: BlockedUser[] }> {
    const res = await api.get('/auth/users/blocked');
    return res.data;
  },
  async muteUser(targetId: string, mutePosts = true, muteStories = false): Promise<{ success: boolean; muted: boolean }> {
    const res = await api.post(`/auth/users/${targetId}/mute`, { mutePosts, muteStories });
    return res.data;
  },
  async unmuteUser(targetId: string): Promise<{ success: boolean; muted: boolean }> {
    const res = await api.delete(`/auth/users/${targetId}/mute`);
    return res.data;
  },
  async getMutualFollowers(targetId: string): Promise<{ success: boolean; data: MutualFollower[]; total: number }> {
    const res = await api.get(`/auth/users/${targetId}/mutual-followers`);
    return res.data;
  },
};
