import React from 'react';

interface KPIMonitorProps {
  label: string;
  value: string | number;
  target: string | number;
  unit?: string;
  trend: 'up' | 'down' | 'neutral';
  type?: 'accent' | 'success' | 'warning' | 'danger'; // 役割ベースの命名に変更 (Basics)
}

const KPIMonitor: React.FC<KPIMonitorProps> = ({ label, value, target, unit, trend, type = 'accent' }) => {
  // ------------------------------------------------------------------
  // 🎨 システム共通カラーへの統一（Basic Theme Integration）
  // ------------------------------------------------------------------
  const colorMap = {
    accent: 'var(--color-accent)',
    success: 'var(--color-success)',
    warning: 'var(--color-warning)',
    danger: 'var(--color-danger)',
  };

  const trendColors = {
    up: 'bg-green-500/10 text-green-400',
    down: 'bg-red-500/10 text-red-400',
    neutral: 'bg-zinc-800 text-zinc-500',
  };

  const currentThemeColor = colorMap[type];

  return (
    <div className="glass-card p-6 flex-1 min-w-[300px] border-zinc-500/5">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{label}</h4>
        <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${trendColors[trend]}`}>
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '•'} {trend.toUpperCase()} Trend
        </span>
      </div>
      
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-black text-white tracking-tighter">{value}</span>
        {unit && <span className="text-sm text-zinc-500 font-bold uppercase tracking-widest">{unit}</span>}
      </div>
      
      <div className="mt-5">
        <div className="flex justify-between text-[9px] uppercase font-black tracking-widest text-zinc-600 mb-2">
          <span>Current Progress</span>
          <span>Target: {target}{unit}</span>
        </div>
        <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/30">
          <div 
            className="h-full transition-all duration-1000"
            style={{ 
              width: `${Math.min((Number(value) / (Number(target) || 1)) * 100, 100)}%`,
              backgroundColor: currentThemeColor,
              boxShadow: `0 0 10px ${currentThemeColor}40` // ほんのり光らせる
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default KPIMonitor;
