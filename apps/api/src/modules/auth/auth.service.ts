import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import { randomBytes, createHash } from "node:crypto";
import * as webPush from "web-push";
import { prisma, runWithTenantSession } from "@unerp/database";
import { UserRole, Role } from "@prisma/client";
import {
  hashPassword,
  comparePassword,
  signSessionToken,
  signTypedToken,
  verifyTypedToken,
  TOKEN_TYPE,
} from "@unerp/auth";
import {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from "@unerp/shared";
import {
  generateTotpSecret,
  buildTotpEnrollment,
  verifyTotp,
  generateRecoveryCodes,
  matchRecoveryCode,
  createResetToken,
  hashResetToken,
  encryptSecret,
  decryptSecret,
} from "./auth-crypto";

/** Failed logins allowed before the account is temporarily locked. */
const MAX_FAILED_ATTEMPTS = 5;
/** How long an account stays locked after too many failed logins. */
const LOCK_DURATION_MS = 15 * 60 * 1000;
/** How long the between-steps MFA challenge token is valid. */
const MFA_CHALLENGE_TTL = "5m";
/** How long a push-approval request stays pending before the login page falls back to a manual code. */
const MFA_PUSH_TTL_MS = 2 * 60 * 1000;

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@unerp.dev",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
}
/** Push-approval is a no-op (silently skipped, code entry still works) until VAPID keys are configured. */
const PUSH_CONFIGURED = Boolean(
  process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY,
);
/** Ties a stored challenge row to its JWT without persisting the bearer token itself. */
const hashChallengeToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");
/** How long a password-reset token is valid. */
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
/** Session lifetime; matches the JWT's default 1-day expiry. */
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

/** Request-derived context recorded on a session for the "active sessions" UI. */
export interface SessionContext {
  ipAddress?: string | null;
  userAgent?: string | null;
  device?: string | null;
}

