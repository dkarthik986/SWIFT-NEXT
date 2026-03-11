package com.example.mongobackend.controller;

import com.example.mongobackend.dto.ApiResponse;
import com.example.mongobackend.dto.LoginRequest;
import com.example.mongobackend.dto.LoginResponse;
import com.example.mongobackend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            LoginResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(401)
                    .body(ApiResponse.error(ex.getMessage()));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(jakarta.servlet.http.HttpServletRequest request) {
        String employeeId = (String) request.getAttribute("employeeId");
        String role       = (String) request.getAttribute("role");
        String name       = (String) request.getAttribute("name");
        String email      = (String) request.getAttribute("email");

        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "employeeId", employeeId != null ? employeeId : "",
                "role",       role       != null ? role       : "",
                "name",       name       != null ? name       : "",
                "email",      email      != null ? email      : ""
        )));
    }
}