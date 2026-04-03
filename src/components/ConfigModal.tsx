"use client";
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const ConfigModal: React.FC<ConfigModalProps> = ({ isOpen, onClose, onSave }) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [config, setConfig] = useState({
    miningPool: { accountName: '', apiKey: '', currency: 'zec' },
    walletAddress: '',
    exchanges: [{ name: 'bitFlyer', apiKey: '', apiSecret: '' }],
    aiKeys: { openai: '', anthropic: '', google: '', sakana: '' },
    agentAssignments: { ceo: 'anthropic', cfo: 'openai', cto: 'openai', cmo: 'google', coo: 'sakana' }
  });

  useEffect(() => {
    if (isOpen) {
      // Load current config from Supabase directly
      import('../lib/supabase').then(async ({ supabase }) => {
        try {
          const { data, error } = await supabase.from('system_config').select('*').limit(1).maybeSingle();
          if (data && data.config_data) {
            setConfig(prev => ({
              ...prev,
              ...data.config_data,
              miningPool: { ...prev.miningPool, ...(data.config_data.miningPool || {}) },
              exchanges: data.config_data.exchanges && data.config_data.exchanges.length > 0 ? data.config_data.exchanges : prev.exchanges,
              aiKeys: { ...prev.aiKeys, ...(data.config_data.aiKeys || {}) },
              agentAssignments: { ...prev.agentAssignments, ...(data.config_data.agentAssignments || {}) }
            }));
          }
        } catch (err) {
          console.error('Failed to load config:', err);
        }
      });
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      const { supabase } = await import('../lib/supabase');
      const { error } = await supabase
        .from('system_config')
        .upsert({ id: 1, config_data: config });

      if (!error) {
        setSuccess(true);
        onSave();
        setTimeout(() => {
            setSuccess(false);
            onClose();
        }, 1500);
      } else {
        throw new Error('Failed to save configuration');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving configuration.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="glass-card w-full max-w-lg p-8 border-zinc-700/50 shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">{t('settings')}</h2>
            <p className="text-xs text-zinc-500 uppercase font-black tracking-widest mt-1">API & Network node registration</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-500 transition-colors">
            ✕
          </button>
        </div>

        <div className="overflow-y-auto pr-2 custom-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-500 pb-4">
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">1. F2Pool Credentials</h3>
              <div className="grid gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-500 ml-1">Account Name</label>
                  <input 
                    type="text" 
                    value={config.miningPool.accountName}
                    onChange={(e) => setConfig({...config, miningPool: {...config.miningPool, accountName: e.target.value}})}
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-accent transition-colors"
                    placeholder="Enter F2Pool ID"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-500 ml-1">Read-Only API Key</label>
                  <input 
                    type="password" 
                    value={config.miningPool.apiKey}
                    onChange={(e) => setConfig({...config, miningPool: {...config.miningPool, apiKey: e.target.value}})}
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-accent transition-colors"
                    placeholder="••••••••••••••••"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-zinc-800">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-success">2. Financial Node</h3>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[10px] uppercase font-bold text-zinc-500">Wallet Address (Optional)</label>
                  <span className="text-[8px] text-zinc-600 font-mono italic">{t('syncing')}</span>
                </div>
                <input 
                  type="text" 
                  value={config.walletAddress}
                  onChange={(e) => setConfig({...config, walletAddress: e.target.value})}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-400 focus:outline-none focus:border-success transition-colors"
                  placeholder="Leave blank to sync from Pool"
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-zinc-800">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500">3. Exchange Connectivity</h3>
              <div className="grid gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-500 ml-1">Exchange (e.g. bitFlyer)</label>
                  <input 
                    type="text" 
                    value={config.exchanges[0].name}
                    onChange={(e) => {
                        const newEx = [...config.exchanges];
                        newEx[0].name = e.target.value;
                        setConfig({...config, exchanges: newEx});
                    }}
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-400 focus:outline-none focus:border-amber-500 transition-colors"
                    placeholder="bitFlyer / Binance"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input 
                    type="password" 
                    value={config.exchanges[0].apiKey}
                    onChange={(e) => {
                        const newEx = [...config.exchanges];
                        newEx[0].apiKey = e.target.value;
                        setConfig({...config, exchanges: newEx});
                    }}
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none"
                    placeholder="API Key"
                  />
                  <input 
                    type="password" 
                    value={config.exchanges[0].apiSecret}
                    onChange={(e) => {
                        const newEx = [...config.exchanges];
                        newEx[0].apiSecret = e.target.value;
                        setConfig({...config, exchanges: newEx});
                    }}
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none"
                    placeholder="API Secret"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-zinc-800">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-400">4. AI Orchestration Models</h3>
              <div className="grid gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-500 ml-1">OpenAI Key (GPT-4o)</label>
                  <input 
                    type="password" 
                    value={config.aiKeys.openai}
                    onChange={(e) => setConfig({...config, aiKeys: {...config.aiKeys, openai: e.target.value}})}
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-400 transition-colors"
                    placeholder="sk-..."
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-500 ml-1">Anthropic Key (Claude 3.5)</label>
                  <input 
                    type="password" 
                    value={config.aiKeys.anthropic}
                    onChange={(e) => setConfig({...config, aiKeys: {...config.aiKeys, anthropic: e.target.value}})}
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-400 transition-colors"
                    placeholder="sk-ant-..."
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-500 ml-1">Google Gemini Key</label>
                  <input 
                    type="password" 
                    value={config.aiKeys.google}
                    onChange={(e) => setConfig({...config, aiKeys: {...config.aiKeys, google: e.target.value}})}
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-400 transition-colors"
                    placeholder="AIza..."
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-[#ed4e33] ml-1">Sakana AI Key</label>
                  <input 
                    type="password" 
                    value={config.aiKeys.sakana}
                    onChange={(e) => setConfig({...config, aiKeys: {...config.aiKeys, sakana: e.target.value}})}
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#ed4e33] transition-colors"
                    placeholder="sk-sakana-..."
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-zinc-800">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">5. Agent Role Assignments</h3>
              <div className="grid grid-cols-1 gap-4">
                {[
                  { id: 'ceo', label: 'CEO (Strategy)', color: 'text-zinc-300' },
                  { id: 'cfo', label: 'CFO (Financials)', color: 'text-zinc-300' },
                  { id: 'cto', label: 'CTO (Engineering)', color: 'text-zinc-300' },
                  { id: 'cmo', label: 'CMO (Marketing)', color: 'text-zinc-300' },
                  { id: 'coo', label: 'COO (Operations)', color: 'text-zinc-300' }
                ].map((role) => (
                  <div key={role.id} className="flex justify-between items-center bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/50">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${role.color}`}>{role.label}</span>
                    <select 
                      value={config.agentAssignments[role.id as keyof typeof config.agentAssignments]}
                      onChange={(e) => setConfig({...config, agentAssignments: {...config.agentAssignments, [role.id]: e.target.value}})}
                      className="bg-zinc-800 text-[10px] text-zinc-300 font-bold uppercase tracking-wider p-2 rounded-lg border-none outline-none focus:ring-1 focus:ring-blue-400"
                    >
                      <option value="openai">GPT-4o</option>
                      <option value="anthropic">Claude 3.5</option>
                      <option value="google">Gemini 1.5</option>
                      <option value="sakana">Sakana AI</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6">
              <button 
                type="submit" 
                disabled={loading || success}
                className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-lg ${success ? 'bg-success text-black' : 'bg-accent text-black hover:scale-[1.02] active:scale-95'}`}
              >
                {loading ? t('syncing') : success ? '✓' : t('save')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ConfigModal;
