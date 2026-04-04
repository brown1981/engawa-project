"use client";
import React, { useState, useEffect } from 'react';
import AgentStatusCard from '../components/AgentStatusCard';
import SafetyProtocolBanner from '../components/SafetyProtocolBanner';
import KPIMonitor from '../components/KPIMonitor';
import BusinessChatLog from '../components/BusinessChatLog';
import CommanderInput from '@/components/CommanderInput';
import ConfigModal from '@/components/ConfigModal';
import EmailInbox from '@/components/EmailInbox';
import EmailComposer from '@/components/EmailComposer';
import AICostWidget from '@/components/AICostWidget';
import Auth from '@/components/Auth';
import { useLanguage } from '../contexts/LanguageContext';
import { useDashboard } from '../hooks/useDashboard';
import { supabase } from '@/lib/supabase';
import { MessageSquare, Mail, Plus } from 'lucide-react';

// ------------------------------------------------------------------
// 🚀 生産検証（Production Hardening）版 Dashboard V2 (Integrated Comm)
// ------------------------------------------------------------------

export default function Dashboard() {
  const [session, setSession] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'discussion' | 'mail'>('discussion');
  const { t, language, setLanguage } = useLanguage();

  const { data, loading: loadingData, error, refresh } = useDashboard();

  useEffect(() => {
    // 🔧 Fix: 5秒タイムアウト付きのセッション確認
    // Supabase URL/Keyが本番環境で未設定の場合、getSession()が永久に待機するバグを修正
    const sessionTimeout = setTimeout(() => {
      console.warn('⚠️ Supabase session check timed out. Proceeding without auth.');
      setLoadingSession(false);
    }, 5000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(sessionTimeout);
      setSession(session);
      setLoadingSession(false);
    }).catch((err) => {
      clearTimeout(sessionTimeout);
      console.error('❌ Auth session error:', err);
      setLoadingSession(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      clearTimeout(sessionTimeout);
      subscription.unsubscribe();
    };
  }, []);

  if (loadingSession) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-zinc-500 text-[10px] uppercase tracking-[0.3em] font-bold animate-pulse">Establishing Secure Link...</p>
      </div>
    );
  }

  if (!session) {
    // 🔧 Fix: onAuthSuccess が空関数だったバグを修正
    // ログイン成功後、最新のセッションを取得してダッシュボードを表示する
    return <Auth onAuthSuccess={async () => {
      const { data: { session: newSession } } = await supabase.auth.getSession();
      setSession(newSession);
    }} />;
  }

  if (loadingData && !data) {
    return (
      <div className="min-h-screen bg-black p-8 flex flex-col gap-8">
        <div className="animate-pulse space-y-8">
          <div className="h-20 bg-zinc-900/50 rounded-3xl w-1/3 border border-zinc-800"></div>
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
          <h1 className="text-4xl font-black engawa-gradient-text tracking-tight uppercase">
             {t('dashboard_title')}
          </h1>
          <p className="text-zinc-500 text-[10px] mt-1 font-bold uppercase tracking-[0.3em] opacity-60">
             Mission Control // Autonomous Intelligence Hub
          </p>
        </div>
        <div className="flex items-center gap-4 bg-zinc-900/50 p-2 rounded-2xl border border-zinc-800 backdrop-blur-xl">
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value as any)}
            className="bg-transparent text-[10px] text-zinc-400 font-bold uppercase tracking-widest outline-none cursor-pointer px-2 border-r border-zinc-800"
          >
            <option value="ja">JP</option>
            <option value="en">EN</option>
          </select>
          
          <div className="text-right px-3 border-r border-zinc-800">
            <div className="text-[8px] text-zinc-500 uppercase font-black">{t('status')}</div>
            <div className="text-[10px] text-success font-black uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
              <div className="w-1 h-1 bg-success rounded-full animate-pulse"></div> Local Node
            </div>
          </div>
          <button 
            onClick={() => setIsConfigOpen(true)}
            className="p-3 hover:bg-zinc-800 text-zinc-500 hover:text-blue-400 transition-all rounded-xl"
            title={t('settings')}
          >
            ⚙️
          </button>
        </div>
      </header>

      <ConfigModal 
        isOpen={isConfigOpen} 
        onClose={() => setIsConfigOpen(false)} 
        onSave={() => refresh()}
      />

      {isComposeOpen && (
        <EmailComposer onClose={() => setIsComposeOpen(false)} />
      )}

      {/* Safety Alert */}
      <SafetyProtocolBanner fallbackCount={fallbackCount} />
      
      {error && (
        <div className="p-2 bg-red-900/20 border border-red-900/40 text-red-500 text-[10px] font-black uppercase tracking-widest text-center rounded-lg animate-pulse mb-4">
           ⚠️ Synchronicity Lost: {error}
        </div>
      )}

      {data && (
        <>
          {/* KPI Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPIMonitor label={t('kpi_dscr')} value={data.kpis.dscr.value} target={data.kpis.dscr.target} unit="x" trend={data.kpis.dscr.trend} type="accent"/>
            <KPIMonitor label="Live Hashrate" value={data.kpis.hashrate.value.toString()} target={data.kpis.hashrate.target.toString()} unit="TH/s" trend={data.kpis.hashrate.trend} type="warning"/>
            <KPIMonitor label={t('kpi_revenue')} value={data.kpis.cashFlow.value.toLocaleString()} target={data.kpis.cashFlow.target.toLocaleString()} unit="JPY" trend={data.kpis.cashFlow.trend} type="success"/>
            <KPIMonitor label={t('kpi_efficiency')} value={data.kpis.efficiency.value} target={data.kpis.efficiency.target} unit="%" trend={data.kpis.efficiency.trend} type="warning"/>
          </div>

          {/* AI Cost Monitor */}
          <AICostWidget />

          {/* Agents Section */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-white flex items-center gap-3 tracking-[0.2em] uppercase">
                <span className="w-1.5 h-4 bg-blue-500 rounded-full"></span>
                Operational Intelligence Unit
              </h2>
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

          {/* Integrated Intelligence Center */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-1 p-1 bg-zinc-900/80 rounded-2xl border border-zinc-800/50 backdrop-blur-xl shadow-2xl">
                <button
                  onClick={() => setActiveTab('discussion')}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'discussion' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  <MessageSquare size={14} /> {t('intelligence_log')}
                </button>
                <button
                  onClick={() => setActiveTab('mail')}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'mail' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  <Mail size={14} /> {t('mail_inbox')}
                </button>
              </div>

              {activeTab === 'mail' && (
                <button
                  onClick={() => setIsComposeOpen(true)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-zinc-700/50"
                >
                  <Plus size={14} /> {t('mail_composer')}
                </button>
              )}
            </div>

            <div className="min-h-[500px]">
              {activeTab === 'discussion' ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <BusinessChatLog messages={data.discussion} />
                  <CommanderInput />
                </div>
              ) : (
                <EmailInbox />
              )}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
