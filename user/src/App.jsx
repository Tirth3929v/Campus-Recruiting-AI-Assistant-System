import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Dashboard from './pages/Dashboard';
import InterviewPage from './pages/InterviewPage';
import Login from './pages/Login';
import Register from './pages/Register';
import SignUp from './pages/Signup';
import ProtectedRoute from './pages/ProtectedRoute';
import ProfilePage from './pages/ProfilePage';
import JobsPage from './pages/JobsPage';
import CoursesPage from './pages/CoursesPage';
// import HistoryPage from './pages/HistoryPage'; // Create this for the history route

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/signup" element={<SignUp />} />

            {/* Student Routes Group */}
            <Route path="/student">
              <Route path="dashboard" element={
                <ProtectedRoute><Dashboard /></ProtectedRoute>
              } />
              <Route path="interview" element={
                <ProtectedRoute><InterviewPage /></ProtectedRoute>
              } />
              <Route path="profile" element={
                <ProtectedRoute><ProfilePage /></ProtectedRoute>
              } />
              <Route path="jobs" element={
                <ProtectedRoute><JobsPage /></ProtectedRoute>
              } />
              <Route path="courses" element={
                <ProtectedRoute><CoursesPage /></ProtectedRoute>
              } />
              <Route path="history" element={
                <ProtectedRoute><div>History Page Placeholder</div></ProtectedRoute>
              } />
            </Route>

            {/* Default Redirects */}
            <Route path="/" element={<Navigate to="/student/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/student/dashboard" replace />} />
          </Routes>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;