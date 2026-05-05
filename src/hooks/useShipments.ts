import { useState, useEffect } from 'react';
import { Shipment, ShipmentStatus } from '../types';
import { useAuth } from './useAuth';

const MOCK_SHIPMENTS: Shipment[] = [
  {
    id: 'SH-101',
    tenantId: 'TENANT-001',
    trackingNumber: 'SW-90210-A',
    origin: 'New York Port',
    destination: 'Distribution Center A, NJ',
    status: 'IN_TRANSIT',
    estimatedDelivery: '2026-05-06T14:00:00Z',
    assignedDriverId: 'DRV-001',
    currentLat: 40.7128,
    currentLng: -74.0060,
    history: [
      { timestamp: '2026-05-01T08:00:00Z', location: 'New York Port', status: 'PENDING', note: 'Shipment created' },
      { timestamp: '2026-05-03T10:00:00Z', location: 'Jersey City Hub', status: 'IN_TRANSIT', note: 'Departed origin hub' },
    ],
    createdAt: '2026-05-01T08:00:00Z',
    updatedAt: '2026-05-05T10:00:00Z'
  },
  {
    id: 'SH-102',
    tenantId: 'TENANT-001',
    trackingNumber: 'SW-90211-B',
    origin: 'Los Angeles Hub',
    destination: 'Retail Store 42, CA',
    status: 'DELIVERED',
    estimatedDelivery: '2026-05-04T16:30:00Z',
    assignedDriverId: 'DRV-002',
    currentLat: 34.0522,
    currentLng: -118.2437,
    history: [
      { timestamp: '2026-05-02T09:00:00Z', location: 'LA Hub', status: 'PENDING', note: 'Package received' },
      { timestamp: '2026-05-03T08:30:00Z', location: 'Santa Monica', status: 'IN_TRANSIT', note: 'Out for delivery' },
      { timestamp: '2026-05-04T16:30:00Z', location: 'Retail Store 42', status: 'DELIVERED', note: 'Delivered to loading dock' },
    ],
    createdAt: '2026-05-02T09:00:00Z',
    updatedAt: '2026-05-04T16:30:00Z'
  },
  {
    id: 'SH-103',
    tenantId: 'TENANT-001',
    trackingNumber: 'SW-90212-C',
    origin: 'Dallas Logistics Center',
    destination: 'Warehouse 09, TX',
    status: 'DELAYED',
    estimatedDelivery: '2026-05-05T18:00:00Z',
    assignedDriverId: 'DRV-003',
    currentLat: 32.7767,
    currentLng: -96.7970,
    history: [
      { timestamp: '2026-05-03T11:00:00Z', location: 'Dallas Hub', status: 'PENDING', note: 'Order processed' },
      { timestamp: '2026-05-05T07:00:00Z', location: 'Waco Transit Center', status: 'DELAYED', note: 'Stalled due to engine alert' },
    ],
    createdAt: '2026-05-03T11:00:00Z',
    updatedAt: '2026-05-05T07:00:00Z'
  },
  {
    id: 'SH-999',
    tenantId: 'TENANT-002',
    trackingNumber: 'GF-00001-Z',
    origin: 'Berlin Port',
    destination: 'London Hub',
    status: 'IN_TRANSIT',
    estimatedDelivery: '2026-05-10T12:00:00Z',
    createdAt: '2026-05-01T08:00:00Z',
    updatedAt: '2026-05-01T08:00:00Z'
  }
];

const MOCK_DRIVERS = [
  { id: 'DRV-001', name: 'Marco Rossi' },
  { id: 'DRV-002', name: 'Elena Petrova' },
  { id: 'DRV-003', name: 'Sam Wilson' },
  { id: 'DRV-004', name: 'Tanaka Ken' },
  { id: 'DRV-005', name: 'Sarah Miller' },
];

export function useShipments() {
  const { tenantId } = useAuth();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    const timer = setTimeout(() => {
      setShipments(MOCK_SHIPMENTS.filter(s => s.tenantId === tenantId));
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [tenantId]);

  const updateStatus = async (id: string, status: ShipmentStatus) => {
    setShipments(prev => prev.map(s => {
      if (s.id === id) {
        const newHistory = [...(s.history || []), {
          timestamp: new Date().toISOString(),
          location: s.status === 'PENDING' ? s.origin : 'Current Route',
          status,
          note: `Status updated to ${status}`
        }];
        return { ...s, status, history: newHistory, updatedAt: new Date().toISOString() };
      }
      return s;
    }));
  };

  const assignDriver = async (id: string, driverId: string) => {
    setShipments(prev => prev.map(s => s.id === id ? { ...s, assignedDriverId: driverId, updatedAt: new Date().toISOString() } : s));
  };

  const updateLocation = async (id: string, field: 'origin' | 'destination', value: string) => {
    setShipments(prev => prev.map(s => s.id === id ? { ...s, [field]: value, updatedAt: new Date().toISOString() } : s));
  };

  const bulkUpdateStatus = async (ids: string[], status: ShipmentStatus) => {
    setShipments(prev => prev.map(s => {
      if (ids.includes(s.id)) {
        const newHistory = [...(s.history || []), {
          timestamp: new Date().toISOString(),
          location: 'Bulk Update',
          status,
          note: `Bulk status update to ${status}`
        }];
        return { ...s, status, history: newHistory, updatedAt: new Date().toISOString() };
      }
      return s;
    }));
  };

  return { shipments, loading, updateStatus, assignDriver, updateLocation, bulkUpdateStatus, drivers: MOCK_DRIVERS };
}
