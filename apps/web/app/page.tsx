import React from 'react';
import { AuthRedirect } from './AuthRedirect';
import { PublicPageRenderer } from '@/components/builder/PublicPageRenderer';
import { prisma } from '@unerp/database';

export default async function HomePage() {
  const systemTenant = await prisma.tenant.findUnique({ where: { slug: 'system' } });
  
  let page = null;
  let settings = null;

  if (systemTenant) {
    page = await prisma.webPage.findFirst({
      where: { tenantId: systemTenant.id, slug: 'home' }
    });
    settings = await prisma.webSettings.findFirst({
      where: { tenantId: systemTenant.id }
    });

    if (settings && settings.activeTemplateId) {
      const tmpl = await prisma.webTemplate.findUnique({ where: { id: settings.activeTemplateId } });
      if (tmpl && tmpl.designTokens && (!settings.themeTokens || Object.keys(settings.themeTokens).length === 0)) {
        settings.themeTokens = typeof tmpl.designTokens === 'string' ? JSON.parse(tmpl.designTokens) : tmpl.designTokens;
      }
    }
  }

  return (
    <>
      <AuthRedirect />
      <PublicPageRenderer page={page} settings={settings} />
    </>
  );
}
