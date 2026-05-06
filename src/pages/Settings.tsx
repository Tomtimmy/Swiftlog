import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  User, 
  Lock, 
  Bell, 
  Shield, 
  Save, 
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Settings() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user.uid 
        },
        body: JSON.stringify({ name: profileData.name })
      });
      if (res.ok) {
        const updated = await res.json();
        refreshUser({ name: updated.name, avatar: updated.avatar });
        alert('Profile updated successfully.');
      }
    } catch (err) {
      console.error('Failed to update profile', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user.uid 
        },
        body: JSON.stringify({ password: passwordData.newPassword })
      });
      if (res.ok) {
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        alert('Password updated successfully.');
      }
    } catch (err) {
      console.error('Failed to update password', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">System Settings</h1>
          <p className="text-gray-500 text-sm">Configure your personal profile and terminal preferences</p>
        </div>
        <div className="p-3 bg-gray-100 rounded-lg text-gray-400">
          <SettingsIcon className="w-6 h-6" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="technical-card p-6 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mb-4 border-4 border-white shadow-sm">
              {profileData.name.charAt(0)}
            </div>
            <h3 className="font-bold text-gray-900">{profileData.name}</h3>
            <p className="text-xs text-gray-500 font-mono mb-4">{profileData.email}</p>
            
            <div className={`px-3 py-1 rounded text-[10px] font-bold tracking-widest uppercase ${
              profileData.role === 'ADMIN' ? 'bg-purple-50 text-purple-600' :
              profileData.role === 'COORDINATOR' ? 'bg-blue-50 text-blue-600' :
              'bg-gray-100 text-gray-600'
            }`}>
              {profileData.role}
            </div>
          </div>

          <div className="technical-card p-4">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Terminal Status</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Connection</span>
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  ENCRYPTED
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Terminal ID</span>
                <span className="text-gray-900 font-mono">SWIFT-NODE-042</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Uptime</span>
                <span className="text-gray-900 font-mono">14.2 Hours</span>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Profile Section */}
          <section className="technical-card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest">Personal Profile</h3>
            </div>
            <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Full Name</label>
                  <input 
                    type="text" 
                    value={profileData.name}
                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500 transition-all" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Email Address</label>
                  <input 
                    type="email" 
                    value={profileData.email}
                    disabled
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-sm text-gray-500 outline-none cursor-not-allowed" 
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded text-xs font-bold uppercase tracking-widest hover:bg-blue-700 transition-all disabled:opacity-50"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Profile Changes
                </button>
              </div>
            </form>
          </section>

          {/* Security Section */}
          <section className="technical-card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest">Security & Credentials</h3>
            </div>
            <form onSubmit={handleUpdatePassword} className="p-6 space-y-4">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Current Password</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500 transition-all" 
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">New Password</label>
                    <input 
                      type="password" 
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500 transition-all" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Confirm New Password</label>
                    <input 
                      type="password" 
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500 transition-all" 
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded text-xs font-bold uppercase tracking-widest hover:bg-amber-700 transition-all disabled:opacity-50"
                >
                  Update Credentials
                </button>
              </div>
            </form>
          </section>

          {/* Preferences Section */}
          <section className="technical-card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
              <Bell className="w-4 h-4 text-purple-600" />
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest">Notification Preferences</h3>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: 'Dispatch Alerts', desc: 'Real-time updates on active shipments', active: true },
                { label: 'Security Notifications', desc: 'Alerts for login attempts and permission changes', active: true },
                { label: 'System Reports', desc: 'Weekly analytics and performance summaries', active: false },
              ].map((pref, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs font-bold text-gray-900">{pref.label}</p>
                    <p className="text-[10px] text-gray-500">{pref.desc}</p>
                  </div>
                  <button className={`w-10 h-5 rounded-full transition-all relative ${pref.active ? 'bg-blue-600' : 'bg-gray-300'}`}>
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${pref.active ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Admin System Controls */}
          {user?.role === 'ADMIN' && (
            <section className="technical-card overflow-hidden border-2 border-dashed border-purple-200">
               <div className="px-6 py-4 border-b border-gray-100 bg-purple-50 flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-600" />
                <h3 className="text-xs font-bold text-purple-900 uppercase tracking-widest">Global Terminal Controls</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between p-4 bg-purple-50/50 rounded-lg">
                  <div>
                    <p className="text-sm font-bold text-gray-900">Maintenance Mode</p>
                    <p className="text-xs text-gray-500">Disable all non-admin terminal access for system updates.</p>
                  </div>
                  <button className="px-4 py-2 bg-gray-200 text-gray-600 rounded text-[10px] font-bold uppercase tracking-widest hover:bg-gray-300 transition-all">
                    ACTIVATE
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-purple-50/50 rounded-lg">
                  <div>
                    <p className="text-sm font-bold text-gray-900">Flush Audit Logs</p>
                    <p className="text-xs text-gray-500">Archive and clear logs older than 90 days.</p>
                  </div>
                  <button className="px-4 py-2 bg-purple-600 text-white rounded text-[10px] font-bold uppercase tracking-widest hover:bg-purple-700 transition-all">
                    EXECUTE
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
