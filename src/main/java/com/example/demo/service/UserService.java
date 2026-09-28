package com.example.demo.service;

import com.example.demo.dto.UserRequest;
import com.example.demo.dto.UserResponse;

import java.util.List;

public interface UserService {

    UserResponse getUser(Long id);
    
    UserResponse createUser(UserRequest request);
    
    List<UserResponse> getAllUsers();
    
    UserResponse updateUser(Long id, UserRequest request);
    
    void deleteUser(Long id);
}
