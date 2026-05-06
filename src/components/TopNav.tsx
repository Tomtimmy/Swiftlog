import React from 'react';
import { LogOut, Bell, Search, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function TopNav() {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 border-b border-gray-200 bg-white sticky top-0 z-10 px-8 flex items-center justify-between">
      <div className="flex-1 max-w-md relative hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input 
          type="text" 
          placeholder="Search shipments, tasks, or users..." 
          className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500 transition-all font-medium"
        />
      </div>

      <div className="flex items-center gap-4 ml-auto">
        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        </button>
        
        <div className="h-8 w-[1px] bg-gray-200 mx-2" />
        
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-gray-900 leading-none">{user?.name}</p>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">{user?.role}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-[10px] ring-2 ring-white">
            {user?.avatar}
          </div>
          <button 
            onClick={logout}
            className="flex items-center gap-2 px-3 py-2 bg-gray-900 text-white rounded text-[10px] font-bold uppercase tracking-widest hover:bg-red-600 transition-all shadow-sm"
          >
            <LogOut className="w-3 h-3" />
            Log Out
          </button>
        </div>
      </div>
    </header>
  );
}
