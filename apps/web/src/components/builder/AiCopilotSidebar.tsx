'use client';

import React, { useState } from 'react';
import { Sparkles, HelpCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/builder/ToastProvider';

interface AiCopilotSidebarProps {
  onSuggestFields?: (fields: any[]) => void;
  onSuggestSteps?: (steps: any[]) => void;
  type: 'form' | 'workflow';
  componentId: string;
}

export function AiCopilotSidebar({ onSuggestFields, onSuggestSteps, type, componentId }: AiCopilotSidebarProps) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const endpoint = type === 'form' 
        ? `/api/v1/builder/components/${componentId}/generate`
        : `/api/v1/builder/components/${componentId}/generate`; // Shares suggestion endpoint

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`
        },
        body: JSON.stringify({ prompt })
      });

      if (res.ok) {
        const data = await res.json();
        if (type === 'form' && onSuggestFields) {
          onSuggestFields(data);
          showToast('Suggested fields appended!', 'success');
        } else if (type === 'workflow' && onSuggestSteps) {
          onSuggestSteps(data);
          showToast('Suggested workflow steps appended!', 'success');
        }
      } else {
        showToast('AI suggestions failed to retrieve.', 'error');
      }
    } catch (e) {
      showToast('Network error during copilot generation.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      width: 280,
      borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
      background: 'rgba(30, 41, 59, 0.95)',
      display: 'flex',
      flexDirection: 'column',
      padding: 'var(--space-4)',
      color: 'white',
      zIndex: 9
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-4)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: 'var(--space-2)' }}>
        <Sparkles size={16} style={{ color: 'var(--color-primary)' }} />
        <span style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>AI Workspace Copilot</span>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>
          Describe a modification, new fields, or validation step rules to draft into your canvas layout.
        </p>

        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder={type === 'form' ? "e.g., Add shipping detail inputs with tracking number" : "e.g., Add multi-level approval check step"}
          style={{
            width: '100%',
            height: 120,
            borderRadius: 'var(--radius-md)',
            background: 'rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: 'white',
            padding: 8,
            fontSize: 'var(--text-xs)',
            resize: 'none'
          }}
        />

        <button
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
          style={{
            padding: 'var(--space-2) var(--space-3)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-primary)',
            color: 'white',
            border: 'none',
            fontWeight: 600,
            fontSize: 'var(--text-xs)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            opacity: loading || !prompt.trim() ? 0.6 : 1
          }}
        >
          {loading ? <RefreshCw size={12} className="spin" /> : <Sparkles size={12} />}
          <span>{loading ? 'Thinking...' : 'Suggest Changes'}</span>
        </button>
      </div>

      <div style={{ fontSize: '10px', color: '#64748b', display: 'flex', alignItems: 'center', gap: 4, marginTop: 'var(--space-3)' }}>
        <HelpCircle size={10} /> Powered by Claude models
      </div>
    </div>
  );
}
