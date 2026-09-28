import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, Mail, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import authService from '../services/authService';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setToken('');
    setLoading(true);

    try {
      const result = await authService.forgotPassword(email);
      setMessage(result.message || 'Password reset link generated.');
      if (result.developmentResetToken) {
        setToken(result.developmentResetToken);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Request failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#08090d] px-4 py-12 relative overflow-hidden">
      <div className="w-full max-w-md bg-[#0f131c] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Reset Password</h1>
            <p className="text-xs text-slate-400">Request password recovery instructions</p>
          </div>
        </div>

        {message && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{message}</span>
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
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Request Password Reset'}
          </button>
        </form>

        {token && (
          <div className="mt-5 p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <p className="text-[11px] text-slate-400 mb-1.5 font-medium">
              Development Mode: Copy reset token below:
            </p>
            <textarea
              readOnly
              value={token}
              className="w-full p-2 text-xs font-mono bg-slate-950 border border-slate-800 rounded-lg text-slate-300 select-all resize-none h-16"
            />
            <Link
              to="/reset-password"
              className="mt-2.5 inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
            >
              <span>Proceed to Reset Password</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
          <Link to="/login" className="text-xs font-semibold text-slate-400 hover:text-white transition-colors">
            ← Return to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
