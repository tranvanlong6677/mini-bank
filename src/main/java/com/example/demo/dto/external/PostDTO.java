package com.example.demo.dto.external;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO để map response từ JSONPlaceholder API
 * 
 * API: https://jsonplaceholder.typicode.com/posts
 * Response example:
 * {
 *   "userId": 1,
 *   "id": 1,
 *   "title": "sunt aut facere...",
 *   "body": "quia et suscipit..."
 * }
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostDTO {
    
    private Long userId;
    private Long id;
    private String title;
    private String body;
}
