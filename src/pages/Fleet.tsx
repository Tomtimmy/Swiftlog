import React, { useState, useEffect } from 'react';
import { Truck, MapPin, Battery, Thermometer, ShieldCheck, AlertCircle, Activity, Move, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useFleet } from '../hooks/useFleet';

import Modal from '../components/Modal';
import { useAuth } from '../hooks/useAuth';

export default function Fleet() {
  const { vehicles, loading, updateTelemetry, addVehicle } = useFleet();
  const { user } = useAuth();
  const [movingVehicles, setMovingVehicles] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    name: '',
    plate: '',
    driverName: '',
    location: user?.location || 'HQ'
  });

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    await (addVehicle as any)(newVehicle);
    setIsModalOpen(false);
    setNewVehicle({
      name: '',
      plate: '',
      driverName: '',
      location: user?.location || 'HQ'
    });
  };

  useEffect(() => {
    if (vehicles.length > 0) {
      setMovingVehicles(vehicles.map(v => ({
        ...v,
        // Convert lat/lng to pseudo-coordinates for the mock map
        x: (v.current_lng + 180) * 2, 
        y: (v.current_lat + 90) * 1.5
      })));
    }
  }, [vehicles]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMovingVehicles(prev => prev.map(v => {
        if (v.status !== 'ACTIVE') return v;
        // Mock slight visual movement
        const newX = v.x + (Math.random() - 0.5) * 2;
        const newY = v.y + (Math.random() - 0.5) * 2;
        return { ...v, x: newX, y: newY };
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, [vehicles]);

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Establishing Fleet Link...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fleet Operations</h1>
          <p className="text-gray-500 text-sm">Monitor vehicle health and real-time telemetry from the database</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-md">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-tighter">Live Telemetry</span>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition shadow-sm"
          >
            Registry Master
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          <div className="technical-card h-[500px] relative bg-gray-900 border-none overflow-hidden ring-1 ring-white/10">
            {/* Mock Map Background */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
                <path d="M0 250 Q 200 200 400 250 T 800 250" fill="none" stroke="white" strokeWidth="2" strokeDasharray="10 10"/>
                <path d="M150 0 L 150 600" fill="none" stroke="white" strokeWidth="1" opacity="0.5"/>
                <path d="M0 400 L 800 400" fill="none" stroke="white" strokeWidth="1" opacity="0.5"/>
              </svg>
            </div>

            <div className="absolute top-4 left-4 z-10 space-y-2">
              <div className="bg-gray-800/80 backdrop-blur-md p-3 rounded-lg border border-white/10">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Fleet Legend</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-[10px] text-gray-300">Active</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-[10px] text-gray-300">Idle</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-[10px] text-gray-300">Maintenance</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Vehicle Markers */}
            {movingVehicles.map((v) => (
              <motion.div
                key={v.id}
                animate={{ x: v.x % 800, y: v.y % 500 }}
                transition={{ duration: 3, ease: "linear" }}
                className="absolute"
                style={{ top: 0, left: 0 }}
              >
                <div className="group relative -translate-x-1/2 -translate-y-1/2">
                  <div className={`w-4 h-4 rounded-full border-2 border-white shadow-lg ${
                    v.status === 'ACTIVE' ? 'bg-emerald-500 ring-4 ring-emerald-500/20' : 
                    v.status === 'IDLE' ? 'bg-blue-500' : 'bg-red-500'
                  }`} />
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-gray-800 text-white text-[10px] px-2 py-1 rounded shadow-xl border border-white/20 z-20">
                    <p className="font-bold">{v.id} - {v.plate}</p>
                    <p className="text-gray-400">{v.driver_name || 'No assigned driver'}</p>
                  </div>
                </div>
              </motion.div>
            ))}

            <div className="absolute bottom-4 right-4 bg-gray-800/80 backdrop-blur-md p-2 rounded-md border border-white/10 text-[10px] text-gray-400 font-mono">
              GPS SIGNAL: NOMINAL | NETWORK: 5G SECURE
            </div>
          </div>
        </div>

        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
          {vehicles.map((v) => (
            <div key={v.id} className="technical-card p-4 hover:border-blue-300 transition-all border-l-4 border-l-blue-500">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={v.status === 'MAINTENANCE' ? 'p-2 bg-red-50 rounded' : 'p-2 bg-blue-50 rounded'}>
                    <Truck className={`w-4 h-4 ${v.status === 'MAINTENANCE' ? 'text-red-500' : 'text-blue-600'}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{v.id}</h3>
                    <p className="text-[10px] text-gray-500 uppercase tracking-tighter">{v.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Activity className="w-3 h-3 text-emerald-500 ml-auto mb-1 animate-pulse" />
                  <span className="text-[10px] font-mono font-bold text-gray-400">{v.battery}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-[10px] mb-4">
                <div className="bg-gray-50 p-1.5 rounded border border-gray-100">
                  <p className="text-gray-400 uppercase font-bold tracking-tighter mb-0.5">Assigned Pilot</p>
                  <p className="font-medium truncate">{v.driver_name}</p>
                </div>
                <div className="bg-gray-50 p-1.5 rounded border border-gray-100">
                  <p className="text-gray-400 uppercase font-bold tracking-tighter mb-0.5">Current Zone</p>
                  <p className="font-medium truncate">{v.location}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 py-1.5 bg-gray-900 text-[10px] font-bold text-white rounded hover:bg-gray-800 uppercase tracking-widest">Diagnostics</button>
                <button className="flex-1 py-1.5 bg-gray-100 text-[10px] font-bold text-gray-600 rounded hover:bg-gray-200 uppercase tracking-widest">Track</button>
              </div>
            </div>
          ))}
          {vehicles.length === 0 && (
            <div className="p-8 text-center text-gray-400 italic text-xs">No vehicles registered in fleet.</div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Fleet Registry - New Asset Onboarding"
      >
        <form onSubmit={handleAddVehicle} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Vehicle Model</label>
              <input 
                required
                className="technical-input w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g. Scania R500"
                value={newVehicle.name}
                onChange={(e) => setNewVehicle({ ...newVehicle, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">License Plate</label>
              <input 
                required
                className="technical-input w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g. TX-9921"
                value={newVehicle.plate}
                onChange={(e) => setNewVehicle({ ...newVehicle, plate: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Primary Driver Name</label>
              <input 
                className="technical-input w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Pilot name (if known)"
                value={newVehicle.driverName}
                onChange={(e) => setNewVehicle({ ...newVehicle, driverName: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Base Hub</label>
              <input 
                className="technical-input w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g. HQ"
                value={newVehicle.location}
                onChange={(e) => setNewVehicle({ ...newVehicle, location: e.target.value })}
              />
            </div>
          </div>
          <div className="pt-4 flex gap-3">
            <button 
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 py-3 bg-gray-50 text-gray-600 text-[10px] font-bold rounded-lg hover:bg-gray-100 transition-colors uppercase tracking-widest"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-1 py-3 bg-blue-600 text-white text-[10px] font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100 uppercase tracking-widest"
            >
              Authorize Asset
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

