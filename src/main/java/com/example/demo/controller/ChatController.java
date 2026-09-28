package com.example.demo.controller;

import com.example.demo.dto.ApiResponse;
import com.example.demo.dto.chat.ChatMessageDTO;
import com.example.demo.dto.chat.ConversationDTO;
import com.example.demo.service.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
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
@RequiredArgsConstructor
public class ChatController {

    private static final Logger log = LoggerFactory.getLogger(ChatController.class);

    /**
     * SimpMessagingTemplate - dùng để gửi message đến clients
     * Giống như socket.emit() trong Socket.IO
     */
    private final SimpMessagingTemplate messagingTemplate;
    private final ChatService chatService;

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

        // Forward tin nhắn đến receiver (private message)
        // Receiver đã subscribe: /user/{userId}/queue/messages
        // convertAndSendToUser sẽ tự động thêm prefix /user/{userId}
        messagingTemplate.convertAndSendToUser(
            String.valueOf(savedMessage.getReceiverId()),
            "/queue/messages",
            savedMessage
        );

        // Cũng gửi lại cho sender (để confirm đã gửi thành công)
        messagingTemplate.convertAndSendToUser(
            String.valueOf(savedMessage.getSenderId()),
            "/queue/messages",
            savedMessage
        );

        log.info("Message forwarded to user {}", savedMessage.getReceiverId());
    }

    /**
     * Xử lý typing indicator
     * Client gửi đến: /app/chat.typing
     */
    @MessageMapping("/chat.typing")
    public void handleTyping(@Payload ChatMessageDTO message, Principal principal) {
        // Forward typing status đến receiver
        message.setType(ChatMessageDTO.MessageType.TYPING);
        message.setSenderName(principal.getName());

        messagingTemplate.convertAndSendToUser(
            String.valueOf(message.getReceiverId()),
            "/queue/typing",
            message
        );
    }

    /**
     * Đánh dấu tin nhắn đã đọc
     * Client gửi đến: /app/chat.read
     */
    @MessageMapping("/chat.read")
    public void markAsRead(@Payload ChatMessageDTO message, Principal principal) {
        chatService.markMessagesAsRead(principal.getName(), message.getSenderId());

        // Notify sender rằng tin đã được đọc
        ChatMessageDTO readNotification = ChatMessageDTO.builder()
                .senderId(message.getSenderId())
                .type(ChatMessageDTO.MessageType.READ)
                .build();

        messagingTemplate.convertAndSendToUser(
            String.valueOf(message.getSenderId()),
            "/queue/read",
            readNotification
        );
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
