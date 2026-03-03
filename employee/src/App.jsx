import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Layout
import AdminLayout from './pages/AdminLayout';

// Pages & Components (Employee)
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard'; // (Now labeled EmployeeDashboard internally)
import ManageUsers from './pages/ManageUsers';
import ManageJobs from './pages/ManageJobs';
import CourseBuilder from './pages/CourseBuilder';
import ProtectedRoute from './pages/ProtectedRoute';
import EmployeeLayout from './pages/AdminLayout';    // (Renamed internally)

// Pages & Components (Admin)
import AdminLogin from './pages/AdminLogin';
import AdminPanel from './pages/AdminPanel';
import AdminProtectedRoute from './pages/AdminProtectedRoute';

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <Routes>

            {/* ---------- Public ---------- */}
            <Route path="/login" element={<Login />} />
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* ---------- Employee Panel ---------- */}
            <Route
              path="/employee"
              element={
                <ProtectedRoute>
                  <EmployeeLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<ManageUsers />} />
              <Route path="jobs" element={<ManageJobs />} />
              <Route path="courses" element={<CourseBuilder />} />
            </Route>

            {/* ---------- Admin Panel ---------- */}
            <Route
              path="/admin"
              element={
                <AdminProtectedRoute>
                  <AdminPanel />
                </AdminProtectedRoute>
              }
            />

            {/* ---------- Redirects ---------- */}
            <Route path="/" element={<Navigate to="/employee" replace />} />
            <Route path="*" element={<Navigate to="/employee" replace />} />

          </Routes>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;