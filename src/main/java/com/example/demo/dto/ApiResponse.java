package com.example.demo.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Generic API response wrapper
 * Format chuẩn cho TẤT CẢ API responses trong hệ thống
 * 
 * @param <T> Kiểu dữ liệu của data
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class ApiResponse<T> {

    private int statusCode;      // HTTP status code: 200, 201, 400, 500...
    private String code;         // Business code: "SUCCESS", "USER_NOT_FOUND", "VALIDATION_ERROR"...
    private String message;      // Message cho user/FE đọc
    private T data;              // Actual data

    // ==================== Static Factory Methods ====================
    
    /**
     * Response thành công với data
     */
    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
                .statusCode(200)
                .code("SUCCESS")
                .message("Thành công")
                .data(data)
                .build();
    }

    /**
     * Response thành công khi tạo mới (201 Created)
     */
    public static <T> ApiResponse<T> created(T data) {
        return ApiResponse.<T>builder()
                .statusCode(201)
                .code("CREATED")
                .message("Tạo mới thành công")
                .data(data)
                .build();
    }

    /**
     * Response lỗi validation
     */
    public static <T> ApiResponse<T> validationError(String message, T errors) {
        return ApiResponse.<T>builder()
                .statusCode(400)
                .code("VALIDATION_ERROR")
                .message(message)
                .data(errors)
                .build();
    }

    /**
     * Response lỗi not found
     */
    public static <T> ApiResponse<T> notFound(String message) {
        return ApiResponse.<T>builder()
                .statusCode(404)
                .code("NOT_FOUND")
                .message(message)
                .data(null)
                .build();
    }

    /**
     * Response lỗi server
     */
    public static <T> ApiResponse<T> error(String message) {
        return ApiResponse.<T>builder()
                .statusCode(500)
                .code("INTERNAL_ERROR")
                .message(message)
                .data(null)
                .build();
    }

    /**
     * Response lỗi custom
     */
    public static <T> ApiResponse<T> error(int statusCode, String code, String message) {
        return ApiResponse.<T>builder()
                .statusCode(statusCode)
                .code(code)
                .message(message)
                .data(null)
                .build();
    }
}
