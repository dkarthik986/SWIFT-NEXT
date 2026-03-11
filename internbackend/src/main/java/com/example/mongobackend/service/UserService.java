package com.example.mongobackend.service;

import com.example.mongobackend.dto.*;
import com.example.mongobackend.exception.ConflictException;
import com.example.mongobackend.exception.NotFoundException;
import com.example.mongobackend.exception.BadRequestException;
import com.example.mongobackend.model.User;
import com.example.mongobackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public Page<UserDTO> getUsers(String search, String role, Boolean active,
                                  int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<User> users;
        if (search != null && !search.isBlank()) {
            users = userRepository.searchUsers(search.trim(), pageable);
        } else if (role != null && !role.isBlank() && !role.equalsIgnoreCase("ALL")) {
            users = userRepository.findByRole(role.toUpperCase(), pageable);
        } else if (active != null) {
            users = userRepository.findByActive(active, pageable);
        } else {
            users = userRepository.findAll(pageable);
        }

        return users.map(this::toDTO);
    }

    public UserDTO getUserByEmployeeId(String employeeId) {
        User user = userRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new NotFoundException("User not found: " + employeeId));
        return toDTO(user);
    }

    public UserDTO createUser(UserDTO dto) {
        // Validate required fields manually
        if (dto.getEmployeeId() == null || dto.getEmployeeId().isBlank()) {
            throw new BadRequestException("Employee ID is required");
        }
        if (dto.getName() == null || dto.getName().isBlank()) {
            throw new BadRequestException("Name is required");
        }
        if (dto.getEmail() == null || dto.getEmail().isBlank()) {
            throw new BadRequestException("Email is required");
        }
        if (dto.getPassword() == null || dto.getPassword().isBlank()) {
            throw new BadRequestException("Password is required");
        }
        if (dto.getRole() == null || dto.getRole().isBlank()) {
            throw new BadRequestException("Role is required");
        }

        String empId = dto.getEmployeeId().toUpperCase().trim();
        String email = dto.getEmail().toLowerCase().trim();

        if (userRepository.existsByEmployeeId(empId)) {
            throw new ConflictException("Employee ID already exists: " + empId);
        }
        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("Email already in use: " + email);
        }

        User user = User.builder()
                .employeeId(empId)
                .password(dto.getPassword())          // plain text
                .role(dto.getRole().toUpperCase())
                .name(dto.getName().trim())
                .email(email)
                .active(dto.isActive())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        User saved = userRepository.save(user);
        log.info("User created: {}", saved.getEmployeeId());
        return toDTO(saved);
    }

    public UserDTO updateUser(String employeeId, UserDTO dto) {
        User user = userRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new NotFoundException("User not found: " + employeeId));

        String newEmail = dto.getEmail().toLowerCase().trim();

        if (!user.getEmail().equalsIgnoreCase(newEmail) &&
                userRepository.existsByEmailAndEmployeeIdNot(newEmail, employeeId)) {
            throw new ConflictException("Email already in use: " + newEmail);
        }

        user.setName(dto.getName().trim());
        user.setEmail(newEmail);
        user.setRole(dto.getRole().toUpperCase());
        user.setActive(dto.isActive());
        user.setUpdatedAt(Instant.now());

        if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
            user.setPassword(dto.getPassword()); // plain text
        }

        User saved = userRepository.save(user);
        log.info("User updated: {}", employeeId);
        return toDTO(saved);
    }

    public UserDTO toggleUserStatus(String employeeId, boolean active) {
        User user = userRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new NotFoundException("User not found: " + employeeId));

        if ("ADMIN001".equals(employeeId) && !active) {
            throw new BadRequestException("Cannot disable the primary administrator account");
        }

        user.setActive(active);
        user.setUpdatedAt(Instant.now());
        User saved = userRepository.save(user);
        log.info("User {} status set to active={}", employeeId, active);
        return toDTO(saved);
    }

    public void deleteUser(String employeeId) {
        User user = userRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new NotFoundException("User not found: " + employeeId));

        if ("ADMIN001".equals(employeeId)) {
            throw new BadRequestException("Cannot delete the primary administrator account");
        }

        userRepository.delete(user);
        log.info("User deleted: {}", employeeId);
    }

    public UserDTO getProfile(String employeeId) {
        User user = userRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new NotFoundException("Profile not found"));
        return toDTO(user);
    }

    public UserDTO updateProfile(String employeeId, UpdateProfileRequest req) {
        User user = userRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        if (!user.getEmail().equalsIgnoreCase(req.getEmail()) &&
                userRepository.existsByEmailAndEmployeeIdNot(req.getEmail(), employeeId)) {
            throw new ConflictException("Email already in use: " + req.getEmail());
        }

        user.setName(req.getName());
        user.setEmail(req.getEmail().toLowerCase());
        user.setUpdatedAt(Instant.now());

        User saved = userRepository.save(user);
        log.info("Profile updated for: {}", employeeId);
        return toDTO(saved);
    }

    public void changePassword(String employeeId, ChangePasswordRequest req) {
        User user = userRepository.findByEmployeeId(employeeId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        // Plain text password check
        if (!req.getCurrentPassword().equals(user.getPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }

        if (!req.getNewPassword().equals(req.getConfirmPassword())) {
            throw new BadRequestException("New passwords do not match");
        }

        user.setPassword(req.getNewPassword()); // plain text
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);
        log.info("Password changed for: {}", employeeId);
    }

    public Map<String, Long> getUserStats() {
        return Map.of(
                "total",     userRepository.count(),
                "active",    userRepository.countByActive(true),
                "inactive",  userRepository.countByActive(false),
                "admins",    userRepository.countByRole("ADMIN"),
                "employees", userRepository.countByRole("EMPLOYEE")
        );
    }

    public void updateLastLogin(String employeeId) {
        userRepository.findByEmployeeId(employeeId).ifPresent(user -> {
            user.setLastLogin(Instant.now());
            userRepository.save(user);
        });
    }

    public UserDTO toDTO(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .employeeId(user.getEmployeeId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .active(user.isActive())
                .createdAt(user.getCreatedAt())
                .lastLogin(user.getLastLogin())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}