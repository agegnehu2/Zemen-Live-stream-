import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('zemen_user');
    return raw ? JSON.parse(raw) : null;
  });

  function login(token, userData) {
    localStorage.setItem('zemen_token', token);
    localStorage.setItem('zemen_user', JSON.stringify(userData));
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('zemen_token');
    localStorage.removeItem('zemen_user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
