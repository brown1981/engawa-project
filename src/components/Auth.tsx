"use client";
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';

export default function Auth({ onAuthSuccess }: { onAuthSuccess: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { t } = useLanguage();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Supabase Authによる安全なログイン照会
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      setError('アクセスが拒否されました。認証情報を確認してください。');
    } else if (data.session) {
      onAuthSuccess();
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-black font-sans">
      {/* プレミアムな背景デザイン */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute -bottom-64 -right-64 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="glass-card relative z-10 w-full max-w-md p-8 md:p-12 border border-white/10 rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl bg-zinc-950/40 animate-in fade-in slide-in-from-bottom-10 duration-1000">
        
        <div className="flex justify-center mb-10">
           <div className="w-20 h-20 rounded-[1.5rem] bg-gradient-to-br from-zinc-800 to-black border border-white/10 flex items-center justify-center shadow-xl relative overflow-hidden group">
             <div className="absolute inset-0 bg-accent/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
             <span className="text-white font-black text-3xl tracking-tighter relative z-10">EC</span>
           </div>
        </div>
        
        <h2 className="text-2xl font-black text-white text-center mb-2 tracking-tight">Engawa Cycle AI</h2>
        <p className="text-accent text-center mb-10 text-[10px] uppercase tracking-[0.3em] font-bold">Authorized Commander Only</p>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 ml-2">Email Identity</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/50 border border-zinc-800 rounded-2xl p-4 text-white placeholder-zinc-700 text-sm focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all"
              placeholder="commander@engawa.com"
              required 
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 ml-2">Security Passphrase</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/50 border border-zinc-800 rounded-2xl p-4 text-white placeholder-zinc-700 text-sm focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all"
              placeholder="••••••••••••"
              required 
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-[11px] font-bold p-4 rounded-2xl text-center animate-in shake duration-300">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full mt-8 relative group overflow-hidden bg-white text-black py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg hover:shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-wait"
          >
            <span className="relative z-10 transition-colors duration-300 group-hover:text-black">{loading ? 'AUTHENTICATING...' : 'SYSTEM OVERRIDE ENGAGE'}</span>
            <div className="absolute inset-0 bg-accent translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
          </button>
        </form>
      </div>
    </div>
  );
}
