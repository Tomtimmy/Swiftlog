import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ListTodo, 
  Users, 
  Settings, 
  LogOut,
  Truck,
  Warehouse,
  Receipt,
  BarChart3
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const { user, logout } = useAuth();
  const { hasPermission } = usePermissions();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'shipments', label: 'Shipments', icon: Package },
    { id: 'inventory', label: 'Inventory', icon: Warehouse },
    { id: 'finance', label: 'Finance', icon: Receipt },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'tasks', label: 'Tasks', icon: ListTodo },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'fleet', label: 'Fleet', icon: Truck },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const filteredMenu = menuItems.filter(item => hasPermission(item.id));

  return (
    <aside className="w-64 bg-navy-logistics border-r border-white/5 h-screen flex flex-col fixed left-0 top-0 z-20 text-white shadow-2xl">
      <div className="p-6 border-b border-white/5 flex items-center gap-3">
        <div className="w-9 h-9 bg-electric-orange rounded-xl flex items-center justify-center shadow-lg shadow-electric-orange/20">
          <Truck className="text-navy-logistics w-5 h-5 font-bold" />
        </div>
        <span className="font-black text-lg tracking-tighter uppercase text-white">SwiftConnect</span>
      </div>
      
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto mt-2">
        {filteredMenu.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 group",
              activeTab === item.id 
                ? "bg-white text-navy-logistics font-bold shadow-xl shadow-black/10" 
                : "text-gray-400 hover:bg-white/5 hover:text-white"
            )}
            id={`nav-${item.id}`}
          >
            <item.icon className={cn("w-5 h-5 transition-colors", activeTab === item.id ? "text-electric-orange" : "text-gray-500 group-hover:text-white")} />
            <span className="text-[11px] font-bold uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5 bg-black/20">
        <div className="flex items-center gap-3 px-3 py-4 mb-2">
          <div className="w-10 h-10 rounded-full bg-electric-orange text-navy-logistics flex items-center justify-center font-black text-xs ring-4 ring-white/5 shadow-inner">
            {user?.avatar || '??'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-black text-white truncate tracking-tight uppercase">{user?.name || 'Anonymous'}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
               <div className="w-1.5 h-1.5 bg-ops-green rounded-full shadow-[0_0_8px_#38A169]" />
               <p className="text-[9px] text-gray-500 truncate uppercase font-bold tracking-[0.15em]">{user?.role || 'Guest'}</p>
            </div>
          </div>
        </div>
        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-red-600/10 hover:text-red-500 rounded-xl transition-all duration-200 font-bold text-[10px] uppercase tracking-[0.2em]"
          id="logout-btn"
        >
          <LogOut className="w-4 h-4" />
          Terminate
        </button>
      </div>
    </aside>
  );
}
