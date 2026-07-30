// @ts-nocheck
import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RbacGuard } from "../../common/guards/rbac.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { EducationStudentsService } from "./services/students.service";
import { EducationCoursesService } from "./services/courses.service";
import { EducationGradesService } from "./services/grades.service";
import { EducationAttendanceService } from "./services/attendance.service";
import { EducationFeesService } from "./services/fees.service";
import { EducationLibraryService } from "./services/library.service";
import { EducationTimetableService } from "./services/timetable.service";
import { EducationExamsService } from "./services/exams.service";
import { Request } from "express";

interface AuthRequest extends Request {
  user: { tenantId: string; userId: string };
}

@Controller("ext/education/deep")
@UseGuards(JwtAuthGuard, RbacGuard)
export class EducationDeepController {
  constructor(
    private readonly studentsSvc: EducationStudentsService,
    private readonly coursesSvc: EducationCoursesService,
    private readonly gradesSvc: EducationGradesService,
    private readonly attendanceSvc: EducationAttendanceService,
    private readonly feesSvc: EducationFeesService,
    private readonly librarySvc: EducationLibraryService,
    private readonly timetableSvc: EducationTimetableService,
    private readonly examsSvc: EducationExamsService,
  ) {}

  // ── Students ──
  @Get("students")
  @Permissions("education.students.read")
  async getStudents(@Req() req: AuthRequest) {
    return this.studentsSvc.findAll(req.user.tenantId);
  }

  @Get("students/search")
  @Permissions("education.students.read")
  async searchStudents(@Req() req: AuthRequest, @Query("q") q: string) {
    return this.studentsSvc.search(req.user.tenantId, q);
  }

  @Get("students/:id")
  @Permissions("education.students.read")
  async getStudent(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.studentsSvc.findById(req.user.tenantId, id);
  }

  @Post("students")
  @Permissions("education.students.create")
  async createStudent(@Req() req: AuthRequest, @Body() body: any) {
    return this.studentsSvc.create(req.user.tenantId, body);
  }

  @Put("students/:id")
  @Permissions("education.students.update")
  async updateStudent(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.studentsSvc.update(req.user.tenantId, id, body);
  }

  @Delete("students/:id")
  @Permissions("education.students.delete")
  async deleteStudent(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.studentsSvc.delete(req.user.tenantId, id);
  }

  // ── Parents ──
  @Get("parents")
  @Permissions("education.students.read")
  async getParents(@Req() req: AuthRequest) {
    return this.studentsSvc.getParents(req.user.tenantId);
  }

  @Post("parents")
  @Permissions("education.students.create")
  async createParent(@Req() req: AuthRequest, @Body() body: any) {
    return this.studentsSvc.createParent(req.user.tenantId, body);
  }

  // ── Courses ──
  @Get("courses")
  @Permissions("education.courses.read")
  async getCourses(@Req() req: AuthRequest) {
    return this.coursesSvc.findAll(req.user.tenantId);
  }

  @Get("courses/:id")
  @Permissions("education.courses.read")
  async getCourse(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.coursesSvc.findById(req.user.tenantId, id);
  }

  @Post("courses")
  @Permissions("education.courses.create")
  async createCourse(@Req() req: AuthRequest, @Body() body: any) {
    return this.coursesSvc.create(req.user.tenantId, body);
  }

  @Put("courses/:id")
  @Permissions("education.courses.update")
  async updateCourse(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.coursesSvc.update(req.user.tenantId, id, body);
  }

  @Delete("courses/:id")
  @Permissions("education.courses.delete")
  async deleteCourse(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.coursesSvc.delete(req.user.tenantId, id);
  }

  // ── Course Modules ──
  @Post("courses/:courseId/modules")
  @Permissions("education.courses.update")
  async addModule(
    @Req() req: AuthRequest,
    @Param("courseId") courseId: string,
    @Body() body: any,
  ) {
    return this.coursesSvc.addModule(req.user.tenantId, courseId, body);
  }

  @Put("course-modules/:id")
  @Permissions("education.courses.update")
  async updateModule(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.coursesSvc.updateModule(req.user.tenantId, id, body);
  }

  @Delete("course-modules/:id")
  @Permissions("education.courses.update")
  async removeModule(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.coursesSvc.removeModule(req.user.tenantId, id);
  }

  // ── Enrollments ──
  @Get("courses/:courseId/enrollments")
  @Permissions("education.enrollments.read")
  async getEnrollments(
    @Req() req: AuthRequest,
    @Param("courseId") courseId: string,
  ) {
    return this.coursesSvc.getEnrollments(req.user.tenantId, courseId);
  }

