import { Injectable } from '@nestjs/common';
import { prisma, runWithTenantSession } from '@unerp/database';
import { ErrorReportInput } from './error-reports.schemas';

@Injectable()
export class ErrorReportsService {
  async createReport(dto: ErrorReportInput) {
    let tenantId = dto.tenantId || null;

    // 1. Resolve tenantId if it's missing
    if (!tenantId) {
      const systemTenant = await prisma.tenant.findFirst({
        where: { slug: 'system' },
      });
      if (systemTenant) {
        tenantId = systemTenant.id;
      }
    }

    const executeInsertions = async () => {
      // Create the ErrorLog record
      const errorLog = await prisma.errorLog.create({
        data: {
          tenantId,
          source: 'FRONTEND',
          level: 'ERROR',
          message: dto.message,
          stack: dto.stack || null,
          requestId: dto.requestId || null,
          metadata: {
            url: dto.url,
            userAgent: dto.userAgent || null,
            description: dto.description || null,
            userEmail: dto.userEmail || null,
            userName: dto.userName || null,
          },
        },
      });

      // If the user provided a description, create an AdminAlert to notify administrators
      if (dto.description && tenantId) {
        await prisma.adminAlert.create({
          data: {
            tenantId,
            type: 'USER_ERROR_REPORT',
            severity: 'ERROR',
            title: `User Error Report: ${dto.message.slice(0, 50)}`,
            message: `A user has reported an error on ${dto.url}.\n\nUser Description: ${dto.description}\n\nEmail: ${dto.userEmail || 'Anonymous'}\nRequest ID: ${dto.requestId || 'N/A'}`,
            metadata: {
              errorLogId: errorLog.id,
              url: dto.url,
              requestId: dto.requestId || null,
              userEmail: dto.userEmail || null,
            },
          },
        });
      }

      return {
        success: true,
        logId: errorLog.id,
      };
    };

    // 2. Wrap in tenant session if tenantId is available, otherwise run unscoped
    if (tenantId) {
      return runWithTenantSession(
        {
          tenantId,
          userId: 'system-error-reporter',
        },
        executeInsertions,
      );
    } else {
      return executeInsertions();
    }
  }
}
