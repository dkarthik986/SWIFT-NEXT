// src/components/Profile.js
// Fully connected — fetches live data and persists all changes to MongoDB.

import React, { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";
import { fetchProfile, updateProfile, changePassword } from "../api/userApi";
import "./css/Profile.css";

function Profile() {
  const { user, refreshUser } = useAuth();

  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isEditing, setIsEditing]   = useState(false);
  const [activeSection, setActiveSection] = useState("profile");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast]   = useState(null);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    name: "", email: "",
    currentPassword: "", newPassword: "", confirmPassword: "",
  });

  // ── Load live profile from server ─────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        setLoadingProfile(true);
        const res = await fetchProfile();
        const data = res.data?.data || res.data;
        setProfileData(data);
        setFormData((prev) => ({ ...prev, name: data.name, email: data.email }));
      } catch {
        // Fall back to token data
        setProfileData(user);
        setFormData((prev) => ({
          ...prev,
          name:  user?.name  || "",
          email: user?.email || "",
        }));
      } finally {
        setLoadingProfile(false);
      }
    };
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Update profile (name + email) ─────────────────────────────────────────
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setErrors({});

    try {
      setSubmitting(true);
      const res = await updateProfile({ name: formData.name, email: formData.email });
      const updated = res.data?.data || res.data;
      setProfileData(updated);
      await refreshUser(); // updates header/sidebar name
      setIsEditing(false);
      showToast("Profile updated successfully");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update profile";
      const fieldErrors = err.response?.data?.data;
      if (fieldErrors) setErrors(fieldErrors);
      else showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Change password ────────────────────────────────────────────────────────
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setErrors({});

    if (formData.newPassword !== formData.confirmPassword) {
      setErrors({ confirmPassword: "Passwords do not match" });
      return;
    }

    try {
      setSubmitting(true);
      await changePassword({
        currentPassword: formData.currentPassword,
        newPassword:     formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });
      setFormData((prev) => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }));
      showToast("Password changed successfully");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to change password";
      const fieldErrors = err.response?.data?.data;
      if (fieldErrors) setErrors(fieldErrors);
      else showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const displayUser = profileData || user || {};
  const memberSince = displayUser.createdAt
    ? new Date(displayUser.createdAt).toLocaleDateString("en-GB", {
        day: "numeric", month: "long", year: "numeric",
      })
    : "—";
  const lastLogin = displayUser.lastLogin
    ? new Date(displayUser.lastLogin).toLocaleString("en-GB", {
        day: "numeric", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : "—";

  const getInitials = (name) =>
    name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?";

  return (
    <div className="profile-container">
      {/* Toast */}
      {toast && (
        <div className={`profile-toast profile-toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      {/* Sidebar */}
      <div className="profile-sidebar">
        <div className="profile-avatar-section">
          <div className="profile-avatar-large">
            {loadingProfile ? "…" : getInitials(displayUser.name)}
          </div>
          <h2>{displayUser.name}</h2>
          <p className="profile-role">{displayUser.role}</p>
          <p className="profile-id">{displayUser.employeeId}</p>
          {displayUser.active !== undefined && (
            <span className={`profile-status-badge ${displayUser.active ? "active" : "inactive"}`}>
              {displayUser.active ? "● Active" : "○ Inactive"}
            </span>
          )}
        </div>

        <nav className="profile-nav">
          {[
            { key: "profile",  label: "Profile Information",
              icon: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></> },
            { key: "security", label: "Security",
              icon: <><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></> },
            { key: "activity", label: "Activity Log",
              icon: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/> },
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              className={`profile-nav-item ${activeSection === key ? "active" : ""}`}
              onClick={() => setActiveSection(key)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {icon}
              </svg>
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <div className="profile-main">

        {/* ── Profile Information ─────────────────────────────────────────── */}
        {activeSection === "profile" && (
          <div className="profile-section">
            <div className="section-header">
              <div>
                <h2>Profile Information</h2>
                <p>Your personal information stored in the system</p>
              </div>
              {!isEditing && (
                <button className="btn-edit" onClick={() => setIsEditing(true)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Edit Profile
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleUpdateProfile} className="profile-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      minLength={2}
                    />
                    {errors.name && <span className="field-error">{errors.name}</span>}
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                    {errors.email && <span className="field-error">{errors.email}</span>}
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Employee ID</label>
                    <input type="text" value={displayUser.employeeId} disabled className="disabled-input" />
                  </div>
                  <div className="form-group">
                    <label>Role</label>
                    <input type="text" value={displayUser.role} disabled className="disabled-input" />
                  </div>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-cancel" onClick={() => { setIsEditing(false); setErrors({}); }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-save" disabled={submitting}>
                    {submitting ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="profile-details">
                {loadingProfile ? (
                  <div style={{ padding: 24, color: "var(--gray-400)" }}>Loading profile…</div>
                ) : (
                  <>
                    <div className="detail-row">
                      <div className="detail-item">
                        <label>Full Name</label>
                        <p>{displayUser.name}</p>
                      </div>
                      <div className="detail-item">
                        <label>Email Address</label>
                        <p>{displayUser.email || "Not set"}</p>
                      </div>
                    </div>
                    <div className="detail-row">
                      <div className="detail-item">
                        <label>Employee ID</label>
                        <p>{displayUser.employeeId}</p>
                      </div>
                      <div className="detail-item">
                        <label>Role</label>
                        <p>
                          <span className={`role-badge role-${displayUser.role?.toLowerCase()}`}>
                            {displayUser.role}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="detail-row">
                      <div className="detail-item">
                        <label>Account Status</label>
                        <p>
                          <span className={`status-badge ${displayUser.active ? "active" : "inactive"}`}>
                            {displayUser.active ? "Active" : "Inactive"}
                          </span>
                        </p>
                      </div>
                      <div className="detail-item">
                        <label>Member Since</label>
                        <p>{memberSince}</p>
                      </div>
                    </div>
                    <div className="detail-row">
                      <div className="detail-item">
                        <label>Last Login</label>
                        <p>{lastLogin}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Security ────────────────────────────────────────────────────── */}
        {activeSection === "security" && (
          <div className="profile-section">
            <div className="section-header">
              <div>
                <h2>Security Settings</h2>
                <p>Change your password to keep your account secure</p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="profile-form">
              <h3>Change Password</h3>
              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                  required
                  placeholder="Enter current password"
                />
                {errors.currentPassword && <span className="field-error">{errors.currentPassword}</span>}
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  required
                  minLength={6}
                  placeholder="Min. 6 characters"
                />
                {errors.newPassword && <span className="field-error">{errors.newPassword}</span>}
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  minLength={6}
                  placeholder="Confirm new password"
                />
                {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
              </div>
              <div className="password-requirements">
                <p className="requirements-title">Password Requirements:</p>
                <ul>
                  <li className={formData.newPassword.length >= 6 ? "valid" : ""}>
                    At least 6 characters
                  </li>
                  <li className={formData.newPassword && formData.newPassword === formData.confirmPassword ? "valid" : ""}>
                    Passwords match
                  </li>
                </ul>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-save" disabled={submitting}>
                  {submitting ? "Updating…" : "Update Password"}
                </button>
              </div>
            </form>

            <div className="security-info">
              <h3>Session Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  <div>
                    <p className="info-label">Last Login</p>
                    <p className="info-value">{lastLogin}</p>
                  </div>
                </div>
                <div className="info-item">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  <div>
                    <p className="info-label">Account Role</p>
                    <p className="info-value">{displayUser.role}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Activity Log ─────────────────────────────────────────────────── */}
        {activeSection === "activity" && (
          <div className="profile-section">
            <div className="section-header">
              <div>
                <h2>Activity Log</h2>
                <p>Recent account activity</p>
              </div>
            </div>
            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-icon login">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                    <polyline points="10 17 15 12 10 7"/>
                    <line x1="15" y1="12" x2="3" y2="12"/>
                  </svg>
                </div>
                <div className="activity-content">
                  <p className="activity-title">Last login</p>
                  <p className="activity-details">{lastLogin}</p>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon update">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <div className="activity-content">
                  <p className="activity-title">Account created</p>
                  <p className="activity-details">{memberSince}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;