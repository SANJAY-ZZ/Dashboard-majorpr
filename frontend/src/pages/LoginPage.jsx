import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layers, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import authService from '../services/authService';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      await authService.login({ email, password });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="glass-panel w-full max-w-md p-8 rounded-3xl border border-slate-800 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-400 mx-auto flex items-center justify-center shadow-lg shadow-indigo-500/25 mb-3">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Welcome Back</h1>
          <p className="text-xs text-slate-400 mt-1">
            Sign in to access your project workspace and live dashboard
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-300 font-semibold block mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div className="flex justify-end mt-1.5">
              <Link to="/forgot-password" className="text-[11px] text-slate-400 hover:text-indigo-400 transition-colors">
                Forgot password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 cursor-pointer mt-2"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Fast Login Pills */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <p className="text-[11px] font-semibold text-slate-400 mb-2 text-center">
            One-Click Test Accounts:
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleQuickLogin('admin@company.com', 'Admin@12345')}
              className="px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500/50 text-[10px] text-indigo-300 font-medium transition-all"
            >
              Admin
            </button>
            <button
              onClick={() => handleQuickLogin('manager@company.com', 'Manager@12345')}
              className="px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-[10px] text-cyan-300 font-medium transition-all"
            >
              Manager
            </button>
            <button
              onClick={() => handleQuickLogin('rahul@gmail.com', 'Rahul@12345')}
              className="px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-[10px] text-emerald-300 font-medium transition-all"
            >
              Employee
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500">
          Need an account?{' '}
          <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold">
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
