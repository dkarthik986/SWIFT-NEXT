// src/services/authService.js

import axiosInstance from "../api/axiosInstance";

/**
 * Calls POST /api/auth/login and returns the full response data.
 */
export const loginRequest = (employeeId, password, loginMode) =>
  axiosInstance.post("/api/auth/login", { employeeId, password, loginMode });

/**
 * Validates the current token by calling GET /api/auth/me.
 * Returns the current user payload from the server.
 */
export const verifyToken = () =>
  axiosInstance.get("/api/auth/me");