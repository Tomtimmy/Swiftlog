import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Truck, MapPin, Notebook, X, CheckCircle2, CloudLightning } from 'lucide-react';
import { Shipment, ShipmentStatus } from '../types';

interface ShipmentUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: Shipment | null;
  onUpdate: (id: string, status: ShipmentStatus, location: string, note: string) => Promise<void>;
}

export default function ShipmentUpdateModal({ isOpen, onClose, shipment, onUpdate }: ShipmentUpdateModalProps) {
  const [status, setStatus] = useState<ShipmentStatus>(shipment?.status || 'PENDING');
  const [location, setLocation] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shipment) return;
    setLoading(true);
    await onUpdate(shipment.id, status, location, note);
    setLoading(false);
    onClose();
  };

  if (!isOpen || !shipment) return null;

  const statusOptions: { val: ShipmentStatus; label: string; color: string }[] = [
    { val: 'PENDING', label: 'Pending / At Origin', color: 'bg-gray-100 text-gray-600' },
    { val: 'IN_TRANSIT', label: 'In Transit / Moving', color: 'bg-blue-100 text-blue-600' },
    { val: 'DELAYED', label: 'Delayed / On Hold', color: 'bg-red-100 text-red-600' },
    { val: 'DELIVERED', label: 'Delivered / Final Node', color: 'bg-emerald-100 text-emerald-600' }
  ];

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100"
      >
        <div className="p-6 bg-gray-900 text-white relative">
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-black uppercase tracking-tighter">Event Logger</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{shipment.trackingNumber}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">New Shipment State</label>
            <div className="grid grid-cols-2 gap-2">
              {statusOptions.map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setStatus(opt.val)}
                  className={`p-3 rounded-xl border text-[11px] font-bold transition-all flex items-center justify-between ${
                    status === opt.val 
                      ? 'border-blue-600 bg-blue-50/50 text-blue-700 shadow-sm ring-1 ring-blue-600' 
                      : 'border-gray-100 bg-gray-50 text-gray-400 hover:bg-white'
                  }`}
                >
                  {opt.label}
                  {status === opt.val && <CheckCircle2 className="w-3 h-3" />}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 flex items-center gap-2">
                <MapPin className="w-3 h-3" />
                Current Telemetry Location
              </label>
              <input 
                type="text" 
                placeholder="e.g. Distribution Center 4, Chicago IL"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 flex items-center gap-2">
                <Notebook className="w-3 h-3" />
                Mission Logs / Manifest Notes
              </label>
              <textarea 
                rows={3}
                placeholder="Details about status change, weather conditions, or vehicle status..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
              />
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-50 text-gray-400 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-gray-100 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading || !location}
              className="flex-1 py-3 bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <CloudLightning className="w-4 h-4 animate-pulse" />
              ) : (
                'Commit Node Update'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
