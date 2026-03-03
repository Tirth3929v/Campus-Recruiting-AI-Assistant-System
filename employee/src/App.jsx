import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Layout & Route Guards
import EmployeeLayout from './pages/EmployeeLayout';
import ProtectedRoute from './pages/ProtectedRoute';

// Public pages
import Login from './pages/Login';
import EmployeeRegister from './pages/EmployeeRegister';

// Employee pages
import EmployeeDashboard from './pages/EmployeeDashboard';
import CourseBuilder from './pages/CourseBuilder';
import JobBoard from './pages/JobBoard';
import MyProfile from './pages/MyProfile';

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <Routes>
            {/* ---------- Public ---------- */}
            <Route path="/login" element={<Login />} />
            <Route path="/employee/register" element={<EmployeeRegister />} />

            {/* ---------- Employee Panel ---------- */}
            <Route
              path="/employee"
              element={
                <ProtectedRoute>
                  <EmployeeLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<EmployeeDashboard />} />
              <Route path="courses" element={<CourseBuilder />} />
              <Route path="jobs" element={<JobBoard />} />
              <Route path="profile" element={<MyProfile />} />
            </Route>

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