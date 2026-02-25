import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { ...(token && { Authorization: `Bearer ${token}` }) };
        const res = await fetch('/api/currentuser', { credentials: 'include', headers });
        if (res.ok) {
          const userData = await res.json();
          setUser(userData || null);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Session check failed', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
