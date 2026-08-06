import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { prisma } from "@unerp/database";
import { Prisma } from "@prisma/client";
import {
  SandboxRunner,
  type HostCapabilities,
  type SandboxInstallation,
} from "@unerp/sandbox";
import {
  ExtensionManifestV1Schema,
  effectiveScopes,
  extensionTableName,
  type ExtensionManifestV1,
  type Scope,
} from "@unerp/extension-api";
import { ExtensionSchemaService } from "./extension-schema.service";
import { ExtensionSignatureService } from "./extension-signature.service";

/**
 * Extension registry — PLATFORM_ARCHITECTURE.md § 8.2/8.3, Phase 4 item 3.
 *
 * Installations are persisted per tenant with the scopes that were actually
 * granted, rather than recomputed at call time: if the installing admin later
 * loses a permission, already-installed code must not keep the capability by
 * accident, and must not silently gain one either. Re-granting is an explicit
 * act.
 *
 * Every hook runs through the isolate sandbox. This service never hands
 * extension code a Prisma handle — the host callbacks below close over the
 * tenant from the installation row, so an extension cannot name a tenant, and
 * RLS applies to its reads exactly as it does to first-party ones.
 */
@Injectable()
export class ExtensionRegistryService {
  private readonly logger = new Logger(ExtensionRegistryService.name);
  private readonly sandbox = new SandboxRunner();

  constructor(
    private readonly schemaService: ExtensionSchemaService,
    private readonly signatureService: ExtensionSignatureService,
  ) {}

  /** Models an extension may reach at all, whatever its scopes say. */
  private static readonly EXTENSION_READABLE_MODELS = new Set([
    "Customer",
    "Product",
    "Invoice",
    "SalesOrder",
  ]);

  async listInstalled(tenantId: string) {
    return prisma.tenantExtensionInstallation.findMany({
      where: { tenantId, status: { not: "UNINSTALLED" } },
      orderBy: { installedAt: "desc" },
    });
  }

  /**
   * Install an extension for a tenant.
   *
   * `installerScopes` are the capability scopes the acting admin themselves
   * hold. § 5.2: the effective grant is the intersection — "an extension can
   * never exceed the permissions of the admin who installed it. This is the
   * rule that makes a marketplace safe, and the one most platforms get wrong."
   */
  async installExtension(params: {
    tenantId: string;
    manifest: unknown;
    installerScopes: readonly Scope[];
    installedByUserId?: string;
    approvedHosts?: readonly string[];
    /** Signed bundle + its actual file contents. Required for any non-first-party publisher. */
    bundle?: { signed: unknown; files: ReadonlyMap<string, string | Buffer> };
  }) {
    // Signature FIRST — before scopes are resolved and before any table is
    // provisioned. Verifying afterwards would mean a tampered manifest had
    // already been acted on by the time it was rejected.
    let manifestToUse = params.manifest;
    if (params.bundle) {
      const verified = this.signatureService.verify(
        params.bundle.signed,
        params.bundle.files,
      );
      manifestToUse = verified.manifest;
    }

    const parsed = ExtensionManifestV1Schema.safeParse(manifestToUse);
    if (!parsed.success) {
      throw new BadRequestException(
        `Invalid extension manifest: ${parsed.error.issues
          .map((i) => `${i.path.join(".")} ${i.message}`)
          .join("; ")}`,
      );
    }
    const manifest: ExtensionManifestV1 = parsed.data;

    const granted = effectiveScopes(manifest.scopes, params.installerScopes);
    const refused = manifest.scopes.filter((s) => !granted.includes(s));
    if (refused.length) {
      this.logger.warn(
        `Extension ${manifest.id} requested scopes the installer does not hold, ` +
          `which were NOT granted: ${refused.join(", ")}`,
      );
    }

    // A host may only be approved if the manifest declared it: a manifest
    // cannot approve itself, and an admin cannot approve a host the extension
    // never asked for.
    const declared = new Set(manifest.egress.map((e) => e.host));
    const approvedHosts = (params.approvedHosts ?? []).filter((h) =>
      declared.has(h),
    );

    // § 8.2 — generate the extension's own tables before the installation is
    // recorded, so an installation never exists without the storage it declared.
    const schema = this.schemaService.parse(manifest.schema);
    await this.schemaService.provision(manifest.id, schema);

    const installation = await prisma.tenantExtensionInstallation.upsert({
      where: {
        tenantId_extensionId: {
          tenantId: params.tenantId,
          extensionId: manifest.id,
        },
      },
      create: {
        tenantId: params.tenantId,
        extensionId: manifest.id,
        version: manifest.version,
        publisher: manifest.publisher,
        status: "INSTALLED",
        grantedScopes: granted,
        approvedHosts,
        budget: manifest.budget as unknown as object,
        installedByUserId: params.installedByUserId,
      },
      update: {
        version: manifest.version,
        publisher: manifest.publisher,
        grantedScopes: granted,
        approvedHosts,
        budget: manifest.budget as unknown as object,
        status: "INSTALLED",
      },
    });

    return { installation, refusedScopes: refused };
  }

