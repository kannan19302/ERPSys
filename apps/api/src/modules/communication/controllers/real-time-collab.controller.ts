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
import { CommunicationRealTimeCollabService } from "../services/communication-real-time-collab.service";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";

interface AuthReq extends Request {
  user: { tenantId: string; userId: string };
}

@ApiTags("communication-realtime-collab")
@ApiBearerAuth()
@Controller("communication/collab")
@UseGuards(JwtAuthGuard, RbacGuard)
export class RealTimeCollabController {
  constructor(private readonly svc: CommunicationRealTimeCollabService) {}

  @Get("documents")
  @Permissions("communication.collab.read")
  @ApiOperation({ summary: "List collaborative documents" })
  async getDocuments(@Req() req: AuthReq, @Query() q: any) {
    return this.svc.getDocuments(req.user.tenantId, req.user.userId, q);
  }

  @Get("documents/:id")
  @Permissions("communication.collab.read")
  @ApiOperation({ summary: "Get document" })
  async getDocument(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.getDocument(req.user.tenantId, id);
  }

  @Post("documents")
  @Permissions("communication.collab.create")
  @ApiOperation({ summary: "Create document" })
  async createDocument(@Req() req: AuthReq, @Body() body: any) {
    return this.svc.createDocument(
      req.user.tenantId,
      req.user.userId,
      body.body,
    );
  }

  @Patch("documents/:id")
  @Permissions("communication.collab.update")
  @ApiOperation({ summary: "Edit document" })
  async editDocument(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.svc.editDocument(
      req.user.tenantId,
      id,
      req.user.userId,
      body.body,
    );
  }

  @Post("documents/:id/lock")
  @Permissions("communication.collab.update")
  @ApiOperation({ summary: "Toggle document lock" })
  async lockDocument(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.lockDocument(req.user.tenantId, id, req.user.userId);
  }

  @Delete("documents/:id")
  @Permissions("communication.collab.delete")
  @ApiOperation({ summary: "Delete document" })
  async deleteDocument(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.deleteDocument(req.user.tenantId, id);
  }

  @Get("documents/:documentId/versions/:version")
  @Permissions("communication.collab.read")
  @ApiOperation({ summary: "Get document version" })
  async getDocumentVersion(
    @Req() req: AuthReq,
    @Param("documentId") documentId: string,
    @Param("version") version: string,
  ) {
    return this.svc.getDocumentVersion(
      req.user.tenantId,
      documentId,
      parseInt(version),
    );
  }

  @Get("whiteboards")
  @Permissions("communication.collab.read")
  @ApiOperation({ summary: "List whiteboards" })
  async getWhiteboards(@Req() req: AuthReq) {
    return this.svc.getWhiteboards(req.user.tenantId, req.user.userId);
  }

  @Get("whiteboards/:id")
  @Permissions("communication.collab.read")
  @ApiOperation({ summary: "Get whiteboard" })
  async getWhiteboard(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.getWhiteboard(req.user.tenantId, id);
  }

  @Post("whiteboards")
  @Permissions("communication.collab.create")
  @ApiOperation({ summary: "Create whiteboard" })
  async createWhiteboard(@Req() req: AuthReq, @Body() body: any) {
    return this.svc.createWhiteboard(
      req.user.tenantId,
      req.user.userId,
      body.body,
    );
  }

  @Post("whiteboards/:id/elements")
  @Permissions("communication.collab.create")
  @ApiOperation({ summary: "Add whiteboard element" })
  async addWhiteboardElement(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.svc.addWhiteboardElement(
      req.user.tenantId,
      id,
      req.user.userId,
      body.body,
    );
  }

  @Patch("whiteboard-elements/:id")
  @Permissions("communication.collab.update")
  @ApiOperation({ summary: "Update whiteboard element" })
  async updateWhiteboardElement(
    @Req() req: AuthReq,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.svc.updateWhiteboardElement(req.user.tenantId, id, body.body);
  }

  @Delete("whiteboard-elements/:id")
  @Permissions("communication.collab.delete")
  @ApiOperation({ summary: "Delete whiteboard element" })
  async deleteWhiteboardElement(@Req() req: AuthReq, @Param("id") id: string) {
    return this.svc.deleteWhiteboardElement(req.user.tenantId, id);
  }

  @Post("co-browse")
  @Permissions("communication.collab.create")
  @ApiOperation({ summary: "Start co-browsing session" })
  async collaborateCoBrowse(@Req() req: AuthReq, @Body() body: any) {
    return this.svc.collaborateCoBrowse(
      req.user.tenantId,
      req.user.userId,
      body.body?.sessionId || "",
    );
  }

  @Get("dashboard")
  @Permissions("communication.collab.read")
  @ApiOperation({ summary: "Collaboration dashboard" })
  async getDashboard(@Req() req: AuthReq) {
    return this.svc.getCollabDashboard(req.user.tenantId, req.user.userId);
  }
}
