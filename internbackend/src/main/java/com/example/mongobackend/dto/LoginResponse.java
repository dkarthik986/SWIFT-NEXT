package com.example.mongobackend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class LoginResponse {
    private String token;
    private String employeeId;
    private String name;
    private String role;
    private long expiresIn; // milliseconds
}