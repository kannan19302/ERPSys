'use client';

import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Hash, 
  Send, 
  Bell, 
  Mail, 
   
  User
} from 'lucide-react';

interface Channel {
  id: string;
  name: string;
  description?: string;
}

interface ChannelMessage {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
}

interface SystemNotification {
  id: string;
  title: string;
  content: string;
  status: string;
  createdAt: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  bodyHtml: string;
}

export default function CommunicationPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<ChannelMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'notifications' | 'email'>('chat');

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const cRes = await fetch('http://localhost:3001/communication/channels', { headers });
      const cData = await cRes.json();
      setChannels(Array.isArray(cData) ? cData : []);
      if (cData.length > 0 && !activeChannel) {
        setActiveChannel(cData[0]);
      }

      const nRes = await fetch('http://localhost:3001/communication/notifications', { headers });
      const nData = await nRes.json();
      setNotifications(Array.isArray(nData) ? nData : []);

      const eRes = await fetch('http://localhost:3001/communication/email-templates', { headers });
      const eData = await eRes.json();
      setEmailTemplates(Array.isArray(eData) ? eData : []);
    } catch {
      // Handle error
    }
  };

  const loadMessages = async (channelId: string) => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch(`http://localhost:3001/communication/channels/${channelId}/messages`, { headers });
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch {
      // Handle error
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!activeChannel) return;
    loadMessages(activeChannel.id);
    // Auto poll messages for active channel simulation every 3s
    const timer = setInterval(() => loadMessages(activeChannel.id), 3000);
    return () => clearInterval(timer);
  }, [activeChannel]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChannel) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3001/communication/channels/${activeChannel.id}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: newMessage })
      });
      const sent = await res.json();
      setMessages(prev => [...prev, sent]);
      setNewMessage('');
    } catch {
      // Handle error
    }
  };

  const handleCreateChannel = async () => {
    const name = prompt('Enter channel name (e.g. general):');
    if (!name) return;
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:3001/communication/channels', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, description: 'Public discussion' })
      });
      loadData();
    } catch {
      // Handle error
    }
  };

  const handleCreateEmailTemplate = async () => {
    const name = prompt('Enter template name:');
    if (!name) return;
    const subject = prompt('Enter subject:');
    if (!subject) return;

    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:3001/communication/email-templates', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          subject,
          bodyHtml: `<p>Hello customer,</p><p>This is a custom transaction template for <strong>${name}</strong>.</p>`
        })
      });
      loadData();
    } catch {
      // Handle error
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', height: 'calc(100vh - 120px)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <MessageSquare style={{ color: 'var(--color-primary)' }} />
            Internal Communication
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            Channels, real-time messaging, notification routing, and transaction email builder.
          </p>
        </div>
      </div>

      {/* Mode Switch Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', gap: 'var(--space-4)' }}>
        <button 
          onClick={() => setActiveTab('chat')}
          style={{
            padding: 'var(--space-2) var(--space-4)', border: 'none', background: 'none',
            borderBottom: activeTab === 'chat' ? '2px solid var(--color-primary)' : 'none',
            color: activeTab === 'chat' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: 'var(--weight-semibold)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-2)'
          }}
        >
          <Hash size={16} /> Channels & Chat
        </button>
        <button 
          onClick={() => setActiveTab('notifications')}
          style={{
            padding: 'var(--space-2) var(--space-4)', border: 'none', background: 'none',
            borderBottom: activeTab === 'notifications' ? '2px solid var(--color-primary)' : 'none',
            color: activeTab === 'notifications' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: 'var(--weight-semibold)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-2)'
          }}
        >
          <Bell size={16} /> Notifications ({notifications.filter(n=>n.status==='UNREAD').length})
        </button>
        <button 
          onClick={() => setActiveTab('email')}
          style={{
            padding: 'var(--space-2) var(--space-4)', border: 'none', background: 'none',
            borderBottom: activeTab === 'email' ? '2px solid var(--color-primary)' : 'none',
            color: activeTab === 'email' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: 'var(--weight-semibold)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--space-2)'
          }}
        >
          <Mail size={16} /> Email Templates
        </button>
      </div>

      {/* Tabs Content */}
      <div style={{ flex: 1, display: 'flex', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        
        {activeTab === 'chat' && (
          <>
            {/* Sidebar Channels */}
            <div style={{ width: '240px', borderRight: '1px solid var(--color-border)', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Channels</span>
                <button onClick={handleCreateChannel} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer' }}>
                  </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                {channels.map(ch => (
                  <button 
                    key={ch.id}
                    onClick={() => setActiveChannel(ch)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                      padding: 'var(--space-2) var(--space-3)', border: 'none',
                      borderRadius: 'var(--radius-md)', textAlign: 'left', cursor: 'pointer',
                      background: activeChannel?.id === ch.id ? 'var(--color-primary-light)' : 'transparent',
                      color: activeChannel?.id === ch.id ? 'var(--color-primary)' : 'var(--color-text)'
                    }}
                  >
                    <Hash size={14} />
                    <span style={{ fontSize: 'var(--text-sm)' }}>{ch.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Messages */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border)' }}>
                <h3 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)' }}>#{activeChannel?.name}</h3>
                <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{activeChannel?.description || 'No description set'}</p>
              </div>

              {/* Message Feed */}
              <div style={{ flex: 1, padding: 'var(--space-4)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-3.5)' }}>
                {messages.map(msg => (
                  <div key={msg.id} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'start' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%',
                      background: 'var(--color-primary-light)', color: 'var(--color-primary)',
                      display: 'flex', alignItems: 'center', justifyItems: 'center',
                      fontWeight: 'bold', fontSize: 'var(--text-xs)', justifyContent: 'center'
                    }}>
                      <User size={14} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
                        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)' }}>{msg.userId === 'system' ? 'Super Admin' : 'Agent'}</span>
                        <span style={{ fontSize: '9px', color: 'var(--color-text-secondary)' }}>{new Date(msg.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <p style={{ margin: 'var(--space-1) 0 0 0', fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>{msg.content}</p>
                    </div>
                  </div>
                ))}
                {messages.length === 0 && (
                  <div style={{ display: 'flex', flex: 1, justifyContent: 'center', alignItems: 'center', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-xs)' }}>
                    Start of chat history. Send a message below.
                  </div>
                )}
              </div>

              {/* Message Input Box */}
              <form onSubmit={handleSendMessage} style={{ padding: 'var(--space-4)', borderTop: '1px solid var(--color-border)', display: 'flex', gap: 'var(--space-2)' }}>
                <input 
                  type="text" 
                  placeholder={`Message #${activeChannel?.name}`}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  style={{
                    flex: 1, padding: 'var(--space-2.5) var(--space-4)', borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)', background: 'var(--color-bg)',
                    fontSize: 'var(--text-sm)', color: 'var(--color-text)'
                  }}
                />
                <button type="submit" style={{
                  background: 'var(--color-primary)', color: '#ffffff', border: 'none',
                  padding: 'var(--space-2.5) var(--space-4)', borderRadius: 'var(--radius-md)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center'
                }}>
                  <Send size={16} />
                </button>
              </form>
            </div>
          </>
        )}

        {activeTab === 'notifications' && (
          <div style={{ flex: 1, padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <h3 style={{ margin: 0, fontSize: 'var(--text-md)', fontWeight: 'var(--weight-bold)' }}>System Notifications</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2.5)' }}>
              {notifications.map(n => (
                <div key={n.id} style={{
                  padding: 'var(--space-4)', border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', background: n.status === 'UNREAD' ? 'var(--color-primary-light)' : 'transparent'
                }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)' }}>{n.title}</h4>
                    <p style={{ margin: 'var(--space-1) 0 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{n.content}</p>
                  </div>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
                    {new Date(n.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
              {notifications.length === 0 && (
                <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--text-xs)', textAlign: 'center' }}>No notifications found.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'email' && (
          <div style={{ flex: 1, padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 'var(--text-md)', fontWeight: 'var(--weight-bold)' }}>Transactional Email Templates</h3>
              <button onClick={handleCreateEmailTemplate} style={{
                background: 'var(--color-primary)', color: '#ffffff', border: 'none',
                padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)',
                cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)',
                display: 'flex', alignItems: 'center', gap: 'var(--space-2)'
              }}>
                Create Template
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
              {emailTemplates.map(t => (
                <div key={t.id} style={{
                  padding: 'var(--space-4)', border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <Mail size={18} style={{ color: 'var(--color-primary)' }} />
                    <span style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-sm)' }}>{t.name}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Subject: {t.subject}</p>
                  <div style={{
                    background: 'var(--color-bg)', padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
                    fontSize: '11px', color: 'var(--color-text-secondary)',
                    maxHeight: '80px', overflow: 'hidden', textOverflow: 'ellipsis'
                  }} dangerouslySetInnerHTML={{ __html: t.bodyHtml }} />
                </div>
              ))}
              {emailTemplates.length === 0 && (
                <p style={{ color: 'var(--color-text-tertiary)', fontSize: 'var(--text-xs)', gridColumn: '1/-1', textAlign: 'center' }}>No templates saved.</p>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
