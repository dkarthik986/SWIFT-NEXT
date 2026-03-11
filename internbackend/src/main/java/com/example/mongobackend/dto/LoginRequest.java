package com.example.mongobackend.dto;

import lombok.Data;

// ─── Login Request ────────────────────────────────────────────────────────────
// POST /api/auth/login
// Body: { "employeeId": "EMP001", "password": "secret", "loginMode": "EMPLOYEE" }

@Data
public class LoginRequest {
    private String employeeId;
    private String password;
    private String loginMode; // "EMPLOYEE" or "ADMIN"
}