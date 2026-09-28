package com.example.demo.exception;

/**
 * Custom exception khi resource đã tồn tại (duplicate)
 */
public class DuplicateResourceException extends RuntimeException {
    
    public DuplicateResourceException(String message) {
        super(message);
    }
}
