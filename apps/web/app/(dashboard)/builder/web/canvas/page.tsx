'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { HeroBlock, TrustBarBlock, FeaturesGridBlock, SocialProofBlock, HowItWorksBlock, PricingBlock, FaqBlock } from '@unerp/ui';

// Map section types to our Shared UI Blocks
const BLOCK_REGISTRY: Record<string, React.FC<any>> = {
  hero: HeroBlock,
  trust: TrustBarBlock,
  features: FeaturesGridBlock,
  social: SocialProofBlock,
  steps: HowItWorksBlock,
  pricing: PricingBlock,
  faq: FaqBlock,
  // Fallbacks for the older simple types if any
  text: (props: any) => <div style={{ padding: '80px 20px', textAlign: 'center' }}><h2>{props.title || 'Text Block'}</h2><p>{props.content || 'Content goes here'}</p></div>,
  image: (props: any) => <div style={{ padding: '40px 20px', textAlign: 'center' }}><div style={{ width: '100%', height: 300, backgroundColor: '#eee', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Image Gallery Placeholder</div></div>,
  cta: (props: any) => <div style={{ padding: '60px 20px', textAlign: 'center', backgroundColor: 'var(--color-primary, #333)', color: 'white' }}><h2>{props.title || 'Call to action'}</h2><button className="frappe-btn">{props.buttonText || 'Click here'}</button></div>,
  testimonials: SocialProofBlock, // Map older type to SocialProof
};

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
