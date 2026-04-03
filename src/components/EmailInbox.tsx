"use client";
import React, { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Mail, Clock, User, Reply, Trash2, ChevronRight } from 'lucide-react';

interface Email {
  id: string;
  from_address: string;
  subject: string;
  body_text: string;
  body_html: string;
  is_read: boolean;
  created_at: string;
}

const EmailInbox: React.FC = () => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchEmails();

    const channel = supabase
      .channel('email-updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'emails' }, (payload: { new: Email }) => {
        setEmails(prev => [payload.new, ...prev]);
      })
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, []);

  const fetchEmails = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('emails')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) setEmails(data);
    setLoading(false);
  };

  return (
    <div className="flex h-full min-h-[500px] gap-4 animate-in fade-in duration-500">
      {/* List Panel */}
      <div className={`flex-1 glass-card overflow-hidden flex flex-col ${selectedEmail ? 'hidden lg:flex' : 'flex'}`}>
        <div className="p-4 border-b border-zinc-700/50 flex justify-between items-center bg-zinc-900/10">
          <h3 className="text-xs font-black uppercase tracking-widest text-blue-400 flex items-center gap-2">
            <Mail size={14} /> Incoming Transmission
          </h3>
          <span className="text-[10px] text-zinc-500">{emails.length} Messages</span>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="p-8 text-center text-zinc-600 text-[10px] animate-pulse">Scanning Grid...</div>
          ) : emails.length === 0 ? (
            <div className="p-12 text-center text-zinc-600">
              <Mail className="mx-auto mb-2 opacity-20" size={32} />
              <p className="text-[10px] uppercase font-black tracking-widest opacity-50">Empty Archive</p>
            </div>
          ) : (
            emails.map((email) => (
              <button
                key={email.id}
                onClick={() => setSelectedEmail(email)}
                className={`w-full p-4 text-left border-b border-zinc-900/30 transition-all hover:bg-white/5 flex gap-3 ${!email.is_read ? 'bg-blue-500/5' : ''}`}
              >
                <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
                  <User size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-[10px] font-black text-zinc-200 truncate pr-2">{email.from_address}</span>
                    <span className="text-[8px] text-zinc-500 shrink-0">{new Date(email.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <h4 className="text-xs font-bold text-zinc-100 mb-1 truncate">{email.subject}</h4>
                  <p className="text-[10px] text-zinc-500 line-clamp-1">{email.body_text}</p>
                </div>
                <ChevronRight className="self-center text-zinc-700" size={14} />
              </button>
            ))
          )}
        </div>
      </div>

      {/* Detail Panel */}
      {selectedEmail && (
        <div className="flex-[2] glass-card flex flex-col animate-in slide-in-from-right-4 duration-500 border-blue-500/10">
          <div className="p-4 border-b border-zinc-700/50 flex justify-between items-center">
            <button 
              onClick={() => setSelectedEmail(null)}
              className="lg:hidden text-[10px] font-black uppercase text-zinc-400"
            >
              Back
            </button>
            <div className="flex gap-2">
              <button className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition-colors">
                <Reply size={14} />
              </button>
              <button className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-red-400/50 hover:text-red-400 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                  <User size={24} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-zinc-100">{selectedEmail.from_address}</h2>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-600 mt-1">
                    <Clock size={10} />
                    {new Date(selectedEmail.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
              <h1 className="text-xl font-black tracking-tight text-white">{selectedEmail.subject}</h1>
            </div>

            <div className="prose prose-invert max-w-none text-sm text-zinc-400 leading-relaxed">
              {/* HTML Content or Text Fallback */}
              {selectedEmail.body_html ? (
                <div dangerouslySetInnerHTML={{ __html: selectedEmail.body_html }} />
              ) : (
                <pre className="whitespace-pre-wrap font-sans">{selectedEmail.body_text}</pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailInbox;
