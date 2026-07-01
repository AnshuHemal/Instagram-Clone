import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { api } from '@/services/api';
import { feedCache } from '@/services/feedCache';
import { useActionError } from '@/contexts/ActionErrorContext';

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

export interface UserInfo {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  isVerified: boolean;
  isFollowing?: boolean;
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
  user: UserInfo;
  type?: 'post' | 'reel'; // Unified feed includes both
  // Reel-specific fields (optional)
  hlsUrl?: string;
  thumbnailUrl?: string;
  viewsCount?: string;
  audioName?: string;
}

export type FeedType = 'for_you' | 'following';

interface PostsContextType {
  posts: Post[];
  isLoading: boolean;
  isRefreshing: boolean;
  hasMore: boolean;
  cursor: string | null;
  feedType: FeedType;
  setFeedType: (type: FeedType) => void;
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
  const [feedType, setFeedType] = useState<FeedType>('following');
  const fetchingRef = useRef(false);
  const { showActionError } = useActionError();

  // Load cache on startup
  useEffect(() => {
    const hydrateCache = async () => {
      try {
        const cached = await feedCache.loadFeedPage();
        if (cached && cached.length > 0) {
          setPosts(cached);
        }
      } catch (err) {
        console.warn('Failed to load feed cache:', err);
      }
    };
    hydrateCache();
  }, []);

  const fetchPosts = useCallback(async (nextCursor: string | null = null, refresh: boolean = false) => {
    if (fetchingRef.current) return;

    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    fetchingRef.current = true;

    try {
      const activeCursor = refresh ? null : nextCursor;
      // Use the new unified feed endpoint
      const response = await api.get('/feed/unified', {
        params: {
          limit: 10,
          cursor: activeCursor,
          type: feedType,
        },
      });

      const { data, meta } = response.data;
      
      const newPosts: Post[] = data.map((item: any) => ({
        ...item,
        // Ensure standard boolean format for isLiked
        isLiked: !!item.isLiked,
        likesCount: item.likesCount ?? 0,
        commentsCount: item.commentsCount ?? 0,
      }));

      setPosts((prev) => (refresh ? newPosts : [...prev, ...newPosts]));
      setCursor(meta.nextCursor);
      setHasMore(meta.hasMore);

      // Cache first page on successful refresh
      if (refresh) {
        await feedCache.saveFeedPage(newPosts);
      }
    } catch (err) {
      console.error('Failed to fetch unified feed:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      fetchingRef.current = false;
    }
  }, [feedType]);

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
      // Determine if it's a post or reel and use the correct endpoint
      const isReel = post.type === 'reel';
      const endpoint = isReel ? `/reels/${postId}/like` : `/posts/${postId}/like`;
      
      const response = await api.post(endpoint);
      const { liked, likesCount } = response.data.data;
      
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, isLiked: liked, likesCount: likesCount ?? p.likesCount } : p))
      );
    } catch (err) {
      // Rollback on fail
      setPosts(originalPosts);
      console.error(`Failed to toggle like on ${postId}:`, err);
      showActionError('Failed to toggle like. Check network.', {
        icon: 'heart-outline',
        onRetry: () => handleLikeToggle(postId),
      });
    }
  }, [posts, showActionError]);

  const handleAddComment = useCallback(async (postId: string, text: string) => {
    if (!text.trim()) return null;

    const originalPosts = [...posts];
    const post = posts.find(p => p.id === postId);
    if (!post) return null;

    // Optimistic update of comment count
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p
      )
    );

    try {
      const isReel = post.type === 'reel';
      const endpoint = isReel ? `/reels/${postId}/comment` : `/posts/${postId}/comment`;

      const response = await api.post(endpoint, { text });
      const newComment = response.data.data;

      return newComment;
    } catch (err) {
      // Rollback comment count on failure
      setPosts(originalPosts);
      console.error(`Failed to add comment on ${postId}:`, err);
      showActionError('Failed to post comment. Check network.', {
        icon: 'chatbubble-outline',
        onRetry: () => handleAddComment(postId, text),
      });
      throw err;
    }
  }, [posts, showActionError]);

  const handleDeletePost = useCallback(async (postId: string) => {
    try {
      const post = posts.find(p => p.id === postId);
      const isReel = post?.type === 'reel';
      const endpoint = isReel ? `/reels/${postId}` : `/posts/${postId}`;
      
      await api.delete(endpoint);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      console.error(`Failed to delete ${postId}:`, err);
      throw err;
    }
  }, [posts]);

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