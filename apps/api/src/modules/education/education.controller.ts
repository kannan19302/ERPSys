import { Controller, Get, Post, Put, Param, Query, Body, UseGuards, Req } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { EducationService } from "./education.service";
import { Request } from "express";

interface AuthRequest extends Request { user: { tenantId: string; userId: string }; }

@Controller("ext/education")
@UseGuards(JwtAuthGuard, RbacGuard)
export class EducationController {
  constructor(private readonly svc: EducationService) {}

  // ── Students ──
  @Get("students")
  @Permissions("education.student.read")
  async getStudents(@Req() req: AuthRequest) { return this.svc.getStudents(req.user.tenantId); }

  @Get("students/:id")
  @Permissions("education.student.read")
  async getStudent(@Req() req: AuthRequest, @Param("id") id: string) { return this.svc.getStudentById(req.user.tenantId, id); }

  @Post("students")
  @Permissions("education.student.create")
  async createStudent(@Req() req: AuthRequest, @Body() body: any) { return this.svc.createStudent(req.user.tenantId, body); }

  @Put("students/:id")
  @Permissions("education.student.update")
  async updateStudent(@Req() req: AuthRequest, @Param("id") id: string, @Body() body: any) { return this.svc.updateStudent(req.user.tenantId, id, body); }

  // ── Courses ──
  @Get("courses")
  @Permissions("education.course.read")
  async getCourses(@Req() req: AuthRequest) { return this.svc.getCourses(req.user.tenantId); }

  @Get("courses/:id")
  @Permissions("education.course.read")
  async getCourse(@Req() req: AuthRequest, @Param("id") id: string) { return this.svc.getCourseById(req.user.tenantId, id); }

  @Post("courses")
  @Permissions("education.course.create")
  async createCourse(@Req() req: AuthRequest, @Body() body: any) { return this.svc.createCourse(req.user.tenantId, body); }

  // ── Fee Structures ──
  @Get("fee-structures")
  @Permissions("education.fee.read")
  async getFeeStructures(@Req() req: AuthRequest) { return this.svc.getFeeStructures(req.user.tenantId); }

  @Post("fee-structures")
  @Permissions("education.fee.create")
  async createFeeStructure(@Req() req: AuthRequest, @Body() body: any) { return this.svc.createFeeStructure(req.user.tenantId, body); }

  // ── Student Fees ──
  @Get("student-fees")
  @Permissions("education.fee.read")
  async getStudentFees(@Req() req: AuthRequest) { return this.svc.getStudentFees(req.user.tenantId); }

  // ── Books ──
  @Get("books")
  @Permissions("education.library.read")
  async getBooks(@Req() req: AuthRequest) { return this.svc.getBooks(req.user.tenantId); }

  @Post("books")
  @Permissions("education.library.create")
  async createBook(@Req() req: AuthRequest, @Body() body: any) { return this.svc.createBook(req.user.tenantId, body); }

  @Post("books/checkout")
  @Permissions("education.library.create")
  async checkoutBook(@Req() req: AuthRequest, @Body() body: any) { return this.svc.checkoutBook(req.user.tenantId, body); }

  // ── Book Transactions ──
  @Get("book-transactions")
  @Permissions("education.library.read")
  async getBookTransactions(@Req() req: AuthRequest) { return this.svc.getBookTransactions(req.user.tenantId); }

  // ── Timetables ──
  @Get("timetables")
  @Permissions("education.timetable.read")
  async getTimetables(@Req() req: AuthRequest) { return this.svc.getTimetables(req.user.tenantId); }

  @Post("timetables")
  @Permissions("education.timetable.manage")
  async createTimetable(@Req() req: AuthRequest, @Body() body: any) { return this.svc.createTimetable(req.user.tenantId, body); }

  // ── Attendance ──
  @Get("attendance")
  @Permissions("education.attendance.read")
  async getAttendance(@Req() req: AuthRequest, @Query("studentId") studentId?: string, @Query("courseId") courseId?: string, @Query("date") date?: string) {
    return this.svc.getAttendance(req.user.tenantId, { studentId, courseId, date });
  }

  // ── Grades ──
  @Get("grades")
  @Permissions("education.grade.read")
  async getGrades(@Req() req: AuthRequest, @Query("studentId") studentId?: string, @Query("courseId") courseId?: string) {
    return this.svc.getGrades(req.user.tenantId, { studentId, courseId });
  }
}
