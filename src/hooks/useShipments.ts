import { useState, useEffect } from 'react';
import { Shipment, ShipmentStatus } from '../types';
import { useAuth } from './useAuth';

export function useShipments() {
  const { user } = useAuth();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [drivers, setDrivers] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user) return;
    try {
      const [shipRes, driverRes] = await Promise.all([
        fetch('/api/shipments', { headers: { 'x-user-id': user.uid } }),
        fetch('/api/drivers', { headers: { 'x-user-id': user.uid } })
      ]);
      
      if (shipRes.ok) setShipments(await shipRes.json());
      if (driverRes.ok) setDrivers(await driverRes.json());
    } catch (err) {
      console.error('Failed to fetch shipments data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.uid]);

  const updateStatus = async (id: string, status: ShipmentStatus, location?: string, note?: string) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/shipments/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user.uid 
        },
        body: JSON.stringify({ status, location, note })
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to update shipment status', err);
    }
  };

  const addShipment = async (data: any) => {
    if (!user) return;
    try {
      const res = await fetch('/api/shipments', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user.uid 
        },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        await fetchData();
        return await res.json();
      }
    } catch (err) {
      console.error('Failed to create shipment', err);
    }
  };

  const assignDriver = async (id: string, driverId: string) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/shipments/${id}/assign`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user.uid 
        },
        body: JSON.stringify({ driverId })
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to assign driver', err);
    }
  };

  const updateLocation = async (id: string, field: 'origin' | 'destination', value: string) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/shipments/${id}/location`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user.uid 
        },
        body: JSON.stringify({ field, value })
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to update location', err);
    }
  };

  const bulkUpdateStatus = async (ids: string[], status: ShipmentStatus) => {
    for (const id of ids) {
      await updateStatus(id, status);
    }
  };

  return { shipments, loading, updateStatus, addShipment, assignDriver, updateLocation, bulkUpdateStatus, drivers, refresh: fetchData };
}
