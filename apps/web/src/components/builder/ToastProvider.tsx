/* eslint-disable */
import React, { useState, useCallback, createContext, useContext } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, X, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
  exiting?: boolean;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let toastIdCounter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++toastIdCounter;
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto-dismiss after 3s
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 200);
    }, 3000);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 200);
  }, []);

  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle size={16} style={{ color: 'var(--color-success)', flexShrink: 0 }} />,
    error: <AlertCircle size={16} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />,
    warning: <AlertTriangle size={16} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />,
    info: <Info size={16} style={{ color: '#3b82f6', flexShrink: 0 }} />,
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map(toast => (
            <div
              key={toast.id}
              className={`toast-item toast-${toast.type} ${toast.exiting ? 'toast-exiting' : ''}`}
            >
              {icons[toast.type]}
              <span style={{ flex: 1 }}>{toast.message}</span>
              <button
                onClick={() => dismissToast(toast.id)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--color-text-tertiary)', padding: '2px', flexShrink: 0,
                }}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}
