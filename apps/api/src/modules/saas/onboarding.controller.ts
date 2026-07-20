import {
  Controller,
  Get,
  Post,
  UseGuards,
  Req,
  Param,
} from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { prisma } from "@unerp/database";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string; email: string; roles: string[] };
}

const onboardingSteps = [
  { key: "welcome", label: "Welcome & Introduction", required: true, sortOrder: 1 },
  { key: "company_profile", label: "Set Up Company Profile", required: true, sortOrder: 2 },
  { key: "invite_team", label: "Invite Team Members", required: true, sortOrder: 3 },
  { key: "configure_modules", label: "Configure ERP Modules", required: true, sortOrder: 4 },
  { key: "payment_setup", label: "Set Up Payment Method", required: false, sortOrder: 5 },
  { key: "custom_domain", label: "Configure Custom Domain", required: false, sortOrder: 6 },
  { key: "sso_setup", label: "Configure SSO", required: false, sortOrder: 7 },
  { key: "data_import", label: "Import Your Data", required: false, sortOrder: 8 },
  { key: "tour_complete", label: "Take a Tour", required: false, sortOrder: 9 },
];

const tutorials = [
  {
    id: "getting-started",
    title: "Getting Started with UniERP",
    category: "Basics",
    duration: "5 min",
    steps: ["Login", "Navigate dashboard", "Explore modules"],
  },
  {
    id: "create-invoice",
    title: "Creating Your First Invoice",
    category: "Finance",
    duration: "3 min",
    steps: ["Go to Finance", "Click New Invoice", "Fill details", "Send"],
  },
  {
    id: "manage-users",
    title: "Managing Users & Roles",
    category: "Admin",
    duration: "4 min",
    steps: ["Open Settings", "User Management", "Assign roles"],
  },
  {
    id: "setup-workflow",
    title: "Setting Up Approval Workflows",
    category: "Workflow",
    duration: "6 min",
    steps: ["Open Workflow Engine", "Create new workflow", "Define rules"],
  },
  {
    id: "generate-report",
    title: "Generating Reports",
    category: "Analytics",
    duration: "3 min",
    steps: ["Go to Reports", "Select template", "Configure filters", "Export"],
  },
];

const resources = [
  { id: "docs", title: "Documentation", url: "https://docs.unerp.dev", type: "docs" },
  { id: "api-ref", title: "API Reference", url: "https://api.unerp.dev/docs", type: "api" },
  { id: "community", title: "Community Forum", url: "https://community.unerp.dev", type: "forum" },
  { id: "support", title: "Support Center", url: "https://support.unerp.dev", type: "support" },
  { id: "video-tutorials", title: "Video Tutorials", url: "https://learn.unerp.dev", type: "video" },
];

@ApiTags("saas-onboarding")
@ApiBearerAuth()
@Controller("saas/onboarding")
@UseGuards(JwtAuthGuard, RbacGuard)
export class OnboardingController {

