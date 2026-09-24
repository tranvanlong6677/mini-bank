package com.example.demo.service.impl;

import org.springframework.stereotype.Service;

import com.example.demo.dto.UserResponse;
import com.example.demo.service.UserService;

@Service
public class UserServiceImpl implements UserService {

    @Override
    public UserResponse getUser(Long id) {
        System.out.println(new UserResponse(id, "hihi"));

        return new UserResponse(
            id,
            "longtran",
            "Tran Long"
        );
    }
}