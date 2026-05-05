import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export interface RolePermission {
  role: string;
  feature: string;
  enabled: number;
}

export function usePermissions() {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPermissions() {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/permissions', {
          headers: { 'x-user-id': user.uid }
        });
        if (res.ok) {
          setPermissions(await res.json());
        }
      } catch (err) {
        console.error('Failed to fetch permissions', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPermissions();
  }, [user]);

  const hasPermission = (feature: string) => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    return permissions.find(p => p.role === user.role && p.feature.toLowerCase() === feature.toLowerCase())?.enabled === 1;
  };

  return { permissions, loading, hasPermission };
}
