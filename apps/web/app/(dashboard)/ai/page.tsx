/* eslint-disable no-console */
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, FileText, Mail, Wand2, GitBranch, Loader2, Bot, User, Copy, Check } from 'lucide-react';
import { Card, Button, Badge } from '@unerp/ui';

type Mode = 'chat' | 'invoice' | 'email' | 'form' | 'workflow';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  data?: unknown;
}

const API = 'http://localhost:3001/api/v1/ai';

function getToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('token') || localStorage.getItem('admin_token') || '';
}

const MODES: { id: Mode; label: string; icon: React.ReactNode; description: string }[] = [
  { id: 'chat', label: 'Ask Data', icon: <Sparkles size={16} />, description: 'Ask questions about your ERP data in plain English' },
  { id: 'invoice', label: 'Invoice Scan', icon: <FileText size={16} />, description: 'Paste invoice text to extract structured fields' },
  { id: 'email', label: 'Draft Email', icon: <Mail size={16} />, description: 'Generate a professional email for any business context' },
  { id: 'form', label: 'Build Form', icon: <Wand2 size={16} />, description: 'Describe a data-collection form and get a Builder Studio definition' },
  { id: 'workflow', label: 'Build Workflow', icon: <GitBranch size={16} />, description: 'Describe an approval workflow and get a configurable definition' },
];

