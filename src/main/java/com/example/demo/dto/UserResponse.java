package com.example.demo.dto;

import lombok.Data;

@Data
// @AllArgsConstructor
public class UserResponse {

    private Long id;
    private String username;
    private String fullName;

     public UserResponse(Long id, String username) {
        this.id = id;
        this.username = username;
    }
    public UserResponse(Long id, String username, String fullName) {
        this.id = id;
        this.fullName = fullName;
        this.username = username;
    }

   
}