// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
} from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { StorageAdvancedService } from "./storage-advanced.service";
import {
  encryptFileSchema,
  decryptFileSchema,
  createReplicationSchema,
  createBackupSchema,
  restoreBackupSchema,
  createAlertSchema,
  updateAlertSchema,
  createMigrationSchema,
  compressFileSchema,
  decompressFileSchema,
  analyzeDeduplicationSchema,
  createSnapshotSchema,
  restoreSnapshotSchema,
  createRetentionPolicySchema,
  updateRetentionPolicySchema,
  createSyncSchema,
  updateSyncSchema,
  clearCacheSchema,
} from "./storage-advanced.dtos";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string; orgId?: string };
}

@ApiTags("storage-advanced")
@ApiBearerAuth()
@Controller("storage")
@UseGuards(JwtAuthGuard, RbacGuard)
export class StorageAdvancedController {
  constructor(private readonly svc: StorageAdvancedService) {}

  // ── Encryption ──
  @Get("encryption/:fileId")
  @Permissions("storage.encryption.read")
  @ApiOperation({ summary: "Get file encryption status" })
  async getEncryption(@Req() req: AuthReq, @Param("fileId") fileId: string) {
    return this.svc.getEncryption(req.user.tenantId, fileId);
  }

  @Post("encryption")
  @Permissions("storage.encryption.create")
  @ApiOperation({ summary: "Encrypt file" })
  async encryptFile(
    @Req() req: AuthReq,
    @ZodBody(encryptFileSchema) body: any,
  ) {
    return this.svc.encryptFile(
      req.user.tenantId,
      body.fileId,
      body.algorithm,
      req.user.userId,
    );
  }

  @Post("decryption/:fileId")
  @Permissions("storage.encryption.create")
  @ApiOperation({ summary: "Decrypt file" })
  async decryptFile(@Req() req: AuthReq, @Param("fileId") fileId: string) {
    return this.svc.decryptFile(req.user.tenantId, fileId);
  }

  @Delete("encryption/:fileId")
  @Permissions("storage.encryption.delete")
  @ApiOperation({ summary: "Delete encryption" })
  async deleteEncryption(@Req() req: AuthReq, @Param("fileId") fileId: string) {
    return this.svc.deleteEncryption(req.user.tenantId, fileId);
  }

  // ── Replication ──
  @Get("replications")
  @Permissions("storage.replication.read")
  @ApiOperation({ summary: "List replications" })
  async getReplications(@Req() req: AuthReq, @Query("fileId") fileId?: string) {
    return this.svc.getReplications(req.user.tenantId, fileId);
  }

  @Post("replications")
  @Permissions("storage.replication.manage")
  @ApiOperation({ summary: "Create replication" })
  async createReplication(
    @Req() req: AuthReq,
    @ZodBody(createReplicationSchema) body: any,
  ) {
    return this.svc.createReplication(req.user.tenantId, body, req.user.userId);
  }

  @Delete("replications/:id")
  @Permissions("storage.replication.manage")
  @ApiOperation({ summary: "Delete replication" })
  async deleteReplication(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.deleteReplication(req.user.tenantId, id);
  }

  // ── Backup ──
  @Get("backups")
  @Permissions("storage.backup.read")
  @ApiOperation({ summary: "List backups" })
  async getBackups(@Req() req: AuthReq) {
    return this.svc.getBackups(req.user.tenantId);
  }

  @Post("backups")
  @Permissions("storage.backup.create")
  @ApiOperation({ summary: "Create backup" })
  async createBackup(
    @Req() req: AuthReq,
    @ZodBody(createBackupSchema) body: any,
  ) {
    return this.svc.createBackup(req.user.tenantId, body, req.user.userId);
  }

  @Post("backups/:id/restore")
  @Permissions("storage.backup.restore")
  @ApiOperation({ summary: "Restore backup" })
  async restoreBackup(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.restoreBackup(req.user.tenantId, id);
  }

  @Delete("backups/:id")
  @Permissions("storage.backup.delete")
  @ApiOperation({ summary: "Delete backup" })
  async deleteBackup(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.deleteBackup(req.user.tenantId, id);
  }

