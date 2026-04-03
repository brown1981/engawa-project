import { useLanguage } from '../contexts/LanguageContext';

export type AgentStatus = 'active' | 'fallback' | 'down' | 'processing';

interface AgentStatusCardProps {
  name: string;
  role: string;
  status: AgentStatus;
  lastActive: string;
  model: string;
  currentTask?: string;
}

const AgentStatusCard: React.FC<AgentStatusCardProps> = ({ name, role, status, lastActive, model, currentTask }) => {
  const { t } = useLanguage();

  // ------------------------------------------------------------------
  // 🎨 システム共通カラーへの統一（Basic Theme Integration）
  // ------------------------------------------------------------------
  const statusConfig = {
    active: { color: 'var(--color-success)', text: 'text-green-400' },
    fallback: { color: 'var(--color-warning)', text: 'text-yellow-400' },
    down: { color: 'var(--color-danger)', text: 'text-red-400' },
    processing: { color: 'var(--color-accent)', text: 'text-blue-400' },
  };

  const currentConfig = statusConfig[status];

  return (
    <div className="glass-card p-5 flex flex-col gap-3 min-w-[240px]">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">{role}</h3>
          <h2 className="text-xl font-semibold text-white mt-1">{name}</h2>
        </div>
        <div className="flex items-center gap-2">
          {/* CSS変数を直接スタイルに適用 */}
          <span 
            className="status-pulse w-2 h-2 rounded-full" 
            style={{ color: currentConfig.color, backgroundColor: currentConfig.color }}
          ></span>
          <span className={`text-xs font-black uppercase tracking-widest ${currentConfig.text}`}>
            {t(status)}
          </span>
        </div>
      </div>
      
      <div className="mt-2 space-y-1">
        <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest">
          <span className="text-zinc-500">Model:</span>
          <span className="text-zinc-300 font-mono">{model}</span>
        </div>
        <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest">
          <span className="text-zinc-500">{t('last_active')}:</span>
          <span className="text-zinc-300">{lastActive}</span>
        </div>
      </div>
      
      <div className="h-1 w-full bg-zinc-800/50 rounded-full overflow-hidden mt-3">
        <div 
          className={`h-full transition-all duration-1000 ${status === 'processing' ? 'animate-pulse' : ''}`}
          style={{ 
            width: status === 'active' ? '100%' : status === 'fallback' ? '75%' : status === 'processing' ? '50%' : '0%',
            backgroundColor: currentConfig.color
          }}
        ></div>
      </div>

      {status === 'processing' && currentTask && (
        <div className="mt-3 p-2 bg-accent/5 border border-accent/10 rounded-lg animate-in slide-in-from-top-2 duration-500">
          <p className="text-[10px] text-accent font-bold leading-tight italic opacity-80">
            &quot;{currentTask}&quot;
          </p>
        </div>
      )}
    </div>
  );
};

export default AgentStatusCard;
