import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  UseGuards,
  Req,
  Query,
  Body,
} from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { HrTalentService } from "./hr-talent.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

interface AuthenticatedRequest extends Request {
  user: {
    tenantId: string;
    userId: string;
    email: string;
    roles: string[];
    orgId?: string;
  };
}

@ApiTags("hr-advanced-talent")
@ApiBearerAuth()
@Controller("hr-advanced/talent")
@UseGuards(JwtAuthGuard, RbacGuard)
export class HrTalentController {
  constructor(private readonly hrTalentService: HrTalentService) {}

  // ══ LEARNING COURSES ══

  @Get("learning-courses")
  @Permissions("hr.learning.courses.read")
  @ApiOperation({
    summary: "List learning courses with pagination and filters",
  })
  async getLearningCourses(@Req() req: AuthenticatedRequest, @Query() q: any) {
    return this.hrTalentService.getLearningCourses(req.user.tenantId, q);
  }

  @Get("learning-courses/:id")
  @Permissions("hr.learning.courses.read")
  @ApiOperation({ summary: "Get learning course by ID" })
  async getLearningCourseById(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrTalentService.getLearningCourseById(req.user.tenantId, id);
  }

  @Post("learning-courses")
  @Permissions("hr.learning.courses.create")
  @ApiOperation({ summary: "Create learning course" })
  async createLearningCourse(
    @Req() req: AuthenticatedRequest,
    @Body() dto: any,
  ) {
    return this.hrTalentService.createLearningCourse(req.user.tenantId, dto);
  }

  @Patch("learning-courses/:id")
  @Permissions("hr.learning.courses.update")
  @ApiOperation({ summary: "Update learning course" })
  async updateLearningCourse(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.hrTalentService.updateLearningCourse(
      req.user.tenantId,
      id,
      dto,
    );
  }

  @Delete("learning-courses/:id")
  @Permissions("hr.learning.courses.delete")
  @ApiOperation({ summary: "Delete learning course" })
  async deleteLearningCourse(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrTalentService.deleteLearningCourse(req.user.tenantId, id);
  }

  // ══ LEARNING MODULES ══

  @Get("learning-modules")
  @Permissions("hr.learning.courses.read")
  @ApiOperation({ summary: "List learning modules, optionally by courseId" })
  async getLearningModules(
    @Req() req: AuthenticatedRequest,
    @Query("courseId") courseId?: string,
  ) {
    return this.hrTalentService.getLearningModules(req.user.tenantId, courseId);
  }

  @Post("learning-modules")
  @Permissions("hr.learning.courses.create")
  @ApiOperation({ summary: "Create learning module" })
  async createLearningModule(
    @Req() req: AuthenticatedRequest,
    @Body() dto: any,
  ) {
    return this.hrTalentService.createLearningModule(req.user.tenantId, dto);
  }

  @Patch("learning-modules/:id")
  @Permissions("hr.learning.courses.update")
  @ApiOperation({ summary: "Update learning module" })
  async updateLearningModule(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.hrTalentService.updateLearningModule(
      req.user.tenantId,
      id,
      dto,
    );
  }

  @Delete("learning-modules/:id")
  @Permissions("hr.learning.courses.delete")
  @ApiOperation({ summary: "Delete learning module" })
  async deleteLearningModule(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrTalentService.deleteLearningModule(req.user.tenantId, id);
  }

  // ══ LEARNING ENROLLMENTS ══

  @Get("learning-enrollments")
  @Permissions("hr.learning.enrollments.read")
  @ApiOperation({ summary: "List learning enrollments" })
  async getLearningEnrollments(
    @Req() req: AuthenticatedRequest,
    @Query("employeeId") employeeId?: string,
    @Query("courseId") courseId?: string,
  ) {
    return this.hrTalentService.getEnrollments(
      req.user.tenantId,
      employeeId,
      courseId,
    );
  }

  @Post("learning-enrollments")
  @Permissions("hr.learning.enrollments.create")
  @ApiOperation({ summary: "Create learning enrollment" })
  async createLearningEnrollment(
    @Req() req: AuthenticatedRequest,
    @Body() dto: any,
  ) {
    return this.hrTalentService.enrollInCourse(req.user.tenantId, dto);
  }

