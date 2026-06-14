'use client';

import React, { useState } from 'react';
import {
  MessageSquare, Send, Pin, Smile, Reply, CheckSquare,
  Inbox, Clock, Phone, AtSign
} from 'lucide-react';

interface ThreadMessage {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  reactions: { emoji: string; count: number; reacted: boolean }[];
  isPinned: boolean;
  replies: ThreadMessage[];
}

interface SharedInboxItem {
  id: string;
  from: string;
  subject: string;
  preview: string;
  receivedAt: string;
  assignedTo: string | null;
  status: 'OPEN' | 'ASSIGNED' | 'RESOLVED';
  slaDeadline: string;
  channel: string;
}

export default function CommunicationAdvancedPage() {
  const [activeTab, setActiveTab] = useState<'threads' | 'inbox' | 'outbound'>('threads');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const [messages, setMessages] = useState<ThreadMessage[]>([
    {
      id: 'msg-1', author: 'Sarah Chen', content: 'The Q3 sales pipeline numbers are looking strong. We need to discuss resource allocation for the new accounts.', timestamp: '10:24 AM',
      reactions: [{ emoji: '👍', count: 3, reacted: true }, { emoji: '🎯', count: 1, reacted: false }],
      isPinned: true,
      replies: [
        { id: 'reply-1', author: 'Mike Johnson', content: 'Agreed! I have prepared a resource matrix. Let me share it in the meeting.', timestamp: '10:31 AM', reactions: [{ emoji: '✅', count: 2, reacted: false }], isPinned: false, replies: [] },
        { id: 'reply-2', author: 'Lisa Wang', content: 'Can we also review the CRM lead scoring criteria? Some accounts seem misclassified.', timestamp: '10:35 AM', reactions: [], isPinned: false, replies: [] },
      ]
    },
    {
      id: 'msg-2', author: 'James Park', content: 'Manufacturing line B is running at 87% OEE this week. We need to schedule maintenance before it dips below 80%.', timestamp: '11:02 AM',
      reactions: [{ emoji: '⚠️', count: 4, reacted: false }],
      isPinned: false,
      replies: [
        { id: 'reply-3', author: 'Ops Team', content: 'CMMS ticket #4521 already created for preventive maintenance window next Tuesday.', timestamp: '11:15 AM', reactions: [{ emoji: '👍', count: 1, reacted: false }], isPinned: false, replies: [] },
      ]
    },
    {
      id: 'msg-3', author: 'HR Bot', content: '📢 Reminder: All timesheets for the current pay period must be submitted by Friday 5 PM. Late submissions will be processed in the next cycle.', timestamp: '9:00 AM',
      reactions: [{ emoji: '📝', count: 8, reacted: true }, { emoji: '👀', count: 5, reacted: false }],
      isPinned: true,
      replies: []
    },
  ]);

  const [inboxItems] = useState<SharedInboxItem[]>([
    { id: 'inb-1', from: 'customer@acmecorp.com', subject: 'Invoice #2026-0184 Discrepancy', preview: 'The total on our invoice does not match the PO amount...', receivedAt: '2026-06-14 08:30', assignedTo: null, status: 'OPEN', slaDeadline: '2026-06-15 08:30', channel: 'support@' },
    { id: 'inb-2', from: 'vendor@steelworks.com', subject: 'Delivery Schedule Change', preview: 'Due to supply chain constraints, we need to push the delivery...', receivedAt: '2026-06-14 07:45', assignedTo: 'Mike J.', status: 'ASSIGNED', slaDeadline: '2026-06-14 19:45', channel: 'procurement@' },
    { id: 'inb-3', from: 'applicant@email.com', subject: 'Application for Senior Engineer', preview: 'I am writing to express my interest in the position...', receivedAt: '2026-06-13 16:20', assignedTo: 'HR Team', status: 'ASSIGNED', slaDeadline: '2026-06-16 16:20', channel: 'careers@' },
    { id: 'inb-4', from: 'partner@logistics.com', subject: 'Shipment ASN-8834 Status Update', preview: 'Your shipment is currently in transit and expected to arrive...', receivedAt: '2026-06-13 14:10', assignedTo: 'Ops Team', status: 'RESOLVED', slaDeadline: '2026-06-14 14:10', channel: 'support@' },
  ]);

  const addReaction = (msgId: string, emoji: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id === msgId) {
        const existing = m.reactions.find(r => r.emoji === emoji);
        if (existing) {
          return { ...m, reactions: m.reactions.map(r => r.emoji === emoji ? { ...r, count: r.reacted ? r.count - 1 : r.count + 1, reacted: !r.reacted } : r) };
        }
        return { ...m, reactions: [...m.reactions, { emoji, count: 1, reacted: true }] };
      }
      return m;
    }));
  };

  const togglePin = (msgId: string) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isPinned: !m.isPinned } : m));
  };

  const addReply = (msgId: string) => {
    if (!replyText.trim()) return;
    setMessages(prev => prev.map(m => {
      if (m.id === msgId) {
        return { ...m, replies: [...m.replies, { id: `reply-${Date.now()}`, author: 'You', content: replyText, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), reactions: [], isPinned: false, replies: [] }] };
      }
      return m;
    }));
    setReplyText('');
    setReplyingTo(null);
  };

  const convertToTask = (content: string) => {
    alert(`Task created: "${content.substring(0, 60)}..."\nAssigned to: Current User\nDue: Tomorrow`);
  };

  const slaColor = (deadline: string) => {
    const remaining = new Date(deadline).getTime() - Date.now();
    if (remaining < 0) return 'var(--color-error)';
    if (remaining < 3600000 * 4) return 'var(--color-warning)';
    return 'var(--color-success)';
  };

  const tabs = [
    { id: 'threads' as const, label: 'Threaded Chat', icon: <MessageSquare size={14} /> },
    { id: 'inbox' as const, label: 'Shared Inbox', icon: <Inbox size={14} /> },
    { id: 'outbound' as const, label: 'SMS / WhatsApp', icon: <Phone size={14} /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', height: 'calc(100vh - 120px)' }}>
      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <MessageSquare style={{ color: 'var(--color-primary)' }} />
          Advanced Communication
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
          Threaded conversations with reactions and pins, shared team inboxes with SLA, and outbound messaging.
        </p>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', gap: 'var(--space-1)' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: 'var(--space-2.5) var(--space-4)', border: 'none', background: 'none',
            borderBottom: activeTab === t.id ? '2px solid var(--color-primary)' : '2px solid transparent',
            color: activeTab === t.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: 'var(--weight-semibold)', cursor: 'pointer', fontSize: 'var(--text-sm)',
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)'
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Threaded Chat */}
      {activeTab === 'threads' && (
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {messages.map(msg => (
            <div key={msg.id} style={{
              background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)',
              borderLeft: msg.isPinned ? '3px solid var(--color-primary)' : 'none'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '11px' }}>
                    {msg.author.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <span style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)' }}>{msg.author}</span>
                    <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', marginLeft: 'var(--space-2)' }}>{msg.timestamp}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                  <button onClick={() => togglePin(msg.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: msg.isPinned ? 'var(--color-primary)' : 'var(--color-text-tertiary)' }} title="Pin">
                    <Pin size={14} />
                  </button>
                  <button onClick={() => convertToTask(msg.content)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)' }} title="Convert to Task">
                    <CheckSquare size={14} />
                  </button>
                  <button onClick={() => setReplyingTo(replyingTo === msg.id ? null : msg.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)' }} title="Reply">
                    <Reply size={14} />
                  </button>
                </div>
              </div>

              <p style={{ margin: '0 0 var(--space-2) 0', fontSize: 'var(--text-sm)', color: 'var(--color-text)', lineHeight: 1.5 }}>{msg.content}</p>

              {/* Reactions */}
              <div style={{ display: 'flex', gap: 'var(--space-1)', marginBottom: msg.replies.length > 0 ? 'var(--space-3)' : 0 }}>
                {msg.reactions.map(r => (
                  <button key={r.emoji} onClick={() => addReaction(msg.id, r.emoji)} style={{
                    background: r.reacted ? 'var(--color-primary-light)' : 'var(--color-bg)',
                    border: r.reacted ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                    padding: '2px 8px', borderRadius: 'var(--radius-full)', cursor: 'pointer',
                    fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px'
                  }}>
                    {r.emoji} <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>{r.count}</span>
                  </button>
                ))}
                <button onClick={() => addReaction(msg.id, '👍')} style={{
                  background: 'none', border: '1px dashed var(--color-border)',
                  padding: '2px 8px', borderRadius: 'var(--radius-full)', cursor: 'pointer',
                  fontSize: '12px', color: 'var(--color-text-tertiary)'
                }}>
                  <Smile size={12} />
                </button>
              </div>

              {/* Thread Replies */}
              {msg.replies.length > 0 && (
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)', marginLeft: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2.5)' }}>
                  <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', fontWeight: 'var(--weight-bold)' }}>{msg.replies.length} {msg.replies.length === 1 ? 'reply' : 'replies'}</span>
                  {msg.replies.map(r => (
                    <div key={r.id} style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'flex-start' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--color-bg)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 'bold', flexShrink: 0 }}>
                        {r.author.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
                          <span style={{ fontSize: '12px', fontWeight: 'var(--weight-bold)' }}>{r.author}</span>
                          <span style={{ fontSize: '9px', color: 'var(--color-text-tertiary)' }}>{r.timestamp}</span>
                        </div>
                        <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: 'var(--color-text-secondary)' }}>{r.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply Input */}
              {replyingTo === msg.id && (
                <div style={{ marginTop: 'var(--space-3)', display: 'flex', gap: 'var(--space-2)', marginLeft: 'var(--space-5)' }}>
                  <input value={replyText} onChange={e => setReplyText(e.target.value)} onKeyDown={e => e.key === 'Enter' && addReply(msg.id)} placeholder="Write a reply..." style={{
                    flex: 1, padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)', color: 'var(--color-text)'
                  }} />
                  <button onClick={() => addReply(msg.id)} style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>
                    <Send size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Shared Inbox */}
      {activeTab === 'inbox' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)' }}>
            {(['OPEN', 'ASSIGNED', 'RESOLVED'] as const).map(status => {
              const count = inboxItems.filter(i => i.status === status).length;
              const colors: Record<string, string> = { OPEN: 'var(--color-error)', ASSIGNED: 'var(--color-warning)', RESOLVED: 'var(--color-success)' };
              return (
                <div key={status} style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-3)', textAlign: 'center' }}>
                  <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: colors[status] }}>{count}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{status}</div>
                </div>
              );
            })}
          </div>

          <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                  <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 'var(--weight-bold)' }}>Channel</th>
                  <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 'var(--weight-bold)' }}>From / Subject</th>
                  <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 'var(--weight-bold)' }}>Assigned</th>
                  <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 'var(--weight-bold)' }}>SLA</th>
                  <th style={{ textAlign: 'left', padding: 'var(--space-3) var(--space-4)', fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', fontWeight: 'var(--weight-bold)' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {inboxItems.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <span style={{ fontSize: '11px', background: 'var(--color-bg)', padding: '2px 8px', borderRadius: 'var(--radius-full)', color: 'var(--color-text-secondary)' }}>
                        <AtSign size={10} style={{ display: 'inline', marginRight: '2px' }} />{item.channel}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <div style={{ fontWeight: 'var(--weight-semibold)' }}>{item.subject}</div>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>From: {item.from}</div>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)' }}>
                      {item.assignedTo || <span style={{ color: 'var(--color-error)', fontStyle: 'italic' }}>Unassigned</span>}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: slaColor(item.slaDeadline), fontSize: '12px' }}>
                        <Clock size={12} />
                        {new Date(item.slaDeadline).toLocaleDateString()}
                      </div>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <span style={{
                        fontSize: '11px', padding: '3px 10px', borderRadius: 'var(--radius-full)', fontWeight: 'var(--weight-semibold)',
                        color: item.status === 'OPEN' ? 'var(--color-error)' : item.status === 'ASSIGNED' ? 'var(--color-warning)' : 'var(--color-success)',
                        background: item.status === 'OPEN' ? 'var(--color-error-light)' : item.status === 'ASSIGNED' ? 'var(--color-warning-light)' : 'var(--color-success-light)',
                      }}>{item.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SMS / WhatsApp Outbound */}
      {activeTab === 'outbound' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            {/* SMS Templates */}
            <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)' }}>
              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-3)' }}>📱 SMS Templates</h3>
              {[
                { name: 'Order Confirmation', vars: ['{{orderNumber}}', '{{total}}'], preview: 'Your order #{{orderNumber}} for ${{total}} has been confirmed.' },
                { name: 'Delivery Update', vars: ['{{trackingId}}', '{{eta}}'], preview: 'Your shipment {{trackingId}} is on its way. ETA: {{eta}}.' },
                { name: 'Payment Reminder', vars: ['{{invoiceNo}}', '{{dueDate}}'], preview: 'Reminder: Invoice {{invoiceNo}} is due on {{dueDate}}.' },
              ].map((t, i) => (
                <div key={i} style={{ padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-2)' }}>
                  <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)', marginBottom: '4px' }}>{t.name}</div>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>{t.preview}</p>
                  <div style={{ display: 'flex', gap: 'var(--space-1)', marginTop: '6px' }}>
                    {t.vars.map(v => (
                      <span key={v} style={{ fontSize: '9px', background: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '1px 6px', borderRadius: 'var(--radius-full)' }}>{v}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* WhatsApp Business */}
            <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)' }}>
              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-3)' }}>💬 WhatsApp Business Templates</h3>
              {[
                { name: 'Welcome Message', status: 'APPROVED', category: 'Marketing' },
                { name: 'Appointment Reminder', status: 'APPROVED', category: 'Utility' },
                { name: 'Invoice Notification', status: 'PENDING', category: 'Utility' },
                { name: 'Feedback Request', status: 'REJECTED', category: 'Marketing' },
              ].map((t, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-2.5) var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-2)' }}>
                  <div>
                    <div style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)' }}>{t.name}</div>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>{t.category}</div>
                  </div>
                  <span style={{
                    fontSize: '10px', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontWeight: 'var(--weight-semibold)',
                    color: t.status === 'APPROVED' ? 'var(--color-success)' : t.status === 'PENDING' ? 'var(--color-warning)' : 'var(--color-error)',
                    background: t.status === 'APPROVED' ? 'var(--color-success-light)' : t.status === 'PENDING' ? 'var(--color-warning-light)' : 'var(--color-error-light)',
                  }}>{t.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Send */}
          <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-3)' }}>Quick Send Message</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr 1fr auto', gap: 'var(--space-2)', alignItems: 'end' }}>
              <div>
                <label style={{ fontSize: '10px', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-bold)' }}>Channel</label>
                <select style={{ width: '100%', padding: '6px 8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '12px', background: 'var(--color-bg)', color: 'var(--color-text)' }}>
                  <option>SMS</option>
                  <option>WhatsApp</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '10px', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-bold)' }}>Recipient</label>
                <input placeholder="+1 555 000 0000" style={{ width: '100%', padding: '6px 8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '12px', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
              </div>
              <div>
                <label style={{ fontSize: '10px', color: 'var(--color-text-secondary)', fontWeight: 'var(--weight-bold)' }}>Message</label>
                <input placeholder="Type message..." style={{ width: '100%', padding: '6px 8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '12px', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
              </div>
              <button style={{
                background: 'var(--color-primary)', color: '#fff', border: 'none',
                padding: '6px 16px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                fontSize: '12px', fontWeight: 'var(--weight-semibold)', display: 'flex', alignItems: 'center', gap: '4px'
              }}>
                <Send size={12} /> Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
