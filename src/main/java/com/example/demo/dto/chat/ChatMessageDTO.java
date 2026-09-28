package com.example.demo.dto.chat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO cho tin nhắn chat - dùng để gửi/nhận qua WebSocket
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageDTO {

    private Long id;
    
    /**
     * ID người gửi
     */
    private Long senderId;
    
    /**
     * Tên người gửi (để hiển thị trên UI)
     */
    private String senderName;
    
    /**
     * ID người nhận
     */
    private Long receiverId;
    
    /**
     * Tên người nhận
     */
    private String receiverName;
    
    /**
     * Nội dung tin nhắn
     */
    private String content;
    
    /**
     * Thời gian gửi
     */
    private LocalDateTime sentAt;
    
    /**
     * Đã đọc chưa
     */
    private Boolean isRead;
    
    /**
     * Loại tin nhắn: CHAT, JOIN, LEAVE, TYPING
     */
    private MessageType type;

    /**
     * Enum định nghĩa loại tin nhắn
     */
    public enum MessageType {
        CHAT,       // Tin nhắn bình thường
        JOIN,       // User vào phòng chat
        LEAVE,      // User rời phòng chat
        TYPING,     // User đang gõ
        READ        // Đánh dấu đã đọc
    }
}
