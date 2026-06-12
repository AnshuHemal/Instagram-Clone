import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { TokenManager, api } from '@/services/api';

interface SocketContextProps {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: Record<string, boolean>;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  sendMessage: (conversationId: string, text: string, mediaUrl?: string) => Promise<{ success: boolean; messageId?: string; error?: string }>;
  sendTypingStatus: (conversationId: string, isTyping: boolean) => void;
}

const SocketContext = createContext<SocketContextProps | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({});
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    let active = true;

    const connectSocket = async () => {
      if (!user) {
        // Disconnect if user logs out
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
          setSocket(null);
          setIsConnected(false);
        }
        return;
      }

      try {
        const token = await TokenManager.getToken();
        if (!token || !active) return;

        // Resolve WebSocket URL from API baseURL (e.g. strip '/api')
        const baseUrl = api.defaults.baseURL || '';
        const wsUrl = baseUrl.endsWith('/api') ? baseUrl.slice(0, -4) : baseUrl;

        if (socketRef.current) {
          socketRef.current.disconnect();
        }

        console.log(`[Socket] Connecting to: ${wsUrl}`);
        const newSocket = io(wsUrl, {
          auth: {
            token: `Bearer ${token}`,
          },
          transports: ['websocket'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 2000,
        });

        newSocket.on('connect', () => {
          console.log('[Socket] Connected, ID:', newSocket.id);
          if (active) {
            setIsConnected(true);
          }
        });

        newSocket.on('disconnect', (reason) => {
          console.log('[Socket] Disconnected. Reason:', reason);
          if (active) {
            setIsConnected(false);
          }
        });

        newSocket.on('connect_error', (err) => {
          console.error('[Socket] Connection error:', err.message);
          if (active) {
            setIsConnected(false);
          }
        });

        // Listen for online status changes of other users
        newSocket.on('userOnlineStatus', (data: { userId: string; isOnline: boolean }) => {
          console.log('[Socket] userOnlineStatus event received:', data);
          if (active) {
            setOnlineUsers((prev) => ({
              ...prev,
              [data.userId]: data.isOnline,
            }));
          }
        });

        socketRef.current = newSocket;
        setSocket(newSocket);
      } catch (err) {
        console.error('[Socket] Init failed:', err);
      }
    };

    connectSocket();

    return () => {
      active = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user]);

  const joinConversation = (conversationId: string) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('joinConversation', { conversationId });
    }
  };

  const leaveConversation = (conversationId: string) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('leaveConversation', { conversationId });
    }
  };

  const sendMessage = (
    conversationId: string,
    text: string,
    mediaUrl?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> => {
    return new Promise((resolve) => {
      if (!socketRef.current || !socketRef.current.connected) {
        resolve({ success: false, error: 'Socket is not connected' });
        return;
      }

      socketRef.current.emit(
        'sendMessage',
        { conversationId, text, mediaUrl },
        (response: { success: boolean; messageId?: string; error?: string }) => {
          resolve(response);
        }
      );

      // Fallback fallback resolution in case ack is not supported or times out
      setTimeout(() => {
        resolve({ success: true }); // Assume sent or handled via broadcast
      }, 1000);
    });
  };

  const sendTypingStatus = (conversationId: string, isTyping: boolean) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('typingStatus', { conversationId, isTyping });
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        onlineUsers,
        joinConversation,
        leaveConversation,
        sendMessage,
        sendTypingStatus,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
