package com.example.mongobackend.controller;

import com.example.mongobackend.dto.*;
import com.example.mongobackend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class UserController {

    private final UserService userService;

    // ── User Management — ADMIN ONLY ──────────────────────────────────────────

    @GetMapping("/api/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<UserDTO>>> getUsers(
            @RequestParam(defaultValue = "")     String search,
            @RequestParam(defaultValue = "ALL")  String role,
            @RequestParam(required = false)      Boolean active,
            @RequestParam(defaultValue = "0")    int page,
            @RequestParam(defaultValue = "20")   int size,
            @RequestParam(defaultValue = "name") String sort,   // changed from createdAt
            @RequestParam(defaultValue = "desc") String dir
    ) {
        Page<UserDTO> users = userService.getUsers(search, role, active, page, size, sort, dir);
        return ResponseEntity.ok(ApiResponse.ok(users));
    }

    @GetMapping("/api/users/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getUserStats() {
        return ResponseEntity.ok(ApiResponse.ok(userService.getUserStats()));
    }

    @GetMapping("/api/users/{employeeId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserDTO>> getUserById(
            @PathVariable String employeeId) {
        return ResponseEntity.ok(ApiResponse.ok(userService.getUserByEmployeeId(employeeId)));
    }

    @PostMapping("/api/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserDTO>> createUser(
            @RequestBody UserDTO dto) {           // removed @Valid
        UserDTO created = userService.createUser(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("User created successfully", created));
    }

    @PutMapping("/api/users/{employeeId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserDTO>> updateUser(
            @PathVariable String employeeId,
            @RequestBody UserDTO dto) {           // removed @Valid
        UserDTO updated = userService.updateUser(employeeId, dto);
        return ResponseEntity.ok(ApiResponse.ok("User updated successfully", updated));
    }

    @PatchMapping("/api/users/{employeeId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserDTO>> toggleUserStatus(
            @PathVariable String employeeId,
            @RequestBody StatusUpdateRequest req) {
        UserDTO updated = userService.toggleUserStatus(employeeId, req.getActive());
        String msg = req.getActive() ? "User activated" : "User deactivated";
        return ResponseEntity.ok(ApiResponse.ok(msg, updated));
    }

    @DeleteMapping("/api/users/{employeeId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteUser(
            @PathVariable String employeeId) {
        userService.deleteUser(employeeId);
        return ResponseEntity.ok(ApiResponse.ok("User deleted successfully", null));
    }

    // ── Profile — ANY AUTHENTICATED USER ─────────────────────────────────────

    @GetMapping("/api/profile")
    public ResponseEntity<ApiResponse<UserDTO>> getProfile(
            jakarta.servlet.http.HttpServletRequest request) {
        String employeeId = (String) request.getAttribute("employeeId");
        return ResponseEntity.ok(ApiResponse.ok(userService.getProfile(employeeId)));
    }

    @PutMapping("/api/profile")
    public ResponseEntity<ApiResponse<UserDTO>> updateProfile(
            @RequestBody UpdateProfileRequest req,
            jakarta.servlet.http.HttpServletRequest request) {
        String employeeId = (String) request.getAttribute("employeeId");
        UserDTO updated = userService.updateProfile(employeeId, req);
        return ResponseEntity.ok(ApiResponse.ok("Profile updated successfully", updated));
    }

    @PutMapping("/api/profile/password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @RequestBody ChangePasswordRequest req,
            jakarta.servlet.http.HttpServletRequest request) {
        String employeeId = (String) request.getAttribute("employeeId");
        userService.changePassword(employeeId, req);
        return ResponseEntity.ok(ApiResponse.ok("Password changed successfully", null));
    }
}