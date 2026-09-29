package com.example.demo.controller;

import com.example.demo.dto.ApiResponse;
import com.example.demo.dto.todo.TodoDTO;
import com.example.demo.dto.todo.TodoRequest;
import com.example.demo.dto.todo.TodosByDateDTO;
import com.example.demo.service.TodoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDate;
import java.util.List;

/**
 * REST Controller cho Todo CRUD operations
 */
@RestController
@RequestMapping("/api/todos")
@RequiredArgsConstructor
public class TodoController {

    private final TodoService todoService;

    /**
     * Tạo todo mới
     * POST /api/todos
     */
    @PostMapping
    public ResponseEntity<ApiResponse<TodoDTO>> createTodo(
            @Valid @RequestBody TodoRequest request,
            Principal principal) {

        TodoDTO todo = todoService.createTodo(principal.getName(), request);
        return ResponseEntity.ok(ApiResponse.<TodoDTO>builder()
                .statusCode(201)
                .code("CREATED")
                .message("Todo created successfully")
                .data(todo)
                .build());
    }

    /**
     * Lấy tất cả todos của user
     * GET /api/todos
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<TodoDTO>>> getAllTodos(Principal principal) {
        List<TodoDTO> todos = todoService.getAllTodos(principal.getName());
        return ResponseEntity.ok(ApiResponse.success(todos));
    }

    /**
     * Lấy todos theo ngày cụ thể
     * GET /api/todos/date/{date}
     */
    @GetMapping("/date/{date}")
    public ResponseEntity<ApiResponse<List<TodoDTO>>> getTodosByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            Principal principal) {

        List<TodoDTO> todos = todoService.getTodosByDate(principal.getName(), date);
        return ResponseEntity.ok(ApiResponse.success(todos));
    }

    /**
     * Lấy todos grouped by date trong khoảng ngày
     * GET /api/todos/range?startDate=2024-01-01&endDate=2024-01-31
     */
    @GetMapping("/range")
    public ResponseEntity<ApiResponse<List<TodosByDateDTO>>> getTodosByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            Principal principal) {

        List<TodosByDateDTO> todos = todoService.getTodosGroupedByDate(principal.getName(), startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(todos));
    }

    /**
     * Lấy todos hôm nay
     * GET /api/todos/today
     */
    @GetMapping("/today")
    public ResponseEntity<ApiResponse<List<TodoDTO>>> getTodayTodos(Principal principal) {
        List<TodoDTO> todos = todoService.getTodosByDate(principal.getName(), LocalDate.now());
        return ResponseEntity.ok(ApiResponse.success(todos));
    }

    /**
     * Lấy todos quá hạn
     * GET /api/todos/overdue
     */
    @GetMapping("/overdue")
    public ResponseEntity<ApiResponse<List<TodoDTO>>> getOverdueTodos(Principal principal) {
        List<TodoDTO> todos = todoService.getOverdueTodos(principal.getName());
        return ResponseEntity.ok(ApiResponse.success(todos));
    }

    /**
     * Lấy todos chưa hoàn thành
     * GET /api/todos/pending
     */
    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<List<TodoDTO>>> getPendingTodos(Principal principal) {
        List<TodoDTO> todos = todoService.getPendingTodos(principal.getName());
        return ResponseEntity.ok(ApiResponse.success(todos));
    }

    /**
     * Lấy todo by ID
     * GET /api/todos/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TodoDTO>> getTodoById(
            @PathVariable Long id,
            Principal principal) {

        TodoDTO todo = todoService.getTodoById(principal.getName(), id);
        return ResponseEntity.ok(ApiResponse.success(todo));
    }

    /**
     * Cập nhật todo
     * PUT /api/todos/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TodoDTO>> updateTodo(
            @PathVariable Long id,
            @Valid @RequestBody TodoRequest request,
            Principal principal) {

        TodoDTO todo = todoService.updateTodo(principal.getName(), id, request);
        return ResponseEntity.ok(ApiResponse.<TodoDTO>builder()
                .statusCode(200)
                .code("SUCCESS")
                .message("Todo updated successfully")
                .data(todo)
                .build());
    }

    /**
     * Toggle completed status
     * PATCH /api/todos/{id}/toggle
     */
    @PatchMapping("/{id}/toggle")
    public ResponseEntity<ApiResponse<TodoDTO>> toggleCompleted(
            @PathVariable Long id,
            Principal principal) {

        TodoDTO todo = todoService.toggleCompleted(principal.getName(), id);
        return ResponseEntity.ok(ApiResponse.<TodoDTO>builder()
                .statusCode(200)
                .code("SUCCESS")
                .message("Todo status toggled")
                .data(todo)
                .build());
    }

    /**
     * Xóa todo
     * DELETE /api/todos/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTodo(
            @PathVariable Long id,
            Principal principal) {

        todoService.deleteTodo(principal.getName(), id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .statusCode(200)
                .code("SUCCESS")
                .message("Todo deleted successfully")
                .build());
    }
}
