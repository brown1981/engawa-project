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
  const statusColors = {
    active: 'text-[#4ade80] bg-[#4ade80]',
    fallback: 'text-[#facc15] bg-[#facc15]',
    down: 'text-[#f87171] bg-[#f87171]',
    processing: 'text-accent bg-accent',
  };

  return (
    <div className="glass-card p-5 flex flex-col gap-3 min-w-[240px]">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">{role}</h3>
          <h2 className="text-xl font-semibold text-white mt-1">{name}</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className={`status-pulse w-2 h-2 rounded-full ${statusColors[status]}`}></span>
          <span className={`text-xs font-medium uppercase ${status === 'active' ? 'text-green-400' : status === 'fallback' ? 'text-yellow-400' : 'text-red-400'}`}>
            {t(status)}
          </span>
        </div>
      </div>
      
      <div className="mt-2 space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-zinc-500">Model:</span>
          <span className="text-zinc-300 font-mono">{model}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-zinc-500">{t('last_active')}:</span>
          <span className="text-zinc-300">{lastActive}</span>
        </div>
      </div>
      
      <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden mt-2">
        <div 
          className={`h-full transition-all duration-1000 ${status === 'active' ? 'bg-green-500 w-full' : status === 'fallback' ? 'bg-yellow-500 w-3/4' : status === 'processing' ? 'bg-accent w-1/2 animate-pulse' : 'bg-red-500 w-0'}`}
        ></div>
      </div>

      {status === 'processing' && currentTask && (
        <div className="mt-3 p-2 bg-accent/10 border border-accent/20 rounded-lg animate-in slide-in-from-top-2 duration-500">
          <p className="text-[10px] text-accent font-bold leading-tight italic">
            &quot;{currentTask}&quot;
          </p>
        </div>
      )}
    </div>
  );
};

export default AgentStatusCard;
