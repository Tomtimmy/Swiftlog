import React, { useState } from 'react';
import { Package, Search, Edit3, ShieldAlert, Check, X, AlertCircle, TrendingUp, Filter, ArrowRightLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useInventory, InventoryItem } from '../hooks/useInventory';
import { useAuth } from '../hooks/useAuth';
import StockTransferModal from '../components/StockTransferModal';

export default function Inventory() {
  const { items, loading, updatePrice, addItem, transferStock } = useInventory();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [newPrice, setNewPrice] = useState<string>('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    sku: '',
    category: '',
    quantity: 0,
    price: 0,
    unit: 'unit',
    location: user?.location || 'HQ'
  });

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    await (addItem as any)(newItem);
    setIsAddItemModalOpen(false);
    setNewItem({
      name: '',
      sku: '',
      category: '',
      quantity: 0,
      price: 0,
      unit: 'unit',
      location: user?.location || 'HQ'
    });
  };

  const isManager = user?.role === 'ADMIN' || user?.role === 'COORDINATOR';

  const filtered = items.filter(i => 
    (i.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (i.sku?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const handleEditClick = (item: InventoryItem) => {
    if (!isManager) return;
    setEditingItem(item);
    setNewPrice(item.price.toString());
    setIsConfirming(false);
  };

  const handlePriceUpdate = async () => {
    if (!editingItem || !newPrice) return;
    const price = parseFloat(newPrice);
    if (isNaN(price)) return;

    if (!isConfirming) {
      setIsConfirming(true);
      return;
    }

    const success = await updatePrice(editingItem.id, editingItem.name, price);
    if (success) {
      setEditingItem(null);
      setIsConfirming(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <Package className="w-6 h-6 text-blue-600" />
            Inventory & Price Governance
          </h1>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-widest mt-1">
            {isManager ? 'Master Pricing Control Active' : 'Location-Locked View Mode'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {isManager && (
            <>
              <button 
                onClick={() => setIsAddItemModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Package className="w-4 h-4" />
                Add Stock Item
              </button>
              <button 
                onClick={() => setIsTransferModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors shadow-sm"
              >
                <ArrowRightLeft className="w-4 h-4" />
                Stock Transfer
              </button>
            </>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Filter SKUs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500 transition-all font-medium w-64"
            />
          </div>
          <button className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Product / SKU</th>
              <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Category</th>
              <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Stock Level</th>
              <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Unit Price</th>
              <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Hub Location</th>
              <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Manage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={6} className="p-12 text-center text-[10px] text-gray-400 uppercase font-black tracking-[0.2em] animate-pulse">Initializing Inventory Protocol...</td></tr>
            ) : filtered.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                <td className="p-4">
                  <p className="text-sm font-bold text-gray-900 leading-none">{item.name}</p>
                  <p className="text-[10px] font-mono text-gray-400 mt-1 uppercase leading-none">{item.sku}</p>
                </td>
                <td className="p-4">
                  <span className="text-[10px] font-bold px-2 py-1 bg-gray-100 text-gray-600 rounded uppercase tracking-wider">{item.category}</span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">{item.quantity}</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">{item.unit}s</span>
                  </div>
                </td>
                <td className="p-4 text-right">
                  <p className="text-sm font-mono font-bold text-blue-600">${item.price.toFixed(2)}</p>
                </td>
                <td className="p-4">
                  <span className="text-[10px] font-bold font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">{item.location}</span>
                </td>
                <td className="p-4">
                  <div className="flex justify-center">
                    {isManager ? (
                      <button 
                        onClick={() => handleEditClick(item)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    ) : (
                      <ShieldAlert className="w-4 h-4 text-gray-200" title="Governance Restricted" />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {isAddItemModalOpen && (
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200"
            >
              <div className="p-6 bg-blue-600 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Package className="w-6 h-6" />
                    <h3 className="text-lg font-bold">New Inventory Protocol</h3>
                  </div>
                  <button onClick={() => setIsAddItemModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleAddItem} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Product Name</label>
                    <input 
                      required
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500"
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">SKU Identifier</label>
                    <input 
                      required
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono outline-none focus:ring-1 focus:ring-blue-500"
                      value={newItem.sku}
                      onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Category</label>
                    <input 
                      required
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500"
                      value={newItem.category}
                      onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Unit Type</label>
                    <input 
                      required
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500"
                      value={newItem.unit}
                      onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Base Price ($)</label>
                    <input 
                      required
                      type="number"
                      step="0.01"
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono outline-none focus:ring-1 focus:ring-blue-500"
                      value={newItem.price}
                      onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Initial Stock</label>
                    <input 
                      required
                      type="number"
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono outline-none focus:ring-1 focus:ring-blue-500"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsAddItemModalOpen(false)}
                    className="flex-1 py-3 bg-gray-50 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-100 transition-colors uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100 uppercase tracking-widest"
                  >
                    Register Product
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {editingItem && (
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200"
            >
              <div className="p-6 bg-gray-900 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Price Governance</h3>
                      <p className="text-[10px] text-gray-400 uppercase tracking-[0.1em] font-bold">Modifying SKU: {editingItem.sku}</p>
                    </div>
                  </div>
                  <button onClick={() => setEditingItem(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Product Authority</label>
                  <p className="text-sm font-bold text-gray-900">{editingItem.name}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">Current Price</label>
                    <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg text-lg font-mono font-bold text-gray-500">
                      ${editingItem.price.toFixed(2)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-blue-600 uppercase tracking-widest font-mono">New Evaluation</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-gray-400">$</span>
                      <input 
                        type="number"
                        step="0.01"
                        autoFocus
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                        className="w-full pl-8 pr-4 py-3 bg-blue-50 border border-blue-100 rounded-lg text-lg font-mono font-bold text-blue-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {isConfirming ? (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-3"
                  >
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-amber-900 leading-tight">Confirm Price Versioning</p>
                      <p className="text-[10px] text-amber-700 mt-1 leading-relaxed">
                        This change takes effect immediately. The entire team will be notified of this price implementation. Do you wish to proceed?
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl flex gap-3">
                    <AlertCircle className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-gray-500 leading-relaxed font-medium">
                        Price edits require high-level clearance. Historical records remain at previous values; new price applies to all future operations.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => setEditingItem(null)}
                    className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all uppercase tracking-widest"
                  >
                    Abort
                  </button>
                  <button 
                    onClick={handlePriceUpdate}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all uppercase tracking-widest flex items-center justify-center gap-2 ${
                      isConfirming ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {isConfirming ? (
                      <>
                        <Check className="w-4 h-4" />
                        Execute Change
                      </>
                    ) : (
                      'Initialize Update'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <StockTransferModal 
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        items={items}
        onTransfer={transferStock}
      />
    </div>
  );
}