  @Patch("learning-enrollments/:id/status")
  @Permissions("hr.learning.enrollments.update")
  @ApiOperation({ summary: "Update learning enrollment status" })
  async updateEnrollmentStatus(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body("status") status: string,
  ) {
    return this.hrTalentService.updateEnrollment(req.user.tenantId, id, {
      status,
    });
  }

  @Patch("learning-enrollments/:id/progress")
  @Permissions("hr.learning.enrollments.update")
  @ApiOperation({ summary: "Update learning enrollment progress" })
  async updateEnrollmentProgress(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body("progressPct") progressPct: number,
    @Body("score") score?: number,
  ) {
    return this.hrTalentService.updateEnrollment(req.user.tenantId, id, {
      progressPct,
      score,
    });
  }

  // ══ CERTIFICATIONS ══

  @Get("certifications")
  @Permissions("hr.certifications.read")
  @ApiOperation({ summary: "List certifications" })
  async getCertifications(
    @Req() req: AuthenticatedRequest,
    @Query("employeeId") employeeId?: string,
  ) {
    return this.hrTalentService.getCertifications(
      req.user.tenantId,
      employeeId,
    );
  }

  @Post("certifications")
  @Permissions("hr.certifications.create")
  @ApiOperation({ summary: "Create certification" })
  async createCertification(
    @Req() req: AuthenticatedRequest,
    @Body() dto: any,
  ) {
    return this.hrTalentService.createCertification(req.user.tenantId, dto);
  }

  @Patch("certifications/:id")
  @Permissions("hr.certifications.update")
  @ApiOperation({ summary: "Update certification" })
  async updateCertification(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.hrTalentService.updateCertification(req.user.tenantId, id, dto);
  }

  @Delete("certifications/:id")
  @Permissions("hr.certifications.delete")
  @ApiOperation({ summary: "Delete certification" })
  async deleteCertification(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrTalentService.deleteCertification(req.user.tenantId, id);
  }

  @Get("certifications/expiring")
  @Permissions("hr.certifications.read")
  @ApiOperation({ summary: "List certifications" })
  async getExpiringCertifications(
    @Req() req: AuthenticatedRequest,
    @Query("employeeId") employeeId?: string,
  ) {
    return this.hrTalentService.getCertifications(
      req.user.tenantId,
      employeeId,
    );
  }

  // ══ SKILLS ══

  @Get("skills")
  @Permissions("hr.skills.read")
  @ApiOperation({ summary: "List skill matrices" })
  async getSkills(
    @Req() req: AuthenticatedRequest,
    @Query("category") category?: string,
  ) {
    return this.hrTalentService.getSkills(req.user.tenantId, category);
  }

  @Post("skills")
  @Permissions("hr.skills.create")
  @ApiOperation({ summary: "Create skill matrix" })
  async createSkill(@Req() req: AuthenticatedRequest, @Body() dto: any) {
    return this.hrTalentService.createSkill(req.user.tenantId, dto);
  }

  @Patch("skills/:id")
  @Permissions("hr.skills.update")
  @ApiOperation({ summary: "Update skill matrix" })
  async updateSkill(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.hrTalentService.updateSkill(req.user.tenantId, id, dto);
  }

  @Delete("skills/:id")
  @Permissions("hr.skills.delete")
  @ApiOperation({ summary: "Delete skill matrix" })
  async deleteSkill(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.hrTalentService.deleteSkill(req.user.tenantId, id);
  }

  // ══ SKILL GAP ANALYSES ══

  @Get("skill-gap-analyses")
  @Permissions("hr.skills.read")
  @ApiOperation({ summary: "List skill gap analyses" })
  async getGapAnalyses(@Req() req: AuthenticatedRequest, @Query() q: any) {
    return this.hrTalentService.getGapAnalyses(req.user.tenantId, q);
  }

  @Post("skill-gap-analyses")
  @Permissions("hr.skills.create")
  @ApiOperation({ summary: "Create skill gap analysis" })
  async createGapAnalysis(@Req() req: AuthenticatedRequest, @Body() dto: any) {
    return this.hrTalentService.createGapAnalysis(req.user.tenantId, dto);
  }

