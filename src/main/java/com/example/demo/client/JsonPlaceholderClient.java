package com.example.demo.client;

import com.example.demo.dto.external.PostDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

/**
 * Feign Client để gọi JSONPlaceholder API
 * 
 * @FeignClient annotation:
 * - name: tên định danh của client (dùng cho logging, metrics)
 * - url: base URL của API cần gọi (có thể đọc từ config)
 * 
 * Giống như bạn định nghĩa API endpoint trong React:
 * const API_BASE = 'https://jsonplaceholder.typicode.com'
 * const getPosts = () => fetch(`${API_BASE}/posts`)
 * 
 * Nhưng với Feign, Spring tự động implement phần fetch cho bạn!
 */
@FeignClient(
    name = "jsonplaceholder-client",
    url = "${external.jsonplaceholder.url:https://jsonplaceholder.typicode.com}"
)
public interface JsonPlaceholderClient {

    /**
     * GET /posts - Lấy tất cả posts
     */
    @GetMapping("/posts")
    List<PostDTO> getAllPosts();

    /**
     * GET /posts/{id} - Lấy post theo ID
     */
    @GetMapping("/posts/{id}")
    PostDTO getPostById(@PathVariable("id") Long id);

    /**
     * GET /posts?userId={userId} - Lấy posts của 1 user
     */
    @GetMapping("/posts")
    List<PostDTO> getPostsByUserId(@RequestParam("userId") Long userId);

    /**
     * POST /posts - Tạo post mới
     */
    @PostMapping("/posts")
    PostDTO createPost(@RequestBody PostDTO post);
}
