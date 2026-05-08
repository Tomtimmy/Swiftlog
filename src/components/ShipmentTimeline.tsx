import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Clock, MapPin, AlertCircle, Package } from 'lucide-react';
import { ShipmentHistory, ShipmentStatus } from '../types';
import { format } from 'date-fns';

interface ShipmentTimelineProps {
  history: ShipmentHistory[];
  currentStatus: ShipmentStatus;
}

const getStatusIcon = (status: ShipmentStatus) => {
  switch (status) {
    case 'DELIVERED':
      return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    case 'DELAYED':
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    case 'IN_TRANSIT':
      return <Clock className="w-4 h-4 text-blue-500" />;
    default:
      return <Package className="w-4 h-4 text-gray-400" />;
  }
};

const getStatusColor = (status: ShipmentStatus) => {
  switch (status) {
    case 'DELIVERED':
      return 'bg-emerald-50 border-emerald-100';
    case 'DELAYED':
      return 'bg-red-50 border-red-100';
    case 'IN_TRANSIT':
      return 'bg-blue-50 border-blue-100';
    default:
      return 'bg-gray-50 border-gray-100';
  }
};

export default function ShipmentTimeline({ history, currentStatus }: ShipmentTimelineProps) {
  const sortedHistory = [...history].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="relative">
      {/* Vertical line connecting the items */}
      <div className="absolute left-4 top-0 bottom-0 w-[2px] bg-gray-100 -translate-x-1/2" />

      <div className="space-y-6">
        {sortedHistory.length === 0 ? (
          <div className="pl-10 py-4 italic text-gray-400 text-sm">
            Initial shipment data initialized. Awaiting transit nodes.
          </div>
        ) : (
          sortedHistory.map((item, index) => (
            <motion.div
              key={item.timestamp + index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative pl-10 group"
            >
              {/* Timeline dot */}
              <div className={`absolute left-4 top-1 w-3 h-3 rounded-full border-2 border-white -translate-x-1/2 z-10 ${
                index === 0 ? 'bg-blue-600 ring-4 ring-blue-50' : 'bg-gray-300'
              }`} />

              <div className={`p-4 rounded-xl border ${getStatusColor(item.status)} transition-all hover:shadow-sm`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(item.status)}
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-900">
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-gray-400">
                    {format(new Date(item.timestamp), 'MMM dd, HH:mm')}
                  </span>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3 h-3 text-gray-400 mt-0.5" />
                    <p className="text-xs font-bold text-gray-700">{item.location}</p>
                  </div>
                  {item.note && (
                    <p className="text-[11px] text-gray-500 leading-relaxed pl-5 italic">
                      "{item.note}"
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
