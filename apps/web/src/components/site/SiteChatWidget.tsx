'use client';

import React, { useState, useRef, useEffect } from 'react';

interface Props {
  name: string;
  host: string;
  config: { accent?: string; greeting?: string };
}

export function SiteChatWidget({ name, host, config }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const accent = config.accent || '#6366f1';

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput('');
    const history = [...messages, { role: 'user' as const, content: msg }];
    setMessages(history);
    setLoading(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
      const res = await fetch(`${apiBase}/public/web/chat?host=${encodeURIComponent(host)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, history: history.slice(-6) }),
      });
      const data = await res.json();
      setMessages([...history, { role: 'assistant', content: data.reply || 'Sorry, I could not respond.' }]);
    } catch {
      setMessages([...history, { role: 'assistant', content: 'Something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label="Open chat"
        style={{
          position: 'fixed', bottom: 24, right: 24, width: 56, height: 56, borderRadius: '50%',
          background: accent, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 24,
          boxShadow: '0 4px 12px rgba(0,0,0,.15)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        💬
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, width: 360, maxHeight: 520,
      borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,.18)',
      display: 'flex', flexDirection: 'column', zIndex: 9999, background: '#fff', fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{ background: accent, color: '#fff', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 600 }}>{name}</span>
        <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>×</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 200, maxHeight: 380 }}>
        {messages.length === 0 && (
          <div style={{ color: '#888', fontSize: 14, textAlign: 'center', marginTop: 40 }}>
            {config.greeting || `Hi! I'm ${name}. How can I help you?`}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            background: m.role === 'user' ? accent : '#f3f4f6', color: m.role === 'user' ? '#fff' : '#1f2937',
            padding: '8px 14px', borderRadius: 12, maxWidth: '80%', fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap',
          }}>
            {m.content}
          </div>
        ))}
        {loading && <div style={{ color: '#888', fontSize: 13 }}>Typing…</div>}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(); }} style={{ display: 'flex', borderTop: '1px solid #e5e7eb' }}>
        <input
          value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message…"
          style={{ flex: 1, border: 'none', padding: '12px 14px', fontSize: 14, outline: 'none' }}
        />
        <button type="submit" disabled={loading} style={{ padding: '12px 18px', background: accent, color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
          Send
        </button>
      </form>
    </div>
  );
}
