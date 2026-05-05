import React, { useState, useEffect } from 'react';
import { Truck, MapPin, Battery, Thermometer, ShieldCheck, AlertCircle, Activity, Move } from 'lucide-react';
import { motion } from 'motion/react';

const INITIAL_VEHICLES = [
  { id: 'VK-902', name: 'Volvo FH16', plate: 'NJ-8821', driver: 'Marco Rossi', status: 'ACTIVE', battery: '82%', temp: '18°C', location: 'Near Newark', x: 200, y: 150 },
  { id: 'VK-331', name: 'Mercedes Actros', plate: 'NY-1022', driver: 'Elena Petrova', status: 'IDLE', battery: '95%', temp: '20°C', location: 'Brooklyn Depot', x: 450, y: 300 },
  { id: 'VK-440', name: 'Scania R500', plate: 'TX-4491', driver: 'Sam Wilson', status: 'MAINTENANCE', battery: '12%', temp: '24°C', location: 'Austin Service', x: 600, y: 200 },
  { id: 'VK-112', name: 'Isuzu NPR', plate: 'CA-9920', driver: 'Tanaka Ken', status: 'ACTIVE', battery: '45%', temp: '19°C', location: 'I-5 North', x: 100, y: 400 },
];

export default function Fleet() {
  const [vehicles, setVehicles] = useState(INITIAL_VEHICLES);

  useEffect(() => {
    const interval = setInterval(() => {
      setVehicles(prev => prev.map(v => {
        if (v.status !== 'ACTIVE') return v;
        // Mock movement
        const newX = v.x + (Math.random() - 0.5) * 5;
        const newY = v.y + (Math.random() - 0.5) * 5;
        return { ...v, x: newX, y: newY };
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fleet Operations</h1>
          <p className="text-gray-500 text-sm">Monitor vehicle health and real-time telemetry</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-md">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-tighter">Live Telemetry</span>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium">
            Add Vehicle
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
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Map Legend</p>
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
            {vehicles.map((v) => (
              <motion.div
                key={v.id}
                animate={{ x: v.x, y: v.y }}
                transition={{ duration: 2, ease: "linear" }}
                className="absolute"
                style={{ top: 0, left: 0 }}
              >
                <div className="group relative -translate-x-1/2 -translate-y-1/2">
                  <div className={`w-4 h-4 rounded-full border-2 border-white shadow-lg ${
                    v.status === 'ACTIVE' ? 'bg-emerald-500 ring-4 ring-emerald-500/20' : 
                    v.status === 'IDLE' ? 'bg-blue-500' : 'bg-red-500'
                  }`} />
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-gray-800 text-white text-[10px] px-2 py-1 rounded shadow-xl border border-white/20 z-20">
                    <p className="font-bold">{v.id}</p>
                    <p className="text-gray-400">{v.driver}</p>
                  </div>
                </div>
              </motion.div>
            ))}

            <div className="absolute bottom-4 right-4 bg-gray-800/80 backdrop-blur-md p-2 rounded-md border border-white/10 text-[10px] text-gray-400 font-mono">
              GPS SIGNAL: NOMINAL [LAT 40.71 / LNG -74.00]
            </div>
          </div>
        </div>

        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
          {vehicles.map((v) => (
            <div key={v.id} className="technical-card p-4 hover:border-blue-300 transition-all">
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
                  <p className="text-gray-400 uppercase font-bold tracking-tighter mb-0.5">Location</p>
                  <p className="font-medium truncate">{v.location}</p>
                </div>
                <div className="bg-gray-50 p-1.5 rounded border border-gray-100">
                  <p className="text-gray-400 uppercase font-bold tracking-tighter mb-0.5">Int. Temp</p>
                  <p className="font-medium">{v.temp}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 py-1.5 bg-gray-50 text-[10px] font-bold text-gray-600 rounded hover:bg-gray-100">DIAGNOSTICS</button>
                <button className="flex-1 py-1.5 bg-blue-50 text-[10px] font-bold text-blue-600 rounded hover:bg-blue-100">TRACK</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
