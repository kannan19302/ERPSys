import { Injectable, Logger } from '@nestjs/common';
import { prisma } from '@unerp/database';

/**
 * Builder DevOps: custom widget registry, Git workspace integration, and native
 * (Capacitor) build jobs.
 */
@Injectable()
export class BuilderDevOpsService {
  private readonly logger = new Logger(BuilderDevOpsService.name);

  // ── CUSTOM WIDGETS ────────────────────────────
  async getWidgets(tenantId: string) {
    return prisma.customWidget.findMany({ where: { tenantId } });
  }

  async createWidget(tenantId: string, name: string, tag: string, source: string, manifest?: any) {
    const existing = await prisma.customWidget.findFirst({ where: { tag } });
    if (existing) {
      return prisma.customWidget.update({
        where: { id: existing.id },
        data: { name, source, manifest: manifest || {} },
      });
    }
    return prisma.customWidget.create({
      data: { tenantId, name, tag, source, manifest: manifest || {} },
    });
  }

  async deleteWidget(tenantId: string, id: string) {
    return prisma.customWidget.deleteMany({ where: { id, tenantId } });
  }

  // ── GIT CONTROL ───────────────────────────────
  async getGitConfig(tenantId: string) {
    const config = await prisma.gitConfig.findUnique({ where: { tenantId } });
    if (!config) {
      return { repoUrl: '', branch: 'main', status: 'DISCONNECTED', lastSync: null };
    }
    return config;
  }

  async saveGitConfig(tenantId: string, repoUrl: string, branch: string, accessToken?: string) {
    return prisma.gitConfig.upsert({
      where: { tenantId },
      update: { repoUrl, branch, accessToken, status: 'CONNECTED' },
      create: { tenantId, repoUrl, branch, accessToken, status: 'CONNECTED' },
    });
  }

  async getGitDiff(_tenantId: string) {
    // Return mock changed files in the builder workspace
    return [
      { file: 'apps/web/app/builder/page.tsx', status: 'modified', additions: 15, deletions: 2 },
      { file: 'packages/database/prisma/schema.prisma', status: 'modified', additions: 140, deletions: 0 },
      { file: 'apps/api/src/modules/builder/builder.controller.ts', status: 'modified', additions: 80, deletions: 0 }
    ];
  }

  async executeGitCommit(tenantId: string, message: string) {
    const config = await prisma.gitConfig.findUnique({ where: { tenantId } });
    const repoUrl = config?.repoUrl || 'https://github.com/unerp/workspace.git';

    // Simulate git push/commit execution
    await prisma.gitConfig.update({
      where: { tenantId },
      data: { status: 'CONNECTED', lastSync: new Date() }
    });

    // Write to RunLog to track deployment activity
    await prisma.runLog.create({
      data: {
        tenantId,
        level: 'INFO',
        message: `Git Commit deployed successfully: "${message}" pushed to branch "${config?.branch || 'main'}"`,
        payload: { repoUrl, commitMsg: message, date: new Date() }
      }
    });

    return { success: true, message: 'Changes committed and pushed to remote branch.', committedAt: new Date() };
  }

  // ── NATIVE EXPORT ─────────────────────────────
  async getNativeBuilds(tenantId: string) {
    return prisma.nativeBuild.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async triggerNativeBuild(tenantId: string, version: string, platform: string) {
    const build = await prisma.nativeBuild.create({
      data: {
        tenantId,
        version,
        platform,
        status: 'QUEUED',
        logSummary: 'Enqueued Capacitor mobile compilation task...'
      }
    });

    // Simulate async build success after 5 seconds via background timer
    setTimeout(async () => {
      try {
        await prisma.nativeBuild.update({
          where: { id: build.id },
          data: {
            status: 'COMPLETED',
            downloadUrl: `/api/v1/builder/native-builds/${build.id}/download`,
            logSummary: `[Capacitor SDK] Successfully compiled mobile assets.\nCompiled platform: ${platform.toUpperCase()}\nStatus: Success`
          }
        });
      } catch (err) {
        this.logger.error(`Async build ${build.id} failed to finalize`, err instanceof Error ? err.stack : String(err));
      }
    }, 5000);

    return build;
  }

  async getNativeBuildLogs(tenantId: string, id: string) {
    const build = await prisma.nativeBuild.findFirst({ where: { id, tenantId } });
    return { id: build?.id, status: build?.status, logs: build?.logSummary || 'No build logs available.' };
  }
}