/** Reduces a raw User-Agent string to a short "OS • Browser" label for the sessions UI. */
function parseUserAgent(ua?: string | null): {
  device: string | null;
  browser: string | null;
} {
  if (!ua) return { device: null, browser: null };
  const device = /windows/i.test(ua)
    ? "Windows"
    : /mac os/i.test(ua)
      ? "macOS"
      : /android/i.test(ua)
        ? "Android"
        : /iphone|ipad/i.test(ua)
          ? "iOS"
          : /linux/i.test(ua)
            ? "Linux"
            : null;
  const browser = /edg\//i.test(ua)
    ? "Edge"
    : /chrome\//i.test(ua)
      ? "Chrome"
      : /firefox\//i.test(ua)
        ? "Firefox"
        : /safari\//i.test(ua)
          ? "Safari"
          : /curl\//i.test(ua)
            ? "curl"
            : null;
  return { device, browser };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  private get isProduction() {
    return process.env.NODE_ENV === "production";
  }

  /**
   * Registers a new tenant along with its organization, default roles, and super admin user.
   */
  async register(dto: RegisterInput) {
    const slug = dto.organizationName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // Check if slug already exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug },
    });
    if (existingTenant) {
      throw new BadRequestException(
        "An organization with a similar name already exists. Choose a different name.",
      );
    }

    // Hash the administrator's password
    const hashedPassword = await hashPassword(dto.password);

    // Run creation in a transaction
    return prisma.$transaction(async (tx) => {
      // 1. Create Tenant
      const tenant = await tx.tenant.create({
        data: {
          name: dto.organizationName,
          slug,
          plan: "free",
          status: "ACTIVE",
        },
      });

      // 2. Create default roles for the tenant
      const defaultRolesConfig = {
        SUPER_ADMIN: {
          name: "Super Admin",
          description: "Full access to all features",
          permissions: ["*"],
        },
        ADMIN: {
          name: "Admin",
          description: "Administrative access with user management",
          permissions: ["admin.*", "finance.*", "hr.*", "crm.*", "inventory.*"],
        },
        VIEWER: {
          name: "Viewer",
          description: "Read-only access to all modules",
          permissions: [
            "finance.invoice.read",
            "finance.report.read",
            "hr.employee.read",
            "crm.contact.read",
            "inventory.product.read",
          ],
        },
      };

      const rolesMap: Record<string, string> = {};
      for (const [key, role] of Object.entries(defaultRolesConfig)) {
        const dbRole = await tx.role.create({
          data: {
            tenantId: tenant.id,
            name: role.name,
            description: role.description,
            isSystem: true,
            permissions: JSON.stringify(role.permissions),
          },
        });
        rolesMap[key] = dbRole.id;
      }

      // 3. Create User
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: dto.email.toLowerCase(),
          passwordHash: hashedPassword,
          passwordChangedAt: new Date(),
          firstName: dto.firstName,
          lastName: dto.lastName,
          status: "ACTIVE",
        },
      });

      // 4. Assign SUPER_ADMIN role to user
      const superAdminRoleId = rolesMap["SUPER_ADMIN"];
      if (superAdminRoleId) {
        await tx.userRole.create({
          data: {
            userId: user.id,
            roleId: superAdminRoleId,
          },
        });
      }

      // 5. Create Organization
      const org = await tx.organization.create({
        data: {
          tenantId: tenant.id,
          name: dto.organizationName,
          currency: "USD",
          timezone: "UTC",
        },
      });

      // 6. Create Default Departments
      const depts = ["Finance", "Human Resources", "Sales", "Operations"];
      for (const deptName of depts) {
        await tx.department.create({
          data: {
            tenantId: tenant.id,
            orgId: org.id,
            name: deptName,
            code: deptName.toUpperCase(),
          },
        });
      }

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
        },
      };
    });
  }

  /**
   * Resolves a user's role names and flattened permission list.
   */
  private async resolveRolesAndPermissions(userId: string) {
    const userRoles = (await prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    })) as unknown as Array<UserRole & { role: Role }>;

    const roles = userRoles.map((ur) => ur.role.name);
    const permissions: string[] = [];
    for (const ur of userRoles) {
      try {
        const perms = JSON.parse(ur.role.permissions as string);
        if (Array.isArray(perms)) permissions.push(...perms);
      } catch {
        // Skip malformed permissions
      }
    }
    return { roles, permissions };
  }

  /**
   * Builds the standard authenticated login response with a fresh session token.
   * A revocable `UserSession` row is created and its id embedded as the token's
   * `sid`, so JwtAuthGuard can reject the token the moment the session is revoked.
   */
  private async issueSession(
    user: {
      id: string;
      tenantId: string;
      email: string;
      firstName: string;
      lastName: string;
      avatar?: string | null;
      tenant: { id: string; name: string; slug: string };
    },
    context?: SessionContext,
  ) {
    return runWithTenantSession(
      { tenantId: user.tenantId, userId: user.id },
      async () => {
        const { roles, permissions } = await this.resolveRolesAndPermissions(
          user.id,
        );

        // Create the session first so its id can be sealed into the token.
        const sid = randomBytes(18).toString("hex");
        const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
        const parsedUa = parseUserAgent(context?.userAgent);
        await prisma.userSession.create({
          data: {
            id: sid,
            tenantId: user.tenantId,
            userId: user.id,
            token: sid,
            ipAddress: context?.ipAddress ?? null,
            browser: parsedUa.browser,
            device: context?.device ?? parsedUa.device,
            expiresAt,
          },
        });

        const token = signSessionToken({
          sid,
          userId: user.id,
          tenantId: user.tenantId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roles,
        });

        await prisma.user.update({
          where: { id: user.id },
          data: {
            lastLoginAt: new Date(),
            failedLoginAttempts: 0,
            lockedUntil: null,
          },
        });

        return {
          token,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            avatar: user.avatar,
            roles,
            permissions,
          },
          tenant: {
            id: user.tenant.id,
            name: user.tenant.name,
            slug: user.tenant.slug,
          },
        };
      },
    );
  }

  /**
   * Authenticates a user and issues a JWT token (or an MFA challenge).
   */
  async login(
    dto: LoginInput & { tenantSlug?: string },
    context?: SessionContext,
  ) {
    let tenantId = "";

    if (dto.tenantSlug) {
      const tenant = await prisma.tenant.findUnique({
        where: { slug: dto.tenantSlug },
      });
      if (!tenant) {
        // Do not distinguish "tenant missing" from "bad credentials".
        throw new UnauthorizedException("Invalid credentials");
      }
      tenantId = tenant.id;
    } else {
      // Look up which tenant(s) this email belongs to. This runs before any
      // tenant context exists, so a plain cross-tenant query would be blocked
      // by RLS under the unerp_api runtime role — use the narrow
      // SECURITY DEFINER lookup function instead (Track C / #21).
      const users = await prisma.$queryRaw<
        Array<{ id: string; tenant_id: string }>
      >`
        SELECT id, tenant_id FROM auth_lookup_user_tenants(${dto.email.toLowerCase()})
      `;

      if (users.length === 0) {
        throw new UnauthorizedException("Invalid credentials");
      }
      if (users.length > 1) {
        throw new BadRequestException(
          "Multiple organizations use this email. Please provide your Organization Slug.",
        );
      }

      const targetUser = users[0];
      if (targetUser) {
        tenantId = targetUser.tenant_id;
      }
    }

    // Find user within the specified tenant scope. Run inside a tenant
    // session so the RLS-enforcing unerp_api role can see the row.
    const user = await runWithTenantSession({ tenantId, userId: "" }, () =>
      prisma.user.findFirst({
        where: {
          tenantId,
          email: dto.email.toLowerCase(),
        },
        include: {
          tenant: true,
        },
      }),
    );

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Reject locked accounts before touching the password.
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const mins = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      throw new UnauthorizedException(
        `Account locked due to failed login attempts. Try again in ${mins} minute(s).`,
      );
    }

    // Validate password
    const isPasswordValid = await comparePassword(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      await this.registerFailedAttempt(
        user.id,
        user.tenantId,
        user.failedLoginAttempts,
      );
      throw new UnauthorizedException("Invalid credentials");
    }

    if (user.status !== "ACTIVE") {
      throw new UnauthorizedException(
        `Account is ${user.status.toLowerCase()}`,
      );
    }

    // Password is correct — clear any accumulated failure count.
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await runWithTenantSession({ tenantId, userId: user.id }, () =>
        prisma.user.update({
          where: { id: user.id },
          data: { failedLoginAttempts: 0, lockedUntil: null },
        }),
      );
    }

    // Second factor: issue a short-lived challenge token instead of the user id,
    // so /mfa/verify-login cannot be called for an arbitrary account.
    if (user.mfaEnabled) {
      const challengeToken = signTypedToken(
        TOKEN_TYPE.MFA_CHALLENGE,
        { userId: user.id, tenantId: user.tenantId },
        MFA_CHALLENGE_TTL,
      );
      // Best-effort — a user with no registered device (or push not configured)
      // just falls back to typing the 6-digit code, which always still works.
      const pushSent = await this.sendMfaPushChallenge(
        challengeToken,
        user.id,
        user.tenantId,
      ).catch(() => false);
      return {
        mfaRequired: true,
        challengeToken,
        pushSent,
        message: "MFA authentication required.",
      } as const;
    }

    return this.issueSession(user, context);
  }

  /**
   * Increments the failed-login counter and locks the account past the threshold.
   */
  private async registerFailedAttempt(
    userId: string,
    tenantId: string,
    current: number,
  ) {
    const attempts = current + 1;
    const shouldLock = attempts >= MAX_FAILED_ATTEMPTS;
    await runWithTenantSession({ tenantId, userId }, () =>
      prisma.user.update({
        where: { id: userId },
        data: {
          failedLoginAttempts: shouldLock ? 0 : attempts,
          lockedUntil: shouldLock
            ? new Date(Date.now() + LOCK_DURATION_MS)
            : undefined,
        },
      }),
    );
  }

  /**
   * Returns profile data of the currently authenticated user.
   */
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { tenant: true },
    });

    if (!user) {
      throw new NotFoundException("User profile not found");
    }

    const { roles, permissions } = await this.resolveRolesAndPermissions(
      user.id,
    );

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      roles,
      permissions,
      preferences: user.preferences,
      mfaEnabled: user.mfaEnabled,
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        slug: user.tenant.slug,
      },
    };
  }

  /**
   * Updates profile data of the currently authenticated user.
   */
  async updateProfile(
    userId: string,
    dto: import("@unerp/shared").UpdateProfileInput,
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const updateData: Record<string, unknown> = {};

    if (dto.newPassword) {
      // Changing a password requires proving knowledge of the current one.
      if (!user.passwordHash)
        throw new BadRequestException("Account does not have a password.");
      if (!dto.currentPassword)
        throw new BadRequestException(
          "Current password is required to set a new one.",
        );
      const isPasswordValid = await comparePassword(
        dto.currentPassword,
        user.passwordHash,
      );
      if (!isPasswordValid)
        throw new UnauthorizedException("Invalid current password");
      updateData.passwordHash = await hashPassword(dto.newPassword);
      updateData.passwordChangedAt = new Date();
    }

    if (dto.firstName) updateData.firstName = dto.firstName;
    if (dto.lastName) updateData.lastName = dto.lastName;

    if (dto.preferences) {
      const currentPrefs = user.preferences as Record<string, unknown>;
      updateData.preferences = { ...currentPrefs, ...dto.preferences };
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return {
      id: updatedUser.id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      preferences: updatedUser.preferences,
    };
  }

  /**
   * Lists every tenant this account can sign in to. Identity is email-based:
   * the same verified email in another tenant is the same person, so the list
   * is all ACTIVE user rows sharing the caller's email (Slack-workspace model).
   */
  async listUserTenants(userId: string) {
    const me = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, tenantId: true },
    });
    if (!me) throw new NotFoundException("User not found");

    const memberships = await prisma.user.findMany({
      where: { email: me.email, status: "ACTIVE" },
      select: {
        tenantId: true,
        tenant: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { tenant: { name: "asc" } },
    });
    return memberships.map((m) => ({
      ...m.tenant,
      current: m.tenantId === me.tenantId,
    }));
  }

  /**
   * Re-issues the session against another tenant the caller's email belongs to.
   * The caller already authenticated (password + MFA where enabled) for this
   * email, so switching does not re-prompt — mirroring how login without a slug
   * resolves the tenant. The old session is revoked before the new one is cut,
   * so exactly one tenant scope is live per switch.
   */
  async switchTenant(
    userId: string,
    currentSid: string | undefined,
    tenantSlug: string,
    context?: SessionContext,
  ) {
    const me = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (!me) throw new UnauthorizedException("Invalid session");

    const target = await prisma.user.findFirst({
      where: {
        email: me.email,
        status: "ACTIVE",
        tenant: { slug: tenantSlug },
      },
      include: { tenant: true },
    });
    if (!target) {
      throw new UnauthorizedException(
        "No active membership in that organization",
      );
    }

    if (currentSid) await this.revokeSessionById(currentSid);
    return this.issueSession(target, context);
  }

  /**
   * Issues a single-use, hashed password reset token. Always responds the same
   * way whether or not the email exists, to avoid account enumeration.
   */
  async forgotPassword(dto: ForgotPasswordInput) {
    const genericMessage =
      "If an account exists for that email, a password reset link has been sent.";

    const user = await prisma.user.findFirst({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      return { message: genericMessage };
    }

    // Invalidate any outstanding tokens for this user, then mint a new one.
    const { plain, hash } = createResetToken();
    await prisma.$transaction([
      prisma.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      }),
      prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tenantId: user.tenantId,
          tokenHash: hash,
          expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
        },
      }),
    ]);

    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const resetLink = `${appUrl}/reset-password?token=${plain}`;

    this.logger.log(
      `[email] Password reset requested for ${user.email}. Link dispatched.`,
    );

    // Never return the token in production; expose it only for local dev ergonomics.
    if (this.isProduction) {
      return { message: genericMessage };
    }
    return { message: genericMessage, developerResetLink: resetLink };
  }

  /**
   * Resets the password using a single-use token, then invalidates the token.
   */
  async resetPassword(dto: ResetPasswordInput) {
    const tokenHash = hashResetToken(dto.token);

    const record = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException("Invalid or expired password reset token.");
    }

    const hashedPassword = await hashPassword(dto.password);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: {
          passwordHash: hashedPassword,
          passwordChangedAt: new Date(),
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      }),
      prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      // Burn any other outstanding reset tokens for this user.
      prisma.passwordResetToken.updateMany({
        where: { userId: record.userId, usedAt: null },
        data: { usedAt: new Date() },
      }),
    ]);

    return { message: "Password reset successfully. You can now log in." };
  }

  /**
   * Automatically provisions and logs in a demo user with the specified role.
   * The controller restricts this to non-production environments.
   */
  async loginDemo(
    roleKey: "SUPER_ADMIN" | "HR_MANAGER" | "FINANCE_MANAGER" | "VIEWER",
  ) {
    // 1. Get default tenant
    let tenant = await prisma.tenant.findFirst({
      where: { slug: "system" },
    });
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          name: "System Tenant",
          slug: "system",
          plan: "enterprise",
          status: "ACTIVE",
        },
      });
    }

    // Map role key to email and profile info
    const roleMapping = {
      SUPER_ADMIN: {
        email: "admin@unerp.dev",
        firstName: "System",
        lastName: "Administrator",
        roleName: "Super Admin",
      },
      HR_MANAGER: {
        email: "hr-demo@unerp.dev",
        firstName: "Sarah",
        lastName: "HR",
        roleName: "HR Manager",
      },
      FINANCE_MANAGER: {
        email: "finance-demo@unerp.dev",
        firstName: "John",
        lastName: "Finance",
        roleName: "Finance Manager",
      },
      VIEWER: {
        email: "viewer-demo@unerp.dev",
        firstName: "Guest",
        lastName: "Viewer",
        roleName: "Viewer",
      },
    };

    const target = roleMapping[roleKey] || roleMapping.VIEWER;

    // 2. Find or create user
    let user = await prisma.user.findFirst({
      where: { tenantId: tenant.id, email: target.email },
      include: { tenant: true },
    });

    if (!user) {
      const mockPasswordHash = await hashPassword("DemoUser!2345");
      user = await prisma.user.create({
        data: {
          tenantId: tenant.id,
          email: target.email,
          passwordHash: mockPasswordHash,
          passwordChangedAt: new Date(),
          firstName: target.firstName,
          lastName: target.lastName,
          status: "ACTIVE",
        },
        include: { tenant: true },
      });
    }

    // 3. Find or create the role
    let role = await prisma.role.findFirst({
      where: { tenantId: tenant.id, name: target.roleName },
    });

    if (!role) {
      const defaultRolesConfig: Record<string, string[]> = {
        "Super Admin": ["*"],
        Admin: ["admin.*", "finance.*", "hr.*", "crm.*", "inventory.*"],
        "Finance Manager": ["finance.*", "sales.sales-order.read"],
        "HR Manager": ["hr.*"],
        Viewer: [
          "finance.invoice.read",
          "finance.report.read",
          "hr.employee.read",
          "crm.contact.read",
          "inventory.product.read",
        ],
      };

      const permissions =
        defaultRolesConfig[target.roleName] || defaultRolesConfig.Viewer;

      role = await prisma.role.create({
        data: {
          tenantId: tenant.id,
          name: target.roleName,
          description: `Seeded ${target.roleName} role`,
          isSystem: true,
          permissions: JSON.stringify(permissions),
        },
      });
    }

    // 4. Ensure UserRole assignment
    const userRole = await prisma.userRole.findFirst({
      where: { userId: user.id, roleId: role.id },
    });

    if (!userRole) {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: role.id,
        },
      });
    }

    return this.issueSession(user);
  }

  /**
   * Begins TOTP MFA setup: generates a base32 secret and a locally-rendered QR
   * code. The secret is stored as pending until a code is verified.
   */
  async generateMfaSecret(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException("User not found.");
    }

    const secret = generateTotpSecret();

    await prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: encryptSecret(secret), mfaPending: true },
    });

    const { otpauthUrl, qrDataUrl } = await buildTotpEnrollment(
      user.email,
      secret,
    );

    return { secret, otpauthUrl, qrCodeUrl: qrDataUrl };
  }

  /**
   * Verifies a TOTP code and enables or disables MFA. Enabling returns one-time
   * recovery codes (shown once); disabling clears the secret and codes.
   */
  async verifyMfaAndEnable(userId: string, code: string, enable: boolean) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.mfaSecret) {
      throw new BadRequestException(
        "MFA has not been configured for this user.",
      );
    }

    if (!verifyTotp(code, decryptSecret(user.mfaSecret))) {
      throw new BadRequestException("Invalid verification code.");
    }

    if (!enable) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          mfaEnabled: false,
          mfaPending: false,
          mfaSecret: null,
          mfaRecoveryCodes: [],
        },
      });
      return { message: "MFA disabled successfully." };
    }

    const { plain, hashes } = await generateRecoveryCodes();
    await prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true, mfaPending: false, mfaRecoveryCodes: hashes },
    });

    return {
      message: "MFA enabled successfully.",
      recoveryCodes: plain,
    };
  }

  /**
   * Completes an MFA login: validates the challenge token from step one, then
   * the TOTP code (or a single-use recovery code), and issues a session.
   */
  async verifyMfaLogin(
    challengeToken: string,
    code: string,
    context?: SessionContext,
  ) {
    const payload = verifyTypedToken<{ userId: string }>(
      challengeToken,
      TOKEN_TYPE.MFA_CHALLENGE,
    );
    if (!payload?.userId) {
      throw new UnauthorizedException(
        "MFA session expired. Please sign in again.",
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { tenant: true },
    });

    if (!user || !user.mfaEnabled || !user.mfaSecret) {
      throw new BadRequestException("MFA is not configured for this user.");
    }

    const totpOk = verifyTotp(code, decryptSecret(user.mfaSecret));

    if (!totpOk) {
      // Fall back to single-use recovery codes.
      const storedCodes = Array.isArray(user.mfaRecoveryCodes)
        ? (user.mfaRecoveryCodes as string[])
        : [];
      const matchIndex = await matchRecoveryCode(code, storedCodes);
      if (matchIndex === -1) {
        throw new UnauthorizedException("Invalid verification code.");
      }
      // Consume the used recovery code.
      const remaining = storedCodes.filter((_, i) => i !== matchIndex);
      await prisma.user.update({
        where: { id: user.id },
        data: { mfaRecoveryCodes: remaining },
      });
    }

    return this.issueSession(user, context);
  }

  /**
   * Marks a session inactive so its token is rejected on the next request.
   * Idempotent — unknown or already-revoked ids are a no-op.
   */
  async revokeSessionById(sid: string) {
    if (!sid) return;
    await prisma.userSession.updateMany({
      where: { id: sid, isActive: true },
      data: { isActive: false },
    });
  }

  /** Active sessions for the "Active Sessions" profile UI, most-recent first. */
  async listSessions(userId: string, tenantId: string, currentSid?: string) {
    const sessions = await prisma.userSession.findMany({
      where: { userId, tenantId, isActive: true },
      orderBy: { lastActivityAt: "desc" },
    });
    return sessions.map((s) => ({
      id: s.id,
      device: s.device,
      browser: s.browser,
      ipAddress: s.ipAddress,
      location: s.location,
      startedAt: s.startedAt,
      lastActivityAt: s.lastActivityAt,
      isCurrent: s.id === currentSid,
    }));
  }

  /** Revokes every session for this user except the one making the request. */
  async revokeOtherSessions(
    userId: string,
    tenantId: string,
    currentSid?: string,
  ) {
    const result = await prisma.userSession.updateMany({
      where: {
        userId,
        tenantId,
        isActive: true,
        ...(currentSid ? { id: { not: currentSid } } : {}),
      },
      data: { isActive: false },
    });
    return { revoked: result.count };
  }

  /** Stores a small avatar image as a data URI on the user record. */
  async updateAvatar(userId: string, dataUri: string) {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { avatar: dataUri },
    });
    return { avatar: updated.avatar };
  }

  /* ─────────────────────────────────────────────────────────
     MFA push-approval (Web Push) — an "Approve on your phone"
     alternative to typing a 6-digit code every login. The code
     entry path always keeps working; push is a convenience.
     ───────────────────────────────────────────────────────── */

  /** Registers a device (browser/PWA) to receive push-approval prompts. */
  async subscribeToPush(
    userId: string,
    tenantId: string,
    sub: { endpoint: string; keys: { p256dh: string; auth: string } },
    label?: string,
  ) {
    return runWithTenantSession({ tenantId, userId }, () =>
      prisma.pushSubscription.upsert({
        where: { endpoint: sub.endpoint },
        create: {
          tenantId,
          userId,
          endpoint: sub.endpoint,
          p256dh: sub.keys.p256dh,
          auth: sub.keys.auth,
          label: label ?? null,
        },
        update: {
          p256dh: sub.keys.p256dh,
          auth: sub.keys.auth,
          label: label ?? null,
        },
      }),
    );
  }

  async unsubscribeFromPush(
    userId: string,
    tenantId: string,
    endpoint: string,
  ) {
    await runWithTenantSession({ tenantId, userId }, () =>
      prisma.pushSubscription.deleteMany({
        where: { userId, tenantId, endpoint },
      }),
    );
    return { message: "Device removed." };
  }

  /** Removes any of the user's registered push devices by id (profile "Devices" list). */
  async removePushDeviceById(userId: string, tenantId: string, id: string) {
    await runWithTenantSession({ tenantId, userId }, () =>
      prisma.pushSubscription.deleteMany({ where: { userId, tenantId, id } }),
    );
    return { message: "Device removed." };
  }

  async listPushSubscriptions(userId: string, tenantId: string) {
    return runWithTenantSession({ tenantId, userId }, () =>
      prisma.pushSubscription.findMany({
        where: { userId, tenantId },
        orderBy: { createdAt: "desc" },
        select: { id: true, label: true, createdAt: true },
      }),
    );
  }

  /**
   * Fires an "Approve this sign-in?" push to every device the user has
   * registered. Returns whether anything was actually sent — the login
   * page uses this to decide whether to lead with "check your phone" or
   * go straight to the manual-code form.
   */
  private async sendMfaPushChallenge(
    challengeToken: string,
    userId: string,
    tenantId: string,
  ): Promise<boolean> {
    if (!PUSH_CONFIGURED) return false;

    return runWithTenantSession({ tenantId, userId }, async () => {
      const subscriptions = await prisma.pushSubscription.findMany({
        where: { userId, tenantId },
      });
      if (subscriptions.length === 0) return false;

      await prisma.mfaPushChallenge.create({
        data: {
          tenantId,
          userId,
          token: hashChallengeToken(challengeToken),
          status: "PENDING",
          expiresAt: new Date(Date.now() + MFA_PUSH_TTL_MS),
        },
      });

      const payload = JSON.stringify({
        type: "mfa-approval",
        title: "Approve sign-in?",
        body: "Someone is signing in to your UniERP account. Tap to approve or deny.",
        challengeToken,
      });

      const results = await Promise.allSettled(
        subscriptions.map((s) =>
          webPush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload,
          ),
        ),
      );

      // A 404/410 means the browser unregistered that endpoint — stop targeting it.
      await Promise.all(
        results.map((r, i) => {
          if (r.status !== "rejected") return Promise.resolve();
          const statusCode = (r.reason as { statusCode?: number })?.statusCode;
          if (statusCode !== 404 && statusCode !== 410) {
            this.logger.warn(`MFA push delivery failed: ${r.reason}`);
            return Promise.resolve();
          }
          const sub = subscriptions[i];
          if (!sub) return Promise.resolve();
          return prisma.pushSubscription
            .delete({ where: { id: sub.id } })
            .catch(() => undefined);
        }),
      );

      return true;
    });
  }

  /**
   * Polled by the login page while "Check your phone" is showing. Once
   * approved, finalizes the login exactly like a correct 6-digit code would.
   */
  async getMfaPushStatus(challengeToken: string, context?: SessionContext) {
    const payload = verifyTypedToken<{ userId: string; tenantId: string }>(
      challengeToken,
      TOKEN_TYPE.MFA_CHALLENGE,
    );
    if (!payload?.userId) {
      throw new UnauthorizedException(
        "MFA session expired. Please sign in again.",
      );
    }

    return runWithTenantSession(
      { tenantId: payload.tenantId, userId: payload.userId },
      async () => {
        const challenge = await prisma.mfaPushChallenge.findUnique({
          where: { token: hashChallengeToken(challengeToken) },
        });
        if (!challenge) return { status: "not_sent" as const };

        if (
          challenge.status === "PENDING" &&
          challenge.expiresAt < new Date()
        ) {
          await prisma.mfaPushChallenge.update({
            where: { id: challenge.id },
            data: { status: "EXPIRED" },
          });
          return { status: "expired" as const };
        }

        if (challenge.status === "DENIED") return { status: "denied" as const };
        if (challenge.status === "EXPIRED")
          return { status: "expired" as const };
        if (challenge.status !== "APPROVED")
          return { status: "pending" as const };

        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
          include: { tenant: true },
        });
        if (!user) throw new UnauthorizedException("Account no longer exists.");

        const session = await this.issueSession(user, context);
        return { status: "approved" as const, ...session };
      },
    );
  }

  /**
   * Called from the device that *received* the push (already has its own
   * valid session) to approve or deny somebody else's pending login.
   */
  async respondToMfaPushChallenge(
    approvingUserId: string,
    approvingTenantId: string,
    challengeToken: string,
    approve: boolean,
  ) {
    const payload = verifyTypedToken<{ userId: string; tenantId: string }>(
      challengeToken,
      TOKEN_TYPE.MFA_CHALLENGE,
    );
    if (
      !payload?.userId ||
      payload.userId !== approvingUserId ||
      payload.tenantId !== approvingTenantId
    ) {
      throw new UnauthorizedException(
        "This approval request does not belong to you.",
      );
    }

    return runWithTenantSession(
      { tenantId: approvingTenantId, userId: approvingUserId },
      async () => {
        const challenge = await prisma.mfaPushChallenge.findUnique({
          where: { token: hashChallengeToken(challengeToken) },
        });
        if (
          !challenge ||
          challenge.status !== "PENDING" ||
          challenge.expiresAt < new Date()
        ) {
          throw new BadRequestException("This approval request has expired.");
        }
        await prisma.mfaPushChallenge.update({
          where: { id: challenge.id },
          data: { status: approve ? "APPROVED" : "DENIED" },
        });
        return { message: approve ? "Sign-in approved." : "Sign-in denied." };
      },
    );
  }
}
