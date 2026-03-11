package com.example.mongobackend.dto;

import lombok.Data;

@Data
public class LoginRequest {
    private String employeeId;
    private String password;
    private String loginMode;
}