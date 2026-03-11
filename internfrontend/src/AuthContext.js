// src/AuthContext.js
// Global auth state — stores user info and JWT token, persists across page reloads.

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { verifyToken } from "./services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate from localStorage on app load
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser  = localStorage.getItem("user");

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.clear();
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback((data) => {
    const userData = {
      employeeId: data.employeeId,
      name:       data.name,
      role:       data.role,
      email:      data.email || "",
    };
    setToken(data.token);
    setUser(userData);
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(userData));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }, []);

  /**
   * Refreshes user data from the server — call after profile update
   * so the header/sidebar reflects the new name/email.
   */
  const refreshUser = useCallback(async () => {
    try {
      const res = await verifyToken();
      const fresh = res.data?.data || res.data;
      if (fresh?.employeeId) {
        const updated = { ...user, ...fresh };
        setUser(updated);
        localStorage.setItem("user", JSON.stringify(updated));
      }
    } catch {
      // Token expired or invalid — force logout
      logout();
    }
  }, [user, logout]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, refreshUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}