import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRightLeft, X, AlertTriangle, Truck, MapPin } from 'lucide-react';
import { InventoryItem } from '../hooks/useInventory';

interface StockTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  onTransfer: (data: any) => Promise<boolean>;
}

export default function StockTransferModal({ isOpen, onClose, items, onTransfer }: StockTransferModalProps) {
  const [sku, setSku] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedItem = items.find(i => i.sku === sku && i.location === source);
  const locations = Array.from(new Set(items.map(i => i.location)));
  const uniqueSkus = Array.from(new Set(items.map(i => i.sku)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku || !source || !destination || quantity <= 0) {
      setError('Missing required telemetry parameters.');
      return;
    }
    if (source === destination) {
      setError('Source and destination cannot be identical.');
      return;
    }
    if (selectedItem && quantity > selectedItem.quantity) {
      setError('Insufficient stock for this transfer protocol.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const success = await onTransfer({
        sku,
        quantity,
        sourceLocation: source,
        destLocation: destination
      });
      if (success) {
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-gray-100"
      >
        <div className="p-8 bg-gray-900 text-white relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Truck className="w-32 h-32" />
          </div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center">
                <ArrowRightLeft className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tighter">Stock Migration Protocol</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Inter-location Logistics Handler</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex gap-3 animate-shake">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-xs font-bold text-red-600">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Primary SKU</label>
              <select 
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
              >
                <option value="">Select Resource</option>
                {uniqueSkus.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Transfer Volume</label>
              <input 
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-black outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 items-center">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Source Node</label>
              <select 
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
              >
                <option value="">Select Origin</option>
                {locations.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            <div className="flex flex-col items-center pt-6">
              <ArrowRightLeft className="w-6 h-6 text-blue-200" />
            </div>

            <div className="space-y-2 md:col-start-2">
              <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest pl-1">Destination Node</label>
              <select 
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full p-4 bg-blue-50 border border-blue-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
              >
                <option value="">Target Location</option>
                {locations.concat(['NEW WAREHOUSE']).map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          {selectedItem && (
            <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Available at Source</p>
                  <p className="text-sm font-black text-gray-900">{selectedItem.quantity} {selectedItem.unit}s</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Protocol Type</p>
                <p className="text-sm font-black text-blue-600 uppercase">Redistribution</p>
              </div>
            </div>
          )}

          <div className="pt-4 flex gap-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-gray-50 text-gray-400 text-xs font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-gray-100 transition-all"
            >
              Abort Protocol
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-1 py-4 bg-blue-600 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Commit Migration'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
