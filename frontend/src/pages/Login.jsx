import React, { useState } from 'react';
import { Shield, Key, User, AlertCircle } from 'lucide-react';
import { api } from '../utils/api';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.post('/auth/login', { username, password });
      onLoginSuccess(data.token, data.user, data.profile);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#05060a] px-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_22%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.16),transparent_22%)]" />
      <div className="relative z-10 w-full max-w-md rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,18,28,0.96),rgba(10,10,15,0.98))] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 via-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-950/60">
            <Shield className="h-6 w-6" />
          </div>
          <h2 className="text-3xl font-black tracking-tight text-white">CampusCore Portal</h2>
          <p className="mt-2 text-xs uppercase tracking-[0.26em] text-slate-400">Smart Campus Access</p>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-2 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-100">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Username</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500"><User className="h-4 w-4" /></span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-400/60"
                placeholder="Enter username (e.g. admin, student1)"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500"><Key className="h-4 w-4" /></span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-400/60"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-gradient-to-r from-sky-400 to-violet-500 px-5 py-3 text-sm font-extrabold uppercase tracking-[0.24em] text-slate-950 transition hover:brightness-110 disabled:opacity-60"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 border-t border-white/10 pt-6 text-center">
          <p className="text-[11px] leading-5 text-slate-500">
            Demo Credentials: <span className="font-mono text-slate-300">admin / password123</span> or <span className="font-mono text-slate-300">student1 / password123</span>
          </p>
        </div>
      </div>
    </div>
  );
}
