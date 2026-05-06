import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: number;
  created_at: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/notifications', {
        headers: { 'x-user-id': user.uid }
      });
      if (res.ok) {
        setNotifications(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll for notifications every 30 seconds for "real-time" alerts
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user?.uid]);

  const markAsRead = async (id: string) => {
    if (!user) return;
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
        headers: { 'x-user-id': user.uid }
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  return { notifications, loading, markAsRead, refresh: fetchNotifications };
}
