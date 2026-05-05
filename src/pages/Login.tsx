import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Truck, Lock, Mail, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(email, password);
    } catch (err) {
      setError('Invalid credentials. Hint: use admin123');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="flex w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
        {/* Brand Side */}
        <div className="hidden md:flex md:w-1/2 bg-blue-600 p-12 flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full -mr-32 -mt-32 opacity-20" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-700 rounded-full -ml-24 -mb-24 opacity-30" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 text-white mb-8">
              <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">SwiftConnect</span>
            </div>
            <h1 className="text-4xl font-extrabold text-white leading-tight">
              Modern Enterprise <br/> 
              <span className="text-blue-200">Logistics OS</span>
            </h1>
          </div>

          <div className="relative z-10 text-blue-100 text-sm space-y-4">
            <p className="font-medium">Streamline your supply chain with real-time intelligence and automated compliance.</p>
            <div className="flex items-center gap-4 pt-4 border-t border-white/10">
              <div>
                <p className="text-white font-bold">12k+</p>
                <p className="text-xs opacity-60 uppercase tracking-widest">Active Fleet</p>
              </div>
              <div>
                <p className="text-white font-bold">99.9%</p>
                <p className="text-xs opacity-60 uppercase tracking-widest">On-Time Rate</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Side */}
        <div className="w-full md:w-1/2 p-12">
          <div className="max-w-sm mx-auto">
            <div className="mb-10 text-center md:text-left">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
              <p className="text-gray-500 text-sm">Access your logistics terminal</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </motion.div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Email Terminal</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="name@swiftconnect.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Security Pin</label>
                  <a href="#" className="text-[10px] font-bold text-blue-600 hover:underline uppercase tracking-widest">Forgot?</a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 px-1">
                <input type="checkbox" className="rounded text-blue-600" id="remember" />
                <label htmlFor="remember" className="text-xs text-gray-400">Stay authenticated on this device</label>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all shadow-xl shadow-gray-200 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    AUTHENTICATING...
                  </>
                ) : (
                  'SIGN IN TO TERMINAL'
                )}
              </button>
            </form>

            <div className="mt-12 pt-8 border-t border-gray-100">
              <p className="text-center text-[10px] text-gray-400 uppercase tracking-widest leading-loose">
                Managed Enterprise Domain <br/>
                © 2026 SwiftConnect Logistics Systems
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Access Helper */}
      <div className="fixed bottom-4 right-4 max-w-xs bg-white p-4 rounded-xl shadow-lg border border-gray-100 text-[10px]">
        <p className="font-bold text-gray-400 uppercase mb-2">Dev Access Accounts:</p>
        <div className="space-y-1 text-gray-600">
          <p>Admin: <span className="font-mono text-blue-600">admin@swiftconnect.com</span> / <span className="font-mono text-blue-600">admin123</span></p>
          <p>Coord: <span className="font-mono text-blue-600">manager@swiftconnect.com</span> / <span className="font-mono text-blue-600">manager123</span></p>
          <p>Driver: <span className="font-mono text-blue-600">driver@swiftconnect.com</span> / <span className="font-mono text-blue-600">driver123</span></p>
        </div>
      </div>
    </div>
  );
}
