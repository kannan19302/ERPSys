import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  UseGuards,
  Req,
  Param,
  Query,
} from "@nestjs/common";
import { z } from "zod";
import { ZodBody } from "../../common/decorators/zod-body.decorator";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AiAnalyticsService } from "./services/ai-analytics.service";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

const createForecastScenarioSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  scenarioType: z.string().min(1),
  forecastingMethod: z.string().min(1),
  parameters: z.any().optional(),
  timeHorizon: z.string().optional(),
  basePeriod: z.string().optional(),
  status: z.string().optional(),
});
const createForecastLineSchema = z.object({
  periodDate: z.string().min(1),
  category: z.string().min(1),
  subCategory: z.string().optional(),
  projectedAmount: z.number(),
  driverVariable: z.string().optional(),
  driverValue: z.number().optional(),
});
const createAnomalyDetectionRunSchema = z.object({
  runName: z.string().min(1),
  datasetType: z.string().min(1),
  detectionMethod: z.string().min(1),
  parameters: z.any().optional(),
  dateRangeStart: z.string().optional(),
  dateRangeEnd: z.string().optional(),
  status: z.string().optional(),
});
const createGlCodingSuggestionSchema = z.object({
  sourceType: z.string().min(1),
  sourceId: z.string().min(1),
  suggestedAccount: z.string().min(1),
  confidenceScore: z.number().min(0).max(1),
  reasoning: z.string().optional(),
  suggestedBy: z.string().optional(),
});
const logNlpQuerySchema = z.object({
  query: z.string().min(1),
  parsedIntent: z.string().optional(),
  context: z.string().optional(),
  responseGenerated: z.string().optional(),
  processingTimeMs: z.number().int().min(0).optional(),
});

@ApiTags("advanced-finance-ai-analytics")
@ApiBearerAuth()
@Controller("advanced-finance/ai-analytics")
@UseGuards(JwtAuthGuard, RbacGuard)
export class AiAnalyticsController {
  constructor(private readonly aiService: AiAnalyticsService) {}

