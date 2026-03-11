package com.example.mongobackend.dto;

import lombok.Data;
import jakarta.validation.constraints.NotNull;

@Data
public class StatusUpdateRequest {

    @NotNull(message = "Active status is required")
    private Boolean active;
}