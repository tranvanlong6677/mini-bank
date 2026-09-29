package com.example.demo.controller;

import com.example.demo.dto.ApiResponse;
import com.example.demo.dto.todo.TodoTemplateDTO;
import com.example.demo.dto.todo.TodoTemplateRequest;
import com.example.demo.service.TodoTemplateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/todo-templates")
@RequiredArgsConstructor
@Slf4j
public class TodoTemplateController {

    private final TodoTemplateService templateService;

    /**
     * GET /api/todo-templates - Lấy tất cả templates của user hiện tại
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<TodoTemplateDTO>>> getMyTemplates(Authentication auth) {
        String username = auth.getName();
        log.debug("Getting templates for user: {}", username);
        return ResponseEntity.ok(ApiResponse.success(templateService.getTemplatesByUser(username)));
    }

    /**
     * POST /api/todo-templates - Tạo template mới
     */
    @PostMapping
    public ResponseEntity<ApiResponse<TodoTemplateDTO>> createTemplate(
            Authentication auth,
            @Valid @RequestBody TodoTemplateRequest request) {
        String username = auth.getName();
        log.debug("Creating template for user: {}", username);
        return ResponseEntity.ok(ApiResponse.success(templateService.createTemplate(username, request)));
    }

    /**
     * PUT /api/todo-templates/{id} - Cập nhật template
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TodoTemplateDTO>> updateTemplate(
            Authentication auth,
            @PathVariable Long id,
            @Valid @RequestBody TodoTemplateRequest request) {
        String username = auth.getName();
        log.debug("Updating template {} for user: {}", id, username);
        return ResponseEntity.ok(ApiResponse.success(templateService.updateTemplate(username, id, request)));
    }

    /**
     * DELETE /api/todo-templates/{id} - Xóa template
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteTemplate(
            Authentication auth,
            @PathVariable Long id) {
        String username = auth.getName();
        log.debug("Deleting template {} for user: {}", id, username);
        templateService.deleteTemplate(username, id);
        return ResponseEntity.ok(ApiResponse.success("Template deleted successfully"));
    }

    /**
     * PUT /api/todo-templates/reorder - Sắp xếp lại thứ tự templates
     * Body: [1, 3, 2, 4] - danh sách template IDs theo thứ tự mới
     */
    @PutMapping("/reorder")
    public ResponseEntity<ApiResponse<List<TodoTemplateDTO>>> reorderTemplates(
            Authentication auth,
            @RequestBody List<Long> templateIds) {
        String username = auth.getName();
        log.debug("Reordering {} templates for user: {}", templateIds.size(), username);
        return ResponseEntity.ok(ApiResponse.success(templateService.reorderTemplates(username, templateIds)));
    }
}
