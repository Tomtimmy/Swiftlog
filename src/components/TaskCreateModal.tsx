import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ClipboardList, X, User, AlertTriangle, MapPin, Shield } from 'lucide-react';

interface TaskCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  drivers: { id: string, name: string }[];
  onCreate: (data: any) => Promise<boolean>;
}

export default function TaskCreateModal({ isOpen, onClose, drivers, onCreate }: TaskCreateModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [assignedUserId, setAssignedUserId] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    setLoading(true);
    const success = await onCreate({
      title,
      description,
      priority,
      assignedUserId,
      location,
      isPersonal: false
    });
    setLoading(false);
    if (success) onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-[70] flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-gray-100"
      >
        <div className="p-8 bg-gray-900 text-white relative">
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tighter">Operational Directive</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Terminal Mission Command</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Mission Objective</label>
              <input 
                required
                type="text"
                placeholder="e.g. Inspect Vehicle #54-A Braking System"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Objective Parameters (Optional)</label>
              <textarea 
                rows={3}
                placeholder="Detailed instructions for the assigned operative..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 flex items-center gap-2">
                <Shield className="w-3 h-3 text-indigo-400" />
                Priority Tier
              </label>
              <select 
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
              >
                <option value="LOW">LOW PRIORITY</option>
                <option value="MEDIUM">MEDIUM PRIORITY</option>
                <option value="HIGH">HIGH MISSION PRIORITY</option>
                <option value="URGENT">CRITICAL EMERGENCY</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 flex items-center gap-2">
                <User className="w-3 h-3 text-indigo-400" />
                Assign Operative
              </label>
              <select 
                value={assignedUserId}
                onChange={(e) => setAssignedUserId(e.target.value)}
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
              >
                <option value="">Unassigned</option>
                {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 flex items-center gap-2">
              <MapPin className="w-3 h-3 text-indigo-400" />
              Target Location / Node
            </label>
            <input 
              type="text"
              placeholder="e.g. Maintenance Bay 2 / Chicago Hub"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          <div className="pt-4 flex gap-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-gray-50 text-gray-400 text-xs font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-gray-100 transition-all"
            >
              Abort Directive
            </button>
            <button 
              type="submit"
              disabled={loading || !title}
              className="flex-1 py-4 bg-indigo-600 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Deploy Directive'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
