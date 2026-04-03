import React, { useState } from 'react';
import { Send, X, AlertTriangle, CheckCircle } from 'lucide-react';

interface EmailComposerProps {
  onClose: () => void;
  initialTo?: string;
  initialSubject?: string;
}

const EmailComposer: React.FC<EmailComposerProps> = ({ onClose, initialTo = '', initialSubject = '' }) => {
  const [to, setTo] = useState(initialTo);
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!to || !subject || !body || status === 'sending') return;

    setStatus('sending');
    try {
      // API Route 経由で送信 (src/services/email_service をラップする API)
      // 今回はデモンストレーションのため直接 fetch する形式を例示
      const response = await fetch('/api/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, text: body }),
      });

      if (!response.ok) throw new Error('Transmission Failure');
      
      setStatus('success');
      setTimeout(onClose, 2000);
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMessage(err.message || 'Unknown error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative glass-card w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-500">
        {/* Header */}
        <div className="p-4 border-b border-zinc-700/50 flex justify-between items-center bg-zinc-900/10">
          <h3 className="text-xs font-black uppercase tracking-widest text-blue-400 flex items-center gap-2">
            <Send size={14} /> Outbound Transmission
          </h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/5 transition-colors text-zinc-500"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSend} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 block px-1">Recipient</label>
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="commander@example.com"
              className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-sm text-zinc-200 outline-none focus:border-blue-500/50 transition-all placeholder:text-zinc-700"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 block px-1">Subject Frequency</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="RE: Strategic Intelligence Report"
              className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-sm text-zinc-200 outline-none focus:border-blue-500/50 transition-all placeholder:text-zinc-700"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 block px-1">Manifest Body</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Input your instructions or data summary..."
              rows={8}
              className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-2xl px-4 py-3 text-sm text-zinc-200 outline-none focus:border-blue-500/50 transition-all placeholder:text-zinc-700 resize-none custom-scrollbar"
              required
            />
          </div>

          {/* Status Message */}
          {status === 'error' && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs animate-in shake-in duration-300">
              <AlertTriangle size={14} /> {errorMessage}
            </div>
          )}
          {status === 'success' && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs animate-in fade-in duration-300">
              <CheckCircle size={14} /> Transmission Synchronized.
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
            >
              Abort
            </button>
            <button
              type="submit"
              disabled={status === 'sending' || status === 'success'}
              className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all ${
                status === 'sending' || status === 'success'
                ? 'bg-zinc-800 text-zinc-600'
                : 'bg-blue-600 text-white hover:bg-blue-500 hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/30'
              }`}
            >
              <Send size={14} className={status === 'sending' ? 'animate-pulse' : ''} />
              {status === 'sending' ? 'Transmitting...' : 'Initiate Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmailComposer;
