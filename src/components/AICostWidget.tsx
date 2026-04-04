"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * 💰 AICostWidget
 * API利用コストを可視化するダッシュボードウィジェット
 */

interface CostSummary {
  today_total: number;
  today_sessions: number;
  week_avg: number;
  week_total: number;
  month_avg: number;
  month_total: number;
  top_agent: string;
  by_trigger: { timer: number; commander: number; kpi_alert: number };
}

const AICostWidget: React.FC = () => {
  const [summary, setSummary] = useState<CostSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCosts = async () => {
      try {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        const [todayRes, weekRes, monthRes, agentRes] = await Promise.all([
          supabase.from('api_cost_logs').select('cost_jpy, session_id, triggered_by').gte('created_at', todayStart),
          supabase.from('api_cost_logs').select('cost_jpy, session_id').gte('created_at', weekStart),
          supabase.from('api_cost_logs').select('cost_jpy').gte('created_at', monthStart),
          supabase.from('api_cost_logs').select('agent_id, cost_jpy').gte('created_at', monthStart),
        ]);

        const todayLogs = todayRes.data || [];
        const weekLogs = weekRes.data || [];
        const monthLogs = monthRes.data || [];
        const agentLogs = agentRes.data || [];

        const todayTotal = todayLogs.reduce((s, r) => s + Number(r.cost_jpy), 0);
        const todaySessions = new Set(todayLogs.map((r: any) => r.session_id)).size;

        const weekTotal = weekLogs.reduce((s, r) => s + Number(r.cost_jpy), 0);
        const weekSessions = new Set(weekLogs.map((r: any) => r.session_id)).size;

        const monthTotal = monthLogs.reduce((s, r) => s + Number(r.cost_jpy), 0);
        const monthSessions = new Set(weekLogs.map((r: any) => r.session_id)).size;

        // エージェント別コスト集計
        const byAgent: Record<string, number> = {};
        agentLogs.forEach((r: any) => {
          byAgent[r.agent_id] = (byAgent[r.agent_id] || 0) + Number(r.cost_jpy);
        });
        const topAgent = Object.entries(byAgent).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

        // 起動種別別集計
        const byTrigger = { timer: 0, commander: 0, kpi_alert: 0 };
        todayLogs.forEach((r: any) => {
          const key = r.triggered_by as keyof typeof byTrigger;
          if (key in byTrigger) byTrigger[key] += Number(r.cost_jpy);
        });

        setSummary({
          today_total: todayTotal,
          today_sessions: todaySessions,
          week_avg: weekSessions > 0 ? weekTotal / weekSessions : 0,
          week_total: weekTotal,
          month_avg: monthSessions > 0 ? monthTotal / monthSessions : 0,
          month_total: monthTotal,
          top_agent: topAgent.toUpperCase(),
          by_trigger: byTrigger,
        });
      } catch (err) {
        console.error('Failed to fetch cost data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCosts();
    // 5分ごとに更新
    const interval = setInterval(fetchCosts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fmt = (n: number) => n < 1 ? n.toFixed(3) : n.toFixed(1);

  if (loading) {
    return (
      <div className="glass-card p-5 border-zinc-800/50 animate-pulse">
        <div className="h-4 bg-zinc-800 rounded w-1/3 mb-4"></div>
        <div className="h-8 bg-zinc-800 rounded w-1/2"></div>
      </div>
    );
  }

  const triggerTotal = summary
    ? summary.by_trigger.timer + summary.by_trigger.commander + summary.by_trigger.kpi_alert
    : 0;

  return (
    <div className="glass-card p-5 border-zinc-800/50 space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[8px] text-zinc-500 uppercase font-black tracking-[0.3em]">AI Intelligence Cost</p>
          <p className="text-[8px] text-zinc-700 font-mono mt-0.5">Filter-Zero Protocol // Real-time</p>
        </div>
        <span className="text-[8px] font-black text-purple-400 uppercase tracking-widest bg-purple-400/10 px-2 py-1 rounded-lg">
          🤖 Live
        </span>
      </div>

      {/* メイン数値 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-zinc-900/60 rounded-xl p-3 border border-zinc-800/50">
          <p className="text-[8px] text-zinc-500 uppercase font-black tracking-widest mb-1">Today</p>
          <p className="text-xl font-black text-white">¥{fmt(summary?.today_total || 0)}</p>
          <p className="text-[8px] text-zinc-600 mt-1">{summary?.today_sessions || 0} sessions</p>
        </div>
        <div className="bg-zinc-900/60 rounded-xl p-3 border border-zinc-800/50">
          <p className="text-[8px] text-zinc-500 uppercase font-black tracking-widest mb-1">Week Avg</p>
          <p className="text-xl font-black text-blue-400">¥{fmt(summary?.week_avg || 0)}</p>
          <p className="text-[8px] text-zinc-600 mt-1">Total ¥{fmt(summary?.week_total || 0)}</p>
        </div>
        <div className="bg-zinc-900/60 rounded-xl p-3 border border-zinc-800/50">
          <p className="text-[8px] text-zinc-500 uppercase font-black tracking-widest mb-1">Month Avg</p>
          <p className="text-xl font-black text-purple-400">¥{fmt(summary?.month_avg || 0)}</p>
          <p className="text-[8px] text-zinc-600 mt-1">Total ¥{fmt(summary?.month_total || 0)}</p>
        </div>
      </div>

      {/* 起動種別バー */}
      <div className="space-y-2">
        <p className="text-[8px] text-zinc-500 uppercase font-black tracking-[0.2em]">Cost by Trigger</p>
        {[
          { label: 'Timer (Auto Report)', key: 'timer', color: 'bg-blue-500' },
          { label: 'Commander (Manual)', key: 'commander', color: 'bg-purple-500' },
          { label: 'KPI Alert (Emergency)', key: 'kpi_alert', color: 'bg-red-500' },
        ].map(({ label, key, color }) => {
          const val = summary?.by_trigger[key as keyof typeof summary.by_trigger] || 0;
          const pct = triggerTotal > 0 ? (val / triggerTotal) * 100 : 0;
          return (
            <div key={key} className="space-y-1">
              <div className="flex justify-between text-[8px]">
                <span className="text-zinc-500 font-bold">{label}</span>
                <span className="text-zinc-400 font-mono">¥{fmt(val)}</span>
              </div>
              <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }}></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Top消費エージェント */}
      <div className="flex items-center justify-between bg-zinc-900/40 rounded-xl p-3 border border-zinc-800/30">
        <p className="text-[8px] text-zinc-500 uppercase font-black tracking-widest">Top Spender (This Month)</p>
        <p className="text-[10px] font-black text-amber-400">{summary?.top_agent || '-'}</p>
      </div>
    </div>
  );
};

export default AICostWidget;
