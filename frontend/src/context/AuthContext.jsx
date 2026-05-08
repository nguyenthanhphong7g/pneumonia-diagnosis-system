import { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUsername = localStorage.getItem('username');
    const savedRole = localStorage.getItem('role');
    const savedUserId = localStorage.getItem('userId');

    if (savedToken && savedUsername) {
      setToken(savedToken);
      setUser({ username: savedUsername, role: savedRole, userId: savedUserId });
    }
  }, []);

  const login = (newToken, username, role = 'PATIENT', userId) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('username', username);
    localStorage.setItem('role', role);
    localStorage.setItem('userId', userId);
    setToken(newToken);
    setUser({ username, role, userId });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};