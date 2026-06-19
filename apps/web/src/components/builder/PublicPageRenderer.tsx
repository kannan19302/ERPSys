import React from 'react';
import { HeroBlock, TrustBarBlock, FeaturesGridBlock, SocialProofBlock, HowItWorksBlock, PricingBlock, FaqBlock } from '@unerp/ui';

const BLOCK_REGISTRY: Record<string, React.FC<any>> = {
  hero: HeroBlock,
  trust: TrustBarBlock,
  features: FeaturesGridBlock,
  social: SocialProofBlock,
  steps: HowItWorksBlock,
  pricing: PricingBlock,
  faq: FaqBlock,
  text: (props: any) => <div style={{ padding: '80px 20px', textAlign: 'center' }}><h2>{props.title || 'Text Block'}</h2><p>{props.content || 'Content goes here'}</p></div>,
  image: (props: any) => <div style={{ padding: '40px 20px', textAlign: 'center' }}><div style={{ width: '100%', height: 300, backgroundColor: '#eee', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Image Gallery Placeholder</div></div>,
  cta: (props: any) => <div style={{ padding: '60px 20px', textAlign: 'center', backgroundColor: 'var(--color-primary, #333)', color: 'white' }}><h2>{props.title || 'Call to action'}</h2><button className="frappe-btn">{props.buttonText || 'Click here'}</button></div>,
  testimonials: SocialProofBlock,
};

export function PublicPageRenderer({ page, settings }: { page: any; settings: any }) {
  if (!page) {
    return <div style={{ textAlign: 'center', padding: '100px' }}><h1>Page not found</h1></div>;
  }

  let sections: any[] = [];
  try {
    if (typeof page.sections === 'string') {
      sections = JSON.parse(page.sections);
    } else if (Array.isArray(page.sections)) {
      sections = page.sections;
    } else if (page.sections?.items) {
      sections = page.sections.items;
    }
  } catch (e) {
    sections = [];
  }

  const themeTokens = settings?.themeTokens ? (typeof settings.themeTokens === 'string' ? JSON.parse(settings.themeTokens) : settings.themeTokens) : null;
  
  // Convert tokens to CSS custom properties string
  let cssVars = '';
  if (themeTokens?.colors) {
    Object.entries(themeTokens.colors).forEach(([key, value]) => {
      cssVars += `--color-${key}: ${value};\n`;
    });
  }
  if (themeTokens?.fonts) {
    cssVars += `--font-heading: ${themeTokens.fonts.heading};\n`;
    cssVars += `--font-body: ${themeTokens.fonts.body};\n`;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-background, #ffffff)', color: 'var(--color-text, #111111)', fontFamily: 'var(--font-body, sans-serif)' }}>
      <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `:root { ${cssVars} } \n ${settings?.globalCss || ''}` }} />
      {sections.map(section => {
        const BlockComponent = BLOCK_REGISTRY[section.type] || BLOCK_REGISTRY['text'];
        return (
          <div key={section.id}>
            <BlockComponent {...(section.content || {})} />
          </div>
        );
      })}
    </div>
  );
}
