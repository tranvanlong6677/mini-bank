package com.example.demo.exception;

/**
 * Custom exception khi không tìm thấy user
 */
public class UserNotFoundException extends RuntimeException {
    
    public UserNotFoundException(Long id) {
        super("Không tìm thấy user với id: " + id);
    }
    
    public UserNotFoundException(String message) {
        super(message);
    }
}