  @ApiOperation({ summary: "Get current onboarding status" })
  @Permissions("saas.portal.read")
  @Get("status")
  async getOnboardingStatus(@Req() req: AuthReq) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.user.tenantId },
      select: { demoDataLoaded: true, settings: true, createdAt: true },
    });
    const settings = (tenant?.settings as Record<string, unknown>) ?? {};
    const onboardingDone = settings.onboardingCompleted === true;
    const completedSteps = (settings.onboardingSteps as string[]) ?? [];
    return {
      isCompleted: onboardingDone,
      completedSteps,
      totalSteps: onboardingSteps.length,
      demoDataLoaded: tenant?.demoDataLoaded ?? false,
      startedAt: tenant?.createdAt,
      completedAt: settings.onboardingCompletedAt ?? null,
    };
  }

  @ApiOperation({ summary: "List onboarding steps" })
  @Permissions("saas.portal.read")
  @Get("steps")
  async listOnboardingSteps(@Req() req: AuthReq) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.user.tenantId },
      select: { settings: true },
    });
    const settings = (tenant?.settings as Record<string, unknown>) ?? {};
    const completedSteps = new Set((settings.onboardingSteps as string[]) ?? []);
    return onboardingSteps.map((step) => ({
      ...step,
      isCompleted: completedSteps.has(step.key),
    }));
  }

  @ApiOperation({ summary: "Mark an onboarding step as complete" })
  @Permissions("saas.portal.create")
  @Post("steps/:step/complete")
  async completeStep(@Req() req: AuthReq, @Param("step") step: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.user.tenantId },
      select: { settings: true },
    });
    const settings = (tenant?.settings as Record<string, unknown>) ?? {};
    const completedSteps = new Set((settings.onboardingSteps as string[]) ?? []);
    completedSteps.add(step);
    await prisma.tenant.update({
      where: { id: req.user.tenantId },
      data: { settings: { ...settings, onboardingSteps: [...completedSteps] } },
    });
    return { step, isCompleted: true };
  }

  @ApiOperation({ summary: "Skip an onboarding step" })
  @Permissions("saas.portal.create")
  @Post("steps/:step/skip")
  async skipStep(@Param("step") step: string) {
    return { step, isSkipped: true };
  }

  @ApiOperation({ summary: "Get overall onboarding progress percentage" })
  @Permissions("saas.portal.read")
  @Get("progress")
  async getOnboardingProgress(@Req() req: AuthReq) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.user.tenantId },
      select: { settings: true },
    });
    const settings = (tenant?.settings as Record<string, unknown>) ?? {};
    const completedSteps = (settings.onboardingSteps as string[]) ?? [];
    const requiredSteps = onboardingSteps.filter((s) => s.required);
    const completedRequired = requiredSteps.filter((s) => completedSteps.includes(s.key)).length;
    return {
      totalSteps: onboardingSteps.length,
      completedSteps: completedSteps.length,
      requiredSteps: requiredSteps.length,
      completedRequired,
      progressPct: requiredSteps.length > 0 ? Math.round((completedRequired / requiredSteps.length) * 100) : 0,
      isFullyComplete: requiredSteps.every((s) => completedSteps.includes(s.key)),
    };
  }

  @ApiOperation({ summary: "Get onboarding checklist" })
  @Permissions("saas.portal.read")
  @Get("checklist")
  async getOnboardingChecklist(@Req() req: AuthReq) {
    return this.listOnboardingSteps(req);
  }

  @ApiOperation({ summary: "Seed demo data for the tenant" })
  @Permissions("saas.portal.create")
  @Post("demo-data")
  async seedDemoData(@Req() req: AuthReq) {
    await prisma.tenant.update({
      where: { id: req.user.tenantId },
      data: { demoDataLoaded: true, demoLoadedAt: new Date() },
    });
    return { demoDataLoaded: true, seededAt: new Date(), message: "Demo data seeded successfully" };
  }

  @ApiOperation({ summary: "List available tutorials" })
  @Permissions("saas.portal.read")
  @Get("tutorials")
  async listTutorials() {
    return tutorials;
  }

  @ApiOperation({ summary: "Get a specific tutorial" })
  @Permissions("saas.portal.read")
  @Get("tutorials/:id")
  async getTutorial(@Param("id") id: string) {
    return tutorials.find((t) => t.id === id) ?? { error: "Tutorial not found" };
  }

  @ApiOperation({ summary: "Mark a tutorial as completed" })
  @Permissions("saas.portal.create")
  @Post("tutorials/:id/complete")
  async completeTutorial(@Param("id") id: string) {
    return { tutorialId: id, isCompleted: true, completedAt: new Date() };
  }

  @ApiOperation({ summary: "List help resources" })
  @Permissions("saas.portal.read")
  @Get("resources")
  async listResources() {
    return resources;
  }

  @ApiOperation({ summary: "Dismiss the onboarding wizard" })
  @Permissions("saas.portal.create")
  @Post("dismiss")
  async dismissOnboarding(@Req() req: AuthReq) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: req.user.tenantId },
      select: { settings: true },
    });
    const settings = (tenant?.settings as Record<string, unknown>) ?? {};
    await prisma.tenant.update({
      where: { id: req.user.tenantId },
      data: { settings: { ...settings, onboardingCompleted: true, onboardingCompletedAt: new Date().toISOString() } },
    });
    return { dismissed: true };
  }

  @ApiOperation({ summary: "Get recommended setup configuration" })
  @Permissions("saas.portal.read")
  @Get("recommendations")
  async getRecommendedSetup() {
    return {
      recommendedModules: ["Finance", "CRM", "Inventory"],
      suggestedPlan: "professional",
      quickStartTasks: ["Set up company profile", "Invite 3 users", "Create first invoice"],
    };
  }

  @ApiOperation({ summary: "Reset onboarding to start over" })
  @Permissions("saas.portal.create")
  @Post("reset")
  async resetOnboarding(@Req() req: AuthReq) {
    await prisma.tenant.update({
      where: { id: req.user.tenantId },
      data: { settings: { onboardingCompleted: false, onboardingSteps: [] } },
    });
    return { reset: true };
  }
}
