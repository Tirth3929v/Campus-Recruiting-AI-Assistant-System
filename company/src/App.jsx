import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import CompanyLayout from './layouts/CompanyLayout';
import CompanyDashboard from './pages/CompanyDashboard';
import ManageJobs from './pages/ManageJobs';
import ApplicantsPage from './pages/ApplicantsPage';
import CompanyProfilePage from './pages/CompanyProfilePage';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './pages/ProtectedRoute';

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Company Portal */}
            <Route
              path="/company"
              element={
                <ProtectedRoute>
                  <CompanyLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<CompanyDashboard />} />
              <Route path="jobs" element={<ManageJobs />} />
              <Route path="applicants" element={<ApplicantsPage />} />
              <Route path="profile" element={<CompanyProfilePage />} />
            </Route>

            {/* Redirects */}
            <Route path="/" element={<Navigate to="/company/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/company/dashboard" replace />} />
          </Routes>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;