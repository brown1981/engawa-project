"use client";
import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { BroadcastEngine } from '../lib/core/BroadcastEngine';
import { supabase } from '@/lib/supabase';

const CommanderInput: React.FC = () => {
  const { t } = useLanguage();
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState('all');
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<'idle' | 'thinking' | 'done' | 'error'>('idle');
  const [respondentCount, setRespondentCount] = useState(0);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSending) return;

    setIsSending(true);
    setStatus('thinking');

    try {
      // Step 1: 司令官のメッセージをDBに保存（ログ用）
      const fullMessage = target === 'all' ? message : `@${target} ${message}`;
      await supabase.from('messages').insert([{
        agent_id: 'commander',
        agent_name: '👑 Commander',
        message: fullMessage,
        timestamp: new Date().toISOString(),
      }]);

      // Step 2: モードと宛先を自動判定（言語解釈ゼロ）
      const detection = BroadcastEngine.detectMode({
        message: fullMessage,
        isScheduled: false,
        isKpiAlert: false,
      });

      const resolvedAgentId = target !== 'all' ? target : detection.agentId;
      const sessionId = `cmd-${Date.now()}`;

      // Step 3: BroadcastEngine 経由でエージェントに送信（/api/chat Edge Function）
      const result = await BroadcastEngine.broadcast({
        mode: detection.mode,
        message: target !== 'all' ? message : fullMessage, // 指名時は@プレフィックスを除く
        agentId: resolvedAgentId,
        sessionId,
      });

      setRespondentCount(result.count);
      setStatus(result.success ? 'done' : 'error');
      setMessage('');

      setTimeout(() => setStatus('idle'), 3000);
    } catch (error) {
      console.error('Failed to send command:', error);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    } finally {
      setIsSending(false);
    }
  };

  const statusLabel = {
    idle: target === 'all' ? 'Multi-Agent Broadcast Ready' : `Direct Channel to ${target.toUpperCase()} Ready`,
    thinking: '🧠 Agents Thinking...',
    done: `✅ ${respondentCount} Agent${respondentCount !== 1 ? 's' : ''} Responded`,
    error: '❌ Transmission Failed',
  }[status];

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
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all w-full sm:w-auto ${
              isSending || !message.trim()
                ? 'bg-zinc-800 text-zinc-600'
                : 'bg-blue-600 text-white hover:bg-blue-500 hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/20'
            }`}
          >
            {isSending ? '⟳' : 'Transmit'}
          </button>
        </div>
      </form>
      <div className="flex justify-between px-2 mt-2">
        <span className={`text-[8px] uppercase font-black tracking-[0.2em] transition-colors ${
          status === 'thinking' ? 'text-blue-400 animate-pulse' :
          status === 'done' ? 'text-green-400' :
          status === 'error' ? 'text-red-400' :
          'text-zinc-600 animate-pulse'
        }`}>
          {statusLabel}
        </span>
        <span className="text-[8px] text-zinc-700 font-mono tracking-tighter italic">
          v2.0 // Filter-Zero Protocol
        </span>
      </div>
    </div>
  );
};

export default CommanderInput;
