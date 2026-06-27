import React from 'react';
import { PublicPageRenderer } from '@/components/builder/PublicPageRenderer';
import { prisma } from '@unerp/database';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function PublicSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  // Exclude core routes from being intercepted as dynamic slugs if necessary, 
  // though Next.js routing naturally gives precedence to explicit directories like (auth) and (dashboard)
  
  const systemTenant = await prisma.tenant.findUnique({ where: { slug: 'system' } });
  if (!systemTenant) return notFound();

  const page = await prisma.webPage.findFirst({
    where: { tenantId: systemTenant.id, slug }
  });

  if (!page || page.status !== 'PUBLISHED') {
    return notFound();
  }

  const settings = await prisma.webSettings.findFirst({
    where: { tenantId: systemTenant.id }
  });

  if (settings && settings.activeTemplateId) {
    const tmpl = await prisma.webTemplate.findUnique({ where: { id: settings.activeTemplateId } });
    if (tmpl && tmpl.designTokens && (!settings.themeTokens || Object.keys(settings.themeTokens).length === 0)) {
      settings.themeTokens = typeof tmpl.designTokens === 'string' ? JSON.parse(tmpl.designTokens) : tmpl.designTokens;
    }
  }

  return <PublicPageRenderer page={page} settings={settings} />;
}
