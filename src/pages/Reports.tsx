import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, LineChart, Line, Legend, AreaChart, Area, PieChart, Pie 
} from 'recharts';
import { 
  Download, Activity, TrendingUp, MapPin, Package, 
  BarChart3, ChevronRight, X, ShieldCheck, DollarSign,
  ArrowUpRight, ArrowDownRight, Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useReports, SalesSummary, SKUPerformance } from '../hooks/useReports';
import { useAuth } from '../hooks/useAuth';

export default function Reports() {
  const { reportData, loading, getDrilldown } = useReports();
  const { user } = useAuth();
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [drilldownData, setDrilldownData] = useState<any[]>([]);
  const [isDrilldownLoading, setIsDrilldownLoading] = useState(false);

  const isManager = user?.role === 'ADMIN' || user?.role === 'COORDINATOR';

  const handleLocationClick = async (location: string) => {
    setSelectedLocation(location);
    setIsDrilldownLoading(true);
    const data = await getDrilldown(location);
    setDrilldownData(data);
    setIsDrilldownLoading(false);
  };

  if (!isManager) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
          <ShieldCheck className="w-10 h-10 text-gray-300" />
        </div>
        <h2 className="text-xl font-bold text-navy-logistics tracking-tight uppercase">Access Restricted</h2>
        <p className="text-slate-industrial text-sm mt-2 max-w-sm"> Advanced reporting and revenue analytics are only accessible to Terminal Management.</p>
      </div>
    );
  }

  const salesByLocationData = reportData?.summary.map(s => ({
    name: s.location,
    revenue: s.total_revenue,
    units: s.total_units
  })) || [];

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-black text-navy-logistics tracking-tighter flex items-center gap-3 uppercase">
            <BarChart3 className="w-8 h-8 text-electric-orange" />
            Intelligence Terminal
          </h1>
          <p className="text-[10px] font-bold text-slate-industrial/60 uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
            <Activity className="w-3 h-3 text-ops-green" />
            Real-Time Logistics Data & Revenue Governance
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-[10px] font-bold uppercase tracking-widest text-slate-industrial hover:bg-gray-50 transition-all">
            <Printer className="w-3.5 h-3.5" />
            Print Ledger
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-navy-logistics text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-opacity-90 shadow-lg shadow-navy-logistics/20 transition-all">
            <Download className="w-3.5 h-3.5" />
            Export System Audit
          </button>
        </div>
      </div>

      {/* High-Level Sales Summary [cite: 21] */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 bg-navy-logistics border-b border-navy-logistics/10">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <MapPin className="w-4 h-4 text-electric-orange" />
                Regional Sales Volume
              </h3>
              <span className="text-[10px] font-mono font-bold text-gray-400">REF: SC-REV-2026</span>
            </div>
          </div>
          <div className="p-8 h-[350px] w-full bg-slate-50/50">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesByLocationData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis 
                  dataKey="name" 
                  fontSize={10} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#4A5568', fontWeight: 700 }}
                />
                <YAxis 
                  fontSize={10} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#4A5568', fontWeight: 700 }}
                />
                <Tooltip 
                  cursor={{ fill: '#EDF2F7', opacity: 0.4 }}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                    backgroundColor: '#1A365D',
                    color: '#FFFFFF'
                  }}
                  itemStyle={{ color: '#F6AD55', fontWeight: 800, fontSize: '12px' }}
                />
                <Bar 
                  dataKey="revenue" 
                  fill="#F6AD55" 
                  radius={[6, 6, 0, 0]} 
                  className="cursor-pointer"
                  onClick={(data) => handleLocationClick(data.name)}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
               <div className="w-3 h-3 bg-electric-orange rounded-sm" />
               <span className="text-[9px] font-bold text-slate-industrial uppercase tracking-widest">Gross Revenue ($)</span>
            </div>
            <p className="text-[10px] text-slate-industrial/60 font-medium italic italic">Click bars to initialize SKU-level drilldown terminal.</p>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 flex flex-col">
          <h3 className="text-xs font-bold text-navy-logistics uppercase tracking-widest border-b border-gray-50 pb-4 mb-4 flex items-center gap-2">
             <DollarSign className="w-4 h-4 text-ops-green" />
             Regional Revenue Breakdown
          </h3>
          <div className="space-y-4 flex-1">
            {reportData?.summary.map((loc) => (
              <button 
                key={loc.location}
                onClick={() => handleLocationClick(loc.location)}
                className="w-full flex items-center justify-between p-4 bg-gray-50/50 rounded-xl hover:bg-electric-orange/10 transition-all group border border-transparent hover:border-electric-orange/20"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white border border-gray-100 rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                    <MapPin className="w-4 h-4 text-navy-logistics" />
                  </div>
                  <div className="text-left">
                    <p className="text-[11px] font-bold text-navy-logistics uppercase tracking-tight">{loc.location}</p>
                    <p className="text-[10px] text-slate-industrial font-mono mt-0.5">{loc.transaction_count} Trans.</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-ops-green font-mono">${loc.total_revenue.toLocaleString()}</p>
                  <p className="text-[9px] font-bold text-slate-industrial uppercase tracking-widest mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Drill Down <ChevronRight className="w-2.5 h-2.5 inline" /></p>
                </div>
              </button>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100">
             <div className="flex items-center justify-between text-navy-logistics">
                <span className="text-[10px] font-bold uppercase tracking-widest">Total Terminal Rev</span>
                <span className="text-lg font-black font-mono">
                  ${reportData?.summary.reduce((acc, curr) => acc + curr.total_revenue, 0).toLocaleString()}
                </span>
             </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics: SKU revenue and Stock-to-Sales ratios [cite: 23, 24] */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
           <h3 className="text-xs font-bold text-navy-logistics uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-ops-green" />
              Advanced Performance Index
           </h3>
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-ops-green" />
                 <span className="text-[9px] font-bold text-slate-industrial uppercase tracking-widest">Optimal &gt; 0.5</span>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-electric-orange" />
                 <span className="text-[9px] font-bold text-slate-industrial uppercase tracking-widest">Critical &lt; 0.2</span>
              </div>
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="p-5 text-[10px] font-bold text-slate-industrial uppercase tracking-widest border-b border-gray-100">SKU Master</th>
                <th className="p-5 text-[10px] font-bold text-slate-industrial uppercase tracking-widest border-b border-gray-100 text-right">Revenue Contrib.</th>
                <th className="p-5 text-[10px] font-bold text-slate-industrial uppercase tracking-widest border-b border-gray-100 text-center">Volume Sold</th>
                <th className="p-5 text-[10px] font-bold text-slate-industrial uppercase tracking-widest border-b border-gray-100 text-center">Current Vault</th>
                <th className="p-5 text-[10px] font-bold text-slate-industrial uppercase tracking-widest border-b border-gray-100 text-right">S-T-S Ratio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {reportData?.performance.map((perf) => (
                <tr key={perf.sku} className="hover:bg-gray-50/80 transition-colors">
                  <td className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-navy-logistics opacity-30" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-navy-logistics">{perf.name}</p>
                        <p className="text-[10px] font-mono text-slate-industrial/60 mt-0.5 uppercase">{perf.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-5 text-right">
                    <div className="inline-flex items-center gap-2 text-ops-green font-mono font-bold">
                       <DollarSign className="w-3.5 h-3.5" />
                       {perf.revenue.toLocaleString()}
                    </div>
                  </td>
                  <td className="p-5 text-center">
                    <span className="text-sm font-bold text-navy-logistics">{perf.units_sold}</span>
                  </td>
                  <td className="p-5 text-center">
                    <span className="text-sm font-bold text-slate-industrial bg-gray-100 px-3 py-1 rounded-full">{perf.current_stock}</span>
                  </td>
                  <td className="p-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <span className={`text-[11px] font-black font-mono ${
                         perf.stock_to_sales_ratio > 0.5 ? 'text-ops-green' : 
                         perf.stock_to_sales_ratio > 0.2 ? 'text-electric-orange' : 'text-red-600'
                       }`}>
                          {perf.stock_to_sales_ratio.toFixed(2)}
                       </span>
                       {perf.stock_to_sales_ratio > 0.4 ? <ArrowUpRight className="w-3.5 h-3.5 text-ops-green" /> : <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Drill Down Modal [cite: 21] */}
      <AnimatePresence>
        {selectedLocation && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-navy-logistics/40 backdrop-blur-md"
              onClick={() => setSelectedLocation(null)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border border-gray-100"
            >
              <div className="p-8 bg-navy-logistics text-white flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-electric-orange rounded-2xl">
                    <MapPin className="w-6 h-6 text-navy-logistics" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tight">Location Intelligence: {selectedLocation}</h3>
                    <p className="text-[10px] text-gray-400 uppercase font-black tracking-[0.2em] mt-1">Full SKU-Level Revenue Breakdown Terminal</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedLocation(null)}
                  className="p-3 hover:bg-white/10 rounded-full transition-all group"
                >
                  <X className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                </button>
              </div>

              <div className="p-8">
                {isDrilldownLoading ? (
                  <div className="py-20 text-center flex flex-col items-center">
                     <div className="w-12 h-12 border-4 border-electric-orange border-t-transparent rounded-full animate-spin mb-4" />
                     <p className="text-[11px] font-bold text-navy-logistics uppercase tracking-widest animate-pulse">Synchronizing Regional Ledger...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="h-[300px]">
                       <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                           <Pie
                              data={drilldownData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="revenue"
                           >
                             {drilldownData.map((_, index) => (
                               <Cell key={`cell-${index}`} fill={['#F6AD55', '#38A169', '#1A365D', '#4A5568'][index % 4]} />
                             ))}
                           </Pie>
                           <Tooltip />
                         </PieChart>
                       </ResponsiveContainer>
                    </div>

                    <div className="space-y-3">
                       <h4 className="text-[10px] font-bold text-slate-industrial uppercase tracking-widest border-b pb-2 mb-4">SKU Level Performance</h4>
                       {drilldownData.map((sku) => (
                         <div key={sku.sku} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                           <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-electric-orange" />
                              <div>
                                 <p className="text-xs font-bold text-navy-logistics uppercase tracking-tight">{sku.sku}</p>
                                 <p className="text-[10px] text-slate-industrial/60 font-mono">{sku.units} Units Sold</p>
                              </div>
                           </div>
                           <p className="text-sm font-black text-navy-logistics font-mono">${sku.revenue.toLocaleString()}</p>
                         </div>
                       ))}
                       <div className="mt-8 p-6 bg-navy-logistics rounded-2xl text-center">
                          <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] mb-1 font-bold">Aggregated Revenue</p>
                          <p className="text-2xl font-black text-electric-orange font-mono">
                             ${drilldownData.reduce((acc, curr) => acc + curr.revenue, 0).toLocaleString()}
                          </p>
                       </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
