package com.example.mongobackend.dto;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {

    private String id;
    private String employeeId;
    private String name;
    private String email;
    private String role;
    private boolean active;
    private Object createdAt;
    private Instant lastLogin;
    private Instant updatedAt;
    private String password;
}