package com.example.demo.dto.todo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * DTO để group todos theo ngày
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TodosByDateDTO {

    private LocalDate date;
    private String dayOfWeek;  // MONDAY, TUESDAY, etc.
    private Long totalCount;
    private Long completedCount;
    private Long pendingCount;
    private List<TodoDTO> todos;
}
