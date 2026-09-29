package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Entity lưu trữ Todo items của user
 * Mỗi todo có ngày due date để group theo ngày
 */
@Entity
@Table(name = "todos", indexes = {
    @Index(name = "idx_todo_user_id", columnList = "user_id"),
    @Index(name = "idx_todo_due_date", columnList = "due_date"),
    @Index(name = "idx_todo_user_due_date", columnList = "user_id, due_date")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TodoEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * ID của user sở hữu todo này
     */
    @Column(name = "user_id", nullable = false)
    private Long userId;

    /**
     * Tiêu đề todo
     */
    @Column(nullable = false, length = 255)
    private String title;

    /**
     * Mô tả chi tiết (optional)
     */
    @Column(columnDefinition = "TEXT")
    private String description;

    /**
     * Ngày cần hoàn thành - dùng để group todos theo ngày
     */
    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    /**
     * Đã hoàn thành chưa
     */
    @Column(nullable = false)
    @Builder.Default
    private Boolean completed = false;

    /**
     * Độ ưu tiên: LOW, MEDIUM, IMPORTANT, HIGH
     */
    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    @Builder.Default
    private Priority priority = Priority.MEDIUM;

    /**
     * Thời gian tạo
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Thời gian cập nhật
     */
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum Priority {
        LOW, MEDIUM, HIGH, CRITICAL
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
