import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import UserLayout from './layouts/UserLayout';
import Dashboard from './pages/Dashboard';
import InterviewPage from './pages/InterviewPage';
import Login from './pages/Login';
import Register from './pages/Register';
import SignUp from './pages/Signup';
import ProtectedRoute from './pages/ProtectedRoute';
import ProfilePage from './pages/ProfilePage';
import JobsPage from './pages/JobsPage';
import CoursesPage from './pages/CoursesPage';
import CourseViewer from './pages/CourseViewer';
import HistoryPage from './pages/HistoryPage';

const App = () => {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <ThemeProvider>
          <Routes>
            {/* ---------- Public ---------- */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/signup" element={<SignUp />} />

            {/* ---------- Student Portal (with persistent sidebar layout) ---------- */}
            <Route
              path="/student"
              element={
                <ProtectedRoute>
                  <UserLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="interview" element={<InterviewPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="jobs" element={<JobsPage />} />
              <Route path="courses" element={<CoursesPage />} />
              <Route path="courses/:id" element={<CourseViewer />} />
              <Route path="history" element={<HistoryPage />} />
            </Route>

            {/* ---------- Redirects ---------- */}
            <Route path="/" element={<Navigate to="/student/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/student/dashboard" replace />} />
          </Routes>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;