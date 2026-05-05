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
    <aside className="w-64 bg-white border-right border-gray-200 h-screen flex flex-col fixed left-0 top-0 z-20">
      <div className="p-6 border-b border-gray-200 flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
          <Truck className="text-white w-5 h-5" />
        </div>
        <span className="font-bold text-xl tracking-tight text-gray-900">SwiftLog</span>
      </div>
      
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {filteredMenu.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200",
              activeTab === item.id 
                ? "bg-blue-50 text-blue-700 font-medium" 
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
            id={`nav-${item.id}`}
          >
            <item.icon className={cn("w-5 h-5", activeTab === item.id ? "text-blue-600" : "text-gray-400")} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200 bg-gray-50/50">
        <div className="flex items-center gap-3 px-3 py-4 mb-2">
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs ring-2 ring-white">
            {user?.avatar || '??'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate tracking-tight">{user?.name || 'Anonymous'}</p>
            <p className="text-[10px] text-gray-500 truncate uppercase font-bold tracking-widest">{user?.role || 'Guest'}</p>
          </div>
        </div>
        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-md transition-all duration-200 font-bold text-xs uppercase tracking-widest"
          id="logout-btn"
        >
          <LogOut className="w-4 h-4" />
          Terminate Session
        </button>
      </div>
    </aside>
  );
}
