import React from 'react';
import { HeroBlock, TrustBarBlock, FeaturesGridBlock, SocialProofBlock, HowItWorksBlock, PricingBlock, FaqBlock } from '@unerp/ui';
import { CollectionBlock } from './CollectionBlock';
import {
  RichTextBlock, ImageBlock, GalleryBlock, ColumnsBlock, LogoCloudBlock,
  CtaBannerBlock, NavbarBlock, FooterBlock, ContactFormBlock, CartBlock,
} from './RichBlocks';

/** Single source of truth for section type → component, used by the builder
 *  canvas preview and the public page renderer. */
export const BLOCK_REGISTRY: Record<string, React.FC<any>> = {
  // Marketing
  hero: HeroBlock,
  trust: TrustBarBlock,
  features: FeaturesGridBlock,
  social: SocialProofBlock,
  steps: HowItWorksBlock,
  pricing: PricingBlock,
  faq: FaqBlock,
  testimonials: SocialProofBlock,
  cta: CtaBannerBlock,
  logos: LogoCloudBlock,
  // Content
  text: RichTextBlock,
  image: ImageBlock,
  gallery: GalleryBlock,
  columns: ColumnsBlock,
  // CMS + commerce
  collection: CollectionBlock,
  contact: ContactFormBlock,
  cart: CartBlock,
  // Chrome
  navbar: NavbarBlock,
  footer: FooterBlock,
};