  async setStatus(
    tenantId: string,
    extensionId: string,
    status: "ENABLED" | "DISABLED",
  ) {
    const found = await this.require(tenantId, extensionId);
    if (found.killed && status === "ENABLED") {
      throw new ForbiddenException(
        `Extension ${extensionId} was stopped by the platform and cannot be re-enabled by the tenant.`,
      );
    }
    return prisma.tenantExtensionInstallation.update({
      where: { id: found.id },
      data: { status },
    });
  }

  async uninstall(tenantId: string, extensionId: string) {
    const found = await this.require(tenantId, extensionId);
    return prisma.tenantExtensionInstallation.update({
      where: { id: found.id },
      data: { status: "UNINSTALLED", grantedScopes: [], approvedHosts: [] },
    });
  }

  /**
   * Platform kill switch (§ 8.3) — reachable from the Platform Admin Console.
   * Distinct from DISABLED, which is the tenant's own choice: a killed
   * extension cannot be re-enabled by the tenant.
   */
  async kill(tenantId: string, extensionId: string, reason: string) {
    const found = await this.require(tenantId, extensionId);
    this.sandbox.disable(extensionId);
    return prisma.tenantExtensionInstallation.update({
      where: { id: found.id },
      data: { killed: true, killedReason: reason, status: "DISABLED" },
    });
  }

  /** Run one hook of an installed extension inside the capability sandbox. */
  async invoke(params: {
    tenantId: string;
    extensionId: string;
    code: string;
    hook: string;
    args?: unknown[];
  }) {
    const found = await this.require(params.tenantId, params.extensionId);

    if (found.killed) {
      throw new ForbiddenException(
        `Extension ${params.extensionId} is stopped by the platform: ${found.killedReason ?? "no reason recorded"}`,
      );
    }
    if (found.status !== "ENABLED") {
      throw new ForbiddenException(
        `Extension ${params.extensionId} is ${found.status.toLowerCase()}, not enabled.`,
      );
    }

    const installation: SandboxInstallation = {
      extensionId: found.extensionId,
      tenantId: found.tenantId,
      scopes: found.grantedScopes as Scope[],
      approvedHosts: found.approvedHosts,
      budget: (found.budget as Record<string, number> | null) ?? undefined,
    };

    const host = this.hostFor(found.extensionId, found.tenantId);

    try {
      const { result, usage } = await this.sandbox.run(
        params.code,
        installation,
        host,
        { hook: params.hook, args: params.args },
      );
      await this.recordUsage(
        found.tenantId,
        found.extensionId,
        params.hook,
        usage,
        null,
      );
      return result;
    } catch (error) {
      const kind = error instanceof Error ? error.name : "UnknownError";
      await this.recordUsage(
        found.tenantId,
        found.extensionId,
        params.hook,
        { cpuMs: 0, queries: 0, httpCalls: 0 },
        kind,
      );
      throw error;
    }
  }

