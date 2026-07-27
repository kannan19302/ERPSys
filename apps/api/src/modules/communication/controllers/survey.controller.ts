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
import { JwtAuthGuard } from "../../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../../common/guards/rbac.guard";
import { Permissions } from "../../../common/decorators/permissions.decorator";
import { CommunicationSurveyService } from "../services/communication-survey.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string };
}

@ApiTags("communication-survey")
@ApiBearerAuth()
@Controller("communication/surveys")
@UseGuards(JwtAuthGuard, RbacGuard)
export class SurveyController {
  constructor(private readonly svc: CommunicationSurveyService) {}

  @Get()
  @Permissions("communication.survey.read")
  @ApiOperation({ summary: "List surveys" })
  async getSurveys(@Req() req: AuthReq, @Query() q: any) {
    return this.svc.getSurveys(req.user.tenantId, q);
  }

  @Get(":id")
  @Permissions("communication.survey.read")
  @ApiOperation({ summary: "Get survey" })
  async getSurvey(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.getSurvey(req.user.tenantId, id);
  }

  @Post()
  @Permissions("communication.survey.create")
  @ApiOperation({ summary: "Create survey" })
  async createSurvey(@Req() req: AuthReq, @Body() body: any) {
    return this.svc.createSurvey(req.user.tenantId, req.user.userId, body.body);
  }

  @Patch(":id")
  @Permissions("communication.survey.update")
  @ApiOperation({ summary: "Update survey" })
  async updateSurvey(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.svc.updateSurvey(req.user.tenantId, id, body.body);
  }

  @Post(":id/publish")
  @Permissions("communication.survey.update")
  @ApiOperation({ summary: "Publish survey" })
  async publishSurvey(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.publishSurvey(req.user.tenantId, id);
  }

  @Delete(":id")
  @Permissions("communication.survey.delete")
  @ApiOperation({ summary: "Delete survey" })
  async deleteSurvey(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.deleteSurvey(req.user.tenantId, id);
  }

  @Post(":id/questions")
  @Permissions("communication.survey.create")
  @ApiOperation({ summary: "Add question to survey" })
  async addQuestion(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.svc.addQuestion(req.user.tenantId, id, body.body);
  }

  @Patch("questions/:questionId")
  @Permissions("communication.survey.update")
  @ApiOperation({ summary: "Update question" })
  async updateQuestion(
    @Req() req: AuthReq,
    @Param("questionId") questionId: string,
    @Body() body: any,
  ) {
    return this.svc.updateQuestion(req.user.tenantId, questionId, body.body);
  }

  @Delete("questions/:questionId")
  @Permissions("communication.survey.delete")
  @ApiOperation({ summary: "Delete question" })
  async deleteQuestion(
    @Req() req: AuthReq,
    @Param("questionId") questionId: string,
  ) {
    return this.svc.deleteQuestion(req.user.tenantId, questionId);
  }

  @Post(":id/responses")
  @Permissions("communication.survey.create")
  @ApiOperation({ summary: "Submit survey response" })
  async collectResponse(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.svc.collectResponse(req.user.tenantId, id, body.body);
  }

  @Get(":id/analysis")
  @Permissions("communication.survey.read")
  @ApiOperation({ summary: "Analyze survey results" })
  async analyzeResults(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.analyzeResults(req.user.tenantId, id);
  }

  @Get("dashboard")
  @Permissions("communication.survey.read")
  @ApiOperation({ summary: "Survey dashboard" })
  async getDashboard(@Req() req: AuthReq) {
    return this.svc.getSurveyDashboard(req.user.tenantId);
  }

  @Get("templates")
  @Permissions("communication.survey.read")
  @ApiOperation({ summary: "List survey templates" })
  async getTemplates(
    @Req() req: AuthReq,
    @Query("category") category?: string,
  ) {
    return this.svc.getSurveyTemplates(req.user.tenantId, category);
  }

  @Post("templates")
  @Permissions("communication.survey.create")
  @ApiOperation({ summary: "Create survey template" })
  async createTemplate(@Req() req: AuthReq, @Body() body: any) {
    return this.svc.createSurveyTemplate(
      req.user.tenantId,
      req.user.userId,
      body.body,
    );
  }

  @Delete("templates/:id")
  @Permissions("communication.survey.delete")
  @ApiOperation({ summary: "Delete survey template" })
  async deleteTemplate(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.deleteSurveyTemplate(req.user.tenantId, id);
  }
}
