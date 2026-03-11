// src/components/UserManagement.js
// Fully connected to backend — all operations persist to MongoDB user_data collection.

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../AuthContext";
import {
  fetchUsers,
  fetchUserStats,
  createUser,
  updateUser,
  toggleUserStatus,
  deleteUser,
} from "../api/userApi";
import "./css/UserManagement.css";

// ── Toast notification ───────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`um-toast um-toast-${type}`}>
      <span>{message}</span>
      <button onClick={onClose}>×</button>
    </div>
  );
}

// ── Modal wrapper ────────────────────────────────────────────────────────────
function FormModal({ title, onSubmit, onClose, children, submitLabel, submitting }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose} disabled={submitting}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <div style={{ padding: "20px 22px 4px" }}>{children}</div>
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={submitting}>
              {submitting ? "Saving…" : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
function UserManagement() {
  const { user } = useAuth();

  // Data state
  const [users, setUsers]           = useState([]);
  const [stats, setStats]           = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // UI state
  const [loading, setLoading]             = useState(true);
  const [submitting, setSubmitting]       = useState(false);
  const [showAddModal, setShowAddModal]   = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser]   = useState(null);
  const [toast, setToast]                 = useState(null);

  // Filter / pagination state
  const [searchTerm, setSearchTerm]   = useState("");
  const [filterRole, setFilterRole]   = useState("ALL");
  const [currentPage, setCurrentPage] = useState(0);
  const PAGE_SIZE = 20;

  const [formData, setFormData] = useState({
    employeeId: "", name: "", email: "", role: "EMPLOYEE", password: "", active: true,
  });

  // ── Fetch users ────────────────────────────────────────────────────────────
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page: currentPage, size: PAGE_SIZE, sort: "createdAt", dir: "desc" };
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (filterRole !== "ALL") params.role = filterRole;
      const res  = await fetchUsers(params);
      const data = res.data?.data || res.data;
      setUsers(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalCount(data.totalElements || 0);
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to load users", "error");
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, filterRole]);

  // ── Fetch stats ────────────────────────────────────────────────────────────
  const loadStats = useCallback(async () => {
    try {
      const res = await fetchUserStats();
      setStats(res.data?.data || res.data);
    } catch { /* non-critical */ }
  }, []);

  useEffect(() => { loadUsers(); loadStats(); }, [loadUsers, loadStats]);

  // Debounce search / role change
  useEffect(() => {
    const timer = setTimeout(() => { setCurrentPage(0); loadUsers(); }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, filterRole]);

  // ── Toast helper ───────────────────────────────────────────────────────────
  const showToast = (message, type = "success") => setToast({ message, type });

  // ── CRUD handlers ──────────────────────────────────────────────────────────
  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await createUser(formData);
      showToast("User created successfully");
      setShowAddModal(false);
      resetForm();
      loadUsers(); loadStats();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to create user", "error");
    } finally { setSubmitting(false); }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await updateUser(selectedUser.employeeId, formData);
      showToast("User updated successfully");
      setShowEditModal(false); setSelectedUser(null); resetForm(); loadUsers();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update user", "error");
    } finally { setSubmitting(false); }
  };

  const handleDeleteUser = async (employeeId) => {
    if (!window.confirm(`Delete user ${employeeId}? This cannot be undone.`)) return;
    try {
      await deleteUser(employeeId);
      showToast("User deleted"); loadUsers(); loadStats();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete user", "error");
    }
  };

  const handleToggleStatus = async (employeeId, currentActive) => {
    try {
      await toggleUserStatus(employeeId, !currentActive);
      showToast(`User ${!currentActive ? "activated" : "deactivated"}`); loadUsers();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update status", "error");
    }
  };

  const openEditModal = (u) => {
    setSelectedUser(u);
    setFormData({ employeeId: u.employeeId, name: u.name, email: u.email, role: u.role, password: "", active: u.active });
    setShowEditModal(true);
  };

  const resetForm = () =>
    setFormData({ employeeId: "", name: "", email: "", role: "EMPLOYEE", password: "", active: true });

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  const getInitials = (name) =>
    name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?";

  // ── Guard ──────────────────────────────────────────────────────────────────
  if (user?.role !== "ADMIN") {
    return (
      <div className="user-management-container">
        <div className="access-denied">
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h2>Access Denied</h2>
          <p>Only administrators can manage users.</p>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="user-management-container">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="um-header">
        <div className="um-title-section">
          <h1>User Management</h1>
          <p className="um-subtitle">
            Manage system users and access permissions
            {totalCount > 0 && <span className="um-count"> — {totalCount} users</span>}
          </p>
        </div>
        <button className="um-add-btn" onClick={() => setShowAddModal(true)}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add New User
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="um-stats-bar">
          <div className="stat-pill"><span className="stat-label">Total</span><span className="stat-value">{stats.total}</span></div>
          <div className="stat-pill active"><span className="stat-label">Active</span><span className="stat-value">{stats.active}</span></div>
          <div className="stat-pill inactive"><span className="stat-label">Inactive</span><span className="stat-value">{stats.inactive}</span></div>
          <div className="stat-pill admin"><span className="stat-label">Admins</span><span className="stat-value">{stats.admins}</span></div>
          <div className="stat-pill employee"><span className="stat-label">Employees</span><span className="stat-value">{stats.employees}</span></div>
        </div>
      )}

      {/* Filters */}
      <div className="um-filters">
        <div className="um-search-box">
          <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" /><line x1="16.5" y1="16.5" x2="22" y2="22" />
          </svg>
          <input
            type="text"
            placeholder="Search by name, email, or employee ID…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && <button className="search-clear" onClick={() => setSearchTerm("")}>×</button>}
        </div>
        <div className="um-role-filter">
          <label>Role</label>
          <select value={filterRole} onChange={(e) => { setFilterRole(e.target.value); setCurrentPage(0); }}>
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="EMPLOYEE">Employee</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="um-table-container">
        {loading ? (
          <div className="um-loading"><div className="um-spinner" />Loading users…</div>
        ) : users.length === 0 ? (
          <div className="um-no-data">
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p>No users match your search criteria</p>
          </div>
        ) : (
          <table className="um-table">
            <thead>
              <tr>
                <th>Employee ID</th><th>Name</th><th>Email</th><th>Role</th>
                <th>Status</th><th>Created</th><th>Last Login</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id || u.employeeId}>
                  <td><span className="employee-id">{u.employeeId}</span></td>
                  <td>
                    <div className="user-name-cell">
                      <div className="user-avatar">{getInitials(u.name)}</div>
                      <span style={{ fontWeight: 500, fontSize: 13 }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ color: "var(--gray-2)", fontSize: 12.5 }}>{u.email}</td>
                  <td><span className={`role-badge role-${u.role?.toLowerCase()}`}>{u.role}</span></td>
                  <td>
                    <button
                      className={`status-toggle ${u.active ? "active" : "inactive"}`}
                      onClick={() => handleToggleStatus(u.employeeId, u.active)}
                      disabled={u.employeeId === "ADMIN001" && u.active}
                    >
                      {u.active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--gray-3)" }}>{formatDate(u.createdAt)}</td>
                  <td style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--gray-3)" }}>{formatDate(u.lastLogin)}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="action-btn edit-btn" onClick={() => openEditModal(u)} title="Edit">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => handleDeleteUser(u.employeeId)}
                        title="Delete"
                        disabled={u.employeeId === "ADMIN001"}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="um-pagination">
          <button className="page-btn" onClick={() => setCurrentPage((p) => Math.max(0, p - 1))} disabled={currentPage === 0}>← Prev</button>
          <span className="page-info">Page {currentPage + 1} of {totalPages}</span>
          <button className="page-btn" onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))} disabled={currentPage >= totalPages - 1}>Next →</button>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <FormModal title="Add New User" onSubmit={handleAddUser} onClose={() => { setShowAddModal(false); resetForm(); }} submitLabel="Add User" submitting={submitting}>
          <div className="form-group">
            <label>Employee ID *</label>
            <input type="text" value={formData.employeeId} onChange={(e) => setFormData({ ...formData, employeeId: e.target.value.toUpperCase() })} required placeholder="e.g. EMP004" />
          </div>
          <div className="form-group">
            <label>Full Name *</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="Enter full name" />
          </div>
          <div className="form-group">
            <label>Email *</label>
            <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required placeholder="user@swift.com" />
          </div>
          <div className="form-group">
            <label>Password *</label>
            <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required placeholder="Min. 6 characters" minLength={6} />
          </div>
          <div className="form-group">
            <label>Role *</label>
            <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
              <option value="EMPLOYEE">Employee</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>
          <div className="form-group checkbox-group">
            <label>
              <input type="checkbox" checked={formData.active} onChange={(e) => setFormData({ ...formData, active: e.target.checked })} />
              <span>Active User</span>
            </label>
          </div>
        </FormModal>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <FormModal title="Edit User" onSubmit={handleEditUser} onClose={() => { setShowEditModal(false); setSelectedUser(null); resetForm(); }} submitLabel="Save Changes" submitting={submitting}>
          <div className="form-group">
            <label>Employee ID</label>
            <input type="text" value={formData.employeeId} disabled className="disabled-input" />
          </div>
          <div className="form-group">
            <label>Full Name *</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Email *</label>
            <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>New Password <span style={{ color: "var(--gray-3)", fontWeight: 400, textTransform: "none" }}>(leave blank to keep current)</span></label>
            <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Enter new password" minLength={6} />
          </div>
          <div className="form-group">
            <label>Role *</label>
            <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} disabled={selectedUser.employeeId === "ADMIN001"}>
              <option value="EMPLOYEE">Employee</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>
          <div className="form-group checkbox-group">
            <label>
              <input type="checkbox" checked={formData.active} onChange={(e) => setFormData({ ...formData, active: e.target.checked })} disabled={selectedUser.employeeId === "ADMIN001"} />
              <span>Active User</span>
            </label>
          </div>
        </FormModal>
      )}
    </div>
  );
}

export default UserManagement;