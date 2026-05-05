import { useState, useEffect } from 'react';
import { Task, TaskStatus } from '../types';
import { useAuth } from './useAuth';

const MOCK_TASKS: Task[] = [
  {
    id: 'T-1',
    tenantId: 'TENANT-001',
    title: 'Review driver documentation',
    description: 'Check license expiration for newly onboarded drivers.',
    priority: 'HIGH',
    status: 'TODO',
    createdAt: '2026-05-04T09:00:00Z'
  },
  {
    id: 'T-2',
    tenantId: 'TENANT-001',
    title: 'Maintenance VK-902',
    description: 'Scheduled oil change and brake inspection.',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    assignedUserId: 'U-001',
    createdAt: '2026-05-04T10:00:00Z'
  },
  {
    id: 'T-3',
    tenantId: 'TENANT-001',
    title: 'Quarterly compliance audit',
    description: 'Ensure all shipments from Q1 have proper insurance records.',
    priority: 'LOW',
    status: 'COMPLETED',
    createdAt: '2026-05-01T14:00:00Z'
  },
  {
    id: 'T-99',
    tenantId: 'TENANT-002',
    title: 'Secret Task Company B',
    description: 'Should not be seen by Company A',
    priority: 'HIGH',
    status: 'TODO',
    createdAt: '2026-05-04T09:00:00Z'
  }
];

export function useTasks() {
  const { tenantId, user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!tenantId) return;

    // Load from LocalStorage first (Offline-First)
    const localTasks = localStorage.getItem(`tasks_${tenantId}`);
    if (localTasks) {
      setTasks(JSON.parse(localTasks));
      setLoading(false);
    }

    // Simulate API Fetch
    const timer = setTimeout(() => {
      const serverTasks = MOCK_TASKS.filter(t => t.tenantId === tenantId);
      
      setTasks(prev => {
        // Merge server tasks with local personal tasks
        const personalTasks = prev.filter(t => t.isPersonal);
        const merged = [...serverTasks, ...personalTasks];
        localStorage.setItem(`tasks_${tenantId}`, JSON.stringify(merged));
        return merged;
      });
      setLoading(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [tenantId]);

  const moveTask = (id: string, status: TaskStatus) => {
    setTasks(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, status, isSyncing: isOffline } : t);
      localStorage.setItem(`tasks_${tenantId}`, JSON.stringify(updated));
      return updated;
    });
  };

  const addPersonalTask = (title: string) => {
    if (!tenantId || !user) return;
    const newTask: Task = {
      id: `P-${Date.now()}`,
      tenantId,
      title,
      description: 'Personal task',
      priority: 'MEDIUM',
      status: 'TODO',
      isPersonal: true,
      isSyncing: isOffline,
      createdAt: new Date().toISOString()
    };
    setTasks(prev => {
      const updated = [newTask, ...prev];
      localStorage.setItem(`tasks_${tenantId}`, JSON.stringify(updated));
      return updated;
    });
  };

  return { tasks, loading, moveTask, addPersonalTask, isOffline };
}
