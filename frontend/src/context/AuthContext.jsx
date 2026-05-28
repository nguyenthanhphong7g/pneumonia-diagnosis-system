import { createContext, useState } from 'react';

export const AuthContext = createContext();

const normalizeRole = (role) => (role ? String(role).toUpperCase() : 'PATIENT');

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => sessionStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    const savedToken = sessionStorage.getItem('token');
    const savedUsername = sessionStorage.getItem('username');
    const savedRole = normalizeRole(sessionStorage.getItem('role'));
    const savedUserId = sessionStorage.getItem('userId');

    if (savedToken && savedUsername) {
      return { username: savedUsername, role: savedRole, userId: savedUserId };
    }

    return null;
  });

  const login = (newToken, username, role = 'PATIENT', userId) => {
    const normalizedRole = normalizeRole(role);
    sessionStorage.setItem('token', newToken);
    sessionStorage.setItem('username', username);
    sessionStorage.setItem('role', normalizedRole);
    sessionStorage.setItem('userId', userId);
    setToken(newToken);
    setUser({ username, role: normalizedRole, userId });
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('role');
    sessionStorage.removeItem('userId');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};