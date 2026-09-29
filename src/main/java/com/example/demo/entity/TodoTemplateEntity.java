package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entity lưu các tiêu đề mặc định (template) cho Todo
 * Mỗi user có danh sách templates riêng
 */
@Entity
@Table(name = "todo_templates", indexes = {
    @Index(name = "idx_template_user_id", columnList = "user_id")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TodoTemplateEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(length = 10)
    private String icon;  // Emoji icon

    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    @Builder.Default
    private TodoEntity.Priority priority = TodoEntity.Priority.MEDIUM;

    @Column(name = "sort_order")
    @Builder.Default
    private Integer sortOrder = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