  // ── Analytics ──
  @Get("analytics")
  @Permissions("storage.analytic.read")
  @ApiOperation({ summary: "Get storage analytics" })
  async getAnalytics(
    @Req() req: AuthReq,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    return this.svc.getAnalytics(req.user.tenantId, startDate, endDate);
  }

  // ── Alerts ──
  @Get("alerts")
  @Permissions("storage.alert.read")
  @ApiOperation({ summary: "List alerts" })
  async getAlerts(@Req() req: AuthReq) {
    return this.svc.getAlerts(req.user.tenantId);
  }

  @Post("alerts")
  @Permissions("storage.alert.create")
  @ApiOperation({ summary: "Create alert" })
  async createAlert(
    @Req() req: AuthReq,
    @ZodBody(createAlertSchema) body: any,
  ) {
    return this.svc.createAlert(req.user.tenantId, body, req.user.userId);
  }

  @Patch("alerts/:id")
  @Permissions("storage.alert.update")
  @ApiOperation({ summary: "Update alert" })
  async updateAlert(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @ZodBody(updateAlertSchema) body: any,
  ) {
    return this.svc.updateAlert(req.user.tenantId, id, body);
  }

  @Delete("alerts/:id")
  @Permissions("storage.alert.delete")
  @ApiOperation({ summary: "Delete alert" })
  async deleteAlert(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.deleteAlert(req.user.tenantId, id);
  }

  // ── Migrations ──
  @Get("migrations")
  @Permissions("storage.migration.read")
  @ApiOperation({ summary: "List migrations" })
  async getMigrations(@Req() req: AuthReq) {
    return this.svc.getMigrations(req.user.tenantId);
  }

  @Post("migrations")
  @Permissions("storage.migration.create")
  @ApiOperation({ summary: "Create migration" })
  async createMigration(
    @Req() req: AuthReq,
    @ZodBody(createMigrationSchema) body: any,
  ) {
    return this.svc.createMigration(req.user.tenantId, body, req.user.userId);
  }

  @Post("migrations/:id/start")
  @Permissions("storage.migration.manage")
  @ApiOperation({ summary: "Start migration" })
  async startMigration(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.startMigration(req.user.tenantId, id);
  }

  @Post("migrations/:id/rollback")
  @Permissions("storage.migration.manage")
  @ApiOperation({ summary: "Rollback migration" })
  async rollbackMigration(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.rollbackMigration(req.user.tenantId, id);
  }

  // ── Compression ──
  @Get("compressions")
  @Permissions("storage.compression.read")
  @ApiOperation({ summary: "List compressions" })
  async getCompressions(@Req() req: AuthReq, @Query("fileId") fileId?: string) {
    return this.svc.getCompressions(req.user.tenantId, fileId);
  }

  @Post("compress")
  @Permissions("storage.compression.manage")
  @ApiOperation({ summary: "Compress file" })
  async compressFile(
    @Req() req: AuthReq,
    @ZodBody(compressFileSchema) body: any,
  ) {
    return this.svc.compressFile(
      req.user.tenantId,
      body.fileId,
      body.algorithm,
      req.user.userId,
    );
  }

  @Post("decompress/:fileId")
  @Permissions("storage.compression.manage")
  @ApiOperation({ summary: "Decompress file" })
  async decompressFile(@Req() req: AuthReq, @Param("fileId") fileId: string) {
    return this.svc.decompressFile(req.user.tenantId, fileId);
  }

  // ── Deduplication ──
  @Get("deduplications")
  @Permissions("storage.deduplication.read")
  @ApiOperation({ summary: "List deduplications" })
  async getDeduplications(@Req() req: AuthReq) {
    return this.svc.getDeduplications(req.user.tenantId);
  }

  @Post("deduplications/analyze")
  @Permissions("storage.deduplication.manage")
  @ApiOperation({ summary: "Analyze deduplication" })
  async analyzeDeduplication(@Req() req: AuthReq) {
    return this.svc.analyzeDeduplication(req.user.tenantId, req.user.userId);
  }

  // ── Snapshots ──
  @Get("snapshots")
  @Permissions("storage.snapshot.read")
  @ApiOperation({ summary: "List snapshots" })
  async getSnapshots(@Req() req: AuthReq) {
    return this.svc.getSnapshots(req.user.tenantId);
  }

