import { PrismaClient } from '@prisma/client';

const TEMPLATES = [
  {
    name: 'Lumina',
    description: 'Dark navy + electric blue + white. Glassmorphism cards, gradient hero, floating nav. Best for: Dev tools, B2B SaaS, AI products.',
    thumbnail: '/templates/lumina.png',
    designTokens: {
      colors: {
        primary: '#0F172A',
        accent: '#3B82F6',
        background: '#020617',
        text: '#F8FAFC',
        surface: 'rgba(255, 255, 255, 0.05)',
      },
      fonts: {
        heading: 'Inter, sans-serif',
        body: 'Inter, sans-serif',
        code: 'JetBrains Mono, monospace',
      },
      radii: { card: '16px', button: '8px' },
      shadows: { card: '0 4px 30px rgba(0, 0, 0, 0.1)' },
    }
  },
  {
    name: 'Bloom',
    description: 'Sage green + warm ivory + terracotta accent. Organic shapes, soft drop shadows, nature photography. Best for: Spas, yoga studios, nutrition coaches.',
    thumbnail: '/templates/bloom.png',
    designTokens: {
      colors: {
        primary: '#8A9A86',
        accent: '#E2725B',
        background: '#FDFBF7',
        text: '#2C3528',
        surface: '#FFFFFF',
      },
      fonts: {
        heading: 'Playfair Display, serif',
        body: 'DM Sans, sans-serif',
      },
      radii: { card: '24px', button: '30px' },
      shadows: { card: '0 10px 40px rgba(138, 154, 134, 0.1)' },
    }
  },
  {
    name: 'Forge',
    description: 'Charcoal + safety orange + steel gray. Grid-heavy, bold typography, full-bleed images. Best for: Construction, engineering, logistics.',
    thumbnail: '/templates/forge.png',
    designTokens: {
      colors: {
        primary: '#333333',
        accent: '#FF6B00',
        background: '#FFFFFF',
        text: '#1A1A1A',
        surface: '#F5F5F5',
      },
      fonts: {
        heading: 'Barlow Condensed, sans-serif',
        body: 'Roboto, sans-serif',
      },
      radii: { card: '0px', button: '0px' },
      shadows: { card: 'none' },
    }
  },
  {
    name: 'Velvet',
    description: 'Black + champagne gold + off-white. Full-screen imagery, minimal UI chrome, editorial layout. Best for: Boutique hotels, fashion brands, high-end retail.',
    thumbnail: '/templates/velvet.png',
    designTokens: {
      colors: {
        primary: '#000000',
        accent: '#D4AF37',
        background: '#FAF9F6',
        text: '#111111',
        surface: '#FFFFFF',
      },
      fonts: {
        heading: 'Cormorant Garamond, serif',
        body: 'Montserrat, sans-serif',
      },
      radii: { card: '0px', button: '0px' },
      shadows: { card: '0 4px 20px rgba(0,0,0,0.05)' },
    }
  },
  {
    name: 'Pulse',
    description: 'Clean white + trust blue + soft green. Airy layout, rounded cards, accessibility-first (WCAG AA). Best for: Clinics, telemedicine, health apps.',
    thumbnail: '/templates/pulse.png',
    designTokens: {
      colors: {
        primary: '#ffffff',
        accent: '#2563EB',
        background: '#F8FAFC',
        text: '#1E293B',
        surface: '#FFFFFF',
      },
      fonts: {
        heading: 'Source Serif Pro, serif',
        body: 'Nunito, sans-serif',
      },
      radii: { card: '12px', button: '6px' },
      shadows: { card: '0 2px 10px rgba(0,0,0,0.05)' },
    }
  },
  {
    name: 'Spark',
    description: 'Bright yellow + deep purple + white. Playful geometry, progress bars, course card grid. Best for: Online courses, tutoring, EdTech.',
    thumbnail: '/templates/spark.png',
    designTokens: {
      colors: {
        primary: '#6D28D9',
        accent: '#FBBF24',
        background: '#FFFFFF',
        text: '#334155',
        surface: '#F1F5F9',
      },
      fonts: {
        heading: 'Nunito, sans-serif',
        body: 'Merriweather, serif',
      },
      radii: { card: '16px', button: '100px' },
      shadows: { card: '0 8px 30px rgba(109, 40, 217, 0.15)' },
    }
  },
  {
    name: 'Atlas',
    description: 'Sky blue + warm sand + coral. Full-bleed destination photos, parallax scroll, map integrations. Best for: Travel agencies, tour operators, experience marketplaces.',
    thumbnail: '/templates/atlas.png',
    designTokens: {
      colors: {
        primary: '#0EA5E9',
        accent: '#FF7F50',
        background: '#FDFBF7', // Warm sand
        text: '#0F172A',
        surface: '#FFFFFF',
      },
      fonts: {
        heading: 'Raleway, sans-serif',
        body: 'Lora, serif',
      },
      radii: { card: '8px', button: '4px' },
      shadows: { card: '0 4px 15px rgba(0,0,0,0.1)' },
    }
  },
  {
    name: 'Stack',
    description: 'Pure black + neon green + white. Terminal aesthetic, brutalist grid, animated text. Best for: Dev portfolios, creative agencies, design studios.',
    thumbnail: '/templates/stack.png',
    designTokens: {
      colors: {
        primary: '#000000',
        accent: '#39FF14', // Neon Green
        background: '#111111',
        text: '#FFFFFF',
        surface: '#222222',
      },
      fonts: {
        heading: 'Outfit, sans-serif',
        body: 'Fira Code, monospace',
      },
      radii: { card: '0px', button: '0px' },
      shadows: { card: 'none' },
    }
  },
  {
    name: 'Crest',
    description: 'Deep navy + gold + warm white. Conservative grid, serif authority, trust signals front-loaded. Best for: Law firms, accounting, financial advisory.',
    thumbnail: '/templates/crest.png',
    designTokens: {
      colors: {
        primary: '#0B2545',
        accent: '#D4AF37',
        background: '#FDFCFB',
        text: '#333333',
        surface: '#FFFFFF',
      },
      fonts: {
        heading: 'Playfair Display, serif',
        body: 'Mulish, sans-serif',
      },
      radii: { card: '4px', button: '2px' },
      shadows: { card: '0 2px 10px rgba(0,0,0,0.08)' },
    }
  },
  {
    name: 'Market',
    description: 'White + vibrant coral + near-black. Product-first grid, sticky cart, promotional ribbons. Best for: DTC brands, Shopify-style stores, marketplaces.',
    thumbnail: '/templates/market.png',
    designTokens: {
      colors: {
        primary: '#FFFFFF',
        accent: '#FF6B6B',
        background: '#F9FAFB',
        text: '#111827',
        surface: '#FFFFFF',
      },
      fonts: {
        heading: 'Poppins, sans-serif',
        body: 'Open Sans, sans-serif',
      },
      radii: { card: '12px', button: '6px' },
      shadows: { card: '0 4px 12px rgba(0,0,0,0.05)' },
    }
  },
  {
    name: 'Root',
    description: 'Forest green + warm amber + cream. Story-driven layout, donor CTAs, impact counters. Best for: NGOs, charities, community organizations.',
    thumbnail: '/templates/root.png',
    designTokens: {
      colors: {
        primary: '#2D5A27',
        accent: '#FFB347',
        background: '#FFFDD0',
        text: '#2C3E50',
        surface: '#FFFFFF',
      },
      fonts: {
        heading: 'Zilla Slab, serif',
        body: 'Source Sans Pro, sans-serif',
      },
      radii: { card: '16px', button: '8px' },
      shadows: { card: '0 8px 24px rgba(45, 90, 39, 0.1)' },
    }
  },
  {
    name: 'Nova',
    description: 'Deep space black + electric violet + cyan glow. Particle backgrounds, animated gradients, bold data displays. Best for: AI startups, research labs, deeptech companies.',
    thumbnail: '/templates/nova.png',
    designTokens: {
      colors: {
        primary: '#0B0B1A',
        accent: '#8A2BE2', // Electric Violet
        background: '#05050A',
        text: '#E2E8F0',
        surface: 'rgba(138, 43, 226, 0.1)',
      },
      fonts: {
        heading: 'Space Grotesk, sans-serif',
        body: 'IBM Plex Mono, monospace',
      },
      radii: { card: '20px', button: '10px' },
      shadows: { card: '0 0 20px rgba(0, 255, 255, 0.2)' }, // Cyan glow
    }
  }
];

export async function seedWebTemplates(prisma: PrismaClient, tenantId: string) {
  for (const template of TEMPLATES) {
    await prisma.webTemplate.create({
      data: {
        tenantId,
        name: template.name,
        description: template.description,
        thumbnail: template.thumbnail,
        designTokens: JSON.stringify(template.designTokens),
        status: 'ACTIVE',
        author: 'System',
      }
    });
  }
  console.log('seeded 12 predefined Web Templates.');
}
