import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  Users, UserPlus, Shield, Mail, Key, 
  MoreHorizontal, Edit2, Trash2, CheckCircle2,
  XCircle, Filter, Search, Loader2, AlertCircle, RefreshCw
} from 'lucide-react';
import { UserRole } from '../types';
import Modal from '../components/Modal';

interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'ACTIVE' | 'INACTIVE';
  last_login?: string;
}

interface AuditLog {
  id: number;
  user_name: string;
  action: string;
  details: string;
  timestamp: string;
}

interface RolePermission {
  role: string;
  feature: string;
  enabled: number;
}

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [team, setTeam] = useState<ManagedUser[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'permissions' | 'logs'>('users');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'TEAM_MEMBER' as UserRole, password: '' });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const roles: UserRole[] = ['ADMIN', 'COORDINATOR', 'DRIVER', 'TEAM_MEMBER'];
  const features = ['dashboard', 'shipments', 'inventory', 'finance', 'reports', 'tasks', 'team', 'fleet', 'settings'];

  const fetchData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const [usersRes, logsRes, permRes] = await Promise.all([
        fetch('/api/users', { headers: { 'x-user-id': currentUser.uid } }),
        fetch('/api/audit-logs', { headers: { 'x-user-id': currentUser.uid } }),
        fetch('/api/permissions', { headers: { 'x-user-id': currentUser.uid } })
      ]);
      
      if (usersRes.ok && logsRes.ok && permRes.ok) {
        setTeam(await usersRes.json());
        setLogs(await logsRes.json());
        setPermissions(await permRes.json());
      }
    } catch (err) {
      console.error('Failed to fetch user data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  const handleTogglePermission = async (role: string, feature: string, enabled: boolean) => {
    if (!currentUser) return;
    setActionLoading(`perm-${role}-${feature}`);
    try {
      const res = await fetch('/api/permissions', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': currentUser.uid 
        },
        body: JSON.stringify({ role, feature, enabled })
      });
      if (res.ok) {
        await fetchData();
      }
    } finally {
      setActionLoading(null);
    }
  };

  const isPermissionEnabled = (role: string, feature: string) => {
    return permissions.find(p => p.role === role && p.feature === feature)?.enabled === 1;
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setActionLoading('create');
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': currentUser.uid 
        },
        body: JSON.stringify(newUser)
      });
      if (res.ok) {
        await fetchData();
        setIsCreateModalOpen(false);
        setNewUser({ name: '', email: '', role: 'TEAM_MEMBER', password: '' });
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!currentUser) return;
    if (!confirm('Are you sure you want to reset this user\'s password?')) return;
    
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/users/${userId}/reset-password`, {
        method: 'POST',
        headers: { 'x-user-id': currentUser.uid }
      });
      if (res.ok) {
        const { newPassword } = await res.json();
        alert(`Password reset successful. New password: ${newPassword}`);
        await fetchData();
      }
    } finally {
      setActionLoading(null);
    }
  };

  const filteredTeam = team.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (currentUser?.role !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center p-8">
        <Shield className="w-16 h-16 text-gray-200 mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Access Restricted</h2>
        <p className="text-gray-500 max-w-sm mt-2">Only system administrators can access the team management and user configuration terminal.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">System Administration</h1>
          <p className="text-gray-500 text-sm">Configure operators, permissions, and monitor system security</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={fetchData}
            className="p-2 text-gray-400 hover:text-blue-600 transition-colors bg-white border border-gray-200 rounded-md"
            title="Refresh System Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            PROVISION OPERATOR
          </button>
        </div>
      </div>

      <div className="flex border-b border-gray-100 mb-6 gap-8">
        {[
          { id: 'users', label: 'Terminal Operators', icon: Users },
          { id: 'permissions', label: 'Access Policies', icon: Shield },
          { id: 'logs', label: 'Security Audit', icon: AlertCircle }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 pb-4 text-xs font-bold uppercase tracking-widest transition-all relative ${
              activeTab === tab.id ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Operators', value: team.length, icon: Users, color: 'text-blue-600' },
              { label: 'Active Sessions', value: team.filter(u => !!u.last_login).length, icon: CheckCircle2, color: 'text-emerald-600' },
              { label: 'System Admins', value: team.filter(u => u.role === 'ADMIN').length, icon: Shield, color: 'text-purple-600' },
              { label: 'Inactive Users', value: team.filter(u => u.status === 'INACTIVE').length, icon: XCircle, color: 'text-amber-600' },
            ].map((stat, i) => (
              <div key={i} className="technical-card p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 bg-gray-50 rounded-lg ${stat.color}`}>
                    <stat.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                    <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="technical-card">
            <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Search by name, email, or role..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto min-h-[400px]">
              {loading ? (
                <div className="flex flex-col items-center justify-center p-20 gap-4">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Fetching Centralized Identity Data...</p>
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                      <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Operator</th>
                      <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">System Role</th>
                      <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                      <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Last Activity</th>
                      <th className="p-4 w-10">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredTeam.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                              {u.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900">{u.name}</p>
                              <p className="text-xs text-gray-500">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded tracking-widest ${
                            u.role === 'ADMIN' ? 'bg-purple-50 text-purple-600' :
                            u.role === 'COORDINATOR' ? 'bg-blue-50 text-blue-600' :
                            u.role === 'DRIVER' ? 'bg-emerald-50 text-emerald-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${u.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                            <span className="text-xs font-medium text-gray-700 font-mono tracking-tighter">{u.status}</span>
                          </div>
                        </td>
                        <td className="p-4 text-xs text-gray-500 font-mono">
                          {u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleResetPassword(u.id)}
                              disabled={!!actionLoading}
                              className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-all"
                              title="Reset Password"
                            >
                              <Key className="w-3.5 h-3.5" />
                            </button>
                            <button className="p-1.5 text-gray-300 hover:text-gray-600 hover:bg-gray-100 rounded transition-all">
                              <MoreHorizontal className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'permissions' && (
        <div className="technical-card p-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-gray-900 tracking-tight">Role-Based Access Matrix</h3>
              <p className="text-sm text-gray-500">Configure which system features are visible to each user role.</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
              <Shield className="w-6 h-6" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest w-48">Feature Module</th>
                  {roles.map(role => (
                    <th key={role} className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
                      {role}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {features.map(feature => (
                  <tr key={feature} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">{feature}</span>
                        <span className="text-[10px] text-gray-500 italic">Access to {feature} terminal</span>
                      </div>
                    </td>
                    {roles.map(role => {
                      const enabled = isPermissionEnabled(role, feature);
                      const isLoading = actionLoading === `perm-${role}-${feature}`;
                      const isAdminRole = role === 'ADMIN';

                      return (
                        <td key={role} className="p-4 text-center">
                          <button
                            disabled={isAdminRole || isLoading || loading}
                            onClick={() => handleTogglePermission(role, feature, !enabled)}
                            className={`p-2 rounded-md transition-all ${
                              enabled 
                                ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' 
                                : 'text-gray-300 bg-gray-50 hover:bg-gray-100'
                            } ${isAdminRole ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {isLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                            ) : enabled ? (
                              <CheckCircle2 className="w-5 h-5 mx-auto" />
                            ) : (
                              <XCircle className="w-5 h-5 mx-auto" />
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-8 p-4 bg-amber-50 border border-amber-100 rounded-lg flex items-start gap-3">
             <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
             <div className="text-xs text-amber-800">
                <p className="font-bold mb-1 uppercase tracking-tight">Security Note</p>
                <p>Admin permissions are hardcoded for system stability and cannot be revoked. Changes to permissions take effect immediately upon next page load for affected users.</p>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="technical-card p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 tracking-tight">Security Audit Logs</h3>
              <p className="text-sm text-gray-500 tracking-tight">Real-time ledger of all sensitive system operations and terminal access.</p>
            </div>
            <Shield className="w-8 h-8 text-amber-100" />
          </div>
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {logs.length === 0 ? (
              <p className="text-xs text-gray-400 italic text-center py-8">No system activity logs found.</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-amber-200 transition-colors">
                   <div className="pt-0.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${
                        log.action.includes('LOGIN') ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' :
                        log.action.includes('CREATE') ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                        log.action.includes('PERMISSION') ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]' :
                        'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                      }`} />
                   </div>
                   <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                         <span className="text-xs font-bold text-gray-900 tracking-tight">{log.action}</span>
                         <span className="text-[10px] text-gray-400 px-2 py-0.5 bg-white rounded border border-gray-100 font-mono">
                            {new Date(log.timestamp).toLocaleString()}
                         </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{log.details}</p>
                      <div className="flex items-center gap-2">
                         <div className="w-4 h-4 bg-blue-100 text-blue-600 rounded flex items-center justify-center text-[8px] font-bold">
                            {log.user_name.charAt(0)}
                         </div>
                         <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">{log.user_name}</p>
                      </div>
                   </div>
                </div>
              ))
            )}
          </div>
          <button className="mt-6 w-full py-3 text-xs font-bold text-amber-600 uppercase tracking-widest border-2 border-dashed border-amber-200 rounded-lg hover:bg-amber-50 transition-colors">
            Download Cryptographic Audit Trail (JSON/CSV)
          </button>
        </div>
      )}

      <Modal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
        title="Invite Terminal Operator"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="space-y-2">
             <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Name</label>
             <input 
              required
              className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500"
              value={newUser.name}
              onChange={e => setNewUser({...newUser, name: e.target.value})}
              placeholder="e.g. Sarah Jenkins"
             />
          </div>
          <div className="space-y-2">
             <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Email Terminal</label>
             <input 
              required
              type="email"
              className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500"
              value={newUser.email}
              onChange={e => setNewUser({...newUser, email: e.target.value})}
              placeholder="operator@swiftconnect.com"
             />
          </div>
          <div className="space-y-2">
             <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Security Role</label>
             <select 
              className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500"
              value={newUser.role}
              onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}
             >
                <option value="ADMIN">System Admin</option>
                <option value="COORDINATOR">Operations Coordinator</option>
                <option value="DRIVER">Fleet Driver</option>
                <option value="TEAM_MEMBER">General Terminal Access</option>
             </select>
          </div>
          <div className="space-y-2">
             <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Initial Security Pin</label>
             <input 
              required
              type="password"
              className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500"
              value={newUser.password}
              onChange={e => setNewUser({...newUser, password: e.target.value})}
              placeholder="••••••••"
             />
          </div>
          <div className="pt-4">
             <button 
              type="submit"
              disabled={!!actionLoading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
             >
                {actionLoading === 'create' ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                PROVISION ACCESS
             </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
