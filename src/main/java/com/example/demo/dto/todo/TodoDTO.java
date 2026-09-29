package com.example.demo.dto.todo;

import com.example.demo.entity.TodoEntity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO để trả về Todo cho client
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TodoDTO {

    private Long id;
    private Long userId;
    private String title;
    private String description;
    private LocalDate dueDate;
    private Boolean completed;
    private String priority;  // LOW, MEDIUM, HIGH
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * Convert từ Entity sang DTO
     */
    public static TodoDTO fromEntity(TodoEntity entity) {
        return TodoDTO.builder()
                .id(entity.getId())
                .userId(entity.getUserId())
                .title(entity.getTitle())
                .description(entity.getDescription())
                .dueDate(entity.getDueDate())
                .completed(entity.getCompleted())
                .priority(entity.getPriority().name())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
