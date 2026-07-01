import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';

/**
 * Web Studio content: pages, blog posts, assets, templates, menus, SEO configs,
 * and global web settings. Straightforward per-tenant CRUD with no cross-domain
 * dependencies.
 */
@Injectable()
export class BuilderWebContentService {
  // ── WEB PAGES ─────────────────────────────────
  async getWebPages(tenantId: string) {
    return prisma.webPage.findMany({
      where: { tenantId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getWebPageById(tenantId: string, id: string) {
    const page = await prisma.webPage.findFirst({ where: { id, tenantId } });
    if (!page) throw new NotFoundException('Web page not found');
    return page;
  }

  async createWebPage(
    tenantId: string,
    dto: { name: string; slug: string; sections?: any; metaTitle?: string; metaDesc?: string; ogImage?: string; visibility?: string }
  ) {
    const existing = await prisma.webPage.findFirst({
      where: { tenantId, slug: dto.slug },
    });
    if (existing) throw new BadRequestException('A page with this slug already exists');

    return prisma.webPage.create({
      data: {
        tenantId,
        name: dto.name,
        slug: dto.slug,
        sections: dto.sections || [],
        metaTitle: dto.metaTitle || null,
        metaDesc: dto.metaDesc || null,
        ogImage: dto.ogImage || null,
        visibility: dto.visibility || 'PUBLIC',
      },
    });
  }

  async updateWebPage(tenantId: string, id: string, dto: Partial<{ name: string; slug: string; status: string; sections: any; metaTitle: string; metaDesc: string; ogImage: string; visibility: string; sortOrder: number }>) {
    const page = await prisma.webPage.findFirst({ where: { id, tenantId } });
    if (!page) throw new NotFoundException('Web page not found');

    return prisma.webPage.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.sections !== undefined && { sections: dto.sections }),
        ...(dto.metaTitle !== undefined && { metaTitle: dto.metaTitle }),
        ...(dto.metaDesc !== undefined && { metaDesc: dto.metaDesc }),
        ...(dto.ogImage !== undefined && { ogImage: dto.ogImage }),
        ...(dto.visibility !== undefined && { visibility: dto.visibility }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      },
    });
  }

  async deleteWebPage(tenantId: string, id: string) {
    const page = await prisma.webPage.findFirst({ where: { id, tenantId } });
    if (!page) throw new NotFoundException('Web page not found');
    return prisma.webPage.delete({ where: { id } });
  }

  // ── BLOG POSTS ────────────────────────────────
  async getBlogPosts(tenantId: string) {
    return prisma.blogPost.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBlogPostById(tenantId: string, id: string) {
    const post = await prisma.blogPost.findFirst({ where: { id, tenantId } });
    if (!post) throw new NotFoundException('Blog post not found');
    return post;
  }

  async createBlogPost(
    tenantId: string,
    dto: { title: string; slug: string; content?: string; excerpt?: string; category?: string; tags?: any; author?: string; featuredImage?: string; metaTitle?: string; metaDesc?: string; readTime?: string }
  ) {
    const existing = await prisma.blogPost.findFirst({
      where: { tenantId, slug: dto.slug },
    });
    if (existing) throw new BadRequestException('A blog post with this slug already exists');

    return prisma.blogPost.create({
      data: {
        tenantId,
        title: dto.title,
        slug: dto.slug,
        content: dto.content || null,
        excerpt: dto.excerpt || null,
        category: dto.category || 'General',
        tags: dto.tags || [],
        author: dto.author || null,
        featuredImage: dto.featuredImage || null,
        metaTitle: dto.metaTitle || null,
        metaDesc: dto.metaDesc || null,
        readTime: dto.readTime || null,
      },
    });
  }

  async updateBlogPost(tenantId: string, id: string, dto: Partial<{ title: string; content: string; excerpt: string; category: string; tags: any; author: string; status: string; featuredImage: string; metaTitle: string; metaDesc: string; readTime: string }>) {
    const post = await prisma.blogPost.findFirst({ where: { id, tenantId } });
    if (!post) throw new NotFoundException('Blog post not found');

    return prisma.blogPost.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.content !== undefined && { content: dto.content }),
        ...(dto.excerpt !== undefined && { excerpt: dto.excerpt }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.tags !== undefined && { tags: dto.tags }),
        ...(dto.author !== undefined && { author: dto.author }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.featuredImage !== undefined && { featuredImage: dto.featuredImage }),
        ...(dto.metaTitle !== undefined && { metaTitle: dto.metaTitle }),
        ...(dto.metaDesc !== undefined && { metaDesc: dto.metaDesc }),
        ...(dto.readTime !== undefined && { readTime: dto.readTime }),
        ...(dto.status === 'PUBLISHED' && !post.publishedAt && { publishedAt: new Date() }),
      },
    });
  }

  async deleteBlogPost(tenantId: string, id: string) {
    const post = await prisma.blogPost.findFirst({ where: { id, tenantId } });
    if (!post) throw new NotFoundException('Blog post not found');
    return prisma.blogPost.delete({ where: { id } });
  }

  // ── WEB ASSETS ────────────────────────────────
  async getWebAssets(tenantId: string) {
    return prisma.webAsset.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
  }

  async createWebAsset(tenantId: string, dto: { name: string; url: string; type?: string; sizeBytes?: number }) {
    return prisma.webAsset.create({
      data: {
        tenantId,
        name: dto.name,
        url: dto.url,
        type: dto.type || 'IMAGE',
        sizeBytes: dto.sizeBytes || 0,
      }
    });
  }

  async updateWebAsset(tenantId: string, id: string, dto: Partial<{ name: string; url: string; type: string }>) {
    const asset = await prisma.webAsset.findFirst({ where: { id, tenantId } });
    if (!asset) throw new NotFoundException('Web asset not found');
    return prisma.webAsset.update({
      where: { id },
      data: dto
    });
  }

  async deleteWebAsset(tenantId: string, id: string) {
    const asset = await prisma.webAsset.findFirst({ where: { id, tenantId } });
    if (!asset) throw new NotFoundException('Web asset not found');
    return prisma.webAsset.delete({ where: { id } });
  }

  // ── WEB TEMPLATES ─────────────────────────────
  async getWebTemplates(tenantId: string) {
    return prisma.webTemplate.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
  }

  async createWebTemplate(tenantId: string, dto: { name: string; description?: string; htmlContent?: string; cssContent?: string; status?: string }) {
    return prisma.webTemplate.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description || null,
        htmlContent: dto.htmlContent || null,
        cssContent: dto.cssContent || null,
        status: dto.status || 'DRAFT',
      }
    });
  }

  async updateWebTemplate(tenantId: string, id: string, dto: Partial<{ name: string; description: string; htmlContent: string; cssContent: string; status: string }>) {
    const template = await prisma.webTemplate.findFirst({ where: { id, tenantId } });
    if (!template) throw new NotFoundException('Web template not found');
    return prisma.webTemplate.update({
      where: { id },
      data: dto
    });
  }

  async deleteWebTemplate(tenantId: string, id: string) {
    const template = await prisma.webTemplate.findFirst({ where: { id, tenantId } });
    if (!template) throw new NotFoundException('Web template not found');
    return prisma.webTemplate.delete({ where: { id } });
  }

  // ── WEB MENUS ─────────────────────────────────
  async getWebMenus(tenantId: string) {
    return prisma.webMenu.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
  }

  async createWebMenu(tenantId: string, dto: { name: string; location?: string; items?: any; status?: string }) {
    return prisma.webMenu.create({
      data: {
        tenantId,
        name: dto.name,
        location: dto.location || 'HEADER',
        items: dto.items || [],
        status: dto.status || 'ACTIVE',
      }
    });
  }

  async updateWebMenu(tenantId: string, id: string, dto: Partial<{ name: string; location: string; items: any; status: string }>) {
    const menu = await prisma.webMenu.findFirst({ where: { id, tenantId } });
    if (!menu) throw new NotFoundException('Web menu not found');
    return prisma.webMenu.update({
      where: { id },
      data: dto
    });
  }

  async deleteWebMenu(tenantId: string, id: string) {
    const menu = await prisma.webMenu.findFirst({ where: { id, tenantId } });
    if (!menu) throw new NotFoundException('Web menu not found');
    return prisma.webMenu.delete({ where: { id } });
  }

  // ── WEB SEO ───────────────────────────────────
  async getWebSeo(tenantId: string) {
    return prisma.webSeo.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
  }

  async createWebSeo(tenantId: string, dto: { path: string; title: string; description?: string; keywords?: string; ogImage?: string; status?: string }) {
    const existing = await prisma.webSeo.findFirst({ where: { tenantId, path: dto.path } });
    if (existing) throw new BadRequestException('SEO config for this path already exists');
    return prisma.webSeo.create({
      data: {
        tenantId,
        path: dto.path,
        title: dto.title,
        description: dto.description || null,
        keywords: dto.keywords || null,
        ogImage: dto.ogImage || null,
        status: dto.status || 'ACTIVE',
      }
    });
  }

  async updateWebSeo(tenantId: string, id: string, dto: Partial<{ path: string; title: string; description: string; keywords: string; ogImage: string; status: string }>) {
    const seo = await prisma.webSeo.findFirst({ where: { id, tenantId } });
    if (!seo) throw new NotFoundException('Web SEO not found');
    return prisma.webSeo.update({
      where: { id },
      data: dto
    });
  }

  async deleteWebSeo(tenantId: string, id: string) {
    const seo = await prisma.webSeo.findFirst({ where: { id, tenantId } });
    if (!seo) throw new NotFoundException('Web SEO not found');
    return prisma.webSeo.delete({ where: { id } });
  }

  // ── WEB SETTINGS ──────────────────────────────
  async getWebSettings(tenantId: string) {
    let settings = await prisma.webSettings.findFirst({ where: { tenantId } });
    if (!settings) {
      settings = await prisma.webSettings.create({ data: { tenantId } });
    }
    return settings;
  }

  async updateWebSettings(tenantId: string, data: any) {
    const settings = await this.getWebSettings(tenantId);
    return prisma.webSettings.update({
      where: { id: settings.id },
      data: {
        activeTemplateId: data.activeTemplateId !== undefined ? data.activeTemplateId : undefined,
        globalCss: data.globalCss !== undefined ? data.globalCss : undefined,
        themeTokens: data.themeTokens !== undefined ? data.themeTokens : undefined,
      }
    });
  }
}
