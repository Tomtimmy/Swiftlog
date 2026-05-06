import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<User>;
  logout: () => void;
  refreshUser: (updatedData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthProvider: Initializing session check...');
    try {
      const savedUser = localStorage.getItem('auth_session');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        console.log('AuthProvider: Restored user', parsed.email);
        setUser(parsed);
      } else {
        console.log('AuthProvider: No session found');
      }
    } catch (err) {
      console.error('Failed to restore session:', err);
      localStorage.removeItem('auth_session');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password?: string) => {
    console.log('AuthProvider: Attempting login for', email);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned ${response.status}`);
      }

      const dbUser = await response.json();
      const mappedUser: User = {
        uid: dbUser.id,
        tenantId: dbUser.tenant_id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        avatar: dbUser.avatar
      };

      setUser(mappedUser);
      localStorage.setItem('auth_session', JSON.stringify(mappedUser));
      console.log('AuthProvider: Login successful', mappedUser.email);
      return mappedUser;
    } catch (err) {
      console.error('AuthProvider: Login failed', err);
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_session');
  };

  const refreshUser = (updatedData: Partial<User>) => {
    if (user) {
      const newUser = { ...user, ...updatedData };
      setUser(newUser);
      localStorage.setItem('auth_session', JSON.stringify(newUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
