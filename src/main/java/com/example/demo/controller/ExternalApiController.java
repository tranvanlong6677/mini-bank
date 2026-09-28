package com.example.demo.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.client.JsonPlaceholderClient;
import com.example.demo.dto.ApiResponse;
import com.example.demo.dto.external.PostDTO;

import lombok.RequiredArgsConstructor;

/**
 * Controller demo Feign Client
 * 
 * Endpoint này cho phép test việc gọi external API thông qua Feign
 */
@RestController
@RequestMapping("/api/external")
@RequiredArgsConstructor
public class ExternalApiController {

    // Inject Feign Client như một bean bình thường
    // Spring tự động tạo implementation dựa trên interface!
    private final JsonPlaceholderClient jsonPlaceholderClient;

    /**
     * GET /api/external/posts
     * Lấy tất cả posts từ JSONPlaceholder
     */
    @GetMapping("/posts")
    public ResponseEntity<ApiResponse<List<PostDTO>>> getAllPosts() {
        // Gọi external API như gọi method Java bình thường!
        List<PostDTO> posts = jsonPlaceholderClient.getAllPosts();
        
        return ResponseEntity.ok(ApiResponse.success(posts));
    }

    /**
     * GET /api/external/posts/{id}
     * Lấy 1 post theo ID
     */
    @GetMapping("/posts/{id}")
    public ResponseEntity<ApiResponse<PostDTO>> getPostById(@PathVariable Long id) {
        PostDTO post = jsonPlaceholderClient.getPostById(id);
        
        return ResponseEntity.ok(ApiResponse.success(post));
    }

    /**
     * GET /api/external/posts/user/{userId}
     * Lấy tất cả posts của 1 user
     */
    @GetMapping("/posts/user/{userId}")
    public ResponseEntity<ApiResponse<List<PostDTO>>> getPostsByUser(@PathVariable Long userId) {
        List<PostDTO> posts = jsonPlaceholderClient.getPostsByUserId(userId);
        
        return ResponseEntity.ok(ApiResponse.success(posts));
    }

    /**
     * POST /api/external/posts
     * Tạo post mới (JSONPlaceholder fake API - không lưu thật)
     */
    @PostMapping("/posts")
    public ResponseEntity<ApiResponse<PostDTO>> createPost(@RequestBody PostDTO post) {
        PostDTO createdPost = jsonPlaceholderClient.createPost(post);
        
        return ResponseEntity.ok(ApiResponse.created(createdPost));
    }
}
