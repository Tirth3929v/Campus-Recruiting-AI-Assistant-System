import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await axiosInstance.get('/currentuser');
      setUser(res.data || null);
    } catch (error) {
      console.error("Auth check failed:", error.response?.data?.error || error.message);
      setUser(null);
      setLoading(false); // Immediate unlock on error
    } finally {
      setLoading(false); // Robust unlock
    }
  };

  const login = async (token, userData) => {
    localStorage.setItem('student_token', token);
    setUser(userData);
  };

  const logout = async () => {
    try {
      await axiosInstance.post('/auth/logout');
    } catch (error) {
      console.error("Logout API failed:", error.message);
    }
    localStorage.removeItem('student_token');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
