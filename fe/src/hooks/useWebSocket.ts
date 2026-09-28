import { useEffect, useRef, useState, useCallback } from 'react';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { ChatMessage } from '../types';

const WS_URL = 'http://localhost:7000/ws';

interface UseWebSocketReturn {
  connected: boolean;
  messages: ChatMessage[];
  sendMessage: (receiverId: number, content: string) => void;
  sendTyping: (receiverId: number) => void;
  markAsRead: (senderId: number) => void;
  clearMessages: () => void;
}

/**
 * Custom hook để quản lý WebSocket connection
 * Tương tự như useEffect + state management cho real-time chat
 */
export const useWebSocket = (userId: number | null): UseWebSocketReturn => {
  const clientRef = useRef<Client | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (!userId) return;

    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.warn('No access token found for WebSocket');
      return;
    }

    // Tạo STOMP client
    const client = new Client({
      // Sử dụng SockJS làm WebSocket transport
      webSocketFactory: () => new SockJS(WS_URL),
      
      // Headers gửi khi CONNECT
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },

      // Debug logs (có thể tắt ở production)
      debug: (str) => {
        console.log('[STOMP]', str);
      },

      // Reconnect sau 5 giây nếu mất kết nối
      reconnectDelay: 5000,

      // Heartbeat để giữ connection
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    // Callback khi connect thành công
    client.onConnect = () => {
      console.log('WebSocket connected!');
      setConnected(true);

      // Subscribe để nhận tin nhắn private
      // Server gửi đến: /user/{userId}/queue/messages
      // Client subscribe: /user/queue/messages (STOMP tự map userId)
      client.subscribe('/user/queue/messages', (message: IMessage) => {
        const chatMessage: ChatMessage = JSON.parse(message.body);
        console.log('Received message:', chatMessage);
        
        setMessages((prev) => [...prev, chatMessage]);
      });

      // Subscribe để nhận typing indicator
      client.subscribe('/user/queue/typing', (message: IMessage) => {
        const typingMessage: ChatMessage = JSON.parse(message.body);
        console.log('Typing:', typingMessage.senderName);
        // Có thể emit event hoặc update state để show "đang gõ..."
      });

      // Subscribe để nhận read receipts
      client.subscribe('/user/queue/read', (message: IMessage) => {
        const readMessage: ChatMessage = JSON.parse(message.body);
        console.log('Read receipt from:', readMessage.senderId);
        // Update messages to mark as read
      });
    };

    // Callback khi disconnect
    client.onDisconnect = () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    };

    // Callback khi có lỗi
    client.onStompError = (frame) => {
      console.error('STOMP error:', frame.headers['message']);
      console.error('Details:', frame.body);
    };

    // Activate (connect) client
    client.activate();
    clientRef.current = client;

    // Cleanup khi unmount
    return () => {
      if (client.active) {
        client.deactivate();
      }
    };
  }, [userId]);

  /**
   * Gửi tin nhắn
   */
  const sendMessage = useCallback((receiverId: number, content: string) => {
    if (!clientRef.current?.connected) {
      console.warn('WebSocket not connected');
      return;
    }

    const message: ChatMessage = {
      receiverId,
      senderId: userId!,
      content,
      type: 'CHAT',
    };

    // Gửi đến /app/chat.send
    clientRef.current.publish({
      destination: '/app/chat.send',
      body: JSON.stringify(message),
    });

    console.log('Message sent:', message);
  }, [userId]);

  /**
   * Gửi typing indicator
   */
  const sendTyping = useCallback((receiverId: number) => {
    if (!clientRef.current?.connected) return;

    const message: ChatMessage = {
      receiverId,
      senderId: userId!,
      content: '',
      type: 'TYPING',
    };

    clientRef.current.publish({
      destination: '/app/chat.typing',
      body: JSON.stringify(message),
    });
  }, [userId]);

  /**
   * Đánh dấu tin nhắn đã đọc
   */
  const markAsRead = useCallback((senderId: number) => {
    if (!clientRef.current?.connected) return;

    const message: ChatMessage = {
      senderId,
      receiverId: userId!,
      content: '',
      type: 'READ',
    };

    clientRef.current.publish({
      destination: '/app/chat.read',
      body: JSON.stringify(message),
    });
  }, [userId]);

  /**
   * Clear messages (khi switch conversation)
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    connected,
    messages,
    sendMessage,
    sendTyping,
    markAsRead,
    clearMessages,
  };
};
