package com.example.demo.dto.chat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO cho danh sách cuộc hội thoại (hiển thị ở sidebar)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationDTO {

    /**
     * ID của người chat cùng
     */
    private Long partnerId;
    
    /**
     * Tên người chat cùng
     */
    private String partnerName;
    
    /**
     * Tin nhắn cuối cùng (preview)
     */
    private String lastMessage;
    
    /**
     * Thời gian tin nhắn cuối
     */
    private LocalDateTime lastMessageAt;
    
    /**
     * Số tin chưa đọc
     */
    private Long unreadCount;
}
