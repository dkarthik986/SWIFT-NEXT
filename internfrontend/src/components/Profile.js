import React, { useState } from "react";
import { useAuth } from "../AuthContext";
import "./css/Profile.css";

function Profile() {
  const { user, authFetch } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || "",
    email: user.email || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [activeSection, setActiveSection] = useState("profile");

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      console.log("Updating profile:", formData);
      // In real app: await authFetch('/api/users/profile', { method: 'PUT', body: JSON.stringify(formData) });
      alert("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      alert("New passwords don't match!");
      return;
    }
    
    try {
      console.log("Changing password");
      // In real app: await authFetch('/api/users/change-password', { method: 'POST', body: JSON.stringify({ ... }) });
      alert("Password changed successfully!");
      setFormData({ ...formData, currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      console.error("Error changing password:", error);
      alert("Failed to change password");
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-sidebar">
        <div className="profile-avatar-section">
          <div className="profile-avatar-large">
            {user.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2) : 'U'}
          </div>
          <h2>{user.name}</h2>
          <p className="profile-role">{user.role}</p>
          <p className="profile-id">{user.employeeId}</p>
        </div>

        <nav className="profile-nav">
          <button
            className={`profile-nav-item ${activeSection === "profile" ? "active" : ""}`}
            onClick={() => setActiveSection("profile")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            Profile Information
          </button>
          <button
            className={`profile-nav-item ${activeSection === "security" ? "active" : ""}`}
            onClick={() => setActiveSection("security")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Security
          </button>
          <button
            className={`profile-nav-item ${activeSection === "activity" ? "active" : ""}`}
            onClick={() => setActiveSection("activity")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            Activity Log
          </button>
        </nav>
      </div>

      <div className="profile-main">
        {/* Profile Information Section */}
        {activeSection === "profile" && (
          <div className="profile-section">
            <div className="section-header">
              <div>
                <h2>Profile Information</h2>
                <p>Manage your personal information and account details</p>
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
                    />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Employee ID</label>
                    <input
                      type="text"
                      value={user.employeeId}
                      disabled
                      className="disabled-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Role</label>
                    <input
                      type="text"
                      value={user.role}
                      disabled
                      className="disabled-input"
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn-cancel" onClick={() => setIsEditing(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-save">
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div className="profile-details">
                <div className="detail-row">
                  <div className="detail-item">
                    <label>Full Name</label>
                    <p>{user.name}</p>
                  </div>
                  <div className="detail-item">
                    <label>Email Address</label>
                    <p>{user.email || "Not set"}</p>
                  </div>
                </div>
                <div className="detail-row">
                  <div className="detail-item">
                    <label>Employee ID</label>
                    <p>{user.employeeId}</p>
                  </div>
                  <div className="detail-item">
                    <label>Role</label>
                    <p>
                      <span className={`role-badge role-${user.role.toLowerCase()}`}>
                        {user.role}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="detail-row">
                  <div className="detail-item">
                    <label>Account Status</label>
                    <p>
                      <span className="status-badge active">Active</span>
                    </p>
                  </div>
                  <div className="detail-item">
                    <label>Member Since</label>
                    <p>January 15, 2024</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Security Section */}
        {activeSection === "security" && (
          <div className="profile-section">
            <div className="section-header">
              <div>
                <h2>Security Settings</h2>
                <p>Manage your password and security preferences</p>
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
              </div>

              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  required
                  minLength={6}
                  placeholder="Enter new password (min 6 characters)"
                />
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
              </div>

              <div className="password-requirements">
                <p className="requirements-title">Password Requirements:</p>
                <ul>
                  <li className={formData.newPassword.length >= 6 ? "valid" : ""}>
                    At least 6 characters long
                  </li>
                  <li className={formData.newPassword === formData.confirmPassword && formData.newPassword ? "valid" : ""}>
                    Passwords match
                  </li>
                </ul>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-save">
                  Update Password
                </button>
              </div>
            </form>

            <div className="security-info">
              <h3>Session Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                    <line x1="12" y1="18" x2="12.01" y2="18"/>
                  </svg>
                  <div>
                    <p className="info-label">Current Device</p>
                    <p className="info-value">Chrome on Windows</p>
                  </div>
                </div>
                <div className="info-item">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  <div>
                    <p className="info-label">Last Login</p>
                    <p className="info-value">Today at 9:30 AM</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Activity Log Section */}
        {activeSection === "activity" && (
          <div className="profile-section">
            <div className="section-header">
              <div>
                <h2>Activity Log</h2>
                <p>View your recent account activity</p>
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
                  <p className="activity-title">Successful login</p>
                  <p className="activity-details">Chrome on Windows • 192.168.1.100</p>
                </div>
                <div className="activity-time">2 hours ago</div>
              </div>

              <div className="activity-item">
                <div className="activity-icon search">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35"/>
                  </svg>
                </div>
                <div className="activity-content">
                  <p className="activity-title">Performed search</p>
                  <p className="activity-details">Searched for MT103 messages</p>
                </div>
                <div className="activity-time">3 hours ago</div>
              </div>

              <div className="activity-item">
                <div className="activity-icon update">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </div>
                <div className="activity-content">
                  <p className="activity-title">Profile updated</p>
                  <p className="activity-details">Changed email address</p>
                </div>
                <div className="activity-time">1 day ago</div>
              </div>

              <div className="activity-item">
                <div className="activity-icon login">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                    <polyline points="10 17 15 12 10 7"/>
                    <line x1="15" y1="12" x2="3" y2="12"/>
                  </svg>
                </div>
                <div className="activity-content">
                  <p className="activity-title">Successful login</p>
                  <p className="activity-details">Chrome on Windows • 192.168.1.100</p>
                </div>
                <div className="activity-time">2 days ago</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;