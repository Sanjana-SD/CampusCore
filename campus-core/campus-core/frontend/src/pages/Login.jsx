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
    <div className="flex min-h-screen items-center justify-center px-4 relative overflow-hidden">
      {/* Background visual circles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-blue-600/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md glass-card rounded-2xl p-8 shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4 z-10">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight card-title">
            Welcome to CampusCore
          </h2>
          <p className="text-xs text-muted mt-1">Smart Campus Portal Access Control</p>
        </div>

        {error && (
          <div className="mb-6 flex items-start space-x-2 bg-rose-50 border border-rose-200 p-4 rounded-xl text-rose-700 text-sm">
            <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Username
            </label>
              <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted">
                <User className="h-4.5 w-4.5" />
              </span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-100 rounded-xl text-on-card placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                placeholder="Enter username (e.g. admin, student1)"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Password
            </label>
              <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted">
                <Key className="h-4.5 w-4.5" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-100 rounded-xl text-on-card placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-blue-500/10 disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800/80 text-center">
          <p className="text-[11px] text-slate-500">
            Demo Credentials: <span className="text-slate-400 font-mono">admin / password123</span> or <span className="text-slate-400 font-mono">student1 / password123</span>
          </p>
        </div>
      </div>
    </div>
  );
}