  @Patch("skill-gap-analyses/:id")
  @Permissions("hr.skills.update")
  @ApiOperation({ summary: "Update skill gap analysis" })
  async updateGapAnalysis(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.hrTalentService.updateGapAnalysis(req.user.tenantId, id, dto);
  }

  @Patch("skill-gap-analyses/:id/close")
  @Permissions("hr.skills.update")
  @ApiOperation({ summary: "Close skill gap analysis" })
  async closeGapAnalysis(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
  ) {
    return this.hrTalentService.updateGapAnalysis(req.user.tenantId, id, {
      isClosed: true,
    });
  }

  // ══ CAREER PATHS ══

  @Get("career-paths")
  @Permissions("hr.career.paths.read")
  @ApiOperation({ summary: "List career paths" })
  async getCareerPaths(@Req() req: AuthenticatedRequest) {
    return this.hrTalentService.getCareerPaths(req.user.tenantId);
  }

  @Post("career-paths")
  @Permissions("hr.career.paths.create")
  @ApiOperation({ summary: "Create career path" })
  async createCareerPath(@Req() req: AuthenticatedRequest, @Body() dto: any) {
    return this.hrTalentService.createCareerPath(req.user.tenantId, dto);
  }

  @Patch("career-paths/:id")
  @Permissions("hr.career.paths.update")
  @ApiOperation({ summary: "Update career path" })
  async updateCareerPath(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.hrTalentService.updateCareerPath(req.user.tenantId, id, dto);
  }

  @Post("career-paths/:id/requirements")
  @Permissions("hr.career.paths.update")
  @ApiOperation({ summary: "Add requirement to career path" })
  async addRequirement(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.hrTalentService.addRequirement(req.user.tenantId, id, dto);
  }

  // ══ MENTORING PROGRAMS ══

  @Get("mentoring-programs")
  @Permissions("hr.mentoring.programs.read")
  @ApiOperation({ summary: "List mentoring programs" })
  async getPrograms(@Req() req: AuthenticatedRequest) {
    return this.hrTalentService.getPrograms(req.user.tenantId);
  }

  @Post("mentoring-programs")
  @Permissions("hr.mentoring.programs.create")
  @ApiOperation({ summary: "Create mentoring program" })
  async createProgram(@Req() req: AuthenticatedRequest, @Body() dto: any) {
    return this.hrTalentService.createProgram(req.user.tenantId, dto);
  }

  @Patch("mentoring-programs/:id")
  @Permissions("hr.mentoring.programs.update")
  @ApiOperation({ summary: "Update mentoring program" })
  async updateProgram(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.hrTalentService.updateProgram(req.user.tenantId, id, dto);
  }

  // ══ MENTORING SESSIONS ══

  @Get("mentoring-sessions")
  @Permissions("hr.mentoring.sessions.read")
  @ApiOperation({ summary: "List mentoring sessions" })
  async getSessions(
    @Req() req: AuthenticatedRequest,
    @Query("programId") programId?: string,
  ) {
    return this.hrTalentService.getSessions(req.user.tenantId, programId);
  }

  @Post("mentoring-sessions")
  @Permissions("hr.mentoring.sessions.create")
  @ApiOperation({ summary: "Create mentoring session" })
  async createSession(@Req() req: AuthenticatedRequest, @Body() dto: any) {
    return this.hrTalentService.createSession(req.user.tenantId, dto);
  }

  @Patch("mentoring-sessions/:id")
  @Permissions("hr.mentoring.sessions.update")
  @ApiOperation({ summary: "Update mentoring session" })
  async updateSession(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.hrTalentService.updateSession(req.user.tenantId, id, dto);
  }

  @Patch("mentoring-sessions/:id/complete")
  @Permissions("hr.mentoring.sessions.update")
  @ApiOperation({ summary: "Complete mentoring session" })
  async completeSession(
    @Req() req: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() dto: any,
  ) {
    return this.hrTalentService.completeSession(req.user.tenantId, id, dto);
  }
}
