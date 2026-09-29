// ==================== API Response Types ====================

export interface ApiResponse<T> {
  statusCode: number;
  code: string;
  message: string;
  data: T;
}

// ==================== Auth Types ====================

export interface AuthRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  fullName: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  username: string;
  fullName: string;
  tokenType: string;
  expiresIn: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// ==================== User Types ====================

export interface User {
  id: number;
  username: string;
  fullName: string;
}

export interface UserRequest {
  username: string;
  fullName: string;
}

export interface UserResponse {
  id: number;
  username: string;
  fullName: string;
}

// ==================== Auth Context Types ====================

export interface AuthUser {
  username: string;
  fullName: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<ApiResponse<AuthResponse>>;
  register: (
    username: string,
    password: string,
    fullName: string
  ) => Promise<ApiResponse<AuthResponse>>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  isAuthenticated: boolean;
}

// ==================== Post Types ====================

export interface Post {
  userId: number;
  id: number;
  title: string;
  body: string;
}

export interface PostRequest {
  userId: number;
  title: string;
  body: string;
}

// ==================== Chat Types ====================

export type MessageType = 'CHAT' | 'JOIN' | 'LEAVE' | 'TYPING' | 'READ';

export interface ChatMessage {
  id?: number;
  senderId: number;
  senderName?: string;
  receiverId: number;
  receiverName?: string;
  content: string;
  sentAt?: string;
  isRead?: boolean;
  type: MessageType;
}

export interface Conversation {
  partnerId: number;
  partnerName: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

// ==================== Todo Types ====================

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Todo {
  id: number;
  userId: number;
  title: string;
  description?: string;
  dueDate: string; // ISO date string: "2024-01-15"
  completed: boolean;
  priority: Priority;
  createdAt: string;
  updatedAt: string;
}

export interface TodoRequest {
  title: string;
  description?: string;
  dueDate: string;
  priority?: Priority;
}

export interface TodosByDate {
  date: string;
  dayOfWeek: string;
  totalCount: number;
  completedCount: number;
  pendingCount: number;
  todos: Todo[];
}

// ==================== Todo Template Types ====================

export interface TodoTemplate {
  id: number;
  title: string;
  icon?: string;
  priority: Priority;
  sortOrder: number;
}

export interface TodoTemplateRequest {
  title: string;
  icon?: string;
  priority?: Priority;
  sortOrder?: number;
}
