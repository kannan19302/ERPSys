'use client';
import styles from './page.module.css';
import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, FileText, Mail, Wand2, GitBranch, Loader2, Bot, User, Copy, Check } from 'lucide-react';
import { Card, Button, Badge } from '@unerp/ui';
import { RouteGuard, useApiClient } from '@unerp/framework';

type Mode = 'chat' | 'invoice' | 'email' | 'form' | 'workflow';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  data?: unknown;
}

type AiResponse = {
  [key: string]: unknown;
  answer?: string;
  data?: unknown[];
  extracted?: unknown;
  draftPoNumber?: string;
  draftPoId?: string;
  confidence?: number;
  error?: string;
  draft?: string;
  email?: string;
  form?: unknown;
  workflow?: unknown;
};

const MODES: { id: Mode; label: string; icon: React.ReactNode; description: string }[] = [
  { id: 'chat', label: 'Ask Data', icon: <Sparkles size={16} />, description: 'Ask questions about your ERP data in plain English' },
  { id: 'invoice', label: 'Invoice Scan', icon: <FileText size={16} />, description: 'Paste invoice text to extract structured fields' },
  { id: 'email', label: 'Draft Email', icon: <Mail size={16} />, description: 'Generate a professional email for any business context' },
  { id: 'form', label: 'Build Form', icon: <Wand2 size={16} />, description: 'Describe a data-collection form and get a Builder Studio definition' },
  { id: 'workflow', label: 'Build Workflow', icon: <GitBranch size={16} />, description: 'Describe an approval workflow and get a configurable definition' },
];

export default function AiCopilotPage() {
  const client = useApiClient();
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
      let endpoint = '';
      let body: Record<string, unknown> = {};

      switch (mode) {
        case 'chat':
          endpoint = '/ai/ask';
          body = { question: prompt };
          break;
        case 'invoice':
          endpoint = '/ai/process-invoice';
          body = { documentText: prompt, createDraft };
          break;
        case 'email':
          endpoint = '/ai/draft-email';
          body = { to: '', regarding: prompt, tone: 'professional' };
          break;
        case 'form':
          endpoint = '/ai/generate-form';
          body = { prompt };
          break;
        case 'workflow':
          endpoint = '/ai/generate-workflow';
          body = { prompt };
          break;
      }

      const data = await client.post<AiResponse>(endpoint, body);
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
    } catch {
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
    <RouteGuard permission="ai.copilot.read">
    <div className={`p-8 ui-stack-6 ${styles.s1}`} >

      {/* Header */}
      <div>
        <h1 className="text-3xl ui-hstack-3">
          <Sparkles className="ui-text-primary" size={28} />
          AI Copilot
        </h1>
        <p className="ui-text-muted mt-1">
          Your intelligent assistant for data queries, document processing, and workflow generation.
        </p>
      </div>

      {/* Mode Tabs */}
      <div className="ui-flex ui-gap-2 ui-flex-wrap">
        {MODES.map(m => (
          <button
            key={m.id}
            onClick={() => { setMode(m.id); setMessages([]); }}
            className={`ui-pill ${mode === m.id ? 'active' : ''}`}
          >
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      {/* Invoice mode option */}
      {mode === 'invoice' && (
        <label className="ui-checkbox-row">
          <input type="checkbox" checked={createDraft} onChange={e => setCreateDraft(e.target.checked)} className={styles.s2} />
          Automatically create a draft Purchase Order from extracted fields (if vendor is found)
        </label>
      )}

      {/* Chat Area */}
      <Card className={`flex-1 ${styles.s3}`} >
        {/* Mode description */}
        <div className={`px-6 py-4 border-b ${styles.s4}`} >
          <div className="ui-hstack-2 ui-text-sm-muted">
            {currentMode.icon}
            <span>{currentMode.description}</span>
            <span className="ml-auto"><Badge variant="info" size="sm">Powered by Claude</Badge></span>
          </div>
        </div>

        {/* Messages */}
        <div className={`p-6 ui-stack-4 flex-1 ${styles.s5}`} >
          {messages.length === 0 && (
            <div className="text-center ui-text-tertiary mt-8">
              <Bot size={40} className={styles.s6} />
              <p className="text-sm">Start by typing your request below.</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className="ui-flex ui-gap-3 ui-items-start" style={{ flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
              <div
                className="ui-avatar-md ui-flex-center"
                style={{
                  background: msg.role === 'user' ? 'var(--color-primary)' : 'var(--color-bg-muted)',
                  color: msg.role === 'user' ? 'var(--color-text-inverse)' : 'var(--color-text-secondary)',
                }}
              >
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>

              <div className={`ui-stack-1 ${styles.s7}`} style={{ alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div
                  className={`py-3 px-4 rounded-lg text-sm ${styles.s8}`}
                  style={{ background: msg.role === 'user' ? 'var(--color-primary)' : 'var(--color-bg-subtle)', color: msg.role === 'user' ? 'var(--color-text-inverse)' : 'var(--color-text)' }}
                >
                  {msg.content}
                </div>

                {msg.role === 'assistant' && msg.content.length > 30 && (
                  <button
                    onClick={() => copyText(msg.content, `msg-${i}`)}
                    className={`ui-btn-icon ui-text-xs-tertiary ui-hstack-2 ${styles.s9}`}
                    
                  >
                    {copied === `msg-${i}` ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                  </button>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="ui-hstack-3">
              <div className={`ui-avatar-md ui-flex-center ${styles.s10}`} >
                <Bot size={16} className="ui-text-muted" />
              </div>
              <div className={`py-3 px-4 rounded-lg ${styles.s4}`} >
                <Loader2 size={16} className="animate-spin ui-text-primary" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className={`px-6 py-4 border-b ${styles.s11}`} >
          <div className={`ui-flex ui-gap-3 ${styles.s12}`} >
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={placeholders[mode]}
              rows={mode === 'invoice' ? 4 : 2}
              className="ui-textarea flex-1"
            />
            <Button onClick={send} disabled={loading || !input.trim()} className={styles.s13}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              <span className="ml-2">Send</span>
            </Button>
          </div>
          <p className="ui-text-xs-tertiary mt-2">
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      </Card>
    </div>
    </RouteGuard>
  );
}
