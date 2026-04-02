import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface ChatMessage {
  id: string;
  agentId: string;
  agentName: string;
  message: string;
  timestamp: string;
}

interface BusinessChatLogProps {
  messages: ChatMessage[];
}

const BusinessChatLog: React.FC<BusinessChatLogProps> = ({ messages }) => {
  const { t } = useLanguage();
  const agentAvatars: { [key: string]: string } = {
    ceo: '👑',
    cfo: '📈',
    cto: '⚙️',
    cmo: '📣',
    coo: '🛡️',
  };

  return (
    <div className="glass-card flex-col h-[400px] flex overflow-hidden border-zinc-500/10">
      <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/40">
        <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
          <span className="w-2 h-2 bg-accent rounded-full animate-pulse"></span>
          {t('decision_log')}
        </h3>
        <span className="text-[10px] text-zinc-600 font-mono">Channel: #operational-strategy</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-zinc-600 italic text-xs font-mono">
            Waiting for next decision cycle...
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div 
              key={msg.id} 
              className={`flex gap-3 animate-in slide-in-from-left-4 duration-500`}
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-lg border border-zinc-700 shadow-lg">
                {agentAvatars[msg.agentId] || '🤖'}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black text-white uppercase tracking-wider">{msg.agentName}</span>
                  <span className="text-[9px] text-zinc-600 font-mono">{msg.timestamp}</span>
                </div>
                <div className="p-3 bg-zinc-900/60 rounded-xl rounded-tl-none border border-zinc-800/50">
                  <p className="text-xs text-zinc-300 leading-relaxed font-medium italic">
                    &quot;{msg.message}&quot;
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BusinessChatLog;
