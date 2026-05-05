import { useState, useEffect } from 'react';
import { Notification } from '../types';

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    userId: 'current-user',
    message: 'Shipment SH-103 is delayed due to weather in Dallas.',
    read: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'n2',
    userId: 'current-user',
    message: 'New driver Marco Rossi has been assigned to VK-902.',
    read: true,
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'n3',
    userId: 'current-user',
    message: 'Critical: Vehicle VK-440 reported engine temperature anomaly.',
    read: false,
    createdAt: new Date(Date.now() - 7200000).toISOString()
  }
];

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setNotifications(MOCK_NOTIFICATIONS);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  return { notifications, loading, markAsRead };
}
