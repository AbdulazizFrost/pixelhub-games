"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import GlassPanel from '@/components/GlassPanel';
import { Gamepad2, Mail, Lock, LogIn, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, apiUrl } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Login failed. Please check credentials.');
      }

      login(data.token, data.user);
      router.push('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[75vh]">
      <GlassPanel glow className="w-full max-w-md p-8 flex flex-col gap-6">
        
        {/* Header */}
        <div className="text-center flex flex-col items-center gap-2">
          <div className="p-3 rounded-xl bg-gradient-to-r from-primary to-accent shadow-neonBlue">
            <Gamepad2 className="w-8 h-8 text-black" />
          </div>
          <h2 className="text-2xl font-black tracking-wider text-glow-blue uppercase mt-2">
            Welcome Back
          </h2>
          <p className="text-xs text-mutedText">Log in to sync your level, achievements, and play stats.</p>
        </div>

        {error && (
          <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-xs text-red-400 font-semibold">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-300">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mutedText" />
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-black/40 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-gray-200 outline-none focus:border-primary/40 focus:shadow-[0_0_10px_rgba(0,240,255,0.1)]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-300">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mutedText" />
              <input 
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-black/40 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-gray-200 outline-none focus:border-primary/40 focus:shadow-[0_0_10px_rgba(0,240,255,0.1)]"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-primary to-accent text-black font-extrabold text-sm rounded-xl hover:scale-[1.01] hover:brightness-110 transition-all shadow-neonBlue mt-2"
          >
            {loading ? 'LOGGING IN...' : 'LOG IN'}
            <LogIn className="w-4 h-4" />
          </button>

        </form>

        <div className="flex justify-between items-center text-xs text-mutedText mt-2">
          <span>New to PixelHub?</span>
          <Link href="/register" className="flex items-center gap-1 text-primary font-bold hover:underline">
            Create account
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

      </GlassPanel>
    </div>
  );
}
