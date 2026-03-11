import React, { useState } from "react";
import { useAuth } from "../AuthContext";
import Search from "./Search";
import UserManagement from "./UserManagement";
import Profile from "./Profile";
import "./css/Dashboard.css";

function Dashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("search");
  const [showNotifications, setShowNotifications] = useState(false);

  const formatLastLogin = () => {
    const date = new Date();
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();
    const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    return `${day} ${month} ${year} ${time}`;
  };

  const renderContent = () => {
    switch (activeTab) {
      case "search":
        return <Search />;
      case "userManagement":
        return <UserManagement />;
      case "profile":
        return <Profile />;
      default:
        return <Search />;
    }
  };

  return (
    <div className="dashboard-container">
      {/* Top Navbar */}
      <nav className="dashboard-navbar">
        <div className="navbar-left">
          <div className="welcome-section">
            <span className="welcome-text">Welcome,</span>
            <span className="last-login">Last Login: {formatLastLogin()}</span>
          </div>
        </div>

        <div className="navbar-right">
          {/* Notifications */}
          <div className="notification-wrapper">
            <button 
              className="notification-btn"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <span className="notification-badge">3</span>
            </button>
            
            {showNotifications && (
              <div className="notification-dropdown">
                <div className="notification-header">
                  <h4>Notifications</h4>
                  <span className="notification-count">3 New</span>
                </div>
                <div className="notification-list">
                  <div className="notification-item">
                    <div className="notification-dot"/>
                    <div className="notification-content">
                      <p className="notification-title">New SWIFT message received</p>
                      <p className="notification-time">2 minutes ago</p>
                    </div>
                  </div>
                  <div className="notification-item">
                    <div className="notification-dot"/>
                    <div className="notification-content">
                      <p className="notification-title">System maintenance scheduled</p>
                      <p className="notification-time">1 hour ago</p>
                    </div>
                  </div>
                  <div className="notification-item">
                    <div className="notification-dot"/>
                    <div className="notification-content">
                      <p className="notification-title">User access updated</p>
                      <p className="notification-time">3 hours ago</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Logout Button */}
          <button className="logout-btn" onClick={logout}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Logout
          </button>
        </div>
      </nav>

      {/* Horizontal Tab Navigation */}
      <div className="tab-navigation">
        <div className="tabs-container">
          <button
            className={`tab-item ${activeTab === "search" ? "active" : ""}`}
            onClick={() => setActiveTab("search")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <span>Message Search</span>
          </button>

          <button
            className={`tab-item ${activeTab === "userManagement" ? "active" : ""}`}
            onClick={() => setActiveTab("userManagement")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <span>User Management</span>
          </button>

          <button
            className={`tab-item ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span>Profile</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="dashboard-content">
        {renderContent()}
      </div>
    </div>
  );
}

export default Dashboard;