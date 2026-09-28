package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entity = đại diện cho 1 table trong database
 * Mỗi instance của UserEntity = 1 row trong table "users"
 */
@Entity                         // Đánh dấu đây là JPA Entity
@Table(name = "users")          // Tên table trong database
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserEntity {

    @Id                                              // Primary key
    @GeneratedValue(strategy = GenerationType.IDENTITY)  // Auto increment
    private Long id;

    @Column(nullable = false, unique = true, length = 50)  // NOT NULL, UNIQUE
    private String username;

    @Column(nullable = false)  // Password - sẽ lưu dạng hash (BCrypt)
    private String password;

    @Column(name = "full_name", nullable = false, length = 100)  // Tên column khác tên field
    private String fullName;

    @Column(unique = true, length = 100)
    private String email;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * Lifecycle callback - tự động set trước khi INSERT
     */
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * Lifecycle callback - tự động set trước khi UPDATE
     */
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
