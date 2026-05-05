import React, { useState } from 'react';
import { useInventory } from '../hooks/useInventory';
import { Package, ArrowRightLeft, Warehouse, Factory, CheckCircle, Clock, Plus, Search, Filter } from 'lucide-react';
import Modal from '../components/Modal';
import { format } from 'date-fns';

export default function Inventory() {
  const { inventory, transfers, loading, initiateTransfer, receiveTransfer } = useInventory();
  const [activeTab, setActiveTab] = useState<'STOCK' | 'TRANSFERS'>('STOCK');
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [newTransfer, setNewTransfer] = useState({
    sku: '',
    quantity: 0,
    source: 'Processing Plant A',
    destination: 'Main Warehouse NY'
  });

  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    await initiateTransfer({
      sku: newTransfer.sku,
      quantity: Number(newTransfer.quantity),
      source: newTransfer.source,
      destination: newTransfer.destination
    });
    setIsTransferModalOpen(false);
    setNewTransfer({ sku: '', quantity: 0, source: 'Processing Plant A', destination: 'Main Warehouse NY' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory & Distribution</h1>
          <p className="text-gray-500 text-sm">Manage stock levels and inter-facility transfers</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsTransferModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Transfer
          </button>
        </div>
      </div>

      <div className="flex gap-4 border-b border-gray-200">
        <button 
          className={`pb-3 text-sm font-bold tracking-widest uppercase transition-colors relative ${activeTab === 'STOCK' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          onClick={() => setActiveTab('STOCK')}
        >
          Overall Stock
          {activeTab === 'STOCK' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
        </button>
        <button 
          className={`pb-3 text-sm font-bold tracking-widest uppercase transition-colors relative ${activeTab === 'TRANSFERS' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          onClick={() => setActiveTab('TRANSFERS')}
        >
          Transfer Logs
          {activeTab === 'TRANSFERS' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-400">Syncing with warehouse...</div>
      ) : activeTab === 'STOCK' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 technical-card p-0">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search SKU or Product Name..." 
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-md text-sm focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <Filter className="w-4 h-4 text-gray-400 cursor-pointer" />
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">SKU</th>
                  <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Product Name</th>
                  <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Location</th>
                  <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {inventory.map((item, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{item.sku}</span>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-medium text-gray-900">{item.name}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Warehouse className="w-3 h-3" />
                        {item.locationId}
                      </div>
                    </td>
                    <td className="p-4 font-bold text-sm text-gray-900">{item.quantity.toLocaleString()} units</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-4">
            <div className="technical-card p-6 bg-gradient-to-br from-blue-600 to-blue-700 text-white border-none">
              <p className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-4">Storage Capacity</p>
              <div className="flex items-end justify-between mb-2">
                <h3 className="text-3xl font-bold">78%</h3>
                <span className="text-xs text-blue-100">12,400 / 15,000 m³</span>
              </div>
              <div className="h-2 bg-blue-900/30 rounded-full overflow-hidden">
                <div className="h-full bg-blue-400 w-[78%]" />
              </div>
            </div>
            
            <div className="technical-card p-6">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Top Moving SKUs</h4>
              <div className="space-y-4">
                {[
                  { sku: 'SKU-A100', name: 'Beans', change: '+12%' },
                  { sku: 'SKU-B200', name: 'Honey', change: '+5%' }
                ].map((s, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-900">{s.name}</p>
                      <p className="text-[10px] text-gray-400">{s.sku}</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{s.change}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="technical-card p-0">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">ID</th>
                <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Movement</th>
                <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Item / Qty</th>
                <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transfers.map((trf) => (
                <tr key={trf.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <p className="text-xs font-bold text-gray-900">{trf.id}</p>
                    <p className="text-[10px] text-gray-400">{format(new Date(trf.createdAt), 'MMM dd, HH:mm')}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                       <div className="flex flex-col items-center">
                          <Factory className="w-3 h-3 text-gray-400 mb-1" />
                          <span className="text-[10px] font-medium text-gray-600">{trf.source}</span>
                       </div>
                       <ArrowRightLeft className="w-3 h-3 text-blue-300" />
                       <div className="flex flex-col items-center">
                          <Warehouse className="w-3 h-3 text-gray-400 mb-1" />
                          <span className="text-[10px] font-medium text-gray-600">{trf.destination}</span>
                       </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="text-xs font-bold text-gray-900">{trf.sku}</p>
                    <p className="text-xs text-blue-600">{trf.quantity} units</p>
                  </td>
                  <td className="p-4">
                    {trf.status === 'IN_TRANSIT' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                        <Clock className="w-3 h-3" />
                        EN ROUTE
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                        <CheckCircle className="w-3 h-3" />
                        RECEIVED
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    {trf.status === 'IN_TRANSIT' && (
                      <button 
                        onClick={() => receiveTransfer(trf.id)}
                        className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded transition-colors"
                      >
                        Confirm Receipt
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {transfers.length === 0 && (
            <div className="p-12 text-center text-gray-400 text-sm">No transfer history found.</div>
          )}
        </div>
      )}

      <Modal 
        isOpen={isTransferModalOpen} 
        onClose={() => setIsTransferModalOpen(false)} 
        title="Initiate Stock Transfer"
      >
        <form onSubmit={handleInitiate} className="space-y-4">
          <div>
            <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block tracking-widest">SKU Select</label>
            <select 
              className="w-full bg-gray-50 border border-gray-100 rounded-md p-2.5 text-sm outline-none focus:ring-1 focus:ring-blue-500"
              value={newTransfer.sku}
              onChange={(e) => setNewTransfer({...newTransfer, sku: e.target.value})}
              required
            >
              <option value="">Choose Product...</option>
              {inventory.map(i => <option key={i.sku} value={i.sku}>{i.sku} - {i.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block tracking-widest">Quantity</label>
              <input 
                type="number" 
                className="w-full bg-gray-50 border border-gray-100 rounded-md p-2.5 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                value={newTransfer.quantity}
                onChange={(e) => setNewTransfer({...newTransfer, quantity: Number(e.target.value)})}
                required
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block tracking-widest">Priority</label>
              <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-md border border-gray-100">
                 <Clock className="w-4 h-4 text-gray-400" />
                 <span className="text-sm">Standard</span>
              </div>
            </div>
          </div>

          <div>
             <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block tracking-widest">Destination Warehouse</label>
             <div className="flex items-center gap-2 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                <Warehouse className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-800">{newTransfer.destination}</span>
             </div>
          </div>

          <div className="pt-4 flex gap-3">
             <button 
              type="button"
              className="flex-1 py-2.5 bg-gray-50 text-gray-600 text-sm font-bold rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => setIsTransferModalOpen(false)}
             >
                Cancel
             </button>
             <button 
              type="submit"
              className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-md shadow-blue-100"
             >
                Deploy Transfer
             </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
