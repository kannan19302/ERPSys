import React from 'react';
import { prisma } from '@unerp/database';
import { notFound } from 'next/navigation';
import { PublicPageRenderer } from '@/components/builder/PublicPageRenderer';
import { SiteChatWidget } from '@/components/site/SiteChatWidget';

export const dynamic = 'force-dynamic';

/**
 * Resolves the active site + published page for a custom domain. Returns null
 * for anything that should 404, including an unreachable/unconfigured
 * database — a site that can't be looked up is indistinguishable from one
 * that doesn't exist, and must never surface as a 500.
 */
async function loadSitePage(cleanHost: string, reqPath: string) {
  try {
    const domain = await prisma.webDomain.findUnique({ where: { host: cleanHost }, include: { site: true } });
    const site = domain?.site;
    if (!site || site.status !== 'ACTIVE') return null;

    const page = await prisma.webSitePage.findFirst({
      where: { siteId: site.id, path: reqPath, status: 'PUBLISHED' },
    });
    if (!page) return null;

    const chatbot = await prisma.webChatbot.findFirst({ where: { siteId: site.id, enabled: true } });
    return { site, page, chatbot };
  } catch (err) {
    console.error('[public-site] lookup failed, serving 404 for', cleanHost, reqPath, err);
    return null;
  }
}

/**
 * Renders a published tenant website, resolved by its custom domain. The web
 * middleware rewrites any non-app host into /_sites/<host>/<path>, so a site
 * is served from "/" with nested paths intact.
 */
export default async function SitePage({ params }: { params: Promise<{ host: string; path?: string[] }> }) {
  const { host, path } = await params;
  const cleanHost = (decodeURIComponent(host).split(':')[0] || host).toLowerCase();
  const reqPath = '/' + (path?.join('/') || '');

  // Asset-like paths (favicon.ico, robots.txt, source maps…) can never be CMS
  // page paths — reject them before spending database queries on them.
  if (/\.[a-z0-9]+$/i.test(reqPath)) return notFound();

  const data = await loadSitePage(cleanHost, reqPath);
  if (!data) return notFound();
  const { site, page, chatbot } = data;

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
