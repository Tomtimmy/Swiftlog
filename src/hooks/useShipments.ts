import { useState, useEffect } from 'react';
import { Shipment, ShipmentStatus } from '../types';
import { useAuth } from './useAuth';

export function useShipments() {
  const { user } = useAuth();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchShipments = async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/shipments', {
        headers: { 'x-user-id': user.uid }
      });
      if (res.ok) {
        setShipments(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch shipments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, [user?.uid]);

  const updateStatus = async (id: string, status: ShipmentStatus) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/shipments/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user.uid 
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        await fetchShipments();
      }
    } catch (err) {
      console.error('Failed to update shipment status', err);
    }
  };

  const assignDriver = async (id: string, driverId: string) => {
    // Note: Implementation for driver assignment would follow same pattern
    console.log('Driver assignment intended for', id, driverId);
  };

  const updateLocation = async (id: string, field: 'origin' | 'destination', value: string) => {
    console.log('Location update intended for', id, field, value);
  };

  const bulkUpdateStatus = async (ids: string[], status: ShipmentStatus) => {
    for (const id of ids) {
      await updateStatus(id, status);
    }
  };

  const MOCK_DRIVERS = [
    { id: 'DRV-001', name: 'Marco Rossi' },
    { id: 'DRV-002', name: 'Elena Petrova' },
    { id: 'DRV-003', name: 'Sam Wilson' },
    { id: 'DRV-004', name: 'Tanaka Ken' },
    { id: 'DRV-005', name: 'Sarah Miller' },
  ];

  return { shipments, loading, updateStatus, assignDriver, updateLocation, bulkUpdateStatus, drivers: MOCK_DRIVERS };
}
