package com.example.demo.controller;

import com.example.demo.dto.ApiResponse;
import com.example.demo.dto.chat.ChatMessageDTO;
import com.example.demo.dto.chat.ConversationDTO;
import com.example.demo.service.ChatService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.user.SimpUserRegistry;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

/**
 * Controller xử lý chat messages
 * 
 * Có 2 loại endpoint:
 * 1. WebSocket endpoints (@MessageMapping) - cho real-time
 * 2. REST endpoints (@GetMapping, @PostMapping) - cho lấy history, conversations
 */
@Controller
public class ChatController {

    private static final Logger log = LoggerFactory.getLogger(ChatController.class);

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatService chatService;
    private final SimpUserRegistry userRegistry;

    public ChatController(SimpMessagingTemplate messagingTemplate, ChatService chatService, SimpUserRegistry userRegistry) {
        this.messagingTemplate = messagingTemplate;
        this.chatService = chatService;
        this.userRegistry = userRegistry;
    }

    // ==================== WEBSOCKET ENDPOINTS ====================

    /**
     * Nhận tin nhắn từ client và forward đến receiver
     * 
     * Client gửi đến: /app/chat.send
     * Server nhận ở đây và forward đến receiver
     * 
     * @param message Tin nhắn từ client
     * @param principal Thông tin user đã authenticate (từ JWT)
     */
    @MessageMapping("/chat.send")
    public void sendMessage(@Payload ChatMessageDTO message, Principal principal) {
        log.info("Received message from {}: {}", principal.getName(), message.getContent());

        // Lưu vào database
        ChatMessageDTO savedMessage = chatService.saveMessage(message, principal.getName());

        // Lấy username của receiver để gửi qua WebSocket
        String receiverUsername = chatService.getUsernameById(savedMessage.getReceiverId());

        // Chỉ forward tin nhắn đến receiver (không gửi lại cho sender)
        // Sender đã có optimistic update ở FE
        if (receiverUsername != null) {
            messagingTemplate.convertAndSendToUser(
                receiverUsername,
                "/queue/messages",
                savedMessage
            );
            log.info("Message forwarded to user: {}", receiverUsername);
        }
    }

    /**
     * Xử lý typing indicator
     * Client gửi đến: /app/chat.typing
     */
    @MessageMapping("/chat.typing")
    public void handleTyping(@Payload ChatMessageDTO message, Principal principal) {
        log.info("=== TYPING REQUEST ===");
        log.info("From principal: {}", principal.getName());
        log.info("To receiverId: {}", message.getReceiverId());
        
        // Forward typing status đến receiver
        message.setType(ChatMessageDTO.MessageType.TYPING);
        message.setSenderName(principal.getName());
        
        // Lấy senderId từ username
        Long senderId = chatService.getUserIdByUsername(principal.getName());
        log.info("Sender ID: {}", senderId);
        message.setSenderId(senderId);

        // Lấy username của receiver để gửi qua WebSocket
        String receiverUsername = chatService.getUsernameById(message.getReceiverId());
        log.info("Receiver username: {}", receiverUsername);
        
        // Log tất cả users đang connected
        log.info("📋 Connected users in registry: {}", 
            userRegistry.getUsers().stream()
                .map(user -> user.getName() + " (sessions: " + user.getSessions().size() + ")")
                .toList()
        );
        
        // Check sessions chi tiết của receiver
        var receiverUser = userRegistry.getUser(receiverUsername);
        if (receiverUser != null) {
            log.info("📋 Receiver '{}' has {} sessions:", receiverUsername, receiverUser.getSessions().size());
            receiverUser.getSessions().forEach(session -> {
                log.info("   - SessionId: {}, Subscriptions: {}", 
                    session.getId(),
                    session.getSubscriptions().stream()
                        .map(sub -> sub.getDestination())
                        .toList()
                );
            });
        } else {
            log.warn("❌ Receiver '{}' NOT found in registry!", receiverUsername);
        }
        
        if (receiverUsername != null && receiverUser != null) {
            // Thử gửi đến /topic với format username
            String topicDestination = "/topic/typing." + receiverUsername;
            log.info("📬 Sending typing to topic: {}", topicDestination);
            
            try {
                messagingTemplate.convertAndSend(topicDestination, message);
                log.info("✅ Typing indicator sent to topic");
            } catch (Exception e) {
                log.error("❌ Error sending typing: ", e);
            }
        } else {
            log.warn("❌ Could not find receiver with ID: {}", message.getReceiverId());
        }
    }

    /**
     * Đánh dấu tin nhắn đã đọc
     * Client gửi đến: /app/chat.read
     */
    @MessageMapping("/chat.read")
    public void markAsRead(@Payload ChatMessageDTO message, Principal principal) {
        chatService.markMessagesAsRead(principal.getName(), message.getSenderId());

        // Lấy username của sender để gửi notification
        String senderUsername = chatService.getUsernameById(message.getSenderId());

        // Notify sender rằng tin đã được đọc
        ChatMessageDTO readNotification = ChatMessageDTO.builder()
                .senderId(message.getSenderId())
                .type(ChatMessageDTO.MessageType.READ)
                .build();

        if (senderUsername != null) {
            // Gửi đến topic thay vì user queue
            String readTopic = "/topic/read." + senderUsername;
            messagingTemplate.convertAndSend(readTopic, readNotification);
            log.info("Read receipt sent to topic: {}", readTopic);
        }
    }

    // ==================== REST ENDPOINTS ====================

    /**
     * Lấy lịch sử chat với 1 user
     * GET /api/chat/history/{partnerId}
     */
    @GetMapping("/api/chat/history/{partnerId}")
    @ResponseBody
    public ResponseEntity<ApiResponse<List<ChatMessageDTO>>> getChatHistory(
            @PathVariable Long partnerId,
            Principal principal) {

        List<ChatMessageDTO> messages = chatService.getChatHistory(
            principal.getName(),
            partnerId
        );

        return ResponseEntity.ok(ApiResponse.success(messages));
    }

    /**
     * Lấy danh sách conversations (cho sidebar)
     * GET /api/chat/conversations
     */
    @GetMapping("/api/chat/conversations")
    @ResponseBody
    public ResponseEntity<ApiResponse<List<ConversationDTO>>> getConversations(Principal principal) {
        List<ConversationDTO> conversations = chatService.getConversations(principal.getName());

        return ResponseEntity.ok(ApiResponse.success(conversations));
    }

    /**
     * Đánh dấu đã đọc (REST alternative)
     * POST /api/chat/read/{senderId}
     */
    @PostMapping("/api/chat/read/{senderId}")
    @ResponseBody
    public ResponseEntity<ApiResponse<Void>> markAsReadRest(
            @PathVariable Long senderId,
            Principal principal) {

        chatService.markMessagesAsRead(principal.getName(), senderId);

        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .statusCode(200)
                .code("SUCCESS")
                .message("Marked as read")
                .build());
    }

    /**
     * Đếm tin nhắn chưa đọc từ 1 user
     * GET /api/chat/unread/{senderId}
     */
    @GetMapping("/api/chat/unread/{senderId}")
    @ResponseBody
    public ResponseEntity<ApiResponse<Long>> countUnread(
            @PathVariable Long senderId,
            Principal principal) {

        Long count = chatService.countUnreadMessages(principal.getName(), senderId);

        return ResponseEntity.ok(ApiResponse.success(count));
    }
}
