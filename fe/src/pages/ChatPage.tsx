import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { chatApi, userApi } from '../services/api';
import { ChatMessage, Conversation, UserResponse } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export default function ChatPage() {
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<number | null>(null);
  const [selectedPartnerName, setSelectedPartnerName] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const selectedPartnerIdRef = useRef<number | null>(null);

  const handleNewMessage = useCallback((message: ChatMessage) => {
    const partnerId = selectedPartnerIdRef.current;
    if (partnerId && (message.senderId === partnerId || message.receiverId === partnerId)) {
      setChatHistory(prev => {
        const exists = prev.some(
          m =>
            m.id === message.id ||
            (m.content === message.content &&
              m.senderId === message.senderId &&
              m.sentAt === message.sentAt)
        );
        if (exists) return prev;
        return [...prev, message];
      });
    }
    loadConversations();
  }, []);

  // Callback khi tin nhắn được đọc
  const handleReadReceipt = useCallback((senderId: number) => {
    // Update UI để hiển thị "đã đọc" cho các tin nhắn
    setChatHistory(prev =>
      prev.map(msg => (msg.receiverId === senderId ? { ...msg, isRead: true } : msg))
    );
  }, []);

  const { connected, sendMessage, sendTyping, markAsRead, typingUser } = useWebSocket(
    currentUserId,
    currentUsername,
    handleNewMessage,
    handleReadReceipt
  );

  console.log('check in page', { typingUser });

  useEffect(() => {
    selectedPartnerIdRef.current = selectedPartnerId;
  }, [selectedPartnerId]);

  useEffect(() => {
    const username = localStorage.getItem('user');
    console.log('🔍 Loading current user from localStorage:', username);
    if (username) {
      try {
        const user = JSON.parse(username);
        console.log('🔍 Parsed user:', user);
        setCurrentUsername(user.username); // Set username để subscribe topic
        userApi.getAll().then(res => {
          console.log('🔍 All users from API:', res.data.data);
          const currentUser = res.data.data.find(u => u.username === user.username);
          console.log('🔍 Current user found:', currentUser);
          if (currentUser) {
            console.log('✅ Setting currentUserId:', currentUser.id);
            setCurrentUserId(currentUser.id);
          } else {
            console.error('❌ Current user not found in users list!');
          }
          setUsers(res.data.data.filter(u => u.username !== user.username));
        });
      } catch (e) {
        console.error('Error parsing user:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (currentUserId) loadConversations();
  }, [currentUserId]);

  // Scroll to bottom khi chatHistory thay đổi hoặc có tin nhắn mới
  const scrollToBottom = useCallback(() => {
    // Delay nhỏ để đảm bảo DOM đã render xong
    setTimeout(() => {
      if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
          viewport.scrollTop = viewport.scrollHeight;
        }
      }
      // Fallback với messagesEndRef
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }, []);

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

    try {
      const res = await chatApi.getHistory(partnerId);
      setChatHistory(res.data.data || []);

      // Scroll xuống cuối sau khi load history
      setTimeout(() => scrollToBottom(), 100);

      markAsRead(partnerId);
      await chatApi.markAsRead(partnerId);
      loadConversations();
    } catch (error) {
      console.error('Error loading chat history:', error);
      setChatHistory([]);
    }
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !selectedPartnerId || !currentUserId) return;

    const messageContent = inputMessage.trim();
    const optimisticMessage: ChatMessage = {
      senderId: currentUserId,
      receiverId: selectedPartnerId,
      content: messageContent,
      type: 'CHAT',
      sentAt: new Date().toISOString(),
      isRead: false,
    };

    setChatHistory(prev => [...prev, optimisticMessage]);
    sendMessage(selectedPartnerId, messageContent);
    setInputMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Gọi sendTyping khi user đang gõ
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
    if (selectedPartnerId && e.target.value.trim()) {
      sendTyping(selectedPartnerId);
    }
  };

  // Kiểm tra xem partner có đang typing không
  // Phải kiểm tra typingUser !== null để tránh null === null = true
  const isPartnerTyping = useMemo(() => {
    return typingUser !== null && typingUser === selectedPartnerId;
  }, [typingUser, selectedPartnerId]);

  // Scroll xuống khi có tin nhắn mới hoặc khi partner đang gõ
  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isPartnerTyping, scrollToBottom]);

  console.log('check in typing123', { isPartnerTyping, typingUser, selectedPartnerId });

  // Debug log
  useEffect(() => {
    // setIsPartnerTyping(typingUser !== null && typingUser === selectedPartnerId)
  }, [typingUser, selectedPartnerId]);

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-[calc(100vh-56px)] bg-slate-50 dark:bg-slate-900">
      <div className="container max-w-7xl h-full py-4">
        <Card className="h-full flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-80 border-r flex flex-col bg-muted/30">
            {/* Sidebar Header */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Messages</h2>
                <Badge variant={connected ? 'default' : 'destructive'} className="text-xs">
                  {connected ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5 animate-pulse" />
                      Online
                    </>
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 mr-1.5" />
                      Offline
                    </>
                  )}
                </Badge>
              </div>
            </div>

            <ScrollArea className="flex-1">
              {/* Conversations */}
              {conversations.length > 0 && (
                <div className="p-2">
                  <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Đoạn chat gần đây
                  </p>
                  {conversations.map(conv => (
                    <button
                      key={conv.partnerId}
                      onClick={() => selectConversation(conv.partnerId, conv.partnerName)}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors',
                        selectedPartnerId === conv.partnerId
                          ? 'bg-primary/10 border border-primary/20'
                          : 'hover:bg-muted'
                      )}
                    >
                      <Avatar className="h-10 w-10 border">
                        <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground">
                          {conv.partnerName?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium truncate">{conv.partnerName}</span>
                          {conv.unreadCount > 0 && (
                            <Badge className="h-5 min-w-[20px] text-xs">{conv.unreadCount}</Badge>
                          )}
                        </div>
                        {typingUser === conv.partnerId ? (
                          <div className="flex items-center gap-1 text-sm text-primary">
                            <span
                              className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"
                              style={{ animationDelay: '0ms' }}
                            />
                            <span
                              className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"
                              style={{ animationDelay: '150ms' }}
                            />
                            <span
                              className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"
                              style={{ animationDelay: '300ms' }}
                            />
                            <span className="ml-1 italic">đang nhập...</span>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground truncate">
                            {conv.lastMessage}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <Separator className="my-2" />

              {/* All Users */}
              <div className="p-2">
                <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Tất cả người dùng
                </p>
                {users.map(user => (
                  <button
                    key={user.id}
                    onClick={() => selectConversation(user.id, user.fullName)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors',
                      selectedPartnerId === user.id
                        ? 'bg-primary/10 border border-primary/20'
                        : 'hover:bg-muted'
                    )}
                  >
                    <Avatar className="h-10 w-10 border">
                      <AvatarFallback className="bg-gradient-to-br from-slate-400 to-slate-500 text-white">
                        {user.fullName?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium truncate block">{user.fullName}</span>
                      <span className="text-sm text-muted-foreground">@{user.username}</span>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedPartnerId ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b flex items-center gap-3 bg-background">
                  <Avatar className="h-10 w-10 border">
                    <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground">
                      {selectedPartnerName?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{selectedPartnerName}</h3>
                    <p className="text-xs text-muted-foreground">
                      {connected ? 'Đang kết nối' : 'Không kết nối'}
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                  <div className="space-y-3">
                    {chatHistory.map((msg, index) => {
                      const isSender = msg.senderId === currentUserId;
                      return (
                        <div
                          key={msg.id || `msg-${index}-${msg.sentAt}`}
                          className={cn('flex', isSender ? 'justify-end' : 'justify-start')}
                        >
                          <div
                            className={cn(
                              'max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm',
                              isSender
                                ? 'bg-primary text-primary-foreground rounded-br-md'
                                : 'bg-muted rounded-bl-md'
                            )}
                          >
                            <p className="text-sm leading-relaxed">{msg.content}</p>
                            <p
                              className={cn(
                                'text-[10px] mt-1 flex items-center gap-1',
                                isSender
                                  ? 'text-primary-foreground/70 justify-end'
                                  : 'text-muted-foreground'
                              )}
                            >
                              {formatTime(msg.sentAt)}
                              {isSender && <span>{msg.isRead ? '✓✓' : '✓'}</span>}
                            </p>
                          </div>
                        </div>
                      );
                    })}

                    {/* Typing Indicator */}
                    {isPartnerTyping && (
                      <div className="flex justify-start items-center gap-2">
                        <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2.5 shadow-sm flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <span
                              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: '0ms' }}
                            />
                            <span
                              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: '150ms' }}
                            />
                            <span
                              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                              style={{ animationDelay: '300ms' }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground ml-1">
                            {selectedPartnerName} đang gõ...
                          </span>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="p-4 border-t bg-background">
                  <div className="flex gap-2">
                    <Input
                      value={inputMessage}
                      onChange={handleInputChange}
                      onKeyPress={handleKeyPress}
                      placeholder="Nhập tin nhắn..."
                      className="flex-1"
                      disabled={!connected}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!connected || !inputMessage.trim()}
                      className="gap-2"
                    >
                      <SendIcon className="h-4 w-4" />
                      <span className="hidden sm:inline">Gửi</span>
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                <div className="rounded-full bg-muted p-6 mb-4">
                  <MessageCircleIcon className="h-12 w-12" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Chọn đoạn chat</h3>
                <p className="text-center max-w-sm">
                  Chọn một người dùng từ danh sách bên trái để bắt đầu trò chuyện
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

// Icons
const SendIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
    />
  </svg>
);

const MessageCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
    />
  </svg>
);
