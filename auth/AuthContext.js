import React, { createContext, useContext, useState, useEffect } from 'react';
import * as authStorage from './authStorage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const session = await authStorage.getSession();
        setUser(session);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signup = async (data) => {
    const session = await authStorage.signup(data);
    setUser(session);
    return session;
  };

  const login = async (data) => {
    const session = await authStorage.login(data);
    setUser(session);
    return session;
  };

  const logout = async () => {
    await authStorage.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
