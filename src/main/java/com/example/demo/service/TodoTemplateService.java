package com.example.demo.service;

import com.example.demo.dto.todo.TodoTemplateDTO;
import com.example.demo.dto.todo.TodoTemplateRequest;
import com.example.demo.entity.TodoEntity;
import com.example.demo.entity.TodoTemplateEntity;
import com.example.demo.entity.UserEntity;
import com.example.demo.repository.TodoTemplateRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TodoTemplateService {

    private final TodoTemplateRepository templateRepository;
    private final UserRepository userRepository;

    private static final int MAX_TEMPLATES_PER_USER = 20;

    /**
     * Lấy tất cả templates của user
     */
    public List<TodoTemplateDTO> getTemplatesByUser(String username) {
        log.info("=== getTemplatesByUser START ===");
        log.info("Username: {}", username);
        
        UserEntity user = getUserByUsername(username);
        log.info("Found user: id={}, username={}", user.getId(), user.getUsername());
        
        List<TodoTemplateEntity> entities = templateRepository.findByUserIdOrderBySortOrderAsc(user.getId());
        log.info("Found {} templates from DB", entities.size());
        
        for (TodoTemplateEntity entity : entities) {
            log.info("  Template: id={}, title='{}', icon='{}', priority={}, sortOrder={}", 
                entity.getId(), entity.getTitle(), entity.getIcon(), entity.getPriority(), entity.getSortOrder());
        }
        
        List<TodoTemplateDTO> result = entities.stream()
                .map(TodoTemplateDTO::fromEntity)
                .collect(Collectors.toList());
        
        log.info("Returning {} DTOs", result.size());
        log.info("Result: {}", result);
        log.info("=== getTemplatesByUser END ===");
        log.info("Result: {}", result);
        return result;
    }

    /**
     * Tạo template mới
     */
    @Transactional
    public TodoTemplateDTO createTemplate(String username, TodoTemplateRequest request) {
        UserEntity user = getUserByUsername(username);
        
        // Kiểm tra giới hạn số templates
        Long count = templateRepository.countByUserId(user.getId());
        if (count >= MAX_TEMPLATES_PER_USER) {
            throw new RuntimeException("Đã đạt giới hạn " + MAX_TEMPLATES_PER_USER + " templates");
        }

        // Nếu không có sortOrder, set là max + 1
        Integer sortOrder = request.getSortOrder();
        if (sortOrder == null) {
            sortOrder = count.intValue();
        }

        TodoTemplateEntity template = TodoTemplateEntity.builder()
                .userId(user.getId())
                .title(request.getTitle())
                .icon(request.getIcon())
                .priority(parsePriority(request.getPriority()))
                .sortOrder(sortOrder)
                .build();

        template = templateRepository.save(template);
        log.info("Created template '{}' for user {}", template.getTitle(), username);
        return TodoTemplateDTO.fromEntity(template);
    }

    /**
     * Cập nhật template
     */
    @Transactional
    public TodoTemplateDTO updateTemplate(String username, Long templateId, TodoTemplateRequest request) {
        UserEntity user = getUserByUsername(username);
        TodoTemplateEntity template = getTemplateByIdAndUser(templateId, user.getId());

        template.setTitle(request.getTitle());
        template.setIcon(request.getIcon());
        template.setPriority(parsePriority(request.getPriority()));
        if (request.getSortOrder() != null) {
            template.setSortOrder(request.getSortOrder());
        }

        template = templateRepository.save(template);
        log.info("Updated template {} for user {}", templateId, username);
        
        return TodoTemplateDTO.fromEntity(template);
    }

    /**
     * Xóa template
     */
    @Transactional
    public void deleteTemplate(String username, Long templateId) {
        UserEntity user = getUserByUsername(username);
        TodoTemplateEntity template = getTemplateByIdAndUser(templateId, user.getId());
        
        templateRepository.delete(template);
        log.info("Deleted template {} for user {}", templateId, username);
    }

    /**
     * Cập nhật thứ tự các templates (reorder)
     */
    @Transactional
    public List<TodoTemplateDTO> reorderTemplates(String username, List<Long> templateIds) {
        UserEntity user = getUserByUsername(username);
        
        for (int i = 0; i < templateIds.size(); i++) {
            TodoTemplateEntity template = getTemplateByIdAndUser(templateIds.get(i), user.getId());
            template.setSortOrder(i);
            templateRepository.save(template);
        }
        
        log.info("Reordered {} templates for user {}", templateIds.size(), username);
        return getTemplatesByUser(username);
    }

    // ===== Helper methods =====

    private UserEntity getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));
    }

    private TodoTemplateEntity getTemplateByIdAndUser(Long templateId, Long userId) {
        return templateRepository.findById(templateId)
                .filter(t -> t.getUserId().equals(userId))
                .orElseThrow(() -> new RuntimeException("Template not found or access denied"));
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
