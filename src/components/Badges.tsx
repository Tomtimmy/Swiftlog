import React from 'react';
import { ShipmentStatus } from '@/src/types';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export function StatusBadge({ status }: { status: ShipmentStatus }) {
  const styles = {
    PENDING: "bg-gray-100 text-gray-700 border-gray-200",
    IN_TRANSIT: "bg-blue-100 text-blue-700 border-blue-200",
    DELIVERED: "bg-emerald-100 text-emerald-700 border-emerald-200",
    DELAYED: "bg-amber-100 text-amber-700 border-amber-200",
  };

  return (
    <AnimatePresence mode="wait">
      <motion.span 
        key={status}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          "px-2.5 py-0.5 rounded-full text-xs font-semibold border inline-block",
          styles[status]
        )}
      >
        {status.replace('_', ' ')}
      </motion.span>
    </AnimatePresence>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    LOW: "bg-blue-50 text-blue-600",
    MEDIUM: "bg-orange-50 text-orange-600",
    HIGH: "bg-red-50 text-red-600",
  };

  return (
    <span className={cn(
      "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
      styles[priority] || "bg-gray-50 text-gray-600"
    )}>
      {priority}
    </span>
  );
}
