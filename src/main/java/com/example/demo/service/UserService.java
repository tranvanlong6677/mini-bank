package com.example.demo.service;

import com.example.demo.dto.UserResponse;

public interface UserService {

    UserResponse getUser(Long id);
}