  @Post("snapshots")
  @Permissions("storage.snapshot.create")
  @ApiOperation({ summary: "Create snapshot" })
  async createSnapshot(
    @Req() req: AuthReq,
    @ZodBody(createSnapshotSchema) body: any,
  ) {
    return this.svc.createSnapshot(req.user.tenantId, body, req.user.userId);
  }

  @Post("snapshots/:id/restore")
  @Permissions("storage.snapshot.restore")
  @ApiOperation({ summary: "Restore snapshot" })
  async restoreSnapshot(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.restoreSnapshot(req.user.tenantId, id);
  }

  @Delete("snapshots/:id")
  @Permissions("storage.snapshot.delete")
  @ApiOperation({ summary: "Delete snapshot" })
  async deleteSnapshot(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.deleteSnapshot(req.user.tenantId, id);
  }

  // ── Retention Policies ──
  @Get("retention-policies")
  @Permissions("storage.retention.read")
  @ApiOperation({ summary: "List retention policies" })
  async getRetentionPolicies(@Req() req: AuthReq) {
    return this.svc.getRetentionPolicies(req.user.tenantId);
  }

  @Post("retention-policies")
  @Permissions("storage.retention.create")
  @ApiOperation({ summary: "Create retention policy" })
  async createRetentionPolicy(
    @Req() req: AuthReq,
    @ZodBody(createRetentionPolicySchema) body: any,
  ) {
    return this.svc.createRetentionPolicy(
      req.user.tenantId,
      body,
      req.user.userId,
    );
  }

  @Patch("retention-policies/:id")
  @Permissions("storage.retention.update")
  @ApiOperation({ summary: "Update retention policy" })
  async updateRetentionPolicy(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @ZodBody(updateRetentionPolicySchema) body: any,
  ) {
    return this.svc.updateRetentionPolicy(req.user.tenantId, id, body);
  }

  @Delete("retention-policies/:id")
  @Permissions("storage.retention.delete")
  @ApiOperation({ summary: "Delete retention policy" })
  async deleteRetentionPolicy(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.deleteRetentionPolicy(req.user.tenantId, id);
  }

  // ── Compliance ──
  @Get("compliance-logs")
  @Permissions("storage.compliance.read")
  @ApiOperation({ summary: "List compliance logs" })
  async getComplianceLogs(
    @Req() req: AuthReq,
    @Query("fileId") fileId?: string,
  ) {
    return this.svc.getComplianceLogs(req.user.tenantId, fileId);
  }

  @Post("compliance/check/:fileId")
  @Permissions("storage.compliance.read")
  @ApiOperation({ summary: "Check file compliance" })
  async checkCompliance(@Req() req: AuthReq, @Param("fileId") fileId: string) {
    return this.svc.checkCompliance(req.user.tenantId, fileId);
  }

  // ── Cache ──
  @Delete("cache")
  @Permissions("storage.cache.manage")
  @ApiOperation({ summary: "Clear cache" })
  async clearCache(
    @Req() req: AuthReq,
    @Query("fileId") fileId?: string,
    @Query("cacheType") cacheType?: string,
  ) {
    return this.svc.clearCache(req.user.tenantId, fileId, cacheType);
  }

  // ── Sync ──
  @Get("syncs")
  @Permissions("storage.sync.read")
  @ApiOperation({ summary: "List syncs" })
  async getSyncs(@Req() req: AuthReq) {
    return this.svc.getSyncs(req.user.tenantId);
  }

  @Post("syncs")
  @Permissions("storage.sync.create")
  @ApiOperation({ summary: "Create sync" })
  async createSync(@Req() req: AuthReq, @ZodBody(createSyncSchema) body: any) {
    return this.svc.createSync(req.user.tenantId, body, req.user.userId);
  }

  @Patch("syncs/:id")
  @Permissions("storage.sync.update")
  @ApiOperation({ summary: "Update sync" })
  async updateSync(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @ZodBody(updateSyncSchema) body: any,
  ) {
    return this.svc.updateSync(req.user.tenantId, id, body);
  }

  @Delete("syncs/:id")
  @Permissions("storage.sync.delete")
  @ApiOperation({ summary: "Delete sync" })
  async deleteSync(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.deleteSync(req.user.tenantId, id);
  }
}
