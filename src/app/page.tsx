'use client';

import React, { useState, useEffect } from 'react';
import AgentStatusCard from '../components/AgentStatusCard';
import SafetyProtocolBanner from '../components/SafetyProtocolBanner';
import KPIMonitor from '../components/KPIMonitor';
import BusinessChatLog from '../components/BusinessChatLog';
import CommanderInput from '@/components/CommanderInput';
import ConfigModal from '@/components/ConfigModal';
import Auth from '@/components/Auth';
import { useLanguage } from '../contexts/LanguageContext';
import { useDashboard } from '../hooks/useDashboard';
import { supabase } from '@/lib/supabase';

// ------------------------------------------------------------------
// 🚀 生産検証（Production Hardening）版 Dashboard
// ------------------------------------------------------------------

export default function Dashboard() {
  const [session, setSession] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const { t, language, setLanguage } = useLanguage();

  // カスタムフックへの移行（基本の集約）
  const { data, loading: loadingData, error, refresh } = useDashboard();

  useEffect(() => {
    // セッションの監視（基本の徹底）
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingSession(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 1. 認証チェック
  if (loadingSession) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-zinc-500 text-[10px] uppercase tracking-[0.3em] font-bold animate-pulse tracking-[0.5em]">Establishing Secure Link...</p>
      </div>
    );
  }

  if (!session) {
    return <Auth onAuthSuccess={() => {}} />;
  }

  // 2. ローディング・スケルトン（ユーザー体験の基本）
  if (loadingData && !data) {
    return (
      <div className="min-h-screen bg-black p-8 flex flex-col gap-8">
        <div className="animate-pulse space-y-8">
          <div className="h-20 bg-zinc-900/50 rounded-3xl w-1/3 border border-zinc-800"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-40 bg-zinc-900/50 rounded-3xl border border-zinc-800"></div>
            <div className="h-40 bg-zinc-900/50 rounded-3xl border border-zinc-800"></div>
            <div className="h-40 bg-zinc-900/50 rounded-3xl border border-zinc-800"></div>
          </div>
          <div className="h-96 bg-zinc-900/50 rounded-3xl border border-zinc-800"></div>
        </div>
      </div>
    );
  }

  const fallbackCount = data?.agents.filter(a => a.status === 'fallback' || a.status === 'down').length || 0;

  return (
    <main className="min-h-screen p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-1000">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black engawa-gradient-text tracking-tight">
             {t('dashboard_title')}
          </h1>
          <p className="text-zinc-500 text-sm mt-1 font-medium uppercase tracking-[0.2em]">
             {t('tagline')}
          </p>
        </div>
        <div className="flex items-center gap-4 bg-zinc-900/50 p-2 rounded-2xl border border-zinc-800">
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value as any)}
            className="bg-transparent text-[10px] text-zinc-400 font-bold uppercase tracking-widest outline-none cursor-pointer px-2 border-r border-zinc-800"
          >
            <option value="ja">JP</option>
            <option value="en">EN</option>
            <option value="zh">ZH</option>
            <option value="ru">RU</option>
            <option value="es">ES</option>
            <option value="ko">KO</option>
            <option value="fr">FR</option>
          </select>
          
          <div className="text-right px-3 border-r border-zinc-800">
            <div className="text-[10px] text-zinc-500 uppercase font-bold">{t('status')}</div>
            <div className="text-[10px] text-success font-black uppercase tracking-widest border border-success/20 px-1.5 rounded-md mt-0.5">
              Live
            </div>
          </div>
          <button 
            onClick={() => setIsConfigOpen(true)}
            className="p-3 hover:bg-zinc-800 text-zinc-500 hover:text-accent transition-all rounded-xl"
            title={t('settings')}
          >
            ⚙️
          </button>
        </div>
      </header>

      <ConfigModal 
        isOpen={isConfigOpen} 
        onClose={() => setIsConfigOpen(false)} 
        onSave={() => refresh()} // 賢い再取得
      />

      {/* Safety Alert */}
      <SafetyProtocolBanner fallbackCount={fallbackCount} />
      
      {error && (
        <div className="p-2 bg-red-900/20 border border-red-900/40 text-red-500 text-[10px] font-black uppercase tracking-widest text-center rounded-lg animate-pulse mb-4">
           ⚠️ {error}
        </div>
      )}

      {data && (
        <>
          {/* KPI Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPIMonitor 
              label={t('kpi_dscr')} 
              value={data.kpis.dscr.value} 
              target={data.kpis.dscr.target} 
              unit="x"
              trend={data.kpis.dscr.trend} 
              type="accent"
            />
            <KPIMonitor 
              label="Live Hashrate" 
              value={data.kpis.hashrate.value.toString()} 
              target={data.kpis.hashrate.target.toString()} 
              unit="TH/s"
              trend={data.kpis.hashrate.trend} 
              type="warning"
            />
            <KPIMonitor 
              label={t('kpi_revenue')} 
              value={data.kpis.cashFlow.value.toLocaleString()} 
              target={data.kpis.cashFlow.target.toLocaleString()} 
              unit="JPY"
              trend={data.kpis.cashFlow.trend} 
              type="success"
            />
            <KPIMonitor 
              label={t('kpi_efficiency')} 
              value={data.kpis.efficiency.value} 
              target={data.kpis.efficiency.target} 
              unit="%"
              trend={data.kpis.efficiency.trend} 
              type="warning"
            />
          </div>

          {/* Mining Analytics Pulse */}
          <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-3xl p-6 flex flex-wrap items-center justify-between gap-6 backdrop-blur-sm">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center text-2xl">💎</div>
                <div>
                   <div className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1">Mining Forecast (24h)</div>
                   <div className="text-xl font-bold text-white tracking-tight">{data.miningStats.payout_24h} <span className="text-zinc-500 text-sm">ALEO</span></div>
                </div>
             </div>
             <div className="h-10 w-px bg-zinc-800 hidden md:block"></div>
             <div>
                <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1 uppercase">Operational Pulse</div>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 bg-success rounded-full animate-ping"></div>
                   <span className="text-xs font-bold text-success uppercase tracking-widest">AI Team Synchronized</span>
                </div>
             </div>
             <div className="text-right">
                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Total Mined</div>
                <div className="text-lg font-black text-zinc-300">{data.miningStats.total_payout.toLocaleString()} <span className="text-zinc-500">ALEO</span></div>
             </div>
          </div>

          {/* Agents Section */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="w-2 h-6 bg-accent rounded-full"></span>
                {t('agent_team')}
              </h2>
              <div className="flex items-center gap-4">
                 <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-[9px] text-green-500 font-bold uppercase tracking-widest">Real-time Node: Active</span>
                 </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {data.agents.map((agent) => (
                <AgentStatusCard 
                  key={agent.id}
                  name={agent.name}
                  role={agent.role}
                  status={agent.status}
                  lastActive={agent.lastActive}
                  model={agent.model}
                  currentTask={agent.currentTask}
                />
              ))}
            </div>
          </section>

          {/* Decision Intelligence Log */}
          <section className="space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-2 h-6 bg-accent rounded-full"></span>
              Operational Strategy & Decision Log
            </h2>
            <BusinessChatLog messages={data.discussion} />
            <CommanderInput />
          </section>
        </>
      )}
    </main>
  );
}