  /**
   * The host side of the capability bridge. Note what is NOT a parameter: the
   * tenant. Extension code passes a model and a query and never a tenant, so
   * there is no argument through which it could reach another one — the scope
   * comes from the session the surrounding request established.
   */
  private hostFor(extensionId: string, tenantId: string): HostCapabilities {
    return {
      log: (level, meta, args) => {
        const line =
          `[extension:${meta.extensionId}][tenant:${meta.tenantId}] ` +
          args
            .map((a) => (typeof a === "string" ? a : JSON.stringify(a)))
            .join(" ");
        if (level === "error") this.logger.error(line);
        else this.logger.log(line);
      },
      dataRead: async (model, query) => {
        if (!ExtensionRegistryService.EXTENSION_READABLE_MODELS.has(model)) {
          throw new ForbiddenException(
            `Extension ${extensionId} may not read model "${model}".`,
          );
        }
        const delegates = prisma as unknown as Record<
          string,
          { findMany: (a: unknown) => Promise<unknown> } | undefined
        >;
        const delegate =
          delegates[model.charAt(0).toLowerCase() + model.slice(1)];
        if (!delegate)
          throw new ForbiddenException(`Unknown model "${model}".`);
        // The tenant-scope extension injects tenantId from the session; the take
        // cap stops an extension pulling a whole table into its isolate.
        const args = (query ?? {}) as Record<string, unknown>;
        return delegate.findMany({
          ...args,
          take: Math.min(Number(args.take ?? 100), 100),
        });
      },
      dataWrite: async (entity, operation, payload) => {
        // § 8.2: an extension writes to ITS OWN generated tables, never a core
        // one. The table name is derived from the extension id plus the entity,
        // so there is no argument through which core data could be named.
        const table = extensionTableName(extensionId, entity);
        const known = await this.schemaService.listTables(extensionId);
        if (!known.includes(table)) {
          throw new ForbiddenException(
            `Extension ${extensionId} has no entity "${entity}" in its declared schema.`,
          );
        }
        return this.writeExtensionRow(table, tenantId, operation, payload);
      },
    };
  }

  /**
   * Insert or update a row in an extension-owned table.
   *
   * Column names are checked against the table's real columns before they can
   * reach SQL, and every value is a bound parameter — the extension supplies
   * data, never structure. The tenant comes from the installation, so an
   * extension cannot write across tenants even if it tries to set tenant_id;
   * RLS `WITH CHECK` would reject it at the database anyway.
   */
  private async writeExtensionRow(
    table: string,
    tenantId: string,
    operation: string,
    payload: unknown,
  ): Promise<unknown> {
    if (operation !== "create") {
      throw new BadRequestException(
        `Extension write operation "${operation}" is not supported yet; only "create" is.`,
      );
    }
    const data = (payload ?? {}) as Record<string, unknown>;

    const columns = await prisma.$queryRaw<Array<{ column_name: string }>>(
      Prisma.sql`SELECT column_name FROM information_schema.columns
                 WHERE table_schema = 'public' AND table_name = ${table}`,
    );
    const allowed = new Set(
      columns
        .map((c) => c.column_name)
        .filter(
          (c) => !["id", "tenant_id", "created_at", "updated_at"].includes(c),
        ),
    );

    const keys = Object.keys(data).filter((k) => allowed.has(k));
    const unknownKeys = Object.keys(data).filter((k) => !allowed.has(k));
    if (unknownKeys.length) {
      throw new BadRequestException(
        `Extension wrote undeclared field(s): ${unknownKeys.join(", ")}`,
      );
    }

    const id = randomUUID();
    const cols = ["id", "tenant_id", ...keys].map((k) => `"${k}"`).join(", ");
    const values = [id, tenantId, ...keys.map((k) => data[k])];

    // Identifiers via Prisma.raw (already validated against the table's real
    // columns above); every VALUE is a bound parameter through Prisma.join, so
    // extension-supplied data can never become SQL. Deliberately not
    // $executeRawUnsafe — that call takes an entire statement as a string,
    // which is exactly what the raw-SQL policy ratchet exists to count.
    await prisma.$executeRaw(
      Prisma.sql`INSERT INTO ${Prisma.raw(`"${table}"`)} (${Prisma.raw(cols)}) VALUES (${Prisma.join(
        values.map((v) => Prisma.sql`${v}`),
      )})`,
    );
    return { id };
  }

  private async recordUsage(
    tenantId: string,
    extensionId: string,
    hook: string,
    usage: { cpuMs: number; queries: number; httpCalls: number },
    errorKind: string | null,
  ) {
    await prisma.extensionInvocationUsage.create({
      data: {
        tenantId,
        extensionId,
        hook,
        cpuMs: usage.cpuMs.toFixed(3),
        queries: usage.queries,
        httpCalls: usage.httpCalls,
        failed: errorKind !== null,
        errorKind,
      },
    });
  }

  private async require(tenantId: string, extensionId: string) {
    const found = await prisma.tenantExtensionInstallation.findUnique({
      where: { tenantId_extensionId: { tenantId, extensionId } },
    });
    if (!found || found.status === "UNINSTALLED") {
      throw new NotFoundException(
        `Extension ${extensionId} is not installed for this tenant.`,
      );
    }
    return found;
  }
}
