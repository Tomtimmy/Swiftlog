import { useState, useEffect } from 'react';
import { Task, TaskStatus } from '../types';
import { useAuth } from './useAuth';

export function useTasks() {
  const { user } = useAuth();
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

  const fetchTasks = async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/tasks', {
        headers: { 'x-user-id': user.uid }
      });
      if (res.ok) {
        setTasks(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch tasks', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [user?.uid]);

  const moveTask = async (id: string, status: TaskStatus) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/tasks/${id}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user.uid 
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        await fetchTasks();
      }
    } catch (err) {
      console.error('Failed to update task status', err);
    }
  };

  const addPersonalTask = async (title: string) => {
    return await createTask({ title, isPersonal: true });
  };

  const createTask = async (data: { title: string, description?: string, priority?: string, assignedUserId?: string, location?: string, isPersonal?: boolean }) => {
    if (!user) return;
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user.uid 
        },
        body: JSON.stringify({ 
          ...data,
          is_personal: data.isPersonal 
        })
      });
      if (res.ok) {
        await fetchTasks();
        return true;
      }
    } catch (err) {
      console.error('Failed to create task', err);
    }
    return false;
  };

  return { tasks, loading, moveTask, addPersonalTask, createTask, isOffline };
}
