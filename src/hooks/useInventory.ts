import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  unit: string;
  location: string;
  updated_at: string;
}

export function useInventory() {
  const { user } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInventory = async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/inventory', {
        headers: { 'x-user-id': user.uid }
      });
      if (res.ok) {
        setItems(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch inventory', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [user?.uid]);

  const updatePrice = async (id: string, name: string, newPrice: number) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/inventory/${id}/price`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user.uid 
        },
        body: JSON.stringify({ price: newPrice, name })
      });
      if (res.ok) {
        await fetchInventory();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to update price', err);
      return false;
    }
  };

  const addItem = async (data: Omit<InventoryItem, 'id' | 'updated_at'>) => {
    if (!user) return;
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user.uid 
        },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        await fetchInventory();
        return await res.json();
      }
    } catch (err) {
      console.error('Failed to add item', err);
    }
  };

  const updateStock = async (id: string, quantity: number) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/inventory/${id}/stock`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user.uid 
        },
        body: JSON.stringify({ quantity })
      });
      if (res.ok) {
        await fetchInventory();
        return true;
      }
    } catch (err) {
      console.error('Failed to update stock', err);
      return false;
    }
  };

  return { items, loading, updatePrice, addItem, updateStock, refresh: fetchInventory };
}
