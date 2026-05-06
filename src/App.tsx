import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';
import Dashboard from './pages/Dashboard';
import Shipments from './pages/Shipments';
import Inventory from './pages/Inventory';
import Tasks from './pages/Tasks';
import Fleet from './pages/Fleet';
import Finance from './pages/Finance';
import Reports from './pages/Reports';
import UserManagement from './pages/UserManagement';
import Settings from './pages/Settings';
import Login from './pages/Login';
import { useAuth } from './hooks/useAuth';
import { usePermissions } from './hooks/usePermissions';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, ShieldAlert } from 'lucide-react';

export default function App() {
  const { user, loading } = useAuth();
  const { hasPermission, loading: permsLoading } = usePermissions();
  const [activeTab, setActiveTab] = useState('dashboard');

  console.log('App: State', { authLoading: loading, permsLoading, hasUser: !!user });

  if (loading || (user && permsLoading)) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium animate-pulse uppercase tracking-widest text-[10px]">
          {loading ? 'Initializing Secure Protocol...' : 'Synchronizing Terminal Identity...'}
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-8 text-[10px] text-gray-400 hover:text-blue-600 uppercase tracking-widest font-bold transition-colors"
        >
          Force Re-Sync
        </button>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const isAllowed = hasPermission(activeTab);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="flex-1 ml-64 flex flex-col">
        <TopNav />
        <main className="p-8">
          <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {!isAllowed ? (
              <div className="flex flex-col items-center justify-center h-[70vh] text-center">
                <div className="p-4 bg-red-50 rounded-full mb-4">
                  <ShieldAlert className="w-12 h-12 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 tracking-tight uppercase">Access Denied</h2>
                <p className="text-gray-500 mt-2 max-w-xs text-sm">Your operator role does not have the necessary permissions to access the <b>{activeTab}</b> terminal module.</p>
                <button 
                  onClick={() => setActiveTab('dashboard')}
                  className="mt-6 px-4 py-2 bg-gray-900 text-white rounded text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-all"
                >
                  Return to Dashboard
                </button>
              </div>
            ) : (
              <>
                {activeTab === 'dashboard' && <Dashboard />}
                {activeTab === 'shipments' && <Shipments />}
                {activeTab === 'inventory' && <Inventory />}
                {activeTab === 'tasks' && <Tasks />}
                {activeTab === 'fleet' && <Fleet />}
                {activeTab === 'finance' && <Finance />}
                {activeTab === 'reports' && <Reports />}
                {activeTab === 'team' && <UserManagement />}
                {activeTab === 'settings' && <Settings />}
                {activeTab !== 'dashboard' && 
                 activeTab !== 'shipments' && 
                 activeTab !== 'tasks' && 
                 activeTab !== 'fleet' && 
                 activeTab !== 'inventory' && 
                 activeTab !== 'finance' && 
                 activeTab !== 'reports' && 
                 activeTab !== 'team' && (
                  <div className="flex items-center justify-center h-[70vh] text-gray-400 italic font-medium uppercase tracking-[0.2em] text-[10px]">
                    Module Offline - Deployment in Progress
                  </div>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  </div>
);
}
