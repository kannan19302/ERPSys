import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { AiService } from '../ai/ai.service';

/**
 * Web Studio multi-site engine. Owns sites, custom domains, site pages,
 * and the per-site AI chatbot. A tenant can run several sites, each served
 * at its own domain(s) from "/" via the web app's host-aware middleware.
 */
@Injectable()
export class WebStudioService {
  constructor(private readonly ai: AiService) {}

  private slugify(s: string): string {
    return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  // ── Sites ──
  async listSites(tenantId: string) {
    return prisma.webSite.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
      include: { domains: true, _count: { select: { pages: true } } },
    });
  }

  async getSite(tenantId: string, id: string) {
    const site = await prisma.webSite.findFirst({ where: { id, tenantId }, include: { domains: true, chatbots: true } });
    if (!site) throw new NotFoundException('Site not found');
    return site;
  }

  async createSite(tenantId: string, data: { name: string; slug?: string; theme?: any; settings?: any }, userId?: string) {
    const slug = this.slugify(data.slug || data.name) || 'site';
    return prisma.webSite.create({
      data: { tenantId, name: data.name, slug, theme: data.theme ?? {}, settings: data.settings ?? {}, createdBy: userId },
    });
  }

  async updateSite(tenantId: string, id: string, data: { name?: string; status?: string; theme?: any; settings?: any }) {
    await this.getSite(tenantId, id);
    return prisma.webSite.update({
      where: { id },
      data: {
        name: data.name ?? undefined,
        status: data.status ?? undefined,
        theme: data.theme ?? undefined,
        settings: data.settings ?? undefined,
      },
    });
  }

  async deleteSite(tenantId: string, id: string) {
    await this.getSite(tenantId, id);
    await prisma.webSite.delete({ where: { id } });
    return { ok: true };
  }

  // ── Domains ──
  async addDomain(tenantId: string, siteId: string, host: string, isPrimary = false) {
    await this.getSite(tenantId, siteId);
    const normalized = host.toLowerCase().trim();
    if (isPrimary) await prisma.webDomain.updateMany({ where: { siteId }, data: { isPrimary: false } });
    return prisma.webDomain.create({ data: { siteId, host: normalized, isPrimary, verified: true } });
  }

  async removeDomain(tenantId: string, siteId: string, domainId: string) {
    await this.getSite(tenantId, siteId);
    await prisma.webDomain.deleteMany({ where: { id: domainId, siteId } });
    return { ok: true };
  }

  // ── Site pages ──
  async listPages(tenantId: string, siteId: string) {
    await this.getSite(tenantId, siteId);
    return prisma.webSitePage.findMany({ where: { siteId, tenantId }, orderBy: [{ type: 'asc' }, { sortOrder: 'asc' }] });
  }

  async upsertPage(
    tenantId: string,
    siteId: string,
    data: { id?: string; path: string; title: string; type?: string; blocks?: any; seo?: any; status?: string },
  ) {
    await this.getSite(tenantId, siteId);
    const path = data.path.startsWith('/') ? data.path : `/${data.path}`;
    if (data.id) {
      return prisma.webSitePage.update({
        where: { id: data.id },
        data: {
          path,
          title: data.title,
          type: (data.type || 'PAGE').toUpperCase(),
          blocks: data.blocks ?? undefined,
          seo: data.seo ?? undefined,
          status: data.status ?? undefined,
        },
      });
    }
    return prisma.webSitePage.upsert({
      where: { siteId_path: { siteId, path } },
      update: { title: data.title, type: (data.type || 'PAGE').toUpperCase(), blocks: data.blocks ?? undefined, seo: data.seo ?? undefined, status: data.status ?? undefined },
      create: { siteId, tenantId, path, title: data.title, type: (data.type || 'PAGE').toUpperCase(), blocks: data.blocks ?? [], seo: data.seo ?? {}, status: data.status || 'DRAFT' },
    });
  }

  async deletePage(tenantId: string, siteId: string, pageId: string) {
    await this.getSite(tenantId, siteId);
    await prisma.webSitePage.deleteMany({ where: { id: pageId, siteId, tenantId } });
    return { ok: true };
  }

  // ── Chatbot config ──
  async getChatbot(tenantId: string, siteId: string) {
    await this.getSite(tenantId, siteId);
    const existing = await prisma.webChatbot.findFirst({ where: { siteId, tenantId } });
    return existing || prisma.webChatbot.create({ data: { siteId, tenantId } });
  }

  async updateChatbot(tenantId: string, siteId: string, data: { name?: string; enabled?: boolean; config?: any; knowledge?: any }) {
    const bot = await this.getChatbot(tenantId, siteId);
    return prisma.webChatbot.update({
      where: { id: bot.id },
      data: { name: data.name ?? undefined, enabled: data.enabled ?? undefined, config: data.config ?? undefined, knowledge: data.knowledge ?? undefined },
    });
  }

  // ── Public host resolution + serving ──
  /** Resolve a request Host header to its site (custom domain → default site). */
  async resolveSiteByHost(host?: string) {
    if (host) {
      const cleanHost = (host.split(':')[0] || host).toLowerCase();
      const domain = await prisma.webDomain.findUnique({ where: { host: cleanHost }, include: { site: true } });
      if (domain?.site && domain.site.status === 'ACTIVE') return domain.site;
    }
    return null;
  }

  async getPublicPage(siteId: string, path: string) {
    const normalized = path && path !== '' ? (path.startsWith('/') ? path : `/${path}`) : '/';
    const page = await prisma.webSitePage.findFirst({ where: { siteId, path: normalized, status: 'PUBLISHED' } });
    if (!page) throw new NotFoundException('Page not found');
    return page;
  }

  async getPublicSiteByHost(host?: string) {
    const site = await this.resolveSiteByHost(host);
    if (!site) throw new NotFoundException('Site not found for host');
    const pages = await prisma.webSitePage.findMany({
      where: { siteId: site.id, status: 'PUBLISHED' },
      select: { path: true, title: true, type: true },
      orderBy: { sortOrder: 'asc' },
    });
    const chatbot = await prisma.webChatbot.findFirst({ where: { siteId: site.id, enabled: true } });
    return { site: { id: site.id, name: site.name, theme: site.theme, settings: site.settings }, pages, chatbot: chatbot ? { name: chatbot.name, config: chatbot.config } : null };
  }

  // ── AI chatbot answer (grounded in the site's content) ──
  async answerChat(host: string | undefined, message: string, history: { role: 'user' | 'assistant'; content: string }[] = []) {
    const site = await this.resolveSiteByHost(host);
    if (!site) throw new NotFoundException('Site not found for host');

    const bot = await prisma.webChatbot.findFirst({ where: { siteId: site.id, enabled: true } });
    if (!bot) return { reply: "Sorry, the assistant isn't available on this site." };

    const knowledge = (bot.knowledge as any) || {};
    const contextParts: string[] = [];

    // Pull published page titles + any text blocks for grounding.
    if (knowledge.usePages !== false) {
      const pages = await prisma.webSitePage.findMany({ where: { siteId: site.id, status: 'PUBLISHED' }, select: { title: true, blocks: true } });
      for (const p of pages.slice(0, 25)) {
        const text = JSON.stringify(p.blocks).replace(/<[^>]+>/g, ' ').slice(0, 600);
        contextParts.push(`PAGE "${p.title}": ${text}`);
      }
    }

    // Pull selected collections' published items.
    const collectionSlugs: string[] = Array.isArray(knowledge.collections) ? knowledge.collections : [];
    if (collectionSlugs.length) {
      const collections = await prisma.webCollection.findMany({ where: { tenantId: site.tenantId, siteId: site.id, slug: { in: collectionSlugs } }, include: { items: { where: { status: 'PUBLISHED' }, take: 30 } } });
      for (const c of collections) {
        for (const item of c.items) contextParts.push(`${c.singular || c.name}: ${JSON.stringify(item.data).slice(0, 400)}`);
      }
    }

    if (typeof knowledge.custom === 'string' && knowledge.custom.trim()) contextParts.push(`NOTES: ${knowledge.custom}`);

    const persona = (bot.config as any)?.persona || `You are ${bot.name}, a friendly assistant for the website "${site.name}".`;
    const context = contextParts.join('\n').slice(0, 12000);

    if (!this.ai.isConfigured()) {
      return { reply: 'The AI assistant is not configured yet.', degraded: true };
    }

    const result = await this.ai.chat(
      [
        {
          role: 'system',
          content: `${persona}\nAnswer using ONLY the website context below. If the answer isn't there, say you don't have that information and offer to connect them with the team. Be concise.\n\n=== WEBSITE CONTEXT ===\n${context}`,
        },
        ...history.slice(-6).map((h) => ({ role: h.role, content: h.content })),
        { role: 'user' as const, content: message },
      ],
      { maxTokens: 500, temperature: 0.4, model: (bot.config as any)?.model, tenantId: site.tenantId },
    );

    return { reply: result.content };
  }
}