export default function AiCopilotPage() {
  const [mode, setMode] = useState<Mode>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [createDraft, setCreateDraft] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    const prompt = input;
    setInput('');
    setLoading(true);

    try {
      const token = getToken();
      let endpoint = '';
      let body: Record<string, unknown> = {};

      switch (mode) {
        case 'chat':
          endpoint = `${API}/ask`;
          body = { question: prompt };
          break;
        case 'invoice':
          endpoint = `${API}/process-invoice`;
          body = { documentText: prompt, createDraft };
          break;
        case 'email':
          endpoint = `${API}/draft-email`;
          body = { to: '', regarding: prompt, tone: 'professional' };
          break;
        case 'form':
          endpoint = `${API}/generate-form`;
          body = { prompt };
          break;
        case 'workflow':
          endpoint = `${API}/generate-workflow`;
          body = { prompt };
          break;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message || res.statusText}` }]);
        return;
      }

      const data = await res.json();
      let content = '';
      let structuredData: unknown = undefined;

      switch (mode) {
        case 'chat':
          content = data.answer || 'No answer returned.';
          structuredData = data.data?.length ? data.data : undefined;
          break;
        case 'invoice':
          if (data.extracted) {
            const draftNote = data.draftPoNumber ? `\n\nDraft PO created: ${data.draftPoNumber} (ID: ${data.draftPoId})` : '';
            content = `Extracted fields (confidence: ${Math.round((data.confidence || 0.85) * 100)}%):\n${JSON.stringify(data.extracted, null, 2)}${draftNote}`;
          } else {
            content = data.error || 'Could not extract invoice fields.';
          }
          break;
        case 'email':
          content = data.draft || data.email || JSON.stringify(data);
          break;
        case 'form':
          content = data.form
            ? `Form definition generated:\n${JSON.stringify(data.form, null, 2)}`
            : `${JSON.stringify(data, null, 2)}`;
          structuredData = data.form || data;
          break;
        case 'workflow':
          content = data.workflow
            ? `Workflow definition generated:\n${JSON.stringify(data.workflow, null, 2)}`
            : `${JSON.stringify(data, null, 2)}`;
          structuredData = data.workflow || data;
          break;
      }

      setMessages(prev => [...prev, { role: 'assistant', content, data: structuredData }]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Network error. Is the API server running?' }]);
    } finally {
      setLoading(false);
    }
  };

  const currentMode = MODES.find(m => m.id === mode)!;

  const placeholders: Record<Mode, string> = {
    chat: 'e.g. "Show me unpaid invoices over $5,000 from last quarter"',
    invoice: 'Paste vendor invoice text here (OCR output, email body, or raw text)…',
    email: 'e.g. "Follow up with Acme Corp about their overdue invoice #INV-0042"',
    form: 'e.g. "A contact form with name, company, phone, and reason for inquiry"',
    workflow: 'e.g. "Purchase order approval: manager approves under $5k, finance director above that"',
  };

  return (
    <div style={{ padding: 'var(--space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', height: '100%' }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <Sparkles style={{ color: 'var(--color-primary)' }} size={28} />
          AI Copilot
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
          Your intelligent assistant for data queries, document processing, and workflow generation.
        </p>
      </div>

      {/* Mode Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        {MODES.map(m => (
          <button
            key={m.id}
            onClick={() => { setMode(m.id); setMessages([]); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
              padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-full)',
              border: mode === m.id ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
              background: mode === m.id ? 'var(--color-primary-light)' : 'transparent',
              color: mode === m.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              fontWeight: mode === m.id ? 'var(--weight-semibold)' : 'var(--weight-normal)',
              fontSize: 'var(--text-sm)', cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      {/* Invoice mode option */}
      {mode === 'invoice' && (
        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
          <input type="checkbox" checked={createDraft} onChange={e => setCreateDraft(e.target.checked)} style={{ width: 16, height: 16, cursor: 'pointer' }} />
          Automatically create a draft Purchase Order from extracted fields (if vendor is found)
        </label>
      )}

      {/* Chat Area */}
      <Card style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {/* Mode description */}
        <div style={{ padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            {currentMode.icon}
            <span>{currentMode.description}</span>
            <span style={{ marginLeft: 'auto' }}><Badge variant="info" size="sm">Powered by Claude</Badge></span>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', minHeight: '300px', maxHeight: '500px' }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--color-text-tertiary)', marginTop: 'var(--space-12)' }}>
              <Bot size={40} style={{ margin: '0 auto var(--space-4)', opacity: 0.4 }} />
              <p style={{ fontSize: 'var(--text-sm)' }}>Start by typing your request below.</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
              <div style={{
                width: 32, height: 32, borderRadius: 'var(--radius-full)', flexShrink: 0,
                background: msg.role === 'user' ? 'var(--color-primary)' : 'var(--color-bg-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: msg.role === 'user' ? '#fff' : 'var(--color-text-secondary)',
              }}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>

              <div style={{ maxWidth: '80%', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-lg)',
                  background: msg.role === 'user' ? 'var(--color-primary)' : 'var(--color-bg-subtle)',
                  color: msg.role === 'user' ? '#fff' : 'var(--color-text-primary)',
                  fontSize: 'var(--text-sm)', lineHeight: 1.6,
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                }}>
                  {msg.content}
                </div>

                {msg.role === 'assistant' && msg.content.length > 30 && (
                  <button
                    onClick={() => copyText(msg.content, `msg-${i}`)}
                    style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', padding: '0 var(--space-1)' }}
                  >
                    {copied === `msg-${i}` ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                  </button>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
              <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-full)', background: 'var(--color-bg-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={16} style={{ color: 'var(--color-text-secondary)' }} />
              </div>
              <div style={{ padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-lg)', background: 'var(--color-bg-subtle)' }}>
                <Loader2 size={16} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: 'var(--space-4) var(--space-6)', borderTop: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-end' }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={placeholders[mode]}
              rows={mode === 'invoice' ? 4 : 2}
              style={{
                flex: 1, padding: 'var(--space-3)', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)',
                resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5,
                background: 'var(--color-bg)', color: 'var(--color-text-primary)',
              }}
            />
            <Button onClick={send} disabled={loading || !input.trim()} style={{ flexShrink: 0, height: 40 }}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              <span style={{ marginLeft: 'var(--space-2)' }}>Send</span>
            </Button>
          </div>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginTop: 'var(--space-2)' }}>
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      </Card>
    </div>
  );
}
