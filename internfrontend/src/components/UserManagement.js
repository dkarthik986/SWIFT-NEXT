import React, { useState, useEffect } from "react";
import { useAuth } from "../AuthContext";
import "./css/UserManagement.css";

function UserManagement() {
  const { authFetch, user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    employeeId: "",
    name: "",
    email: "",
    role: "EMPLOYEE",
    password: "",
    active: true
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("ALL");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const mockUsers = [
        {
          id: "1",
          employeeId: "ADMIN001",
          name: "System Administrator",
          email: "admin@swift.com",
          role: "ADMIN",
          active: true,
          createdAt: "2024-01-15T10:00:00Z",
          lastLogin: "2024-03-09T08:30:00Z"
        },
        {
          id: "2",
          employeeId: "EMP001",
          name: "John Doe",
          email: "john.doe@swift.com",
          role: "EMPLOYEE",
          active: true,
          createdAt: "2024-01-20T10:00:00Z",
          lastLogin: "2024-03-09T09:15:00Z"
        },
        {
          id: "3",
          employeeId: "EMP002",
          name: "Jane Smith",
          email: "jane.smith@swift.com",
          role: "EMPLOYEE",
          active: true,
          createdAt: "2024-02-01T10:00:00Z",
          lastLogin: "2024-03-08T14:20:00Z"
        },
        {
          id: "4",
          employeeId: "EMP003",
          name: "Robert Johnson",
          email: "robert.j@swift.com",
          role: "EMPLOYEE",
          active: false,
          createdAt: "2024-02-10T10:00:00Z",
          lastLogin: "2024-03-01T11:00:00Z"
        }
      ];
      setUsers(mockUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const newUser = {
        id: String(users.length + 1),
        ...formData,
        createdAt: new Date().toISOString(),
        lastLogin: null
      };
      setUsers([...users, newUser]);
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error("Error adding user:", error);
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    try {
      setUsers(users.map(u => u.id === selectedUser.id ? { ...u, ...formData } : u));
      setShowEditModal(false);
      setSelectedUser(null);
      resetForm();
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      setUsers(users.filter(u => u.id !== userId));
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      setUsers(users.map(u => u.id === userId ? { ...u, active: !u.active } : u));
    } catch (error) {
      console.error("Error toggling user status:", error);
    }
  };

  const openEditModal = (u) => {
    setSelectedUser(u);
    setFormData({
      employeeId: u.employeeId,
      name: u.name,
      email: u.email,
      role: u.role,
      password: "",
      active: u.active
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      employeeId: "",
      name: "",
      email: "",
      role: "EMPLOYEE",
      password: "",
      active: true
    });
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "ALL" || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getInitials = (name) =>
    name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  if (user.role !== "ADMIN") {
    return (
      <div className="user-management-container">
        <div className="access-denied">
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <h2>Access Denied</h2>
          <p>You don't have permission to access User Management.</p>
          <p>Only administrators can manage users.</p>
        </div>
      </div>
    );
  }

  const FormModal = ({ title, onSubmit, onClose, children, submitLabel }) => (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <form onSubmit={onSubmit}>
          <div style={{ padding: "24px 24px 0" }}>{children}</div>
          <div className="modal-actions" style={{ padding: "0 24px 24px" }}>
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-submit">{submitLabel}</button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="user-management-container">

      {/* Header */}
      <div className="um-header">
        <div className="um-title-section">
          <h1>User Management</h1>
          <p className="um-subtitle">Manage system users and access permissions</p>
        </div>
        <button className="um-add-btn" onClick={() => setShowAddModal(true)}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add New User
        </button>
      </div>

      {/* Filters */}
      <div className="um-filters">
        <div className="um-search-box">
          <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="16.5" y1="16.5" x2="22" y2="22"/>
          </svg>
          <input
            type="text"
            placeholder="Search by name, email, or employee ID…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="um-role-filter">
          <label>Role</label>
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)}>
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="EMPLOYEE">Employee</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="um-table-container">
        {loading ? (
          <div className="um-loading">Loading users…</div>
        ) : filteredUsers.length === 0 ? (
          <div className="um-no-data">
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p>No users match your search criteria</p>
          </div>
        ) : (
          <table className="um-table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u.id}>
                  <td>
                    <span className="employee-id">{u.employeeId}</span>
                  </td>
                  <td>
                    <div className="user-name-cell">
                      <div className="user-avatar">{getInitials(u.name)}</div>
                      <span style={{ fontWeight: 500, fontSize: 13.5 }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ color: "var(--gray-500)", fontSize: 13 }}>{u.email}</td>
                  <td>
                    <span className={`role-badge role-${u.role.toLowerCase()}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <button
                      className={`status-toggle ${u.active ? "active" : "inactive"}`}
                      onClick={() => handleToggleStatus(u.id)}
                    >
                      {u.active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--gray-400)" }}>
                    {formatDate(u.createdAt)}
                  </td>
                  <td style={{ fontFamily: "var(--mono)", fontSize: 11.5, color: "var(--gray-400)" }}>
                    {formatDate(u.lastLogin)}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="action-btn edit-btn"
                        onClick={() => openEditModal(u)}
                        title="Edit User"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => handleDeleteUser(u.id)}
                        title="Delete User"
                        disabled={u.employeeId === "ADMIN001"}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
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

      {/* Add User Modal */}
      {showAddModal && (
        <FormModal
          title="Add New User"
          onSubmit={handleAddUser}
          onClose={() => { setShowAddModal(false); resetForm(); }}
          submitLabel="Add User"
        >
          <div className="form-group">
            <label>Employee ID *</label>
            <input
              type="text"
              value={formData.employeeId}
              onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
              required
              placeholder="e.g. EMP004"
            />
          </div>
          <div className="form-group">
            <label>Full Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Enter full name"
            />
          </div>
          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="user@swift.com"
            />
          </div>
          <div className="form-group">
            <label>Password *</label>
            <input
              type="password"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              required
              placeholder="Min. 6 characters"
              minLength={6}
            />
          </div>
          <div className="form-group">
            <label>Role *</label>
            <select
              value={formData.role}
              onChange={e => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="EMPLOYEE">Employee</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={formData.active}
                onChange={e => setFormData({ ...formData, active: e.target.checked })}
              />
              <span>Active User</span>
            </label>
          </div>
        </FormModal>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <FormModal
          title="Edit User"
          onSubmit={handleEditUser}
          onClose={() => { setShowEditModal(false); setSelectedUser(null); resetForm(); }}
          submitLabel="Save Changes"
        >
          <div className="form-group">
            <label>Employee ID</label>
            <input
              type="text"
              value={formData.employeeId}
              disabled
              className="disabled-input"
            />
          </div>
          <div className="form-group">
            <label>Full Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>
              New Password{" "}
              <span style={{ color: "var(--gray-400)", fontWeight: 400 }}>
                (leave blank to keep current)
              </span>
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              placeholder="Enter new password"
              minLength={6}
            />
          </div>
          <div className="form-group">
            <label>Role *</label>
            <select
              value={formData.role}
              onChange={e => setFormData({ ...formData, role: e.target.value })}
              disabled={selectedUser.employeeId === "ADMIN001"}
            >
              <option value="EMPLOYEE">Employee</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={formData.active}
                onChange={e => setFormData({ ...formData, active: e.target.checked })}
              />
              <span>Active User</span>
            </label>
          </div>
        </FormModal>
      )}
    </div>
  );
}

export default UserManagement;