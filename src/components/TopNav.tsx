import React, { useState } from 'react';
import { LogOut, Bell, Search, Clock, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

export default function TopNav() {
  const { user, logout } = useAuth();
  const { notifications, markAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <header className="h-16 border-b border-gray-200 bg-white sticky top-0 z-40 px-8 flex items-center justify-between shadow-sm">
      <div className="flex-1 max-w-md relative hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-industrial" />
        <input 
          type="text" 
          placeholder="Terminal Search: Fleet, SKU, Units..." 
          className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[11px] font-bold uppercase tracking-wider outline-none focus:ring-2 focus:ring-navy-logistics focus:bg-white transition-all"
        />
      </div>

      <div className="flex items-center gap-4 ml-auto">
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-2 rounded-full transition-all relative ${showNotifications ? 'bg-navy-logistics text-white shadow-lg shadow-navy-logistics/20' : 'text-slate-industrial hover:text-navy-logistics hover:bg-gray-100'}`}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-electric-orange text-[9px] font-black text-navy-logistics rounded-full border-2 border-white flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setShowNotifications(false)} 
                />
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-96 bg-white border border-gray-200 rounded-2xl shadow-2xl z-40 overflow-hidden"
                >
                  <div className="p-4 bg-gray-900 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                       <ShieldCheck className="w-4 h-4 text-blue-400" />
                       Fleet Alerts
                    </h3>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter">
                        {unreadCount} New
                      </span>
                    )}
                  </div>

                  <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-50">
                    {notifications.length === 0 ? (
                      <div className="p-12 text-center">
                        <CheckCircle2 className="w-10 h-10 text-gray-100 mx-auto mb-2" />
                        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">No Active Alerts</p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div 
                          key={notif.id} 
                          onClick={() => markAsRead(notif.id)}
                          className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer relative group ${!notif.is_read ? 'bg-blue-50/30' : ''}`}
                        >
                          {!notif.is_read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />}
                          <div className="flex gap-3">
                            <div className={`p-2 rounded-lg shrink-0 h-fit ${
                              notif.type === 'PRICING_UPDATE' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {notif.type === 'PRICING_UPDATE' ? <AlertTriangle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-gray-900 leading-tight">{notif.title}</p>
                              <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">{notif.message}</p>
                              <p className="text-[10px] text-gray-400 mt-2 font-medium flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
                    <button className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:underline transition-all">
                      View Audit Log History
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
        
        <div className="h-8 w-[1px] bg-gray-200 mx-2" />
        
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-gray-900 leading-none">{user?.name}</p>
            <div className="flex items-center gap-2 mt-1">
               <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider leading-none">{user?.role}</p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-[10px] ring-2 ring-white shadow-sm overflow-hidden uppercase">
            {user?.avatar}
          </div>
          <button 
            onClick={logout}
            className="flex items-center gap-2 px-3 py-2 bg-gray-900 text-white rounded text-[10px] font-bold uppercase tracking-widest hover:bg-red-600 transition-all shadow-sm"
          >
            <LogOut className="w-3 h-3" />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
