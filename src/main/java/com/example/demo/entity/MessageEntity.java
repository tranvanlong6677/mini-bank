package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entity lưu trữ tin nhắn chat giữa 2 users
 * Mỗi row = 1 tin nhắn
 */
@Entity
@Table(name = "messages", indexes = {
    @Index(name = "idx_sender_receiver", columnList = "sender_id, receiver_id"),
    @Index(name = "idx_sent_at", columnList = "sent_at")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * ID của người gửi (reference đến UserEntity)
     */
    @Column(name = "sender_id", nullable = false)
    private Long senderId;

    /**
     * ID của người nhận
     */
    @Column(name = "receiver_id", nullable = false)
    private Long receiverId;

    /**
     * Nội dung tin nhắn
     * TEXT type cho phép lưu tin nhắn dài
     */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    /**
     * Thời gian gửi
     */
    @Column(name = "sent_at", nullable = false)
    private LocalDateTime sentAt;

    /**
     * Đã đọc chưa (cho tính năng seen)
     */
    @Column(name = "is_read")
    @Builder.Default
    private Boolean isRead = false;

    /**
     * Tự động set thời gian khi tạo mới
     */
    @PrePersist
    protected void onCreate() {
        if (this.sentAt == null) {
            this.sentAt = LocalDateTime.now();
        }
    }
}
