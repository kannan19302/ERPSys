import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma } from "@unerp/database";
import {
  onboardingChecklistResponseSchema,
  type OnboardingChecklistResponse,
} from "@unerp/shared";

export const ONBOARDING_CHECKLIST_KEYS = [
  "profile",
  "logo",
  "invite",
  "app",
  "plan",
  "dashboard",
] as const;

export type OnboardingChecklistKey = (typeof ONBOARDING_CHECKLIST_KEYS)[number];

export interface OnboardingChecklistState {
  profile: boolean;
  logo: boolean;
  invite: boolean;
  app: boolean;
  plan: boolean;
  dashboard: boolean;
}

/**
 * Industry -> app slugs to surface first on the Apps hub (apps.page.tsx sorts
 * everything else alphabetically after these). Slugs match `AppDefinition.id`
 * in apps/web/app/(dashboard)/apps/page.tsx.
 */
const INDUSTRY_APP_PRIORITY: Record<string, string[]> = {
  healthcare: ["healthcare", "hr", "inventory", "finance"],
  education: ["education", "hr", "finance", "crm"],
  "real-estate": ["real-estate", "finance", "crm", "projects"],
  manufacturing: ["manufacturing", "inventory", "procurement", "supply-chain"],
  services: ["projects", "crm", "finance", "hr"],
  retail: ["pos", "inventory", "crm", "sales"],
  "field-service": ["field-service", "projects", "inventory", "crm"],
};
const DEFAULT_APP_PRIORITY: string[] = ["dashboard", "finance", "crm", "hr"];

/**
 * Industry -> preferred checklist step order. Any key omitted keeps its
 * relative position from ONBOARDING_CHECKLIST_KEYS, appended after.
 */
const INDUSTRY_CHECKLIST_ORDER: Record<string, OnboardingChecklistKey[]> = {
  healthcare: ["profile", "invite", "app", "logo", "plan", "dashboard"],
  education: ["profile", "app", "invite", "logo", "plan", "dashboard"],
  "real-estate": ["profile", "invite", "plan", "app", "logo", "dashboard"],
  manufacturing: ["profile", "app", "logo", "invite", "plan", "dashboard"],
  services: ["profile", "invite", "app", "plan", "logo", "dashboard"],
  retail: ["profile", "app", "invite", "logo", "plan", "dashboard"],
  "field-service": ["profile", "app", "invite", "logo", "plan", "dashboard"],
};

function resolveIndustryMeta(industry: string | null | undefined): {
  checklistOrder: OnboardingChecklistKey[];
  priorityAppSlugs: string[];
} {
  const key = (industry || "").toLowerCase();
  return {
    checklistOrder: INDUSTRY_CHECKLIST_ORDER[key] || [
      ...ONBOARDING_CHECKLIST_KEYS,
    ],
    priorityAppSlugs: INDUSTRY_APP_PRIORITY[key] || DEFAULT_APP_PRIORITY,
  };
}

function toResponse(
  checklist: OnboardingChecklistState,
  industry: string | null | undefined,
): OnboardingChecklistResponse {
  const { checklistOrder, priorityAppSlugs } = resolveIndustryMeta(industry);
  return onboardingChecklistResponseSchema.parse({
    ...checklist,
    checklistOrder,
    priorityAppSlugs,
  });
}

@Injectable()
export class OnboardingService {
  /**
   * Returns the onboarding checklist state for a tenant, personalized by the
   * tenant's `industry` (checklist step order + priority app slugs).
   * If it doesn't exist, initializes it.
   */
  async getOnboardingState(
    tenantId: string,
  ): Promise<OnboardingChecklistResponse> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException("Tenant not found");
    }

    const settings = (tenant.settings as Record<string, any>) || {};
    const industry = settings.industry as string | null | undefined;

    if (settings.onboardingChecklist) {
      return toResponse(
        settings.onboardingChecklist as OnboardingChecklistState,
        industry,
      );
    }

    // Initialize defaults
    const defaultChecklist: OnboardingChecklistState = {
      profile: false,
      logo: false,
      invite: false,
      app: false,
      plan: false,
      dashboard: false,
    };

    const updatedSettings = {
      ...settings,
      onboardingChecklist: defaultChecklist,
    };

    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        settings: updatedSettings as any,
      },
    });

    return toResponse(defaultChecklist, industry);
  }

  /**
   * Completes a specific step in the onboarding checklist.
   */
  async completeStep(
    tenantId: string,
    key: string,
  ): Promise<OnboardingChecklistResponse> {
    if (!ONBOARDING_CHECKLIST_KEYS.includes(key as any)) {
      throw new BadRequestException(`Invalid onboarding checklist key: ${key}`);
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException("Tenant not found");
    }

    const settings = (tenant.settings as Record<string, any>) || {};
    const industry = settings.industry as string | null | undefined;
    const checklist =
      (settings.onboardingChecklist as OnboardingChecklistState) || {
        profile: false,
        logo: false,
        invite: false,
        app: false,
        plan: false,
        dashboard: false,
      };

    // Only update if not already completed
    if (checklist[key as OnboardingChecklistKey] === true) {
      return toResponse(checklist, industry);
    }

    const updatedChecklist = {
      ...checklist,
      [key]: true,
    };

    const updatedSettings = {
      ...settings,
      onboardingChecklist: updatedChecklist,
    };

    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        settings: updatedSettings as any,
      },
    });

    return toResponse(updatedChecklist, industry);
  }
}
