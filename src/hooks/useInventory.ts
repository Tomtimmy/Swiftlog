import { useState, useEffect } from 'react';
import { StockTransfer, InventoryItem, TransferStatus } from '../types';
import { useAuth } from './useAuth';

const MOCK_INVENTORY: InventoryItem[] = [
  { sku: 'SKU-A100', name: 'Premium Coffee Beans', quantity: 500, locationId: 'WH-NY', tenantId: 'TENANT-001' },
  { sku: 'SKU-B200', name: 'Organic Honey', quantity: 250, locationId: 'WH-NY', tenantId: 'TENANT-001' },
  { sku: 'SKU-C300', name: 'Dark Chocolate', quantity: 120, locationId: 'WH-LA', tenantId: 'TENANT-001' },
];

const MOCK_TRANSFERS: StockTransfer[] = [
  {
    id: 'TRF-001',
    tenantId: 'TENANT-001',
    source: 'Factory-01',
    destination: 'WH-NY',
    sku: 'SKU-A100',
    quantity: 100,
    status: 'IN_TRANSIT',
    initiatedBy: 'USR-001',
    createdAt: '2026-05-04T08:00:00Z'
  }
];

export function useInventory() {
  const { tenantId, user } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    // Simulate API call filtering by tenantId
    const timer = setTimeout(() => {
      setInventory(MOCK_INVENTORY.filter(i => i.tenantId === tenantId));
      setTransfers(MOCK_TRANSFERS.filter(t => t.tenantId === tenantId));
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [tenantId]);

  const initiateTransfer = async (data: Omit<StockTransfer, 'id' | 'tenantId' | 'status' | 'createdAt' | 'initiatedBy'>) => {
    if (!tenantId || !user) return;
    const newTransfer: StockTransfer = {
      ...data,
      id: `TRF-${Math.floor(Math.random() * 1000)}`,
      tenantId: tenantId,
      status: 'IN_TRANSIT',
      initiatedBy: user.uid,
      createdAt: new Date().toISOString()
    };
    setTransfers(prev => [newTransfer, ...prev]);
    return newTransfer;
  };

  const receiveTransfer = async (transferId: string) => {
    if (!tenantId || !user) return;
    setTransfers(prev => prev.map(t => {
      if (t.id === transferId) {
        // Update inventory logic
        setInventory(inv => {
          const item = inv.find(i => i.sku === t.sku && i.locationId === t.destination);
          if (item) {
            return inv.map(i => (i.sku === t.sku && i.locationId === t.destination) ? { ...i, quantity: i.quantity + t.quantity } : i);
          } else {
            return [...inv, { sku: t.sku, name: `Product ${t.sku}`, quantity: t.quantity, locationId: t.destination, tenantId: tenantId }];
          }
        });
        return { ...t, status: 'RECEIVED', receivedBy: user.uid };
      }
      return t;
    }));
  };

  return { inventory, transfers, loading, initiateTransfer, receiveTransfer };
}
