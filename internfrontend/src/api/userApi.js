// src/api/userApi.js
// All user management and profile API calls.

import axiosInstance from "./axiosInstance";

// ── User Management (ADMIN only) ─────────────────────────────────────────────

/**
 * Fetch paginated users list.
 * @param {Object} params - { page, size, sort, dir, search, role, active }
 */
export const fetchUsers = (params = {}) =>
  axiosInstance.get("/api/users", { params });

/**
 * Fetch user statistics.
 */
export const fetchUserStats = () =>
  axiosInstance.get("/api/users/stats");

/**
 * Fetch a single user by employeeId.
 */
export const fetchUserById = (employeeId) =>
  axiosInstance.get(`/api/users/${employeeId}`);

/**
 * Create a new user.
 * @param {Object} userData - { employeeId, name, email, password, role, active }
 */
export const createUser = (userData) =>
  axiosInstance.post("/api/users", userData);

/**
 * Update an existing user.
 * @param {string} employeeId
 * @param {Object} userData - { name, email, role, active, password? }
 */
export const updateUser = (employeeId, userData) =>
  axiosInstance.put(`/api/users/${employeeId}`, userData);

/**
 * Enable or disable a user account.
 * @param {string} employeeId
 * @param {boolean} active
 */
export const toggleUserStatus = (employeeId, active) =>
  axiosInstance.patch(`/api/users/${employeeId}/status`, { active });

/**
 * Permanently delete a user.
 * @param {string} employeeId
 */
export const deleteUser = (employeeId) =>
  axiosInstance.delete(`/api/users/${employeeId}`);

// ── Profile (authenticated user's own data) ───────────────────────────────────

/**
 * Get the logged-in user's profile from the server.
 */
export const fetchProfile = () =>
  axiosInstance.get("/api/profile");

/**
 * Update logged-in user's name and email.
 * @param {Object} data - { name, email }
 */
export const updateProfile = (data) =>
  axiosInstance.put("/api/profile", data);

/**
 * Change the logged-in user's password.
 * @param {Object} data - { currentPassword, newPassword, confirmPassword }
 */
export const changePassword = (data) =>
  axiosInstance.put("/api/profile/password", data);