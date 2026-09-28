import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';
import authService from '../services/authService';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ token: '', newPassword: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      const result = await authService.resetPassword(form.token, form.newPassword);
      setMessage(result.message || 'Password successfully updated.');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Reset failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#08090d] px-4 py-12 relative overflow-hidden">
      <div className="w-full max-w-md bg-[#0f131c] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Create New Password</h1>
            <p className="text-xs text-slate-400">Enter your reset token and new credentials</p>
          </div>
        </div>

        {message && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{message} Redirecting to login...</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Reset Token
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <textarea
                required
                rows={2}
                placeholder="Paste your reset token here"
                value={form.token}
                onChange={(e) => setForm({ ...form, token: e.target.value })}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              New Password (8+ characters)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={8}
                placeholder="••••••••"
                value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Set New Password'}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
          <Link to="/login" className="text-xs font-semibold text-slate-400 hover:text-white transition-colors">
            ← Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
