import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useShipments } from '../hooks/useShipments';
import { 
  TrendingUp, 
  Package, 
  Truck, 
  AlertTriangle,
  Clock,
  ArrowRight,
  Loader2
} from 'lucide-react';
import StatsCard from '../components/StatsCard';
import { StatusBadge } from '../components/Badges';
import NotificationCenter from '../components/NotificationCenter';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

export default function Dashboard() {
  const { user } = useAuth();
  const { shipments, loading: shipLoading } = useShipments();
  const [stats, setStats] = useState<any>(null);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isDriver = user?.role === 'DRIVER';
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user) return;
      try {
        const [statsRes, revenueRes] = await Promise.all([
          fetch('/api/dashboard/stats', { headers: { 'x-user-id': user.uid } }),
          fetch('/api/dashboard/revenue', { headers: { 'x-user-id': user.uid } })
        ]);

        if (statsRes.ok) setStats(await statsRes.json());
        if (revenueRes.ok) setRevenueData(await revenueRes.json());
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, [user?.uid]);

  if (loading || shipLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Compiling Terminal Intelligence...</p>
      </div>
    );
  }

  // Filter shipments for driver view if needed
  const displayShipments = isDriver 
    ? shipments.filter(s => s.assigned_driver_id === user.uid).slice(0, 5)
    : shipments.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {isDriver ? 'Driver Terminal' : isAdmin ? 'SwiftConnect Overview' : 'Operational Dashboard'}
          </h1>
          <p className="text-gray-500 text-sm">
            {isDriver ? `Welcome back, ${user.name}. View your active routes.` : 'Real-time logistics and operations monitoring from DB'}
          </p>
        </div>
        <div className="flex gap-2">
          {!isDriver && (
            <>
              <button className="px-4 py-2 bg-white border border-gray-200 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors">
                Export Data
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
                Create Shipment
              </button>
            </>
          )}
          {isDriver && (
            <button className="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm uppercase tracking-widest text-[10px] font-bold">
              Dispatch Ready
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isDriver ? (
          <>
            <StatsCard title="Assigned Drops" value={displayShipments.length.toString()} icon={Package} trend="Remaining for today" trendUp={false} />
            <StatsCard title="Completed today" value="2" icon={Truck} trend="Estimated return: 17:00" />
            <StatsCard title="On Time Rate" value="99%" icon={TrendingUp} trend="System rank: #4" trendUp={true} />
            <StatsCard title="Active Order" value={displayShipments[0]?.id || 'NONE'} icon={Clock} trend={displayShipments[0]?.location || 'Standby'} />
          </>
        ) : (
          <>
            <StatsCard title="Active Shipments" value={stats?.activeShipments || '0'} icon={Package} trend="Live from database" trendUp={true} />
            <StatsCard title="On Time Delivery" value={`${stats?.onTimeRate || '0'}%`} icon={TrendingUp} trend="Based on final status" trendUp={true} />
            <StatsCard title="In Transit" value={stats?.inTransit || '0'} icon={Truck} trend="Currently on road" trendUp={false} />
            <StatsCard title="Critical Alerts" value={stats?.criticalAlerts || '0'} icon={AlertTriangle} trend="Action required" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 technical-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">
              {isDriver ? 'Active Route Map' : 'Global Revenue Stream (Last 7 Days)'}
            </h2>
          </div>
          {isDriver ? (
            <div className="h-[300px] w-full bg-gray-50 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-gray-200">
               <Truck className="w-12 h-12 text-gray-300 mb-2" />
               <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Active Navigation Terminal</p>
               <p className="text-xs text-gray-400 mt-1">{displayShipments[0]?.origin || 'Hub'} → {displayShipments[0]?.destination || 'Destination'}</p>
            </div>
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#9CA3AF' }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#9CA3AF' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '8px', 
                      border: 'none', 
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <NotificationCenter />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 technical-card">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900">
              {isDriver ? 'My Assigned Deliveries' : 'Internal Registry: Recent Shipments'}
            </h2>
            <button className="text-xs font-semibold text-blue-600 flex items-center gap-1 hover:underline">
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="overflow-x-auto text-[11px]">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="p-4 uppercase tracking-widest text-gray-400 font-bold">UID</th>
                  <th className="p-4 uppercase tracking-widest text-gray-400 font-bold">Client / SKU</th>
                  <th className="p-4 uppercase tracking-widest text-gray-400 font-bold">Vector</th>
                  <th className="p-4 uppercase tracking-widest text-gray-400 font-bold">Status</th>
                  <th className="p-4 uppercase tracking-widest text-gray-400 font-bold text-right">ETA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {displayShipments.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-bold text-gray-900">{s.id}</td>
                    <td className="p-4">
                      <p className="font-mono text-gray-600">{s.tracking_number}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-medium">{s.destination}</p>
                      <p className="text-[10px] text-gray-400">{s.origin}</p>
                    </td>
                    <td className="p-4">
                      <StatusBadge status={s.status as any} />
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-blue-600">
                      {new Date(s.estimated_delivery).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
                {displayShipments.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-400 italic">No assigned vectors found in database.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="technical-card p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-6">
            {isDriver ? 'Vehicle Health' : 'Fleet Status Matrix'}
          </h2>
          <div className="space-y-6">
            {isDriver ? (
              <>
                <div className="space-y-2">
                   <div className="flex justify-between text-xs font-bold text-gray-500">
                      <span>FUEL LEVEL</span>
                      <span className="text-blue-600">82%</span>
                   </div>
                   <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full w-[82%]" />
                   </div>
                </div>
                <div className="space-y-2">
                   <div className="flex justify-between text-xs font-bold text-gray-500">
                      <span>TYRE PRESSURE</span>
                      <span className="text-emerald-600">OPTIMAL</span>
                   </div>
                   <div className="flex gap-1">
                      {[1,2,3,4].map(i => <div key={i} className="flex-1 h-3 bg-emerald-100 rounded" />)}
                   </div>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                   <p className="text-[10px] font-bold text-amber-600 mb-1">MAINTENANCE ALERT</p>
                   <p className="text-xs text-amber-800">Oil change scheduled in 450km. Contact fleet manager.</p>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded border border-emerald-100">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-tight">Active Duty</span>
                  </div>
                  <span className="text-sm font-mono font-bold text-emerald-900">{stats?.fleetSummary?.active || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded border border-blue-100">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                    <span className="text-xs font-bold text-blue-800 uppercase tracking-tight">Standby / Idle</span>
                  </div>
                  <span className="text-sm font-mono font-bold text-blue-900">{stats?.fleetSummary?.idle || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded border border-red-100">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                    <span className="text-xs font-bold text-red-800 uppercase tracking-tight">Maintenance Required</span>
                  </div>
                  <span className="text-sm font-mono font-bold text-red-900">{stats?.fleetSummary?.maintenance || 0}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
