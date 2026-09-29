package com.example.demo.service;

import com.example.demo.dto.todo.TodoDTO;
import com.example.demo.dto.todo.TodoRequest;
import com.example.demo.dto.todo.TodosByDateDTO;
import com.example.demo.entity.TodoEntity;
import com.example.demo.entity.UserEntity;
import com.example.demo.repository.TodoRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service xử lý business logic cho Todo
 */
@Service
@RequiredArgsConstructor
public class TodoService {

    private final TodoRepository todoRepository;
    private final UserRepository userRepository;

    /**
     * Tạo todo mới
     */
    @Transactional
    public TodoDTO createTodo(String username, TodoRequest request) {
        UserEntity user = getUserByUsername(username);

        TodoEntity.Priority priority = parsePriority(request.getPriority());

        TodoEntity todo = TodoEntity.builder()
                .userId(user.getId())
                .title(request.getTitle())
                .description(request.getDescription())
                .dueDate(request.getDueDate())
                .priority(priority)
                .completed(false)
                .build();

        TodoEntity saved = todoRepository.save(todo);
        return TodoDTO.fromEntity(saved);
    }

    /**
     * Lấy tất cả todos của user
     */
    @Transactional(readOnly = true)
    public List<TodoDTO> getAllTodos(String username) {
        UserEntity user = getUserByUsername(username);
        List<TodoEntity> todos = todoRepository.findByUserIdOrderByDueDateAscPriorityDesc(user.getId());
        return todos.stream().map(TodoDTO::fromEntity).toList();
    }

    /**
     * Lấy todos theo ngày cụ thể
     */
    @Transactional(readOnly = true)
    public List<TodoDTO> getTodosByDate(String username, LocalDate date) {
        UserEntity user = getUserByUsername(username);
        List<TodoEntity> todos = todoRepository.findByUserIdAndDueDateOrderByPriorityDescCreatedAtAsc(user.getId(), date);
        return todos.stream().map(TodoDTO::fromEntity).toList();
    }

    /**
     * Lấy todos grouped by date trong khoảng ngày
     */
    @Transactional(readOnly = true)
    public List<TodosByDateDTO> getTodosGroupedByDate(String username, LocalDate startDate, LocalDate endDate) {
        UserEntity user = getUserByUsername(username);
        List<TodoEntity> todos = todoRepository.findByUserIdAndDateRange(user.getId(), startDate, endDate);

        // Group by date
        Map<LocalDate, List<TodoEntity>> groupedByDate = todos.stream()
                .collect(Collectors.groupingBy(TodoEntity::getDueDate));

        return groupedByDate.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> {
                    LocalDate date = entry.getKey();
                    List<TodoEntity> todosForDate = entry.getValue();
                    long completed = todosForDate.stream().filter(TodoEntity::getCompleted).count();
                    
                    return TodosByDateDTO.builder()
                            .date(date)
                            .dayOfWeek(date.getDayOfWeek().name())
                            .totalCount((long) todosForDate.size())
                            .completedCount(completed)
                            .pendingCount((long) todosForDate.size() - completed)
                            .todos(todosForDate.stream().map(TodoDTO::fromEntity).toList())
                            .build();
                })
                .toList();
    }

    /**
     * Lấy todo by ID
     */
    @Transactional(readOnly = true)
    public TodoDTO getTodoById(String username, Long todoId) {
        UserEntity user = getUserByUsername(username);
        TodoEntity todo = todoRepository.findById(todoId)
                .orElseThrow(() -> new RuntimeException("Todo not found: " + todoId));

        // Check ownership
        if (!todo.getUserId().equals(user.getId())) {
            throw new RuntimeException("Access denied");
        }

        return TodoDTO.fromEntity(todo);
    }

    /**
     * Cập nhật todo
     */
    @Transactional
    public TodoDTO updateTodo(String username, Long todoId, TodoRequest request) {
        UserEntity user = getUserByUsername(username);
        TodoEntity todo = todoRepository.findById(todoId)
                .orElseThrow(() -> new RuntimeException("Todo not found: " + todoId));

        // Check ownership
        if (!todo.getUserId().equals(user.getId())) {
            throw new RuntimeException("Access denied");
        }

        todo.setTitle(request.getTitle());
        todo.setDescription(request.getDescription());
        todo.setDueDate(request.getDueDate());
        todo.setPriority(parsePriority(request.getPriority()));

        TodoEntity saved = todoRepository.save(todo);
        return TodoDTO.fromEntity(saved);
    }

    /**
     * Toggle completed status
     */
    @Transactional
    public TodoDTO toggleCompleted(String username, Long todoId) {
        UserEntity user = getUserByUsername(username);
        TodoEntity todo = todoRepository.findById(todoId)
                .orElseThrow(() -> new RuntimeException("Todo not found: " + todoId));

        // Check ownership
        if (!todo.getUserId().equals(user.getId())) {
            throw new RuntimeException("Access denied");
        }

        todo.setCompleted(!todo.getCompleted());
        TodoEntity saved = todoRepository.save(todo);
        return TodoDTO.fromEntity(saved);
    }

    /**
     * Xóa todo
     */
    @Transactional
    public void deleteTodo(String username, Long todoId) {
        UserEntity user = getUserByUsername(username);
        TodoEntity todo = todoRepository.findById(todoId)
                .orElseThrow(() -> new RuntimeException("Todo not found: " + todoId));

        // Check ownership
        if (!todo.getUserId().equals(user.getId())) {
            throw new RuntimeException("Access denied");
        }

        todoRepository.delete(todo);
    }

    /**
     * Lấy todos quá hạn
     */
    @Transactional(readOnly = true)
    public List<TodoDTO> getOverdueTodos(String username) {
        UserEntity user = getUserByUsername(username);
        List<TodoEntity> todos = todoRepository.findOverdueTodos(user.getId(), LocalDate.now());
        return todos.stream().map(TodoDTO::fromEntity).toList();
    }

    /**
     * Lấy todos chưa hoàn thành
     */
    @Transactional(readOnly = true)
    public List<TodoDTO> getPendingTodos(String username) {
        UserEntity user = getUserByUsername(username);
        List<TodoEntity> todos = todoRepository.findByUserIdAndCompletedFalseOrderByDueDateAscPriorityDesc(user.getId());
        return todos.stream().map(TodoDTO::fromEntity).toList();
    }

    // ==================== Helper Methods ====================

    private UserEntity getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));
    }

    private TodoEntity.Priority parsePriority(String priority) {
        if (priority == null || priority.isBlank()) {
            return TodoEntity.Priority.MEDIUM;
        }
        try {
            return TodoEntity.Priority.valueOf(priority.toUpperCase());
        } catch (IllegalArgumentException e) {
            return TodoEntity.Priority.MEDIUM;
        }
    }
}
