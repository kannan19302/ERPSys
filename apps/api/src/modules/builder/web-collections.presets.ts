// Ready-made CMS collection presets so Web Studio is usable out-of-the-box for
// e-commerce, portfolios, company sites and blogs.

export interface PresetField {
  name: string;
  label: string;
  type: string;
  required?: boolean;
  options?: string;
  referenceCollection?: string;
  helpText?: string;
}

export interface CollectionPreset {
  name: string;
  slug: string;
  singular: string;
  description: string;
  icon: string;
  color: string;
  kind: string;
  fields: PresetField[];
  settings: { titleField: string; slugField?: string; imageField?: string };
  sampleItems: Array<{ slug: string; status: string; featured?: boolean; data: Record<string, unknown> }>;
}

export const COLLECTION_PRESETS: Record<string, CollectionPreset> = {
  products: {
    name: 'Products',
    slug: 'products',
    singular: 'Product',
    description: 'E-commerce product catalog with pricing, images and inventory.',
    icon: '🛍️',
    color: '#10b981',
    kind: 'PRODUCT',
    settings: { titleField: 'name', slugField: 'name', imageField: 'images' },
    fields: [
      { name: 'name', label: 'Product Name', type: 'Text', required: true },
      { name: 'price', label: 'Price', type: 'Price', required: true },
      { name: 'compareAtPrice', label: 'Compare-at Price', type: 'Price' },
      { name: 'sku', label: 'SKU', type: 'Text' },
      { name: 'category', label: 'Category', type: 'Select', options: 'Apparel\nAccessories\nHome\nElectronics\nOther' },
      { name: 'shortDescription', label: 'Short Description', type: 'Textarea' },
      { name: 'description', label: 'Description', type: 'RichText' },
      { name: 'images', label: 'Images', type: 'Gallery' },
      { name: 'inStock', label: 'In Stock', type: 'Boolean' },
      { name: 'tags', label: 'Tags', type: 'Tags' },
    ],
    sampleItems: [
      { slug: 'aurora-wireless-headphones', status: 'PUBLISHED', featured: true, data: { name: 'Aurora Wireless Headphones', price: 199, compareAtPrice: 249, sku: 'AUR-001', category: 'Electronics', shortDescription: 'Studio-grade sound, 40h battery.', inStock: true, tags: ['audio', 'wireless'] } },
      { slug: 'linen-weekend-shirt', status: 'PUBLISHED', data: { name: 'Linen Weekend Shirt', price: 79, sku: 'LWS-220', category: 'Apparel', shortDescription: 'Breathable 100% linen.', inStock: true } },
      { slug: 'ceramic-pour-over', status: 'PUBLISHED', data: { name: 'Ceramic Pour-Over Set', price: 48, sku: 'CPO-330', category: 'Home', shortDescription: 'Hand-glazed, single-origin ready.', inStock: false } },
    ],
  },
  projects: {
    name: 'Projects',
    slug: 'projects',
    singular: 'Project',
    description: 'Portfolio case studies with cover image, gallery and client info.',
    icon: '🎨',
    color: '#8b5cf6',
    kind: 'PORTFOLIO',
    settings: { titleField: 'title', slugField: 'title', imageField: 'coverImage' },
    fields: [
      { name: 'title', label: 'Title', type: 'Text', required: true },
      { name: 'client', label: 'Client', type: 'Text' },
      { name: 'category', label: 'Category', type: 'Select', options: 'Branding\nWeb Design\nMobile\nIllustration\nPhotography' },
      { name: 'coverImage', label: 'Cover Image', type: 'Image' },
      { name: 'gallery', label: 'Gallery', type: 'Gallery' },
      { name: 'summary', label: 'Summary', type: 'Textarea' },
      { name: 'description', label: 'Case Study', type: 'RichText' },
      { name: 'projectUrl', label: 'Live URL', type: 'URL' },
      { name: 'date', label: 'Completed', type: 'Date' },
    ],
    sampleItems: [
      { slug: 'nebula-rebrand', status: 'PUBLISHED', featured: true, data: { title: 'Nebula Rebrand', client: 'Nebula Inc.', category: 'Branding', summary: 'A bold identity refresh for a fintech leader.' } },
      { slug: 'orbit-mobile-app', status: 'PUBLISHED', data: { title: 'Orbit Mobile App', client: 'Orbit', category: 'Mobile', summary: 'End-to-end product design for a travel app.' } },
    ],
  },
  team: {
    name: 'Team',
    slug: 'team',
    singular: 'Team Member',
    description: 'Company team directory with photos, roles and bios.',
    icon: '👥',
    color: '#3b82f6',
    kind: 'TEAM',
    settings: { titleField: 'name', slugField: 'name', imageField: 'photo' },
    fields: [
      { name: 'name', label: 'Name', type: 'Text', required: true },
      { name: 'role', label: 'Role', type: 'Text' },
      { name: 'photo', label: 'Photo', type: 'Image' },
      { name: 'bio', label: 'Bio', type: 'Textarea' },
      { name: 'email', label: 'Email', type: 'Email' },
      { name: 'linkedin', label: 'LinkedIn', type: 'URL' },
    ],
    sampleItems: [
      { slug: 'jane-cooper', status: 'PUBLISHED', data: { name: 'Jane Cooper', role: 'Chief Executive Officer', email: 'jane@example.com' } },
      { slug: 'marcus-lee', status: 'PUBLISHED', data: { name: 'Marcus Lee', role: 'Head of Design' } },
    ],
  },
  testimonials: {
    name: 'Testimonials',
    slug: 'testimonials',
    singular: 'Testimonial',
    description: 'Customer quotes and reviews for social proof sections.',
    icon: '⭐',
    color: '#f59e0b',
    kind: 'TESTIMONIAL',
    settings: { titleField: 'author', imageField: 'avatar' },
    fields: [
      { name: 'author', label: 'Author', type: 'Text', required: true },
      { name: 'company', label: 'Company / Role', type: 'Text' },
      { name: 'quote', label: 'Quote', type: 'Textarea', required: true },
      { name: 'avatar', label: 'Avatar', type: 'Image' },
      { name: 'rating', label: 'Rating (1-5)', type: 'Number' },
    ],
    sampleItems: [
      { slug: 'sofia-rivera', status: 'PUBLISHED', featured: true, data: { author: 'Sofia Rivera', company: 'CTO, Vertex', quote: 'This platform transformed how we ship websites. Effortless and powerful.', rating: 5 } },
      { slug: 'david-kim', status: 'PUBLISHED', data: { author: 'David Kim', company: 'Founder, Loop', quote: 'The best CMS experience we have used — period.', rating: 5 } },
    ],
  },
  blog: {
    name: 'Blog',
    slug: 'blog',
    singular: 'Post',
    description: 'Articles and news with rich text, cover image and tags.',
    icon: '📝',
    color: '#ec4899',
    kind: 'POST',
    settings: { titleField: 'title', slugField: 'title', imageField: 'coverImage' },
    fields: [
      { name: 'title', label: 'Title', type: 'Text', required: true },
      { name: 'excerpt', label: 'Excerpt', type: 'Textarea' },
      { name: 'coverImage', label: 'Cover Image', type: 'Image' },
      { name: 'body', label: 'Body', type: 'RichText' },
      { name: 'author', label: 'Author', type: 'Text' },
      { name: 'category', label: 'Category', type: 'Select', options: 'News\nGuide\nProduct\nInsights' },
      { name: 'tags', label: 'Tags', type: 'Tags' },
    ],
    sampleItems: [
      { slug: 'welcome-to-our-blog', status: 'PUBLISHED', data: { title: 'Welcome to our blog', excerpt: 'The first post on our brand-new site.', author: 'Editorial', category: 'News' } },
    ],
  },
  services: {
    name: 'Services',
    slug: 'services',
    singular: 'Service',
    description: 'Service offerings with descriptions and pricing.',
    icon: '🧩',
    color: '#06b6d4',
    kind: 'GENERIC',
    settings: { titleField: 'title', slugField: 'title' },
    fields: [
      { name: 'title', label: 'Title', type: 'Text', required: true },
      { name: 'icon', label: 'Icon', type: 'Text' },
      { name: 'summary', label: 'Summary', type: 'Textarea' },
      { name: 'description', label: 'Description', type: 'RichText' },
      { name: 'startingPrice', label: 'Starting Price', type: 'Price' },
    ],
    sampleItems: [
      { slug: 'brand-strategy', status: 'PUBLISHED', data: { title: 'Brand Strategy', summary: 'Positioning, messaging and identity systems.', startingPrice: 5000 } },
      { slug: 'web-development', status: 'PUBLISHED', data: { title: 'Web Development', summary: 'High-performance sites and web apps.', startingPrice: 8000 } },
    ],
  },
  events: {
    name: 'Events',
    slug: 'events',
    singular: 'Event',
    description: 'Upcoming events with date, location and details.',
    icon: '📅',
    color: '#ef4444',
    kind: 'GENERIC',
    settings: { titleField: 'title', slugField: 'title', imageField: 'image' },
    fields: [
      { name: 'title', label: 'Title', type: 'Text', required: true },
      { name: 'date', label: 'Date', type: 'Date' },
      { name: 'location', label: 'Location', type: 'Text' },
      { name: 'image', label: 'Image', type: 'Image' },
      { name: 'description', label: 'Description', type: 'RichText' },
      { name: 'registerUrl', label: 'Register URL', type: 'URL' },
    ],
    sampleItems: [
      { slug: 'launch-meetup', status: 'PUBLISHED', data: { title: 'Product Launch Meetup', location: 'San Francisco, CA' } },
    ],
  },
};
