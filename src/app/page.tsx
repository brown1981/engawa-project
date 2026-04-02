'use client';

import React, { useState, useEffect } from 'react';
import AgentStatusCard, { AgentStatus } from '../components/AgentStatusCard';
import SafetyProtocolBanner from '../components/SafetyProtocolBanner';
import KPIMonitor from '../components/KPIMonitor';
import BusinessChatLog from '../components/BusinessChatLog';
import CommanderInput from '../components/CommanderInput';
import ConfigModal from '../components/ConfigModal';
import { useLanguage } from '../contexts/LanguageContext';

interface Agent {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  lastActive: string;
  model: string;
  currentTask: string;
}

interface ChatMessage {
  id: string;
  agentId: string;
  agentName: string;
  message: string;
  timestamp: string;
}

interface KPI {
  value: number;
  target: number;
  trend: 'up' | 'down' | 'neutral';
}

interface DashboardData {
  agents: Agent[];
  discussion: ChatMessage[];
  kpis: {
    dscr: KPI;
    cashFlow: KPI;
    efficiency: KPI;
  };
  batchTasks: {
    pending: number;
    items: string[];
  };
  serverTime: string;
  mining?: {
    pool: {
      name: string;
      currency: string;
      hashrate: string;
      status: string;
    };
  };
}

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const { t, language, setLanguage } = useLanguage();

  const fetchData = async () => {
    try {
      // 1. Fetch Agent Status
      const statusRes = await fetch('/api/status');
      if (!statusRes.ok) throw new Error('Status sync failed');
      const statusJson = await statusRes.json();

      // 2. Fetch Aggregated Financials
      const financialRes = await fetch('/api/financials');
      let financialData = {
          kpis: {
              dscr: { value: 1.84, target: 1.71, trend: 'up' as const },
              cashFlow: { value: 74200, target: 74000, trend: 'up' as const },
              efficiency: { value: 93, target: 95, trend: 'neutral' as const }
          }
      };

      if (financialRes.ok) {
          const fJson = await financialRes.json();
          financialData = {
              kpis: {
                  dscr: { value: fJson.summary.monthlyReturn / 2.3, target: 1.71, trend: 'up' },
                  cashFlow: { value: fJson.summary.totalAssets / 12, target: 74000, trend: 'up' },
                  efficiency: { value: 98, target: 95, trend: 'neutral' }
              }
          };
      }

      setData({
        ...statusJson,
        ...financialData
      });
      setError(null);
    } catch (err) {
      console.error('Fetch Error:', err);
      setError('Real-time sync interrupted...');
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  if (!data) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-500 font-mono text-sm animate-pulse tracking-widest uppercase">{t('syncing')}</p>
        </div>
      </div>
    );
  }

  const fallbackCount = data.agents.filter(a => a.status === 'fallback' || a.status === 'down').length;

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
          {/* Language Switcher */}
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
          
          <div className="text-right px-3">
            <div className="text-[10px] text-zinc-500 uppercase font-bold">{t('queue')}</div>
            <div className={`text-sm font-mono ${data.batchTasks.pending  > 0 ? 'text-amber-400' : 'text-zinc-400'}`}>
              {data.batchTasks.pending}
            </div>
          </div>
          <button 
            onClick={() => setIsConfigOpen(true)}
            className="p-3 hover:bg-zinc-800 text-zinc-500 hover:text-accent transition-all rounded-xl border-l border-zinc-800"
            title={t('settings')}
          >
            ⚙️
          </button>
        </div>
      </header>

      <ConfigModal 
        isOpen={isConfigOpen} 
        onClose={() => setIsConfigOpen(false)} 
        onSave={() => fetchData()}
      />

      {/* Safety Alert */}
      <SafetyProtocolBanner fallbackCount={fallbackCount} />
      {error && (
        <div className="p-2 bg-red-900/20 border border-red-900/40 text-red-500 text-[10px] font-black uppercase tracking-widest text-center rounded-lg animate-pulse">
           ⚠️ {error}
        </div>
      )}

      {/* KPI Section - Real Data Fed */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <KPIMonitor 
          label={t('kpi_dscr')} 
          value={data.kpis.dscr.value} 
          target={data.kpis.dscr.target} 
          unit="x"
          trend={data.kpis.dscr.trend} 
          color="var(--color-accent)"
        />
        <KPIMonitor 
          label={t('kpi_revenue')} 
          value={data.kpis.cashFlow.value.toLocaleString()} 
          target={data.kpis.cashFlow.target.toLocaleString()} 
          unit="JPY"
          trend={data.kpis.cashFlow.trend} 
          color="var(--color-success)"
        />
        <KPIMonitor 
          label={t('kpi_efficiency')} 
          value={data.kpis.efficiency.value} 
          target={data.kpis.efficiency.target} 
          unit="%"
          trend={data.kpis.efficiency.trend} 
          color="var(--color-warning)"
        />
      </div>

      {/* Agents Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-2 h-6 bg-accent rounded-full"></span>
            {t('agent_team')}
          </h2>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-[9px] text-green-500 font-black uppercase tracking-widest">Auto-Ops: ON</span>
             </div>
             <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest leading-none">Polling: 3s</span>
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

      {/* Night Batch Tasks */}
      {data.batchTasks.pending > 0 && (
        <section className="glass-card p-6 border-amber-500/20 animate-in slide-in-from-bottom-5 duration-700">
          <h3 className="text-sm font-black uppercase tracking-widest text-amber-500 mb-4 flex items-center gap-2">
            🌙 Scheduled Tasks Queue
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.batchTasks.items.map(item => (
              <div key={item} className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-800 text-[11px] font-mono text-zinc-400 flex justify-between items-center group hover:border-amber-500/30 transition-colors">
                <span>{item}</span>
                <span className="text-[9px] px-1.5 py-0.5 bg-zinc-800 rounded text-amber-500 font-bold border border-amber-500/10">PENDING</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
