import React from 'react';
import { useInventory } from '../hooks/useInventory';
import { useShipments } from '../hooks/useShipments';
import { useFinance } from '../hooks/useFinance';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend 
} from 'recharts';
import { Download, FileText, TrendingUp, PieChart as PieChartIcon, Activity } from 'lucide-react';
import { format } from 'date-fns';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

export default function Reports() {
  const { inventory, transfers } = useInventory();
  const { shipments } = useShipments();
  const { expenses } = useFinance();

  // Data Aggregation for Charts
  const inventoryData = inventory.map(item => ({
    name: item.sku,
    qty: item.quantity
  }));

  const shipmentStatusData = [
    { name: 'Pending', value: shipments.filter(s => s.status === 'PENDING').length },
    { name: 'In Transit', value: shipments.filter(s => s.status === 'IN_TRANSIT').length },
    { name: 'Delivered', value: shipments.filter(s => s.status === 'DELIVERED').length },
    { name: 'Delayed', value: shipments.filter(s => s.status === 'DELAYED').length },
  ];

  const exportToCSV = (headers: string[], rows: any[][], fileName: string) => {
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${fileName}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleInventoryExport = () => {
    const headers = ['SKU', 'Product Name', 'Location', 'Quantity', 'Tenant ID'];
    const rows = inventory.map(i => [i.sku, i.name, i.locationId, i.quantity, i.tenantId]);
    exportToCSV(headers, rows, 'inventory_report');
  };

  const handleShipmentExport = () => {
    const headers = ['Tracking Number', 'Status', 'Origin', 'Destination', 'ETA', 'Created At'];
    const rows = shipments.map(s => [s.trackingNumber, s.status, s.origin, s.destination, s.estimatedDelivery, s.createdAt]);
    exportToCSV(headers, rows, 'shipment_summary');
  };

  const handleDispatchExport = () => {
    const headers = ['Transfer ID', 'Source', 'Destination', 'SKU', 'Quantity', 'Status', 'Fulfillment Time'];
    const rows = transfers.map(t => [
      t.id, 
      t.source, 
      t.destination, 
      t.sku, 
      t.quantity, 
      t.status, 
      t.status === 'RECEIVED' ? 'Processed' : 'In Progress'
    ]);
    exportToCSV(headers, rows, 'dispatch_history');
  };

  const handleFinanceExport = () => {
    const headers = ['Expense ID', 'Vendor', 'Amount', 'Currency', 'Category', 'Date', 'Status'];
    const rows = expenses.map(e => [e.id, e.vendor, e.amount, e.currency, e.category, e.date, e.status]);
    exportToCSV(headers, rows, 'finance_reconciliation');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Intelligence & Analytics</h1>
          <p className="text-gray-500 text-sm">System-wide data insights and regulatory exports</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory Dashboard */}
        <div className="technical-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest">Inventory Distribution</h3>
            </div>
            <button onClick={handleInventoryExport} className="export-button">
              <Download className="w-3 h-3" />
              Inventory CSV
            </button>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inventoryData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: '#F9FAFB' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="qty" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Shipment Status Dashboard */}
        <div className="technical-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest">Shipment Status</h3>
            </div>
            <button onClick={handleShipmentExport} className="export-button">
              <Download className="w-3 h-3" />
              Shipments CSV
            </button>
          </div>
          <div className="h-[250px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={shipmentStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {shipmentStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quick Export Cards */}
        <div className="technical-card p-6 border-l-4 border-l-purple-500">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-1">Dispatch & Fulfillment Report</h4>
              <p className="text-xs text-gray-500 mb-4">Transfer logs, confirmation times, and warehouse sync history.</p>
              <button 
                onClick={handleDispatchExport}
                className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-md text-xs font-bold hover:bg-purple-100 transition-colors"
              >
                <FileText className="w-4 h-4" />
                Generate Full Log
              </button>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-200" />
          </div>
        </div>

        <div className="technical-card p-6 border-l-4 border-l-amber-500">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-1">Financial Reconciliation</h4>
              <p className="text-xs text-gray-500 mb-4">Expense tracking, payout verification, and tax summary.</p>
              <button 
                onClick={handleFinanceExport}
                className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-md text-xs font-bold hover:bg-amber-100 transition-colors"
              >
                <FileText className="w-4 h-4" />
                Export Ledger
              </button>
            </div>
            <TrendingUp className="w-8 h-8 text-amber-200" />
          </div>
        </div>
      </div>

      <style>{`
        .export-button {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background-color: #f9fafb;
          border: 1px border #e5e7eb;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 700;
          color: #4b5563;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          transition: all 0.2s;
        }
        .export-button:hover {
          background-color: #f3f4f6;
          color: #111827;
          border-color: #d1d5db;
        }
      `}</style>
    </div>
  );
}
