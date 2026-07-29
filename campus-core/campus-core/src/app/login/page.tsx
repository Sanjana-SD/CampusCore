'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Sparkles, Shield, User, Mail, Lock, RefreshCw, KeyRound } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto redirect if already logged in
  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Fetch role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
          
        if (profile?.role === 'admin') router.replace('/admin/dashboard');
        else if (profile?.role === 'faculty') router.replace('/faculty/dashboard');
        else if (profile?.role === 'student') router.replace('/student/dashboard');
      }
    }
    checkUser();
  }, [router, supabase]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.user) {
        // Retrieve role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          throw new Error('Profile details could not be loaded.');
        }

        const role = profile?.role;
        // Insert a login log row
        await supabase.from('login').insert({
          username: email,
          role: role || 'unknown',
          status: 'success'
        });

        // Redirect
        if (role === 'admin') router.replace('/admin/dashboard');
        else if (role === 'faculty') router.replace('/faculty/dashboard');
        else if (role === 'student') router.replace('/student/dashboard');
        else throw new Error('Unauthorized role.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please verify credentials.');
      // Insert failed login attempt log
      await supabase.from('login').insert({
        username: email,
        role: 'unknown',
        status: 'failed'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen mesh-bg text-slate-900 flex items-center justify-center relative overflow-hidden">
      {/* Dynamic background glow overlays */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(59,130,246,0.1),transparent_100%)] pointer-events-none"></div>
      
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="backdrop-blur-md premium-card rounded-3xl p-8 space-y-6">
          
          <div className="text-center space-y-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center font-extrabold text-xl text-white shadow-lg mx-auto">
              CC
            </div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-850 bg-clip-text text-transparent">
              CampusCore
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
              Portal Sign In
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {errorMsg && (
              <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs">
                {errorMsg}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-950 placeholder-slate-400 text-xs focus:outline-none focus:border-blue-500 transition-all shadow-sm"
                  placeholder="name@campuscore.edu"
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-950 placeholder-slate-400 text-xs focus:outline-none focus:border-blue-500 transition-all shadow-sm"
                  placeholder="••••••••"
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
                  <KeyRound className="h-4 w-4" />
                  <span>Secure Login</span>
                </>
              )}
            </button>
          </form>

          {/* Setup notice */}
          <div className="text-center pt-2">
            <p className="text-[10px] text-slate-500 leading-normal">
              Students and Faculty cannot register. Accounts are provisioned only by the Administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
