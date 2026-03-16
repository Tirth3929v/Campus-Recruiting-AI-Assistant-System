import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

const AuthLayout = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex flex-col items-center justify-center text-white">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
        <p className="text-gray-400 animate-pulse">Initializing security...</p>
      </div>
    );
  }

  // Redirect to dashboard if already logged in and trying to access auth pages
  if (user) {
    return <Navigate to="/student/dashboard" replace />;
  }

  return (
    <div className="auth-layout min-h-screen">
      <Outlet />
    </div>
  );
};

export default AuthLayout;
