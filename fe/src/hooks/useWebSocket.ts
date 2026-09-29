import { useEffect, useRef, useState, useCallback } from 'react';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { ChatMessage } from '../types';

const WS_URL = 'http://localhost:7000/ws';

interface UseWebSocketReturn {
  connected: boolean;
  sendMessage: (receiverId: number, content: string) => void;
  sendTyping: (receiverId: number) => void;
  markAsRead: (senderId: number) => void;
  typingUser: number | null;
}

/**
 * Custom hook để quản lý WebSocket connection
 */
export const useWebSocket = (
  userId: number | null, 
  username: string | null,
  onMessage?: (message: ChatMessage) => void,
  onRead?: (senderId: number) => void
): UseWebSocketReturn => {
  const clientRef = useRef<Client | null>(null);
  const [connected, setConnected] = useState(false);
  const [typingUser, setTypingUser] = useState<number | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = useRef<number>(0);
  const onMessageRef = useRef(onMessage);
  const onReadRef = useRef(onRead);
  
  // Dùng ref để track typingUser cho việc clear timeout
  const typingUserRef = useRef<number | null>(null);
  
  // Stable callback để set typing user - tránh stale closure
  const handleTypingReceived = useCallback((senderId: number) => {
    console.log('🔥 handleTypingReceived called with:', senderId);
    
    // Update cả state và ref
    typingUserRef.current = senderId;
    setTypingUser(senderId);
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to clear typing
    typingTimeoutRef.current = setTimeout(() => {
      console.log('⏱️ Clearing typingUser');
      typingUserRef.current = null;
      setTypingUser(null);
    }, 3000);
  }, []);
  
  console.log('🔄 useWebSocket render - typingUser:', typingUser);

  // Update ref khi callback thay đổi
  useEffect(() => {
    onMessageRef.current = onMessage;
    onReadRef.current = onRead;
  }, [onMessage, onRead]);

  useEffect(() => {
    if (!userId || !username) return;

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
      console.log('✅ WebSocket connected! UserId:', userId, 'Username:', username);
      setConnected(true);

      try {
        // Subscribe để nhận tin nhắn private
        console.log('📌 Subscribing to /user/queue/messages...');
        client.subscribe('/user/queue/messages', (message: IMessage) => {
          const chatMessage: ChatMessage = JSON.parse(message.body);
          console.log('📩 Received message via WebSocket:', chatMessage);
          
          // Gọi callback với tin nhắn mới
          if (onMessageRef.current) {
            onMessageRef.current(chatMessage);
          }
        });
        console.log('✅ Subscribed to messages');

        // Subscribe để nhận typing indicator - dùng TOPIC với username
        const typingTopic = `/topic/typing.${username}`;
        console.log('📌 Subscribing to typing topic:', typingTopic);
        const typingSub = client.subscribe(typingTopic, (message: IMessage) => {
          console.log('📬 RAW typing message received:', message.body);
          const typingMessage: ChatMessage = JSON.parse(message.body);
          console.log('🔥 Typing from:', typingMessage.senderName, '(ID:', typingMessage.senderId, ')');
          
          // Đảm bảo senderId là number và gọi stable callback
          const senderId = Number(typingMessage.senderId);
          handleTypingReceived(senderId);
        });
        console.log('✅ Subscribed to typing topic, subscription id:', typingSub.id);

        // Subscribe để nhận read receipts - cũng dùng TOPIC
        const readTopic = `/topic/read.${username}`;
        console.log('Subscribing to', readTopic);
        client.subscribe(readTopic, (message: IMessage) => {
          const readMessage: ChatMessage = JSON.parse(message.body);
          console.log('Read receipt from:', readMessage.senderId);
          
          // Gọi callback để update UI (đánh dấu tin đã đọc)
          if (onReadRef.current && readMessage.senderId) {
            onReadRef.current(readMessage.senderId);
          }
        });
        console.log('✅ Subscribed to read topic');
      } catch (error) {
        console.error('❌ Error subscribing:', error);
      }
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
  }, [userId, username]);

  /**
   * Gửi tin nhắn
   */
  const sendMessage = useCallback((receiverId: number, content: string) => {
    if (!clientRef.current?.connected) {
      console.warn('WebSocket not connected');
      return;
    }

    const message: Partial<ChatMessage> = {
      receiverId,
      content,
      type: 'CHAT',
    };

    // Gửi đến /app/chat.send
    clientRef.current.publish({
      destination: '/app/chat.send',
      body: JSON.stringify(message),
    });

    console.log('Message sent via WebSocket:', message);
  }, []);

  /**
   * Gửi typing indicator (throttled - chỉ gửi tối đa 1 lần mỗi 1 giây)
   */
  const sendTyping = useCallback((receiverId: number) => {
    if (!clientRef.current?.connected) return;

    const now = Date.now();
    // Throttle: chỉ gửi nếu đã qua 1 giây từ lần gửi trước
    if (now - lastTypingSentRef.current < 1000) {
      return;
    }
    lastTypingSentRef.current = now;

    const message: Partial<ChatMessage> = {
      receiverId,
      content: '',
      type: 'TYPING',
    };

    clientRef.current.publish({
      destination: '/app/chat.typing',
      body: JSON.stringify(message),
    });
    
    console.log('Typing sent to:', receiverId);
  }, []);

  /**
   * Đánh dấu tin nhắn đã đọc
   */
  const markAsRead = useCallback((senderId: number) => {
    if (!clientRef.current?.connected) return;

    const message: Partial<ChatMessage> = {
      senderId,
      content: '',
      type: 'READ',
    };

    clientRef.current.publish({
      destination: '/app/chat.read',
      body: JSON.stringify(message),
    });
    
    console.log('Marked as read for sender:', senderId);
  }, []);

  return {
    connected,
    sendMessage,
    sendTyping,
    markAsRead,
    typingUser,
  };
};
