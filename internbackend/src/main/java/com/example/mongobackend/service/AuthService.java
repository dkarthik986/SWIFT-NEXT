package com.example.mongobackend.service;

import com.example.mongobackend.dto.LoginRequest;
import com.example.mongobackend.dto.LoginResponse;
import com.example.mongobackend.model.User;
import com.example.mongobackend.repository.UserRepository;
import com.example.mongobackend.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final UserService userService;

    public LoginResponse login(LoginRequest request) {

        User user = userRepository.findByEmployeeId(request.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Invalid Employee ID or password"));

        if (!user.isActive()) {
            throw new RuntimeException("Account is disabled. Contact your administrator.");
        }

        // Plain text password check
        if (!request.getPassword().equals(user.getPassword())) {
            throw new RuntimeException("Invalid Employee ID or password");
        }

        String requestedMode = request.getLoginMode() != null
                ? request.getLoginMode().toUpperCase()
                : "EMPLOYEE";

        if (!user.getRole().equalsIgnoreCase(requestedMode)) {
            throw new RuntimeException(
                    "Access denied: your account does not have " + requestedMode + " privileges.");
        }

        userService.updateLastLogin(user.getEmployeeId());

        String token = jwtUtil.generateToken(
                user.getEmployeeId(), user.getRole(), user.getName(), user.getEmail());

        log.info("Login successful: {}", user.getEmployeeId());

        return new LoginResponse(
                token,
                user.getEmployeeId(),
                user.getName(),
                user.getRole(),
                user.getEmail(),
                86400000L
        );
    }
}