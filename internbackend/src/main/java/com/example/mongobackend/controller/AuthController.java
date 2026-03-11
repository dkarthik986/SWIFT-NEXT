package com.example.mongobackend.controller;

import com.example.mongobackend.dto.LoginRequest;
import com.example.mongobackend.dto.LoginResponse;
import com.example.mongobackend.model.User;
import com.example.mongobackend.repository.UserRepository;
import com.example.mongobackend.service.uthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {

    private final uthService authService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // ── POST /api/auth/login ────────────────────────────────────────────────
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            LoginResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException ex) {
            Map<String, Object> error = new LinkedHashMap<>();
            error.put("success", false);
            error.put("message", ex.getMessage());
            return ResponseEntity.status(401).body(error);
        }
    }

    // ── GET /api/auth/me  (protected — requires valid JWT) ──────────────────
    @GetMapping("/me")
    public ResponseEntity<?> me() {
        return ResponseEntity.ok(Map.of("message", "Token is valid"));
    }

    // ── POST /api/auth/seed  (ADMIN only — creates test users) ─────────────
    // Remove this endpoint in production!
    @PostMapping("/seed")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> seedUsers() {
        if (userRepository.count() > 0) {
            return ResponseEntity.ok(Map.of("message", "Users already seeded"));
        }

        User admin = new User();
        admin.setEmployeeId("ADMIN001");
        admin.setPassword(passwordEncoder.encode("admin123"));
        admin.setRole("ADMIN");
        admin.setName("System Administrator");
        admin.setEmail("admin@swift.com");
        userRepository.save(admin);

        User emp = new User();
        emp.setEmployeeId("EMP001");
        emp.setPassword(passwordEncoder.encode("emp123"));
        emp.setRole("EMPLOYEE");
        emp.setName("John Doe");
        emp.setEmail("john.doe@swift.com");
        userRepository.save(emp);

        return ResponseEntity.ok(Map.of(
                "message", "Seeded 2 users",
                "users", new String[]{"ADMIN001 / admin123 (ADMIN)", "EMP001 / emp123 (EMPLOYEE)"}
        ));
    }

    // ── POST /api/auth/register  (ADMIN only — create a new user) ──────────
    @PostMapping("/register")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> register(@RequestBody User newUser) {
        if (userRepository.findByEmployeeId(newUser.getEmployeeId()).isPresent()) {
            return ResponseEntity.status(409).body(
                    Map.of("success", false, "message", "Employee ID already exists")
            );
        }
        newUser.setPassword(passwordEncoder.encode(newUser.getPassword()));
        User saved = userRepository.save(newUser);
        saved.setPassword(null);
        return ResponseEntity.ok(saved);
    }
}