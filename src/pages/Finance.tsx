import React, { useState, useRef } from 'react';
import { useFinance } from '../hooks/useFinance';
import { useAuth } from '../hooks/useAuth';
import { 
  Receipt, 
  Plus, 
  Upload, 
  FileText, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Send, 
  HandCoins, 
  CreditCard,
  Search,
  Filter,
  Loader2
} from 'lucide-react';
import Modal from '../components/Modal';
import { format } from 'date-fns';
import { performOCR } from '../services/geminiService';

export default function Finance() {
  const { expenses, loading, addExpense, updateExpenseStatus } = useFinance();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    vendor: '',
    amount: 0,
    currency: 'USD',
    category: 'General',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd')
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsOcrLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      try {
        const result = await performOCR(base64, file.type);
        setFormData({
          vendor: result.vendor,
          amount: result.amount,
          currency: result.currency,
          category: result.category,
          description: result.description,
          date: result.date
        });
      } catch (err) {
        console.error("OCR Failed:", err);
      } finally {
        setIsOcrLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addExpense(formData);
    setIsModalOpen(false);
    setFormData({
      vendor: '',
      amount: 0,
      currency: 'USD',
      category: 'General',
      description: '',
      date: format(new Date(), 'yyyy-MM-dd')
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <span className="badge bg-yellow-50 text-yellow-600 border-yellow-100"><Clock className="w-3 h-3" /> PENDING</span>;
      case 'APPROVED': return <span className="badge bg-emerald-50 text-emerald-600 border-emerald-100"><CheckCircle className="w-3 h-3" /> APPROVED</span>;
      case 'SENT': return <span className="badge bg-blue-50 text-blue-600 border-blue-100"><Send className="w-3 h-3" /> PAYMENT SENT</span>;
      case 'RECEIVED': return <span className="badge bg-purple-50 text-purple-600 border-purple-100"><HandCoins className="w-3 h-3" /> RECONCILED</span>;
      case 'REJECTED': return <span className="badge bg-red-50 text-red-600 border-red-100"><XCircle className="w-3 h-3" /> REJECTED</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance & Reimbursements</h1>
          <p className="text-gray-500 text-sm">Track expenses and manage team payouts with OCR automation</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Expense
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Pending Approval', value: '$1,240', icon: Clock, color: 'text-yellow-600' },
          { label: 'Awaiting Payout', value: '$850', icon: CreditCard, color: 'text-blue-600' },
          { label: 'Total Reconciled', value: '$12,400', icon: CheckCircle, color: 'text-emerald-600' }
        ].map((stat, i) => (
          <div key={i} className="technical-card p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
              <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
            <stat.icon className={`w-8 h-8 ${stat.color} opacity-20`} />
          </div>
        ))}
      </div>

      <div className="technical-card p-0">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Filter by vendor or category..." 
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-md text-sm focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <Filter className="w-4 h-4 text-gray-400 cursor-pointer" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Details</th>
                <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Category</th>
                <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Amount</th>
                <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="p-12 text-center text-gray-400">Loading financial records...</td></tr>
              ) : expenses.map(exp => (
                <tr key={exp.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <p className="text-sm font-bold text-gray-900">{exp.vendor}</p>
                    <p className="text-xs text-gray-500">{exp.description}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{format(new Date(exp.date), 'MMM dd, yyyy')}</p>
                  </td>
                  <td className="p-4">
                    <span className="text-[10px] font-bold px-2 py-1 bg-gray-100 text-gray-600 rounded uppercase">
                      {exp.category}
                    </span>
                  </td>
                  <td className="p-4">
                    <p className="text-sm font-bold text-gray-900">{exp.currency} {exp.amount.toFixed(2)}</p>
                  </td>
                  <td className="p-4">
                    {getStatusBadge(exp.status)}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2 text-xs font-bold">
                      {user?.role === 'ADMIN' && exp.status === 'PENDING' && (
                        <>
                          <button 
                            onClick={() => updateExpenseStatus(exp.id, 'APPROVED')}
                            className="text-emerald-600 hover:bg-emerald-50 px-2 py-1 rounded"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => updateExpenseStatus(exp.id, 'REJECTED')}
                            className="text-red-600 hover:bg-red-50 px-2 py-1 rounded"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {user?.role === 'ADMIN' && exp.status === 'APPROVED' && (
                        <button 
                          onClick={() => updateExpenseStatus(exp.id, 'SENT')}
                          className="text-blue-600 hover:bg-blue-50 px-2 py-1 rounded flex items-center gap-1"
                        >
                          <CreditCard className="w-3 h-3" /> Mark Paid
                        </button>
                      )}
                      {exp.status === 'SENT' && exp.userId === user?.uid && (
                        <button 
                          onClick={() => updateExpenseStatus(exp.id, 'RECEIVED')}
                          className="text-purple-600 hover:bg-purple-50 px-2 py-1 rounded flex items-center gap-1"
                        >
                          <CheckCircle className="w-3 h-3" /> Confirm Receipt
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Expense Request">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div 
            className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer bg-gray-50/50"
            onClick={() => fileInputRef.current?.click()}
          >
            {isOcrLoading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                <p className="text-sm font-medium text-gray-600">AI Scanning Receipt...</p>
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">Upload Receipt (PDF, Image)</p>
                <p className="text-xs text-gray-400">OCR will automatically fill the form</p>
              </>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*,application/pdf"
              onChange={handleFileUpload}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Vendor</label>
              <input 
                type="text" 
                className="technical-input w-full"
                value={formData.vendor}
                onChange={e => setFormData({...formData, vendor: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Amount</label>
              <input 
                type="number" 
                step="0.01"
                className="technical-input w-full"
                value={formData.amount}
                onChange={e => setFormData({...formData, amount: Number(e.target.value)})}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Category</label>
              <select 
                className="technical-input w-full"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
              >
                <option>Travel</option>
                <option>Food</option>
                <option>Fuel</option>
                <option>Hardware</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Date</label>
              <input 
                type="date" 
                className="technical-input w-full"
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Description</label>
            <textarea 
              className="technical-input w-full h-20 resize-none"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              placeholder="Purpose of expense..."
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              className="flex-1 py-2.5 text-sm font-bold text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="flex-1 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-md shadow-blue-100"
            >
              Submit Expense
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
