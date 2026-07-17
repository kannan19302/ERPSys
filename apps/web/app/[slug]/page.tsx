import React from 'react';
import { PublicPageRenderer } from '@/components/builder/PublicPageRenderer';
import { prisma } from '@unerp/database';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

/**
 * Loads the published page + theme settings for the system tenant. Returns
 * null for anything that should 404, including an unreachable/unconfigured
 * database — a public page that can't be looked up is indistinguishable from
 * one that doesn't exist, and must never surface as a 500.
 */
async function loadPublicPage(slug: string) {
  try {
    const systemTenant = await prisma.tenant.findUnique({ where: { slug: 'system' } });
    if (!systemTenant) return null;

    const page = await prisma.webPage.findFirst({
      where: { tenantId: systemTenant.id, slug }
    });
    if (!page || page.status !== 'PUBLISHED') return null;

    const settings = await prisma.webSettings.findFirst({
      where: { tenantId: systemTenant.id }
    });

    if (settings && settings.activeTemplateId) {
      const tmpl = await prisma.webTemplate.findUnique({ where: { id: settings.activeTemplateId } });
      if (tmpl && tmpl.designTokens && (!settings.themeTokens || Object.keys(settings.themeTokens).length === 0)) {
        settings.themeTokens = typeof tmpl.designTokens === 'string' ? JSON.parse(tmpl.designTokens) : tmpl.designTokens;
      }
    }

    return { page, settings };
  } catch (err) {
    console.error('[public-page] lookup failed, serving 404 for slug', slug, err);
    return null;
  }
}

export default async function PublicSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Asset-like paths (favicon.ico, robots.txt, source maps…) can never be CMS
  // page slugs — reject them before spending database queries on them.
  if (slug.includes('.')) return notFound();

  const data = await loadPublicPage(slug);
  if (!data) return notFound();

  return <PublicPageRenderer page={data.page} settings={data.settings} />;
}
