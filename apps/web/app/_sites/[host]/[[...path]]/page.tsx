import React from 'react';
import { prisma } from '@unerp/database';
import { notFound } from 'next/navigation';
import { PublicPageRenderer } from '@/components/builder/PublicPageRenderer';
import { SiteChatWidget } from '@/components/site/SiteChatWidget';

export const dynamic = 'force-dynamic';

/**
 * Renders a published tenant website, resolved by its custom domain. The web
 * middleware rewrites any non-app host into /_sites/<host>/<path>, so a site
 * is served from "/" with nested paths intact.
 */
export default async function SitePage({ params }: { params: Promise<{ host: string; path?: string[] }> }) {
  const { host, path } = await params;
  const cleanHost = (decodeURIComponent(host).split(':')[0] || host).toLowerCase();
  const reqPath = '/' + (path?.join('/') || '');

  const domain = await prisma.webDomain.findUnique({ where: { host: cleanHost }, include: { site: true } });
  const site = domain?.site;
  if (!site || site.status !== 'ACTIVE') return notFound();

  const page = await prisma.webSitePage.findFirst({
    where: { siteId: site.id, path: reqPath, status: 'PUBLISHED' },
  });
  if (!page) return notFound();

  const chatbot = await prisma.webChatbot.findFirst({ where: { siteId: site.id, enabled: true } });

  // PublicPageRenderer expects `page.sections`; site pages store `blocks`.
  const renderPage = { ...page, sections: page.blocks };
  const settings = { themeTokens: (site.theme as any) || {}, ...((site.settings as any) || {}) };

  return (
    <>
      <PublicPageRenderer page={renderPage} settings={settings} />
      {chatbot && (
        <SiteChatWidget name={chatbot.name} host={cleanHost} config={(chatbot.config as any) || {}} />
      )}
    </>
  );
}
