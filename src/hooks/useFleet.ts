import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export interface Vehicle {
  id: string;
  name: string;
  plate: string;
  driver_name: string;
  driver_id: string;
  status: 'ACTIVE' | 'IDLE' | 'MAINTENANCE';
  battery: string;
  temp: string;
  location: string;
  current_lat: number;
  current_lng: number;
  last_update: string;
}

export function useFleet() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVehicles = async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/fleet', {
        headers: { 'x-user-id': user.uid }
      });
      if (res.ok) {
        setVehicles(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch fleet', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [user?.uid]);

  const updateTelemetry = async (id: string, data: Partial<Vehicle>) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/fleet/${id}/telemetry`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user.uid 
        },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        await fetchVehicles();
      }
    } catch (err) {
      console.error('Failed to update telemetry', err);
    }
  };

  return { vehicles, loading, updateTelemetry, refresh: fetchVehicles };
}
