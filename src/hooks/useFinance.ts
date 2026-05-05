import { useState, useEffect } from 'react';
import { Expense, ExpenseStatus } from '../types';
import { useAuth } from './useAuth';

const MOCK_EXPENSES: Expense[] = [
  {
    id: 'EXP-001',
    tenantId: 'TENANT-001',
    userId: 'USR-005',
    amount: 150.50,
    currency: 'USD',
    category: 'Travel',
    description: 'Uber to Airport',
    vendor: 'Uber',
    date: '2026-05-01',
    status: 'RECEIVED',
    createdAt: '2026-05-01T09:00:00Z',
    updatedAt: '2026-05-04T10:00:00Z'
  },
  {
    id: 'EXP-002',
    tenantId: 'TENANT-001',
    userId: 'USR-001',
    amount: 45.00,
    currency: 'USD',
    category: 'Food',
    description: 'Client Lunch',
    vendor: 'Starbucks',
    date: '2026-05-03',
    status: 'APPROVED',
    createdAt: '2026-05-03T13:00:00Z',
    updatedAt: '2026-05-04T09:00:00Z'
  }
];

export function useFinance() {
  const { tenantId, user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    const timer = setTimeout(() => {
      setExpenses(MOCK_EXPENSES.filter(e => e.tenantId === tenantId));
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [tenantId]);

  const addExpense = async (data: Omit<Expense, 'id' | 'tenantId' | 'userId' | 'status' | 'createdAt' | 'updatedAt'>) => {
    if (!tenantId || !user) return;
    const newExpense: Expense = {
      ...data,
      id: `EXP-${Math.floor(Math.random() * 1000)}`,
      tenantId: tenantId,
      userId: user.uid,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setExpenses(prev => [newExpense, ...prev]);
    return newExpense;
  };

  const updateExpenseStatus = async (expenseId: string, status: ExpenseStatus) => {
    setExpenses(prev => prev.map(e => 
      e.id === expenseId ? { ...e, status, updatedAt: new Date().toISOString() } : e
    ));
  };

  return { expenses, loading, addExpense, updateExpenseStatus };
}