  @Post("enrollments")
  @Permissions("education.enrollments.create")
  async createEnrollment(@Req() req: AuthRequest, @Body() body: any) {
    return this.coursesSvc.createEnrollment(req.user.tenantId, body);
  }

  @Patch("enrollments/:id/status")
  @Permissions("education.enrollments.update")
  async updateEnrollmentStatus(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body("status") status: string,
  ) {
    return this.coursesSvc.updateEnrollmentStatus(
      req.user.tenantId,
      id,
      status,
    );
  }

  // ── Gradebooks ──
  @Get("gradebooks")
  @Permissions("education.grades.read")
  async getGradebooks(
    @Req() req: AuthRequest,
    @Query("courseId") courseId?: string,
  ) {
    return this.gradesSvc.getGradebooks(req.user.tenantId, courseId);
  }

  @Post("gradebooks")
  @Permissions("education.grades.create")
  async createGradebook(@Req() req: AuthRequest, @Body() body: any) {
    return this.gradesSvc.createGradebook(req.user.tenantId, body);
  }

  @Put("gradebooks/:id")
  @Permissions("education.grades.update")
  async updateGradebook(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.gradesSvc.updateGradebook(req.user.tenantId, id, body);
  }

  @Delete("gradebooks/:id")
  @Permissions("education.grades.delete")
  async deleteGradebook(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.gradesSvc.deleteGradebook(req.user.tenantId, id);
  }

  // ── Grade Entries ──
  @Get("gradebooks/:gradebookId/entries")
  @Permissions("education.grades.read")
  async getGradeEntries(
    @Req() req: AuthRequest,
    @Param("gradebookId") gradebookId: string,
  ) {
    return this.gradesSvc.getGradeEntries(req.user.tenantId, gradebookId);
  }

  @Post("gradebooks/:gradebookId/entries")
  @Permissions("education.grades.create")
  async upsertGradeEntry(
    @Req() req: AuthRequest,
    @Param("gradebookId") gradebookId: string,
    @Body() body: any,
  ) {
    return this.gradesSvc.upsertGradeEntry(
      req.user.tenantId,
      gradebookId,
      body,
    );
  }

  @Post("gradebooks/:gradebookId/bulk")
  @Permissions("education.grades.create")
  async bulkUpsertGrades(
    @Req() req: AuthRequest,
    @Param("gradebookId") gradebookId: string,
    @Body() body: any,
  ) {
    return this.gradesSvc.bulkUpsertGrades(
      req.user.tenantId,
      gradebookId,
      body.entries,
    );
  }

  // ── Legacy Grades ──
  @Get("grades")
  @Permissions("education.grades.read")
  async getGrades(
    @Req() req: AuthRequest,
    @Query("studentId") studentId?: string,
    @Query("courseId") courseId?: string,
  ) {
    return this.gradesSvc.getLegacyGrades(req.user.tenantId, {
      studentId,
      courseId,
    });
  }

  @Post("grades")
  @Permissions("education.grades.create")
  async createGrade(@Req() req: AuthRequest, @Body() body: any) {
    return this.gradesSvc.createLegacyGrade(req.user.tenantId, body);
  }

  @Get("students/:studentId/grade-summary")
  @Permissions("education.grades.read")
  async getStudentGradeSummary(
    @Req() req: AuthRequest,
    @Param("studentId") studentId: string,
  ) {
    return this.gradesSvc.getStudentGradeSummary(req.user.tenantId, studentId);
  }

  // ── Attendance Sessions ──
  @Get("attendance/sessions")
  @Permissions("education.attendance.read")
  async getAttendanceSessions(
    @Req() req: AuthRequest,
    @Query("courseId") courseId?: string,
  ) {
    return this.attendanceSvc.getSessions(req.user.tenantId, courseId);
  }

  @Post("attendance/sessions")
  @Permissions("education.attendance.create")
  async createAttendanceSession(@Req() req: AuthRequest, @Body() body: any) {
    return this.attendanceSvc.createSession(req.user.tenantId, body);
  }

  @Get("attendance/sessions/:id")
  @Permissions("education.attendance.read")
  async getAttendanceSession(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.attendanceSvc.getSessionById(req.user.tenantId, id);
  }

  @Post("attendance/sessions/:id/mark")
  @Permissions("education.attendance.create")
  async markAttendance(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.attendanceSvc.markAttendance(
      req.user.tenantId,
      id,
      body.records,
    );
  }

