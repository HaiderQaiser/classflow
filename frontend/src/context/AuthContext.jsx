import React, { createContext, useState, useEffect } from 'react';

// 1. Central Notice Board (Context) Create karein
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 2. Page Reload Restore Check
  // Screen refresh hone par dekho kya browser ki storage mein pehle se token para hai?
  useEffect(() => {
    const storedUser = localStorage.getItem('user_info');
    const token = localStorage.getItem('access_token');
    
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // 3. Login Helper Function
  // User login hone par token aur user profile ko browser memory (localStorage) mein save karein
  const login = (token, userData) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('user_info', JSON.stringify(userData));
    setUser(userData);
  };

  // 4. Logout Helper Function
  // Token clear karke status null karein
  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_info');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};