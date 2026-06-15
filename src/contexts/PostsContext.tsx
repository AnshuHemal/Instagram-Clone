import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { api } from '@/services/api';

export interface Comment {
  id: string;
  text: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    isVerified: boolean;
  };
}

export interface PostMedia {
  id: string;
  mediaUrl: string;
  mediaType: 'IMAGE' | 'VIDEO';
  orderIndex: number;
}

export interface Post {
  id: string;
  userId: string;
  caption?: string;
  location?: string;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  isLiked: boolean;
  media: PostMedia[];
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    isVerified: boolean;
  };
}

interface PostsContextType {
  posts: Post[];
  isLoading: boolean;
  isRefreshing: boolean;
  hasMore: boolean;
  cursor: string | null;
  feedType: 'for_you' | 'following';
  setFeedType: (type: 'for_you' | 'following') => void;
  fetchPosts: (nextCursor?: string | null, refresh?: boolean) => Promise<void>;
  handleLikeToggle: (postId: string) => Promise<void>;
  handleAddComment: (postId: string, text: string) => Promise<any>;
  handleDeletePost: (postId: string) => Promise<void>;
}

const PostsContext = createContext<PostsContextType | undefined>(undefined);

export const PostsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [feedType, setFeedType] = useState<'for_you' | 'following'>('following');
  const fetchingRef = useRef(false);

  const fetchPosts = useCallback(async (nextCursor: string | null = null, refresh: boolean = false) => {
    if (fetchingRef.current) return;
    if (isLoading || (isRefreshing && !refresh)) return;

    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    fetchingRef.current = true;

    try {
      const activeCursor = refresh ? null : nextCursor;
      const response = await api.get('/posts/feed', {
        params: {
          limit: 10,
          cursor: activeCursor,
          type: feedType,
        },
      });

      const { data, meta } = response.data;
      
      const newPosts: Post[] = data.map((post: any) => ({
        ...post,
        // Ensure standard boolean format for isLiked
        isLiked: !!post.isLiked,
      }));

      setPosts((prev) => (refresh ? newPosts : [...prev, ...newPosts]));
      setCursor(meta.nextCursor);
      setHasMore(meta.hasMore);
    } catch (err) {
      console.error('Failed to fetch posts feed:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      fetchingRef.current = false;
    }
  }, [isLoading, isRefreshing, feedType]);

  useEffect(() => {
    // Reset and fetch whenever feedType changes
    setPosts([]);
    setCursor(null);
    setHasMore(true);
    fetchingRef.current = false;
    fetchPosts(null, true);
  }, [feedType, fetchPosts]);

  const handleLikeToggle = useCallback(async (postId: string) => {
    // Locate original state for rollback
    const originalPosts = [...posts];
    const postIndex = posts.findIndex((p) => p.id === postId);
    if (postIndex === -1) return;

    const post = posts[postIndex];
    const originalLiked = post.isLiked;
    const originalLikesCount = post.likesCount;

    // Optimistic Update
    const newLiked = !originalLiked;
    const newLikesCount = newLiked ? originalLikesCount + 1 : originalLikesCount - 1;

    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, isLiked: newLiked, likesCount: newLikesCount } : p))
    );

    try {
      const response = await api.post(`/posts/${postId}/like`);
      const { liked, likesCount } = response.data.data;
      
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, isLiked: liked, likesCount } : p))
      );
    } catch (err) {
      // Rollback on fail
      setPosts(originalPosts);
      console.error(`Failed to toggle like on post ${postId}:`, err);
    }
  }, [posts]);

  const handleAddComment = useCallback(async (postId: string, text: string) => {
    if (!text.trim()) return null;

    try {
      const response = await api.post(`/posts/${postId}/comment`, { text });
      const newComment = response.data.data;

      // Update comment count on post
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p
        )
      );

      return newComment;
    } catch (err) {
      console.error(`Failed to add comment on post ${postId}:`, err);
      throw err;
    }
  }, []);

  const handleDeletePost = useCallback(async (postId: string) => {
    try {
      await api.delete(`/posts/${postId}`);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      console.error(`Failed to delete post ${postId}:`, err);
      throw err;
    }
  }, []);

  return (
    <PostsContext.Provider
      value={{
        posts,
        isLoading,
        isRefreshing,
        hasMore,
        cursor,
        feedType,
        setFeedType,
        fetchPosts,
        handleLikeToggle,
        handleAddComment,
        handleDeletePost,
      }}
    >
      {children}
    </PostsContext.Provider>
  );
};

export const usePosts = () => {
  const context = useContext(PostsContext);
  if (!context) {
    throw new Error('usePosts must be used within a PostsProvider');
  }
  return context;
};