  // ── Attendance Records ──
  @Get("attendance/records")
  @Permissions("education.attendance.read")
  async getAttendanceRecords(
    @Req() req: AuthRequest,
    @Query("studentId") studentId?: string,
    @Query("courseId") courseId?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    return this.attendanceSvc.getRecords(req.user.tenantId, {
      studentId,
      courseId,
      from,
      to,
    });
  }

  @Get("students/:studentId/attendance-summary")
  @Permissions("education.attendance.read")
  async getStudentAttendanceSummary(
    @Req() req: AuthRequest,
    @Param("studentId") studentId: string,
  ) {
    return this.attendanceSvc.getStudentSummary(req.user.tenantId, studentId);
  }

  // ── Fee Structures ──
  @Get("fee-structures")
  @Permissions("education.fees.read")
  async getFeeStructures(@Req() req: AuthRequest) {
    return this.feesSvc.getFeeStructures(req.user.tenantId);
  }

  @Post("fee-structures")
  @Permissions("education.fees.create")
  async createFeeStructure(@Req() req: AuthRequest, @Body() body: any) {
    return this.feesSvc.createFeeStructure(req.user.tenantId, body);
  }

  @Put("fee-structures/:id")
  @Permissions("education.fees.update")
  async updateFeeStructure(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.feesSvc.updateFeeStructure(req.user.tenantId, id, body);
  }

  // ── Student Fees ──
  @Get("student-fees")
  @Permissions("education.fees.read")
  async getStudentFees(@Req() req: AuthRequest) {
    return this.feesSvc.getStudentFees(req.user.tenantId);
  }

  @Post("student-fees")
  @Permissions("education.fees.create")
  async assignStudentFee(@Req() req: AuthRequest, @Body() body: any) {
    return this.feesSvc.assignStudentFee(req.user.tenantId, body);
  }

  // ── Fee Invoices ──
  @Get("invoices")
  @Permissions("education.fees.read")
  async getInvoices(
    @Req() req: AuthRequest,
    @Query("studentId") studentId?: string,
    @Query("status") status?: string,
  ) {
    return this.feesSvc.getInvoices(req.user.tenantId, { studentId, status });
  }

  @Post("invoices")
  @Permissions("education.fees.create")
  async createInvoice(@Req() req: AuthRequest, @Body() body: any) {
    return this.feesSvc.createInvoice(req.user.tenantId, body);
  }

  @Post("invoices/:id/payments")
  @Permissions("education.fees.create")
  async recordPayment(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.feesSvc.recordPayment(req.user.tenantId, id, body);
  }

  @Get("payments")
  @Permissions("education.fees.read")
  async getPayments(
    @Req() req: AuthRequest,
    @Query("studentId") studentId?: string,
  ) {
    return this.feesSvc.getPaymentHistory(req.user.tenantId, studentId);
  }

  // ── Library Books ──
  @Get("books")
  @Permissions("education.library.read")
  async getBooks(@Req() req: AuthRequest) {
    return this.librarySvc.getBooks(req.user.tenantId);
  }

  @Get("books/search")
  @Permissions("education.library.read")
  async searchBooks(@Req() req: AuthRequest, @Query("q") q: string) {
    return this.librarySvc.searchBooks(req.user.tenantId, q);
  }

  @Get("books/:id")
  @Permissions("education.library.read")
  async getBook(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.librarySvc.getBookById(req.user.tenantId, id);
  }

  @Post("books")
  @Permissions("education.library.create")
  async createBook(@Req() req: AuthRequest, @Body() body: any) {
    return this.librarySvc.createBook(req.user.tenantId, body);
  }

  @Put("books/:id")
  @Permissions("education.library.update")
  async updateBook(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.librarySvc.updateBook(req.user.tenantId, id, body);
  }

  @Delete("books/:id")
  @Permissions("education.library.delete")
  async deleteBook(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.librarySvc.deleteBook(req.user.tenantId, id);
  }

  // ── Book Transactions ──
  @Post("books/:bookId/checkout")
  @Permissions("education.library.create")
  async checkoutBook(
    @Req() req: AuthRequest,
    @Param("bookId") bookId: string,
    @Body() body: any,
  ) {
    return this.librarySvc.checkout(
      req.user.tenantId,
      body.studentId,
      bookId,
      body.dueDate,
    );
  }

  @Post("books/return/:transactionId")
  @Permissions("education.library.create")
  async returnBook(
    @Req() req: AuthRequest,
    @Param("transactionId") transactionId: string,
  ) {
    return this.librarySvc.returnBook(req.user.tenantId, transactionId);
  }

