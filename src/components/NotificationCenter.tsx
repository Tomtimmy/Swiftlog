import React from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { Bell, Circle, CheckCheck, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../lib/utils';

export default function NotificationCenter() {
  const { notifications, loading, markAsRead } = useNotifications();

  return (
    <div className="technical-card h-full flex flex-col">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-blue-600" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">Live Alerts</h2>
        </div>
        <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
          {notifications.filter(n => !n.read).length} New
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-xs text-gray-400">Syncing...</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {notifications.map((n) => (
              <div 
                key={n.id} 
                className={cn(
                  "p-4 hover:bg-gray-50 transition-colors cursor-pointer group relative",
                  !n.read && "bg-blue-50/30"
                )}
                onClick={() => markAsRead(n.id)}
              >
                <div className="flex gap-3">
                  <div className="mt-1">
                    {n.message.toLowerCase().includes('critical') ? (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    ) : (
                      <Circle className={cn("w-2 h-2 mt-1", !n.read ? "fill-blue-600 text-blue-600" : "text-gray-300")} />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={cn("text-xs leading-relaxed", !n.read ? "text-gray-900 font-medium" : "text-gray-600")}>
                      {n.message}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(n.createdAt))} ago
                    </p>
                  </div>
                </div>
                {!n.read && (
                  <button className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <CheckCheck className="w-4 h-4 text-gray-400 hover:text-blue-600" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <button className="p-3 text-[10px] font-bold text-center text-gray-400 hover:text-blue-600 border-t border-gray-50 uppercase tracking-widest">
        View Notification Logs
      </button>
    </div>
  );
}
