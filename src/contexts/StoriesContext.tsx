import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { useAuth } from './AuthContext';
import { api } from '@/services/api';

export interface StoryItem {
  id: string;
  mediaUrl: string;
  mediaType: 'IMAGE' | 'VIDEO';
  createdAt: string;
  isSeen: boolean;
}

export interface UserStoryGroup {
  userId: string;
  username: string;
  displayName: string;
  avatar: string;
  isSeen: boolean;
  stories: StoryItem[];
}

interface StoriesContextProps {
  stories: UserStoryGroup[];
  loading: boolean;
  fetchStories: () => Promise<void>;
  uploadStory: (uri: string, type: 'image' | 'video') => Promise<boolean>;
  viewStory: (storyId: string) => Promise<void>;
}

const StoriesContext = createContext<StoriesContextProps | undefined>(undefined);

export const StoriesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [stories, setStories] = useState<UserStoryGroup[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchStories = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await api.get('/stories');
      if (res.data) {
        setStories(res.data);
      }
    } catch (err) {
      console.error('[StoriesContext] Fetch stories failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchStories();
    } else {
      setStories([]);
    }
  }, [user]);

  const uploadStory = async (uri: string, type: 'image' | 'video'): Promise<boolean> => {
    try {
      setLoading(true);
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'story_file';
      const match = /\.(\w+)$/.exec(filename);
      const ext = match ? match[1] : '';
      let mimeType = type === 'video' ? 'video/mp4' : 'image/jpeg';

      if (ext) {
        mimeType = type === 'video' ? `video/${ext}` : `image/${ext}`;
      }

      formData.append('file', {
        uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
        name: filename,
        type: mimeType,
      } as any);

      await api.post('/stories', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      await fetchStories();
      return true;
    } catch (err) {
      console.error('[StoriesContext] Story upload failed:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const viewStory = async (storyId: string) => {
    try {
      // Optimistically mark story as seen locally first
      setStories((prevGroups) => {
        return prevGroups.map((group) => {
          const updatedStories = group.stories.map((s) =>
            s.id === storyId ? { ...s, isSeen: true } : s
          );
          const allSeen = updatedStories.every((s) => s.isSeen);
          return {
            ...group,
            isSeen: allSeen,
            stories: updatedStories,
          };
        });
      });

      // Execute view logging in the database
      await api.post(`/stories/${storyId}/view`);
    } catch (err) {
      console.error('[StoriesContext] Failed to log story view:', err);
    }
  };

  return (
    <StoriesContext.Provider
      value={{
        stories,
        loading,
        fetchStories,
        uploadStory,
        viewStory,
      }}
    >
      {children}
    </StoriesContext.Provider>
  );
};

export const useStories = () => {
  const context = useContext(StoriesContext);
  if (!context) {
    throw new Error('useStories must be used within a StoriesProvider');
  }
  return context;
};