  @Get("transactions")
  @Permissions("education.library.read")
  async getTransactions(@Req() req: AuthRequest) {
    return this.librarySvc.getTransactions(req.user.tenantId);
  }

  // ── Library Fines ──
  @Get("fines")
  @Permissions("education.library.read")
  async getFines(
    @Req() req: AuthRequest,
    @Query("studentId") studentId?: string,
  ) {
    return this.librarySvc.getFines(req.user.tenantId, studentId);
  }

  @Post("fines/:id/pay")
  @Permissions("education.library.update")
  async payFine(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.librarySvc.payFine(req.user.tenantId, id);
  }

  @Post("fines/:id/waive")
  @Permissions("education.library.update")
  async waiveFine(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.librarySvc.waiveFine(req.user.tenantId, id);
  }

  // ── Timetables ──
  @Get("timetables")
  @Permissions("education.timetable.read")
  async getTimetables(@Req() req: AuthRequest) {
    return this.timetableSvc.findAll(req.user.tenantId);
  }

  @Get("timetables/:id")
  @Permissions("education.timetable.read")
  async getTimetable(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.timetableSvc.findById(req.user.tenantId, id);
  }

  @Post("timetables")
  @Permissions("education.timetable.create")
  async createTimetable(@Req() req: AuthRequest, @Body() body: any) {
    return this.timetableSvc.create(req.user.tenantId, body);
  }

  @Put("timetables/:id")
  @Permissions("education.timetable.update")
  async updateTimetable(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.timetableSvc.update(req.user.tenantId, id, body);
  }

  @Delete("timetables/:id")
  @Permissions("education.timetable.delete")
  async deleteTimetable(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.timetableSvc.delete(req.user.tenantId, id);
  }

  @Get("timetables/by-day/:weekday")
  @Permissions("education.timetable.read")
  async getTimetableByDay(
    @Req() req: AuthRequest,
    @Param("weekday") weekday: string,
  ) {
    return this.timetableSvc.getByDay(req.user.tenantId, weekday);
  }

  @Get("timetables/by-course/:courseId")
  @Permissions("education.timetable.read")
  async getTimetableByCourse(
    @Req() req: AuthRequest,
    @Param("courseId") courseId: string,
  ) {
    return this.timetableSvc.getByCourse(req.user.tenantId, courseId);
  }

  // ── Exam Schedules ──
  @Get("exams")
  @Permissions("education.exams.read")
  async getExams(
    @Req() req: AuthRequest,
    @Query("courseId") courseId?: string,
  ) {
    return this.examsSvc.findAll(req.user.tenantId, courseId);
  }

  @Get("exams/:id")
  @Permissions("education.exams.read")
  async getExam(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.examsSvc.findById(req.user.tenantId, id);
  }

  @Post("exams")
  @Permissions("education.exams.create")
  async createExam(@Req() req: AuthRequest, @Body() body: any) {
    return this.examsSvc.create(req.user.tenantId, body);
  }

  @Put("exams/:id")
  @Permissions("education.exams.update")
  async updateExam(
    @Req() req: AuthRequest,
    @Param("id") id: string,
    @Body() body: any,
  ) {
    return this.examsSvc.update(req.user.tenantId, id, body);
  }

  @Delete("exams/:id")
  @Permissions("education.exams.delete")
  async deleteExam(@Req() req: AuthRequest, @Param("id") id: string) {
    return this.examsSvc.delete(req.user.tenantId, id);
  }

  // ── Exam Results ──
  @Get("exams/:examId/results")
  @Permissions("education.exams.read")
  async getExamResults(
    @Req() req: AuthRequest,
    @Param("examId") examId: string,
  ) {
    return this.examsSvc.getResults(req.user.tenantId, examId);
  }

  @Post("exams/:examId/results")
  @Permissions("education.exams.create")
  async addExamResult(
    @Req() req: AuthRequest,
    @Param("examId") examId: string,
    @Body() body: any,
  ) {
    return this.examsSvc.addResult(req.user.tenantId, examId, body);
  }

  @Post("exams/:examId/bulk-results")
  @Permissions("education.exams.create")
  async bulkAddResults(
    @Req() req: AuthRequest,
    @Param("examId") examId: string,
    @Body() body: any,
  ) {
    return this.examsSvc.bulkAddResults(
      req.user.tenantId,
      examId,
      body.results,
    );
  }
}
