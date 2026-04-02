import React from 'react';

interface KPIMonitorProps {
  label: string;
  value: string | number;
  target: string | number;
  unit?: string;
  trend: 'up' | 'down' | 'neutral';
  color: string;
}

const KPIMonitor: React.FC<KPIMonitorProps> = ({ label, value, target, unit, trend, color }) => {
  return (
    <div className="glass-card p-6 flex-1 min-w-[300px]">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-500">{label}</h4>
        <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase bg-${trend === 'up' ? 'green' : 'red'}-500/20 text-${trend === 'up' ? 'green' : 'red'}-400`}>
          {trend === 'up' ? '↑' : '↓'} Trend
        </span>
      </div>
      
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-black text-white">{value}</span>
        {unit && <span className="text-lg text-zinc-500 font-medium">{unit}</span>}
      </div>
      
      <div className="mt-4">
        <div className="flex justify-between text-[10px] uppercase font-bold text-zinc-500 mb-1.5">
          <span>Current Progress</span>
          <span>Target: {target}{unit}</span>
        </div>
        <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className="h-full transition-all duration-1000 shadow-[0_0_10px_rgba(0,0,0,0.5)]"
            style={{ 
              width: `${Math.min((parseFloat(value.toString()) / parseFloat(target.toString())) * 100, 100)}%`,
              backgroundColor: color
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default KPIMonitor;
