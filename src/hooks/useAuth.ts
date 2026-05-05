import { useState, useEffect } from 'react';
import { User, UserRole } from '../types';

const MOCK_USERS: Record<string, User> = {
  'admin@swiftconnect.com': {
    uid: 'USR-005',
    tenantId: 'TENANT-001',
    email: 'admin@swiftconnect.com',
    name: 'Admin User',
    role: 'ADMIN',
    avatar: 'AU'
  },
  'driver@swiftconnect.com': {
    uid: 'USR-008',
    tenantId: 'TENANT-001',
    email: 'driver@swiftconnect.com',
    name: 'Delivery Driver',
    role: 'DRIVER',
    avatar: 'DD'
  },
  'manager@swiftconnect.com': {
    uid: 'USR-010',
    tenantId: 'TENANT-001',
    email: 'manager@swiftconnect.com',
    name: 'Ops Manager',
    role: 'COORDINATOR',
    avatar: 'OM'
  }
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check localStorage for session
    try {
      const savedUser = localStorage.getItem('auth_session');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (err) {
      console.error('Failed to restore session:', err);
      localStorage.removeItem('auth_session');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password?: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
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
      return mappedUser;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_session');
  };

  return { user, loading, tenantId: user?.tenantId, login, logout };
}
