'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { BLOCK_REGISTRY } from '@/components/builder/blocks/registry';

function CanvasContent() {
  const searchParams = useSearchParams();
  const pageId = searchParams.get('pageId');
  
  const [sections, setSections] = useState<any[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [themeTokens, setThemeTokens] = useState<any>(null);

  useEffect(() => {
    // Tell the parent we're ready
    window.parent.postMessage({ type: 'CANVAS_READY' }, '*');

    const handleMessage = (e: MessageEvent) => {
      // In a real app we might want to check e.origin here
      const { type, payload } = e.data;
      if (type === 'SYNC_SECTIONS') {
        setSections(payload);
      } else if (type === 'SELECT_SECTION') {
        setSelectedSectionId(payload);
      } else if (type === 'SYNC_THEME') {
        setThemeTokens(payload);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Apply theme tokens to document root
  useEffect(() => {
    if (themeTokens && themeTokens.colors) {
      const root = document.documentElement;
      Object.entries(themeTokens.colors).forEach(([key, value]) => {
        root.style.setProperty(`--color-${key}`, value as string);
      });
      if (themeTokens.fonts) {
        root.style.setProperty(`--font-heading`, themeTokens.fonts.heading);
        root.style.setProperty(`--font-body`, themeTokens.fonts.body);
      }
    }
  }, [themeTokens]);

  const handleSectionClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedSectionId(id);
    // Notify parent
    window.parent.postMessage({ type: 'SECTION_SELECTED', payload: id }, '*');
  };

  const handleCanvasClick = () => {
    setSelectedSectionId(null);
    window.parent.postMessage({ type: 'SECTION_SELECTED', payload: null }, '*');
  };

  return (
    <div 
      className="builder-canvas" 
      onClick={handleCanvasClick}
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-background, #ffffff)',
        color: 'var(--color-text, #111111)',
        fontFamily: 'var(--font-body, sans-serif)',
      }}
    >
      {sections.length === 0 ? (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
          <h1>Drop blocks here to build your page</h1>
        </div>
      ) : (
        sections.map((section) => {
          const BlockComponent = (BLOCK_REGISTRY[section.type] || BLOCK_REGISTRY['text'])!;
          const isSelected = selectedSectionId === section.id;
          
          return (
            <div
              key={section.id}
              onClick={(e) => handleSectionClick(section.id, e)}
              style={{
                position: 'relative',
                outline: isSelected ? '2px solid var(--color-primary, #3B82F6)' : '2px solid transparent',
                outlineOffset: '-2px',
                transition: 'outline 0.2s',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.outline = '2px dashed rgba(59, 130, 246, 0.5)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.outline = '2px solid transparent';
                }
              }}
            >
              {isSelected && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  background: 'var(--color-primary, #3B82F6)',
                  color: 'white',
                  padding: '4px 8px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  zIndex: 10,
                  borderBottomLeftRadius: '4px'
                }}>
                  {section.label || section.type}
                </div>
              )}
              
              {/* Render the actual block with its content payload */}
              <div style={{ pointerEvents: 'none' /* Disable inner interactions while in builder mode */ }}>
                <BlockComponent {...(section.content || {})} />
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

export default function BuilderCanvasPage() {
  return (
    <Suspense fallback={<div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading canvas...</div>}>
      <CanvasContent />
    </Suspense>
  );
}
