import { useState, useEffect } from 'react';
import { Expense, ExpenseStatus } from '../types';
import { useAuth } from './useAuth';

export function useFinance() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExpenses = async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/finance/expenses', {
        headers: { 'x-user-id': user.uid }
      });
      if (res.ok) {
        setExpenses(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch expenses', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [user?.uid]);

  const addExpense = async (data: Omit<Expense, 'id' | 'tenantId' | 'userId' | 'status' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    try {
      const res = await fetch('/api/finance/expenses', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user.uid 
        },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        await fetchExpenses();
        return await res.json();
      }
    } catch (err) {
      console.error('Failed to add expense', err);
    }
  };

  const updateExpenseStatus = async (expenseId: string, status: ExpenseStatus) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/finance/expenses/${expenseId}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user.uid 
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        await fetchExpenses();
      }
    } catch (err) {
      console.error('Failed to update expense status', err);
    }
  };

  return { expenses, loading, addExpense, updateExpenseStatus, refresh: fetchExpenses };
}
