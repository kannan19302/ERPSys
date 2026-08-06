import { z } from "zod";

export const DeploymentStatusEnum = z.enum([
  "PENDING",
  "IN_PROGRESS",
  "SUCCESS",
  "FAILED",
  "ROLLED_BACK",
  "CANCELLED",
]);
export const DeploymentStrategyEnum = z.enum([
  "ROLLING",
  "BLUE_GREEN",
  "CANARY",
  "RECREATE",
]);
export const EnvironmentTypeEnum = z.enum([
  "DEVELOPMENT",
  "STAGING",
  "PRODUCTION",
  "DR",
]);
export const ReleaseTypeEnum = z.enum([
  "STANDARD",
  "HOTFIX",
  "EMERGENCY",
  "MAJOR",
  "MINOR",
  "PATCH",
]);
export const ReleaseStatusEnum = z.enum([
  "DRAFT",
  "BUILDING",
  "TESTING",
  "APPROVED",
  "RELEASED",
  "ROLLED_BACK",
  "FAILED",
]);

export const CreateDeploymentSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  application: z.string().min(1).max(100),
  version: z.string().min(1).max(50),
  environmentId: z.string().min(1),
  strategy: DeploymentStrategyEnum.optional().default("ROLLING"),
  branch: z.string().optional(),
  commitSha: z.string().optional(),
  commitMessage: z.string().optional(),
  deployedBy: z.string().min(1),
});

export const UpdateDeploymentSchema = CreateDeploymentSchema.partial().extend({
  status: DeploymentStatusEnum.optional(),
});

export const CreateEnvironmentSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100),
  type: EnvironmentTypeEnum.optional().default("DEVELOPMENT"),
  application: z.string().optional(),
  baseUrl: z.string().url().optional(),
  healthUrl: z.string().url().optional(),
  region: z.string().optional(),
  cluster: z.string().optional(),
  namespace: z.string().optional(),
  monitoringEnabled: z.boolean().optional().default(true),
  autoDeployEnabled: z.boolean().optional().default(false),
});

export const UpdateEnvironmentSchema = CreateEnvironmentSchema.partial().extend(
  {
    status: z
      .enum(["ACTIVE", "INACTIVE", "MAINTENANCE", "DEGRADED"])
      .optional(),
  },
);

export const CreateEnvironmentConfigSchema = z.object({
  environmentId: z.string().min(1),
  key: z.string().min(1).max(200),
  value: z.string(),
  valueType: z
    .enum(["STRING", "NUMBER", "BOOLEAN", "JSON", "SECRET"])
    .optional()
    .default("STRING"),
  isSecret: z.boolean().optional().default(false),
  description: z.string().optional(),
});

export const CreateReleaseSchema = z.object({
  name: z.string().min(1).max(200),
  version: z.string().min(1).max(50),
  application: z.string().min(1).max(100),
  description: z.string().optional(),
  releaseType: ReleaseTypeEnum.optional().default("STANDARD"),
  environmentId: z.string().optional(),
  releaseNotes: z.string().optional(),
  changelog: z
    .array(
      z.object({
        message: z.string(),
        author: z.string(),
        hash: z.string().optional(),
      }),
    )
    .optional(),
  branch: z.string().optional(),
  commitSha: z.string().optional(),
  tag: z.string().optional(),
});

export const UpdateReleaseSchema = CreateReleaseSchema.partial().extend({
  status: ReleaseStatusEnum.optional(),
  approvedBy: z.string().optional(),
});

export const CreateBuildLogSchema = z.object({
  deploymentId: z.string().min(1),
  stage: z.enum(["BUILD", "TEST", "DEPLOY", "POST_DEPLOY"]),
  level: z.enum(["INFO", "WARN", "ERROR", "DEBUG"]).optional().default("INFO"),
  message: z.string().min(1),
  source: z.string().optional(),
  lineNumber: z.number().int().optional(),
});

export type CreateDeploymentDto = z.infer<typeof CreateDeploymentSchema>;
export type UpdateDeploymentDto = z.infer<typeof UpdateDeploymentSchema>;
export type CreateEnvironmentDto = z.infer<typeof CreateEnvironmentSchema>;
export type UpdateEnvironmentDto = z.infer<typeof UpdateEnvironmentSchema>;
export type CreateEnvironmentConfigDto = z.infer<
  typeof CreateEnvironmentConfigSchema
>;
export type CreateReleaseDto = z.infer<typeof CreateReleaseSchema>;
export type UpdateReleaseDto = z.infer<typeof UpdateReleaseSchema>;
export type CreateBuildLogDto = z.infer<typeof CreateBuildLogSchema>;
