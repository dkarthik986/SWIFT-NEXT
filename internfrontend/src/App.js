import React from "react";
import { AuthProvider, useAuth } from "./AuthContext";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import "./App.css";

function AppContent() {
  const { user } = useAuth();

  if (!user) {
    return <Login />;
  }

  return <Dashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}