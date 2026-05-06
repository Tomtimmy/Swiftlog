import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  TrendingUp, 
  Package, 
  Truck, 
  AlertTriangle,
  Clock,
  ArrowRight
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

const data = [
  { name: 'Mon', value: 40 },
  { name: 'Tue', value: 30 },
  { name: 'Wed', value: 45 },
  { name: 'Thu', value: 55 },
  { name: 'Fri', value: 35 },
  { name: 'Sat', value: 20 },
  { name: 'Sun', value: 15 },
];

const shipments = [
  { id: 'SH-7821', tracking: 'TRK-90021-X', client: 'Acme Corp', dest: 'New York, NY', status: 'IN_TRANSIT', eta: '2h 15m' },
  { id: 'SH-7822', tracking: 'TRK-90022-Y', client: 'Global Logistics', dest: 'Chicago, IL', status: 'PENDING', eta: '5h 40m' },
  { id: 'SH-7823', tracking: 'TRK-90023-Z', client: 'TechFlow Inc', dest: 'Austin, TX', status: 'DELAYED', eta: 'Delayed' },
  { id: 'SH-7824', tracking: 'TRK-90024-A', client: 'SwiftRetail', dest: 'Miami, FL', status: 'DELIVERED', eta: 'Delivered' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const isDriver = user?.role === 'DRIVER';
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {isDriver ? 'Driver Terminal' : isAdmin ? 'SwiftConnect Overview' : 'Operational Dashboard'}
          </h1>
          <p className="text-gray-500 text-sm">
            {isDriver ? `Welcome back, ${user.name}. View your active routes.` : 'Real-time logistics and operations monitoring'}
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
            <button className="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm">
              Clock In
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isDriver ? (
          <>
            <StatsCard title="Assigned Drops" value="8" icon={Package} trend="Remaining for today" trendUp={false} />
            <StatsCard title="Route Distance" value="42km" icon={Truck} trend="Estimated return: 17:00" />
            <StatsCard title="On Time Rate" value="99%" icon={TrendingUp} trend="System rank: #4" trendUp={true} />
            <StatsCard title="Active Order" value="#7821" icon={Clock} trend="Current stop: Austin" />
          </>
        ) : (
          <>
            <StatsCard title="Active Shipments" value="1,284" icon={Package} trend="12% vs last week" trendUp={true} />
            <StatsCard title="On Time Delivery" value="98.2%" icon={TrendingUp} trend="0.4% vs last week" trendUp={true} />
            <StatsCard title="In Transit" value="642" icon={Truck} trend="8% vs yesterday" trendUp={false} />
            <StatsCard title="Critical Alerts" value="3" icon={AlertTriangle} trend="No change" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 technical-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">
              {isDriver ? 'Active Route Map' : 'Delivery Performance'}
            </h2>
            {!isDriver && (
              <select className="text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1 outline-none">
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
              </select>
            )}
          </div>
          {isDriver ? (
            <div className="h-[300px] w-full bg-gray-50 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-gray-200">
               <Truck className="w-12 h-12 text-gray-300 mb-2" />
               <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Active Navigation Terminal</p>
               <p className="text-xs text-gray-400 mt-1">Austin, TX Hub → Central Logistics</p>
            </div>
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
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
              {isDriver ? 'My Assigned Deliveries' : 'Recent Shipments'}
            </h2>
            <button className="text-xs font-semibold text-blue-600 flex items-center gap-1 hover:underline">
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50">
                  <th className="data-grid-header">Order ID</th>
                  <th className="data-grid-header">Tracking</th>
                  <th className="data-grid-header">Client</th>
                  <th className="data-grid-header">Destination</th>
                  <th className="data-grid-header">Status</th>
                  <th className="data-grid-header text-right">ETA</th>
                </tr>
              </thead>
              <tbody>
                {shipments.map((s) => (
                  <tr key={s.id} className="data-grid-row">
                    <td className="data-grid-cell font-bold text-gray-900">{s.id}</td>
                    <td className="data-grid-cell font-mono">{s.tracking}</td>
                    <td className="data-grid-cell">{s.client}</td>
                    <td className="data-grid-cell">{s.dest}</td>
                    <td className="data-grid-cell">
                      <StatusBadge status={s.status as any} />
                    </td>
                    <td className="data-grid-cell text-right font-semibold">{s.eta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="technical-card p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-6">
            {isDriver ? 'Vehicle Health' : 'Fleet Status'}
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
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    <span className="text-sm font-medium">On Road</span>
                  </div>
                  <span className="text-sm font-mono font-bold">142</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                    <span className="text-sm font-medium">Ready</span>
                  </div>
                  <span className="text-sm font-mono font-bold">28</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                    <span className="text-sm font-medium">Maintenance</span>
                  </div>
                  <span className="text-sm font-mono font-bold">5</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