  @Post("forecast-scenarios")
  @Permissions("finance.ai-analytics.manage")
  @ApiOperation({ summary: "Create forecast scenario" })
  async createForecastScenario(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createForecastScenarioSchema) dto: any,
  ) {
    return this.aiService.createForecastScenario(req.user.tenantId, dto);
  }

  @Get("forecast-scenarios")
  @Permissions("finance.ai-analytics.read")
  @ApiOperation({ summary: "List forecast scenarios" })
  async listForecastScenarios(
    @Req() req: AuthenticatedRequest,
    @Query("scenarioType") scenarioType?: string,
    @Query("status") status?: string,
  ) {
    return this.aiService.listForecastScenarios(
      req.user.tenantId,
      scenarioType,
      status,
    );
  }

  @Get("forecast-scenarios/:id")
  @Permissions("finance.ai-analytics.read")
  @ApiOperation({ summary: "Get forecast scenario" })
  async getForecastScenario(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.aiService.getForecastScenario(req.user.tenantId, id);
  }

  @Patch("forecast-scenarios/:id")
  @Permissions("finance.ai-analytics.manage")
  @ApiOperation({ summary: "Update forecast scenario" })
  async updateForecastScenario(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(createForecastScenarioSchema.partial()) dto: any,
  ) {
    return this.aiService.updateForecastScenario(req.user.tenantId, id, dto);
  }

  @Post("forecast-scenarios/:id/activate")
  @Permissions("finance.ai-analytics.manage")
  @ApiOperation({ summary: "Activate forecast scenario" })
  async activateForecastScenario(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.aiService.activateForecastScenario(req.user.tenantId, id);
  }

  @Post("forecast-scenarios/:id/generate")
  @Permissions("finance.ai-analytics.manage")
  @ApiOperation({ summary: "Generate forecast lines" })
  async generateForecastLines(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.aiService.generateForecastLines(req.user.tenantId, id);
  }

  @Delete("forecast-scenarios/:id")
  @Permissions("finance.ai-analytics.manage")
  @ApiOperation({ summary: "Delete forecast scenario" })
  async deleteForecastScenario(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.aiService.deleteForecastScenario(req.user.tenantId, id);
  }

  @Get("forecast-lines")
  @Permissions("finance.ai-analytics.read")
  @ApiOperation({ summary: "List forecast lines" })
  async listForecastLines(
    @Req() req: AuthenticatedRequest,
    @Query("scenarioId") scenarioId: string,
  ) {
    return this.aiService.listForecastLines(req.user.tenantId, scenarioId);
  }

  @Get("forecast-lines/:id")
  @Permissions("finance.ai-analytics.read")
  @ApiOperation({ summary: "Get forecast line" })
  async getForecastLine(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.aiService.getForecastLine(req.user.tenantId, id);
  }

  @Post("scenarios/:scenarioId/lines")
  @Permissions("finance.ai-analytics.manage")
  @ApiOperation({ summary: "Create forecast line" })
  async createForecastLine(
    @Req() req: AuthenticatedRequest,
    @Param("scenarioId") scenarioId: string,
    @ZodBody(createForecastLineSchema) dto: any,
  ) {
    return this.aiService.createForecastLine(
      req.user.tenantId,
      scenarioId,
      dto,
    );
  }

  @Patch("forecast-lines/:id")
  @Permissions("finance.ai-analytics.manage")
  @ApiOperation({ summary: "Update forecast line" })
  async updateForecastLine(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @ZodBody(createForecastLineSchema.partial()) dto: any,
  ) {
    return this.aiService.updateForecastLine(req.user.tenantId, id, dto);
  }

  @Get("forecast-lines/:id/variance")
  @Permissions("finance.ai-analytics.read")
  @ApiOperation({ summary: "Compute forecast line variance" })
  async computeForecastLineVariance(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.aiService.computeForecastLineVariance(req.user.tenantId, id);
  }

  @Post("forecast-lines/update-with-actuals")
  @Permissions("finance.ai-analytics.manage")
  @ApiOperation({ summary: "Update forecast lines with actuals" })
  async updateForecastLineWithActuals(
    @Req() req: AuthenticatedRequest,
    @ZodBody(z.object({ scenarioId: z.string().min(1) })) dto: any,
  ) {
    return this.aiService.updateForecastLineWithActuals(
      req.user.tenantId,
      dto.scenarioId,
    );
  }

  @Delete("forecast-lines/:id")
  @Permissions("finance.ai-analytics.manage")
  @ApiOperation({ summary: "Delete forecast line" })
  async deleteForecastLine(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.aiService.deleteForecastLine(req.user.tenantId, id);
  }

  @Post("anomaly-detection-runs")
  @Permissions("finance.ai-analytics.manage")
  @ApiOperation({ summary: "Create anomaly detection run" })
  async createAnomalyDetectionRun(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createAnomalyDetectionRunSchema) dto: any,
  ) {
    return this.aiService.createAnomalyDetectionRun(req.user.tenantId, dto);
  }

  @Get("anomaly-detection-runs")
  @Permissions("finance.ai-analytics.read")
  @ApiOperation({ summary: "List anomaly detection runs" })
  async listAnomalyDetectionRuns(
    @Req() req: AuthenticatedRequest,
    @Query("status") status?: string,
  ) {
    return this.aiService.listAnomalyDetectionRuns(req.user.tenantId, status);
  }

  @Get("anomaly-detection-runs/:id")
  @Permissions("finance.ai-analytics.read")
  @ApiOperation({ summary: "Get anomaly detection run" })
  async getAnomalyDetectionRun(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.aiService.getAnomalyDetectionRun(req.user.tenantId, id);
  }

  @Post("anomaly-detection-runs/:id/execute")
  @Permissions("finance.ai-analytics.manage")
  @ApiOperation({ summary: "Execute anomaly scan" })
  async executeAnomalyScan(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.aiService.executeAnomalyScan(req.user.tenantId, id);
  }

  @Delete("anomaly-detection-runs/:id")
  @Permissions("finance.ai-analytics.manage")
  @ApiOperation({ summary: "Delete anomaly detection run" })
  async deleteAnomalyDetectionRun(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.aiService.deleteAnomalyDetectionRun(req.user.tenantId, id);
  }

  @Get("anomaly-results")
  @Permissions("finance.ai-analytics.read")
  @ApiOperation({ summary: "List anomaly results" })
  async listAnomalyResults(
    @Req() req: AuthenticatedRequest,
    @Query("runId") runId: string,
  ) {
    return this.aiService.listAnomalyResults(req.user.tenantId, runId);
  }

  @Get("anomaly-results/:id")
  @Permissions("finance.ai-analytics.read")
  @ApiOperation({ summary: "Get anomaly result" })
  async getAnomalyResult(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.aiService.getAnomalyResult(req.user.tenantId, id);
  }

  @Post("anomaly-results/:id/review")
  @Permissions("finance.ai-analytics.manage")
  @ApiOperation({ summary: "Review anomaly result" })
  async reviewAnomalyResult(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.aiService.reviewAnomalyResult(
      req.user.tenantId,
      id,
      req.user.userId,
    );
  }

  @Post("anomaly-results/:id/dismiss")
  @Permissions("finance.ai-analytics.manage")
  @ApiOperation({ summary: "Dismiss anomaly result" })
  async dismissAnomalyResult(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.aiService.dismissAnomalyResult(
      req.user.tenantId,
      id,
      req.user.userId,
    );
  }

  @Post("anomaly-results/:id/resolve")
  @Permissions("finance.ai-analytics.manage")
  @ApiOperation({ summary: "Resolve anomaly result" })
  async resolveAnomalyResult(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.aiService.resolveAnomalyResult(
      req.user.tenantId,
      id,
      req.user.userId,
    );
  }

  @Post("gl-coding-suggestions")
  @Permissions("finance.ai-analytics.manage")
  @ApiOperation({ summary: "Create GL coding suggestion" })
  async createGlCodingSuggestion(
    @Req() req: AuthenticatedRequest,
    @ZodBody(createGlCodingSuggestionSchema) dto: any,
  ) {
    return this.aiService.createGlCodingSuggestion(req.user.tenantId, dto);
  }

  @Get("gl-coding-suggestions")
  @Permissions("finance.ai-analytics.read")
  @ApiOperation({ summary: "List GL coding suggestions" })
  async listGlCodingSuggestions(
    @Req() req: AuthenticatedRequest,
    @Query("sourceType") sourceType?: string,
  ) {
    return this.aiService.listGlCodingSuggestions(
      req.user.tenantId,
      sourceType,
    );
  }

  @Get("gl-coding-suggestions/:id")
  @Permissions("finance.ai-analytics.read")
  @ApiOperation({ summary: "Get GL coding suggestion" })
  async getGlCodingSuggestion(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.aiService.getGlCodingSuggestion(req.user.tenantId, id);
  }

  @Post("gl-coding-suggestions/:id/accept")
  @Permissions("finance.ai-analytics.manage")
  @ApiOperation({ summary: "Accept GL coding suggestion" })
  async acceptGlCodingSuggestion(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.aiService.acceptGlCodingSuggestion(
      req.user.tenantId,
      id,
      req.user.userId,
    );
  }

  @Post("gl-coding-suggestions/:id/reject")
  @Permissions("finance.ai-analytics.manage")
  @ApiOperation({ summary: "Reject GL coding suggestion" })
  async rejectGlCodingSuggestion(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.aiService.rejectGlCodingSuggestion(req.user.tenantId, id);
  }

  @Post("nlp-queries")
  @Permissions("finance.ai-analytics.manage")
  @ApiOperation({ summary: "Log NLP query" })
  async logNlpQuery(
    @Req() req: AuthenticatedRequest,
    @ZodBody(logNlpQuerySchema) dto: any,
  ) {
    return this.aiService.logNlpQuery(req.user.tenantId, dto);
  }

  @Get("nlp-queries")
  @Permissions("finance.ai-analytics.read")
  @ApiOperation({ summary: "List NLP query logs" })
  async listNlpQueryLogs(
    @Req() req: AuthenticatedRequest,
    @Query("parsedIntent") parsedIntent?: string,
  ) {
    return this.aiService.listNlpQueryLogs(req.user.tenantId, parsedIntent);
  }

  @Get("nlp-queries/analytics")
  @Permissions("finance.ai-analytics.read")
  @ApiOperation({ summary: "Get NLP query analytics" })
  async getNlpQueryAnalytics(@Req() req: AuthenticatedRequest) {
    return this.aiService.getNlpQueryAnalytics(req.user.tenantId);
  }

  @Get("dashboard")
  @Permissions("finance.ai-analytics.read")
  @ApiOperation({ summary: "Get AI analytics dashboard" })
  async getAiAnalyticsDashboard(@Req() req: AuthenticatedRequest) {
    return this.aiService.getAiAnalyticsDashboard(req.user.tenantId);
  }
}
