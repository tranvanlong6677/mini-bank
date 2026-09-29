package com.example.demo.dto.todo;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Request DTO để tạo/cập nhật Todo
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TodoRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title must be less than 255 characters")
    private String title;

    @Size(max = 2000, message = "Description must be less than 2000 characters")
    private String description;

    @NotNull(message = "Due date is required")
    private LocalDate dueDate;

    /**
     * LOW, MEDIUM, HIGH - default MEDIUM nếu không truyền
     */
    private String priority;
}
