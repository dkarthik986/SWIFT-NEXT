package com.example.mongobackend.dto;

import lombok.Data;
import jakarta.validation.constraints.*;

@Data
public class UpdateProfileRequest {

    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 100)
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;
}