import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { Reel } from '@/constants/mockData';

// Dynamic check for expo-video (SDK 51+ standard)
let ExpoVideo: any = null;
try {
  ExpoVideo = require('expo-video');
} catch (e) {
  // Silent fallback
}

interface ReelsContextProps {
  reels: Reel[];
  isLoading: boolean;
  isRefreshing: boolean;
  hasMore: boolean;
  cursor: string | null;
  activeId: string;
  setActiveId: (id: string) => void;
  prewarmedPlayer: any;
  players: Record<string, any>;
  fetchReels: (nextCursor?: string | null, isRefresh?: boolean) => Promise<void>;
  handleLikeToggle: (id: string) => void;
  prefetchReels: () => void;
}

const ReelsContext = createContext<ReelsContextProps | undefined>(undefined);

export const ReelsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [reels, setReels] = useState<Reel[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeId, setActiveId] = useState<string>('');
  const [prewarmedPlayer, setPrewarmedPlayer] = useState<any>(null);

  const prewarmedUrlRef = useRef<string | null>(null);
  
  // Video Player Pool state and refs
  const [players, setPlayers] = useState<Record<string, any>>({});
  const playersRef = useRef<Record<string, any>>({});

  // Delayed release queue to prevent garbage collection crashes on native unmount
  const releaseQueueRef = useRef<Record<string, { player: any; timer: any }>>({});

  const safelyReleasePlayer = (id: string, player: any) => {
    if (!player) return;
    try {
      player.pause();
    } catch (e) {}

    // Cancel existing release timer if any
    if (releaseQueueRef.current[id]) {
      clearTimeout(releaseQueueRef.current[id].timer);
    }

    const timer = setTimeout(() => {
      try {
        player.release();
      } catch (e) {
        console.warn('Error releasing player:', e);
      }
      delete releaseQueueRef.current[id];
    }, 5000); // 5 seconds delayed release

    releaseQueueRef.current[id] = { player, timer };
  };

  const getPlayerFromReleaseQueue = (id: string) => {
    const item = releaseQueueRef.current[id];
    if (item) {
      clearTimeout(item.timer);
      const player = item.player;
      delete releaseQueueRef.current[id];
      return player;
    }
    return null;
  };

  const createPlayerInstance = (url: string) => {
    if (!ExpoVideo) return null;
    const cleanUrl = url.replace('.mp4.m3u8', '.m3u8');
    try {
      const player = ExpoVideo.createVideoPlayer(cleanUrl);
      player.loop = true;
      player.pause(); // Explicitly pause to ensure preloaded player doesn't start playing audio
      return player;
    } catch (e: any) {
      console.error('Error creating player in pool:', e.message);
      return null;
    }
  };

  // Preload and release players dynamically as activeId changes
  useEffect(() => {
    if (!user || reels.length === 0 || !activeId) {
      // Clean up all players on logout or empty reels
      Object.entries(playersRef.current).forEach(([id, player]) => {
        safelyReleasePlayer(id, player);
      });
      playersRef.current = {};
      setPlayers({});
      return;
    }

    const activeIndex = reels.findIndex(r => r.id === activeId);
    if (activeIndex === -1) return;

    // We preload [index-1, index, index+1, index+2] (previous, active, next, and next-next)
    const targetIndices = [activeIndex - 1, activeIndex, activeIndex + 1, activeIndex + 2].filter(
      idx => idx >= 0 && idx < reels.length
    );

    const nextPlayers: Record<string, any> = {};
    const newTargetKeys = new Set(targetIndices.map(idx => reels[idx].id));

    // Keep or create players for target indices
    targetIndices.forEach(idx => {
      const reel = reels[idx];
      if (!reel.hlsUrl) return;

      if (playersRef.current[reel.id]) {
        // Reuse existing player instance
        nextPlayers[reel.id] = playersRef.current[reel.id];
      } else {
        // Check release queue first to retrieve instead of recreating
        const queuedPlayer = getPlayerFromReleaseQueue(reel.id);
        if (queuedPlayer) {
          nextPlayers[reel.id] = queuedPlayer;
        } else {
          // Create new player instance and preload buffer
          const player = createPlayerInstance(reel.hlsUrl);
          if (player) {
            nextPlayers[reel.id] = player;
          }
        }
      }
    });

    // Clean up players that are no longer adjacent to active index
    Object.keys(playersRef.current).forEach(id => {
      if (!newTargetKeys.has(id)) {
        safelyReleasePlayer(id, playersRef.current[id]);
      }
    });

    playersRef.current = nextPlayers;
    setPlayers(nextPlayers);

  }, [activeId, reels, user]);

  // Clean up all pool players on context unmount
  useEffect(() => {
    return () => {
      Object.values(playersRef.current).forEach(player => {
        try {
          player.release();
        } catch (e) {}
      });
      Object.values(releaseQueueRef.current).forEach(item => {
        clearTimeout(item.timer);
        try {
          item.player.release();
        } catch (e) {}
      });
    };
  }, []);


  const mapBackendReel = (item: any): Reel => {
    return {
      id: item.id,
      username: item.user?.username || 'anonymous',
      avatar: item.user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      imageUrl: item.thumbnailUrl || 'https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=800',
      description: item.caption || '',
      likesCount: Number(item.likesCount || 0),
      commentsCount: Number(item.commentsCount || 0),
      isLiked: !!item.isLiked,
      musicName: item.audioName || 'Original Audio',
      views: Number(item.viewsCount || 0).toLocaleString(),
      hlsUrl: item.hlsUrl || undefined,
      durationSeconds: item.durationSeconds ? Number(item.durationSeconds) : undefined,
    };
  };

  const warmUpPlayer = (reel: Reel) => {
    if (!ExpoVideo || !reel.hlsUrl) return;
    const cleanUrl = reel.hlsUrl.replace('.mp4.m3u8', '.m3u8');
    if (prewarmedUrlRef.current === cleanUrl) return;
    
    if (prewarmedPlayer) {
      safelyReleasePlayer('prewarmed', prewarmedPlayer);
    }
    
    prewarmedUrlRef.current = cleanUrl;
    try {
      const player = ExpoVideo.createVideoPlayer(cleanUrl);
      player.loop = true;
      setPrewarmedPlayer(player);
    } catch (e: any) {
      console.error('Error pre-warming video player message:', e.message);
      console.error('Error pre-warming video player stack:', e.stack);
    }
  };

  const fetchReels = async (nextCursor: string | null = null, isRefresh = false) => {
    if (!user) return;
    if (isLoading) return;
    if (!isRefresh && !hasMore) return;

    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const url = nextCursor 
        ? `/reels/feed?limit=8&cursor=${nextCursor}` 
        : `/reels/feed?limit=8`;
      
      const res = await api.get(url);
      const backendItems = res.data.data || [];
      const meta = res.data.meta || {};

      const formattedItems = backendItems.map(mapBackendReel);

      setReels(prev => {
        const nextList = isRefresh ? formattedItems : [...prev, ...formattedItems];
        if (nextList.length > 0) {
          warmUpPlayer(nextList[0]);
        }
        return nextList;
      });
      setCursor(meta.nextCursor || null);
      setHasMore(meta.hasMore ?? false);

      if ((isRefresh || reels.length === 0) && formattedItems.length > 0) {
        setActiveId(formattedItems[0].id);
      }
    } catch (err) {
      console.error('Failed to load reels feed:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const prefetchReels = () => {
    if (reels.length === 0 && user) {
      fetchReels(null, true);
    }
  };

  useEffect(() => {
    if (user) {
      prefetchReels();
    } else {
      // Clear data on logout
      setReels([]);
      setCursor(null);
      setHasMore(true);
      setPrewarmedPlayer((prev: any) => {
        if (prev) safelyReleasePlayer('prewarmed', prev);
        return null;
      });
      prewarmedUrlRef.current = null;
    }
    // Only depend on user — not prewarmedPlayer, which would cause an infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleLikeToggle = (id: string) => {
    setReels(prevReels =>
      prevReels.map(reel => {
        if (reel.id === id) {
          const newIsLiked = !reel.isLiked;
          return {
            ...reel,
            isLiked: newIsLiked,
            likesCount: newIsLiked ? reel.likesCount + 1 : reel.likesCount - 1,
          };
        }
        return reel;
      })
    );
  };

  return (
    <ReelsContext.Provider value={{
      reels,
      isLoading,
      isRefreshing,
      hasMore,
      cursor,
      activeId,
      setActiveId,
      prewarmedPlayer,
      players,
      fetchReels,
      handleLikeToggle,
      prefetchReels
    }}>
      {children}
    </ReelsContext.Provider>
  );
};

export const useReels = () => {
  const context = useContext(ReelsContext);
  if (!context) {
    throw new Error('useReels must be used within a ReelsProvider');
  }
  return context;
};
