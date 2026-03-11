package com.example.mongobackend.service;

import com.example.mongobackend.dto.LoginRequest;
import com.example.mongobackend.dto.LoginResponse;
import com.example.mongobackend.model.User;
import com.example.mongobackend.repository.UserRepository;
import com.example.mongobackend.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class uthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public LoginResponse login(LoginRequest request) {
        // 1. Find user by employeeId
        User user = userRepository.findByEmployeeId(request.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Invalid Employee ID or password"));

        // 2. Check account is active
        if (!user.isActive()) {
            throw new RuntimeException("Account is disabled. Contact your administrator.");
        }

        // 3. Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid Employee ID or password");
        }

        // 4. Enforce login mode matches the user's actual role
        String requestedMode = request.getLoginMode() != null
                ? request.getLoginMode().toUpperCase()
                : "EMPLOYEE";

        if (!user.getRole().equalsIgnoreCase(requestedMode)) {
            throw new RuntimeException(
                    "Access denied: your account does not have " + requestedMode + " privileges."
            );
        }

        // 5. Generate JWT
        String token = jwtUtil.generateToken(user.getEmployeeId(), user.getRole(), user.getName());

        return new LoginResponse(
                token,
                user.getEmployeeId(),
                user.getName(),
                user.getRole(),
                86400000L // 24h
        );
    }
}