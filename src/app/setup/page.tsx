'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Shield, User, Mail, Lock, Phone, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function SetupPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    phone_number: ''
  });

  // Verify setup state
  useEffect(() => {
    async function checkSetup() {
      try {
        const res = await fetch('/api/setup');
        const data = await res.json();
        if (!data.setupRequired) {
          router.replace('/login');
        } else {
          setChecking(false);
        }
      } catch (err) {
        setChecking(false);
      }
    }
    checkSetup();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.email || !form.password) {
      setErrorMsg('Full name, email, and password are required.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to initialize setup.');
      }

      setSuccess(true);
      setTimeout(() => {
        router.replace('/login');
      }, 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Connection error creating administrator.');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen mesh-bg flex items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen mesh-bg text-slate-900 flex items-center justify-center relative overflow-hidden">
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(59,130,246,0.1),transparent_100%)] pointer-events-none"></div>
      
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="backdrop-blur-md premium-card rounded-3xl p-8 space-y-6">
          
          <div className="text-center space-y-2">
            <div className="inline-flex h-12 w-12 rounded-2xl bg-blue-50 border border-blue-100 items-center justify-center text-blue-600 mx-auto">
              <Shield className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-850 bg-clip-text text-transparent">
              CampusCore Setup
            </h2>
            <p className="text-xs text-slate-400 uppercase font-bold tracking-widest leading-none mt-1">
              Initialize Administrator
            </p>
          </div>

          {success ? (
            <div className="py-8 text-center space-y-4">
              <div className="h-14 w-14 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-lg">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Setup Successful!</h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                Admin account created successfully. Redirecting you to the main secure login page...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs">
                  {errorMsg}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <User className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-950 placeholder-slate-400 text-xs focus:outline-none focus:border-blue-500 transition-all shadow-sm"
                    placeholder="Super Administrator"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-950 placeholder-slate-400 text-xs focus:outline-none focus:border-blue-500 transition-all shadow-sm"
                    placeholder="admin@campuscore.edu"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type="password"
                    required
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-950 placeholder-slate-400 text-xs focus:outline-none focus:border-blue-500 transition-all shadow-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Phone Number</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <Phone className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    value={form.phone_number}
                    onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-950 placeholder-slate-400 text-xs focus:outline-none focus:border-blue-500 transition-all shadow-sm"
                    placeholder="+91 9988776655"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-600 text-white font-bold rounded-xl text-xs uppercase tracking-wide transition-all shadow-lg flex items-center justify-center space-x-1.5 hover:scale-[1.005] cursor-pointer"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Initialize System Admin</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
