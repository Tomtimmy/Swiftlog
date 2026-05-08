import React, { useState, useEffect } from 'react';
import { Brain, Sparkles, ShieldAlert, Zap, Info, Loader2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getLogisticsInsights } from '../services/aiService';
import { Shipment, InventoryItem, Task } from '../types';

interface AIAssistantProps {
  shipments: Shipment[];
  inventory: InventoryItem[];
  tasks: Task[];
}

export default function AIAssistant({ shipments, inventory, tasks }: AIAssistantProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchInsights = async () => {
    setLoading(true);
    const insights = await getLogisticsInsights(shipments, inventory, tasks);
    setData(insights);
    setLoading(false);
  };

  useEffect(() => {
    if (shipments.length > 0 || inventory.length > 0) {
      fetchInsights();
    }
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'text-red-500 bg-red-50 border-red-100';
      case 'MEDIUM': return 'text-amber-500 bg-amber-50 border-amber-100';
      default: return 'text-blue-500 bg-blue-50 border-blue-100';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'RISK': return <ShieldAlert className="w-4 h-4" />;
      case 'OPTIMIZATION': return <Zap className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  return (
    <div className="technical-card p-6 bg-gradient-to-br from-white to-blue-50/30 relative overflow-hidden">
      {/* Decorative pulse */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-100/50 rounded-full blur-3xl" />
      
      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-tighter">Logistics Intelligence</h2>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Active Neural Link</span>
            </div>
          </div>
        </div>
        <button 
          onClick={fetchInsights}
          disabled={loading}
          className="p-2 hover:bg-white rounded-lg transition-all border border-gray-100 shadow-sm disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin text-blue-600" /> : <RefreshCw className="w-4 h-4 text-gray-400" />}
        </button>
      </div>

      <div className="space-y-4 relative z-10">
        {loading && !data ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <Sparkles className="w-8 h-8 text-blue-200 animate-pulse mb-4" />
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Parsing Fleet Telemetry...</p>
          </div>
        ) : (
          <>
            <div className="p-4 bg-white/60 backdrop-blur-sm border border-white rounded-xl shadow-sm italic text-xs text-gray-600 leading-relaxed border-l-4 border-l-blue-600">
              "{data?.summary || 'Standard operational parameters detected across all nodes.'}"
            </div>

            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {data?.insights?.map((insight: any, idx: number) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`p-3 rounded-xl border flex gap-3 items-start ${getPriorityColor(insight.priority)}`}
                  >
                    <div className="mt-0.5">
                      {getIcon(insight.type)}
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-wider mb-0.5">{insight.label}</h4>
                      <p className="text-[11px] font-medium leading-normal opacity-80">{insight.description}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>

      {!loading && (
        <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Model: Gemini 3 Flash</span>
          <div className="flex gap-1">
             <div className="w-1 h-3 bg-blue-600 rounded-full" />
             <div className="w-1 h-3 bg-blue-400 rounded-full" />
             <div className="w-1 h-3 bg-blue-200 rounded-full" />
          </div>
        </div>
      )}
    </div>
  );
}
