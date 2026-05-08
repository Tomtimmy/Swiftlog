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
      console.log('usePermissions: Fetching for', user.role);
      try {
        const res = await fetch('/api/permissions', {
          headers: { 'x-user-id': user.uid }
        });
        if (res.ok) {
          const data = await res.json();
          console.log('usePermissions: Loaded', data.length, 'rules');
          setPermissions(data);
        } else {
          console.error('usePermissions: API error', res.status);
        }
      } catch (err) {
        console.error('Failed to fetch permissions', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPermissions();
  }, [user?.uid]); // Specifically watch UID

  const hasPermission = (feature: string) => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    return permissions.find(p => p.role === user.role && p.feature?.toLowerCase() === feature?.toLowerCase())?.enabled === 1;
  };

  return { permissions, loading, hasPermission };
}
