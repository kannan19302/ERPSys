'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { X, Sparkles, Send } from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';
import styles from './AICopilot.module.css';

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  time: string;
}

interface AICopilotProps {
  theme: 'light' | 'dark';
}

export function AICopilot({ theme }: AICopilotProps) {
  const pathname = usePathname() || '';
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { 
      sender: 'ai', 
      text: 'Hello! I am your UniERP AI Copilot. How can I assist you with your modules, workflows, or ledger auditing today?', 
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    }
  ]);
  const [chatTyping, setChatTyping] = useState(false);
  const [aiWidgetEnabled, setAiWidgetEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const status = await apiGet<{ configured: boolean; enabled: boolean }>('/ai/status');
        if (mounted) setAiWidgetEnabled(status.enabled !== false);
      } catch {
        // Best-effort: leave widget visible if status check fails
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, chatTyping]);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const updatedMessages = [...chatMessages, { sender: 'user' as const, text: userMsg, time: timeStr }];
    setChatMessages(updatedMessages);
    setChatInput('');
    setChatTyping(true);

    try {
      const messages = updatedMessages.map(m => ({
        role: m.sender === 'user' ? 'user' as const : 'assistant' as const,
        content: m.text,
      }));

      const data = await apiPost<{ reply: string; actions?: Array<{ tool: string }> }>(
        '/ai/converse',
        { messages, context: { path: pathname } },
      );

      const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const actionSuffix = data.actions?.length
        ? `\n\n_Action taken: ${data.actions.map((a) => a.tool).join(', ')}_`
        : '';

      setChatMessages(prev => [...prev, { sender: 'ai', text: `${data.reply}${actionSuffix}`, time: replyTime }]);
    } catch (err) {
      const errorTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setChatMessages(prev => [...prev, { sender: 'ai', text: 'Sorry, I could not reach the AI assistant right now. Please try again in a moment.', time: errorTime }]);
    } finally {
      setChatTyping(false);
    }
  };

  if (!aiWidgetEnabled) return null;

  const chatToggleClass = `${styles.toggleBtn} ${chatOpen ? styles.toggleBtnRotated : ''}`;
  const chatWindowClass = `${styles.chatWindow} ${theme === 'light' ? styles.chatWindowLight : styles.chatWindowDark}`;
  const chatHeaderClass = `${styles.header} ${theme === 'light' ? styles.headerLight : styles.headerDark}`;
  const chatInputFormClass = `${styles.inputForm} ${theme === 'light' ? styles.inputFormLight : styles.inputFormDark}`;
  const chatInputClass = `${styles.chatInput} ${theme === 'light' ? styles.chatInputLight : styles.chatInputDark}`;
  const typingIndicatorClass = `${styles.typingIndicator} ${theme === 'light' ? styles.typingIndicatorLight : styles.typingIndicatorDark}`;

  return (
    <div className={styles.floatingContainer}>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        className={chatToggleClass}
        aria-label={chatOpen ? "Close AI Copilot" : "Open AI Copilot"}
      >
        {chatOpen ? <X size={20} /> : <Sparkles size={20} />}
      </button>

      {/* Chat Window Box */}
      {chatOpen && (
        <div className={chatWindowClass}>
          {/* Header */}
          <div className={chatHeaderClass}>
            <div className={styles.headerInfo}>
              <div className={styles.botAvatarWrapper}>
                <div className={styles.botAvatar}>
                  <Sparkles size={14} />
                </div>
                <span className={styles.activeIndicator} />
              </div>
              <div>
                <h4 className={styles.headerTitle}>UniERP AI Copilot</h4>
                <span className={styles.headerSubtitle}>Active Assistant</span>
              </div>
            </div>
            <button
              onClick={() => setChatOpen(false)}
              className={styles.closeBtn}
              aria-label="Close chat"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages Area */}
          <div className={styles.messagesArea}>
            {chatMessages.map((msg, idx) => {
              const isAi = msg.sender === 'ai';
              const bubbleWrapperClass = `${styles.messageBubbleWrapper} ${isAi ? styles.bubbleAi : styles.bubbleUser}`;
              
              const bubbleTextThemeClass = isAi 
                ? (theme === 'light' ? styles.bubbleTextAiLight : styles.bubbleTextAiDark)
                : '';

              const bubbleClass = `${styles.messageBubble} ${
                isAi ? `${styles.bubbleTextAi} ${bubbleTextThemeClass}` : styles.bubbleTextUser
              }`;

              return (
                <div key={idx} className={bubbleWrapperClass}>
                  <div className={bubbleClass}>
                    {msg.text}
                  </div>
                  <span className={styles.messageTime}>
                    {msg.time}
                  </span>
                </div>
              );
            })}

            {chatTyping && (
              <div className={typingIndicatorClass}>
                <span className={styles.typingDot} />
                <span className={styles.typingDot} />
                <span className={styles.typingDot} />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Box Form */}
          <form onSubmit={handleChatSubmit} className={chatInputFormClass}>
            <input
              type="text"
              placeholder="Ask UniERP AI..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className={chatInputClass}
            />
            <button
              type="submit"
              className={styles.sendBtn}
              style={{ opacity: chatInput.trim() ? 1 : 0.6 }}
              disabled={!chatInput.trim()}
              aria-label="Send message"
            >
              <Send size={12} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
