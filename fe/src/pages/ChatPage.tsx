import { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { chatApi, userApi } from '../services/api';
import { ChatMessage, Conversation, UserResponse } from '../types';

/**
 * Trang Chat - Real-time messaging giữa 2 users
 */
export default function ChatPage() {
  // Lấy userId từ localStorage (trong thực tế nên lấy từ context)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  
  // Danh sách conversations (sidebar)
  const [conversations, setConversations] = useState<Conversation[]>([]);
  
  // Danh sách users (để start chat mới)
  const [users, setUsers] = useState<UserResponse[]>([]);
  
  // Conversation đang active
  const [selectedPartnerId, setSelectedPartnerId] = useState<number | null>(null);
  const [selectedPartnerName, setSelectedPartnerName] = useState<string>('');
  
  // Tin nhắn history + real-time
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  
  // Input message
  const [inputMessage, setInputMessage] = useState('');
  
  // Ref để auto-scroll
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // WebSocket hook
  const { connected, messages: wsMessages, sendMessage, clearMessages } = useWebSocket(currentUserId);

  // Lấy currentUserId từ users list (tạm thời)
  useEffect(() => {
    const username = localStorage.getItem('user');
    if (username) {
      try {
        const user = JSON.parse(username);
        // Fetch user ID từ API
        userApi.getAll().then(res => {
          const currentUser = res.data.data.find(u => u.username === user.username);
          if (currentUser) {
            setCurrentUserId(currentUser.id);
          }
          // Lọc users khác để hiển thị
          setUsers(res.data.data.filter(u => u.username !== user.username));
        });
      } catch (e) {
        console.error('Error parsing user:', e);
      }
    }
  }, []);

  // Load conversations khi có userId
  useEffect(() => {
    if (currentUserId) {
      loadConversations();
    }
  }, [currentUserId]);

  // Merge WebSocket messages vào chat history
  useEffect(() => {
    if (wsMessages.length > 0) {
      const lastMessage = wsMessages[wsMessages.length - 1];
      
      // Chỉ add nếu message thuộc conversation đang active
      if (selectedPartnerId && 
          (lastMessage.senderId === selectedPartnerId || 
           lastMessage.receiverId === selectedPartnerId)) {
        setChatHistory(prev => [...prev, lastMessage]);
      }
      
      // Refresh conversations để update lastMessage
      loadConversations();
    }
  }, [wsMessages, selectedPartnerId]);

  // Auto-scroll khi có tin nhắn mới
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const loadConversations = async () => {
    try {
      const res = await chatApi.getConversations();
      setConversations(res.data.data || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const selectConversation = async (partnerId: number, partnerName: string) => {
    setSelectedPartnerId(partnerId);
    setSelectedPartnerName(partnerName);
    clearMessages();
    
    // Load chat history
    try {
      const res = await chatApi.getHistory(partnerId);
      setChatHistory(res.data.data || []);
    } catch (error) {
      console.error('Error loading chat history:', error);
      setChatHistory([]);
    }
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !selectedPartnerId) return;
    
    sendMessage(selectedPartnerId, inputMessage.trim());
    setInputMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex h-[calc(100vh-100px)] bg-gray-100">
      {/* Sidebar - Conversations & Users */}
      <div className="w-80 bg-white border-r flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold">Messages</h2>
          <div className={`text-sm ${connected ? 'text-green-500' : 'text-red-500'}`}>
            {connected ? '● Connected' : '○ Disconnected'}
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length > 0 && (
            <div className="p-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase px-2 mb-2">
                Recent Chats
              </h3>
              {conversations.map((conv) => (
                <div
                  key={conv.partnerId}
                  onClick={() => selectConversation(conv.partnerId, conv.partnerName)}
                  className={`p-3 rounded-lg cursor-pointer mb-1 ${
                    selectedPartnerId === conv.partnerId 
                      ? 'bg-blue-100' 
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-medium">{conv.partnerName}</span>
                    {conv.unreadCount > 0 && (
                      <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">{conv.lastMessage}</p>
                </div>
              ))}
            </div>
          )}

          {/* Users List (để start chat mới) */}
          <div className="p-2 border-t">
            <h3 className="text-xs font-semibold text-gray-500 uppercase px-2 mb-2">
              All Users
            </h3>
            {users.map((user) => (
              <div
                key={user.id}
                onClick={() => selectConversation(user.id, user.fullName)}
                className={`p-3 rounded-lg cursor-pointer mb-1 ${
                  selectedPartnerId === user.id 
                    ? 'bg-blue-100' 
                    : 'hover:bg-gray-100'
                }`}
              >
                <span className="font-medium">{user.fullName}</span>
                <p className="text-sm text-gray-400">@{user.username}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedPartnerId ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white border-b">
              <h3 className="font-bold text-lg">{selectedPartnerName}</h3>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatHistory.map((msg, index) => (
                <div
                  key={msg.id || index}
                  className={`flex ${
                    msg.senderId === currentUserId ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      msg.senderId === currentUserId
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-800'
                    }`}
                  >
                    <p>{msg.content}</p>
                    <p className={`text-xs mt-1 ${
                      msg.senderId === currentUserId ? 'text-blue-100' : 'text-gray-400'
                    }`}>
                      {formatTime(msg.sentAt)}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!connected || !inputMessage.trim()}
                  className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          // No conversation selected
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-xl">Select a conversation to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
