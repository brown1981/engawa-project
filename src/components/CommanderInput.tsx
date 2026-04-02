import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const CommanderInput: React.FC = () => {
  const { t } = useLanguage();
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState('all');
  const [isSending, setIsSending] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSending) return;

    setIsSending(true);
    try {
      const res = await fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: target === 'all' ? message : `@${target} ${message}`,
          target 
        })
      });

      if (res.ok) {
        setMessage('');
      }
    } catch (error) {
      console.error('Failed to send command:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="mt-4 animate-in slide-in-from-bottom-4 duration-700">
      <form onSubmit={handleSendMessage} className="relative group">
        <div className="absolute inset-0 bg-blue-500/10 blur-xl group-focus-within:bg-blue-500/20 transition-all rounded-2xl"></div>
        <div className="relative glass-card flex flex-col sm:flex-row items-center p-2 pl-3 pr-2 gap-2 border-zinc-700/50 group-focus-within:border-blue-500/50 transition-all shadow-2xl">
          <select 
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="bg-zinc-800 text-[10px] text-blue-400 font-black uppercase tracking-widest p-2 rounded-xl border border-zinc-700/50 outline-none hover:bg-zinc-700 transition-colors cursor-pointer w-full sm:w-auto"
          >
            <option value="all">Broadcast</option>
            <option value="ceo">CEO (Direct)</option>
            <option value="cfo">CFO (Direct)</option>
            <option value="cto">CTO (Direct)</option>
            <option value="cmo">CMO (Direct)</option>
            <option value="coo">COO (Direct)</option>
          </select>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('ask_ai') + '...'}
            disabled={isSending}
            className="flex-1 bg-transparent border-none outline-none text-sm text-zinc-100 placeholder:text-zinc-600 py-3 mx-2 w-full"
          />
          <button
            type="submit"
            disabled={isSending || !message.trim()}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all w-full sm:w-auto ${isSending || !message.trim() ? 'bg-zinc-800 text-zinc-600' : 'bg-blue-600 text-white hover:bg-blue-500 hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/20'}`}
          >
            {isSending ? '...' : 'Transmit'}
          </button>
        </div>
      </form>
      <div className="flex justify-between px-2 mt-2">
        <span className="text-[8px] text-zinc-600 uppercase font-black tracking-[0.2em] animate-pulse">
          Secure Line Active: {target === 'all' ? 'Multi-Agent Broadcast' : `Direct Channel to ${target.toUpperCase()}`}
        </span>
        <span className="text-[8px] text-zinc-700 font-mono tracking-tighter italic">
          v1.2 // Intercom protocol: 0xCOMMAND
        </span>
      </div>
    </div>
  );
};

export default CommanderInput;
