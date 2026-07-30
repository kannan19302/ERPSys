import '../../../../core/contracts/paginated.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_paths.dart';
import '../models/hr_models.dart';

abstract class HrRemoteDataSource {
  // Employees
  Future<Paginated<EmployeeModel>> listEmployees(ListQuery query);
  Future<EmployeeModel> getEmployee(String id);
  Future<EmployeeModel> createEmployee(Map<String, dynamic> payload);
  Future<EmployeeModel> updateEmployee(String id, Map<String, dynamic> payload);
  Future<void> deleteEmployee(String id);

  // Departments
  Future<Paginated<DepartmentModel>> listDepartments(ListQuery query);
  Future<DepartmentModel> getDepartment(String id);
  Future<DepartmentModel> createDepartment(Map<String, dynamic> payload);
  Future<DepartmentModel> updateDepartment(
    String id,
    Map<String, dynamic> payload,
  );

  // Leave
  Future<Paginated<LeaveRequestModel>> listLeaveRequests(ListQuery query);
  Future<LeaveRequestModel> getLeaveRequest(String id);
  Future<LeaveRequestModel> createLeaveRequest(Map<String, dynamic> payload);
  Future<LeaveRequestModel> approveLeave(String id);
  Future<LeaveRequestModel> rejectLeave(String id);

  // Leave types
  Future<List<LeaveTypeModel>> listLeaveTypes();
  Future<LeaveTypeModel> createLeaveType(Map<String, dynamic> payload);

  // Attendance
  Future<Paginated<AttendanceModel>> listAttendance(ListQuery query);
  Future<AttendanceModel> createAttendance(Map<String, dynamic> payload);
  Future<AttendanceModel> updateAttendance(
    String id,
    Map<String, dynamic> payload,
  );

  // Timesheets
  Future<Paginated<TimesheetModel>> listTimesheets(ListQuery query);
  Future<TimesheetModel> getTimesheet(String id);
  Future<TimesheetModel> updateTimesheet(
    String id,
    Map<String, dynamic> payload,
  );
  Future<TimesheetModel> submitTimesheet(String id);
  Future<TimesheetModel> approveTimesheet(String id);

  // Payroll
  Future<PayrollRunModel> createPayrollRun(Map<String, dynamic> payload);
  Future<Paginated<PayrollRunModel>> listPayrollRuns(ListQuery query);
  Future<PayrollRunModel> getPayrollRun(String id);
  Future<PayrollRunModel> reversePayrollRun(String id);

  // Payslips
  Future<Paginated<PayslipModel>> listPayslips(ListQuery query);
  Future<PayslipModel> getPayslip(String id);

  // Salary structures
  Future<Paginated<SalaryStructureModel>> listSalaryStructures(ListQuery query);
  Future<SalaryStructureModel> createSalaryStructure(
    Map<String, dynamic> payload,
  );

  // Departure & resignation (placeholder)

  // Performance reviews
  Future<Paginated<PerformanceReviewModel>> listPerformanceReviews(
    ListQuery query,
  );
  Future<PerformanceReviewModel> getPerformanceReview(String id);
  Future<PerformanceReviewModel> createPerformanceReview(
    Map<String, dynamic> payload,
  );
  Future<PerformanceReviewModel> updatePerformanceReview(
    String id,
    Map<String, dynamic> payload,
  );
  Future<PerformanceReviewModel> submitPerformanceReview(String id);

  // Leave allocations
  Future<Paginated<LeaveAllocationModel>> listLeaveAllocations(
    ListQuery query,
  );

  // Org chart & dashboard
  Future<List<OrgChartNodeModel>> getOrgChart();
  Future<HrDashboardStatsModel> getHrDashboard();
}

class HrRemoteDataSourceImpl implements HrRemoteDataSource {
  const HrRemoteDataSourceImpl(this._client);

  final ApiClient _client;

  // ── Employees ──

  @override
  Future<Paginated<EmployeeModel>> listEmployees(ListQuery query) =>
      _client.getPaginated<EmployeeModel>(
        ApiPaths.employees,
        query,
        EmployeeModel.fromJson,
      );

  @override
  Future<EmployeeModel> getEmployee(String id) async =>
      EmployeeModel.fromJson(await _client.getObject(ApiPaths.employee(id)));

  @override
  Future<EmployeeModel> createEmployee(Map<String, dynamic> payload) async =>
      EmployeeModel.fromJson(
        await _client.post(ApiPaths.employees, body: payload),
      );

  @override
  Future<EmployeeModel> updateEmployee(
    String id,
    Map<String, dynamic> payload,
  ) async =>
      EmployeeModel.fromJson(
        await _client.patch(ApiPaths.employee(id), body: payload),
      );

  @override
  Future<void> deleteEmployee(String id) =>
      _client.delete(ApiPaths.employee(id));

  // ── Departments ──

  @override
  Future<Paginated<DepartmentModel>> listDepartments(ListQuery query) =>
      _client.getPaginated<DepartmentModel>(
        ApiPaths.departments,
        query,
        DepartmentModel.fromJson,
      );

  @override
  Future<DepartmentModel> getDepartment(String id) async =>
      DepartmentModel.fromJson(
        await _client.getObject(ApiPaths.department(id)),
      );

  @override
  Future<DepartmentModel> createDepartment(
    Map<String, dynamic> payload,
  ) async =>
      DepartmentModel.fromJson(
        await _client.post(ApiPaths.departments, body: payload),
      );

  @override
  Future<DepartmentModel> updateDepartment(
    String id,
    Map<String, dynamic> payload,
  ) async =>
      DepartmentModel.fromJson(
        await _client.patch(ApiPaths.department(id), body: payload),
      );

  // ── Leave ──

  @override
  Future<Paginated<LeaveRequestModel>> listLeaveRequests(ListQuery query) =>
      _client.getPaginated<LeaveRequestModel>(
        ApiPaths.leaveRequests,
        query,
        LeaveRequestModel.fromJson,
      );

  @override
  Future<LeaveRequestModel> getLeaveRequest(String id) async =>
      LeaveRequestModel.fromJson(
        await _client.getObject(ApiPaths.leaveRequest(id)),
      );

  @override
  Future<LeaveRequestModel> createLeaveRequest(
    Map<String, dynamic> payload,
  ) async =>
      LeaveRequestModel.fromJson(
        await _client.post(ApiPaths.leaveRequests, body: payload),
      );

  @override
  Future<LeaveRequestModel> approveLeave(String id) async =>
      LeaveRequestModel.fromJson(
        await _client.post(ApiPaths.leaveRequestApprove(id)),
      );

  @override
  Future<LeaveRequestModel> rejectLeave(String id) async =>
      LeaveRequestModel.fromJson(
        await _client.post(ApiPaths.leaveRequestReject(id)),
      );

  // ── Leave types ──

  @override
  Future<List<LeaveTypeModel>> listLeaveTypes() async {
    final List<Map<String, dynamic>> items =
        await _client.getList(ApiPaths.leaveTypes);
    return items.map(LeaveTypeModel.fromJson).toList(growable: false);
  }

  @override
  Future<LeaveTypeModel> createLeaveType(Map<String, dynamic> payload) async =>
      LeaveTypeModel.fromJson(
        await _client.post(ApiPaths.leaveTypes, body: payload),
      );

  // ── Attendance ──

  @override
  Future<Paginated<AttendanceModel>> listAttendance(ListQuery query) =>
      _client.getPaginated<AttendanceModel>(
        ApiPaths.attendance,
        query,
        AttendanceModel.fromJson,
      );

  @override
  Future<AttendanceModel> createAttendance(
    Map<String, dynamic> payload,
  ) async =>
      AttendanceModel.fromJson(
        await _client.post(ApiPaths.attendance, body: payload),
      );

  @override
  Future<AttendanceModel> updateAttendance(
    String id,
    Map<String, dynamic> payload,
  ) async =>
      AttendanceModel.fromJson(
        await _client.patch(ApiPaths.attendanceRecord(id), body: payload),
      );

  // ── Timesheets ──

  @override
  Future<Paginated<TimesheetModel>> listTimesheets(ListQuery query) =>
      _client.getPaginated<TimesheetModel>(
        ApiPaths.timesheets,
        query,
        TimesheetModel.fromJson,
      );

  @override
  Future<TimesheetModel> getTimesheet(String id) async =>
      TimesheetModel.fromJson(
        await _client.getObject(ApiPaths.timesheet(id)),
      );

  @override
  Future<TimesheetModel> updateTimesheet(
    String id,
    Map<String, dynamic> payload,
  ) async =>
      TimesheetModel.fromJson(
        await _client.patch(ApiPaths.timesheet(id), body: payload),
      );

  @override
  Future<TimesheetModel> submitTimesheet(String id) async =>
      TimesheetModel.fromJson(
        await _client.post(ApiPaths.timesheetSubmit(id)),
      );

  @override
  Future<TimesheetModel> approveTimesheet(String id) async =>
      TimesheetModel.fromJson(
        await _client.post(ApiPaths.timesheetApprove(id)),
      );

  // ── Payroll ──

  @override
  Future<PayrollRunModel> createPayrollRun(Map<String, dynamic> payload) async =>
      PayrollRunModel.fromJson(
        await _client.post(ApiPaths.payrollRun, body: payload),
      );

  @override
  Future<Paginated<PayrollRunModel>> listPayrollRuns(ListQuery query) =>
      _client.getPaginated<PayrollRunModel>(
        ApiPaths.payrollRuns,
        query,
        PayrollRunModel.fromJson,
      );

  @override
  Future<PayrollRunModel> getPayrollRun(String id) async =>
      PayrollRunModel.fromJson(
        await _client.getObject(ApiPaths.payrollRunDetail(id)),
      );

  @override
  Future<PayrollRunModel> reversePayrollRun(String id) async =>
      PayrollRunModel.fromJson(
        await _client.post(ApiPaths.payrollRunReverse(id)),
      );

  // ── Payslips ──

  @override
  Future<Paginated<PayslipModel>> listPayslips(ListQuery query) =>
      _client.getPaginated<PayslipModel>(
        ApiPaths.payslips,
        query,
        PayslipModel.fromJson,
      );

  @override
  Future<PayslipModel> getPayslip(String id) async =>
      PayslipModel.fromJson(await _client.getObject(ApiPaths.payslip(id)));

  // ── Salary structures ──

  @override
  Future<Paginated<SalaryStructureModel>> listSalaryStructures(
    ListQuery query,
  ) =>
      _client.getPaginated<SalaryStructureModel>(
        ApiPaths.salaryStructures,
        query,
        SalaryStructureModel.fromJson,
      );

  @override
  Future<SalaryStructureModel> createSalaryStructure(
    Map<String, dynamic> payload,
  ) async =>
      SalaryStructureModel.fromJson(
        await _client.post(ApiPaths.salaryStructures, body: payload),
      );

  // ── Performance reviews ──

  @override
  Future<Paginated<PerformanceReviewModel>> listPerformanceReviews(
    ListQuery query,
  ) =>
      _client.getPaginated<PerformanceReviewModel>(
        ApiPaths.performanceReviews,
        query,
        PerformanceReviewModel.fromJson,
      );

  @override
  Future<PerformanceReviewModel> getPerformanceReview(String id) async =>
      PerformanceReviewModel.fromJson(
        await _client.getObject(ApiPaths.performanceReview(id)),
      );

  @override
  Future<PerformanceReviewModel> createPerformanceReview(
    Map<String, dynamic> payload,
  ) async =>
      PerformanceReviewModel.fromJson(
        await _client.post(ApiPaths.performanceReviews, body: payload),
      );

  @override
  Future<PerformanceReviewModel> updatePerformanceReview(
    String id,
    Map<String, dynamic> payload,
  ) async =>
      PerformanceReviewModel.fromJson(
        await _client.patch(ApiPaths.performanceReview(id), body: payload),
      );

  @override
  Future<PerformanceReviewModel> submitPerformanceReview(String id) async =>
      PerformanceReviewModel.fromJson(
        await _client.post(ApiPaths.performanceReviewSubmit(id)),
      );

  // ── Leave allocations ──

  @override
  Future<Paginated<LeaveAllocationModel>> listLeaveAllocations(
    ListQuery query,
  ) =>
      _client.getPaginated<LeaveAllocationModel>(
        ApiPaths.leaveRequests,
        query,
        LeaveAllocationModel.fromJson,
      );

  // ── Org chart & dashboard ──

  @override
  Future<List<OrgChartNodeModel>> getOrgChart() async {
    final List<Map<String, dynamic>> items =
        await _client.getList(ApiPaths.orgChart);
    return items.map(OrgChartNodeModel.fromJson).toList(growable: false);
  }

  @override
  Future<HrDashboardStatsModel> getHrDashboard() async =>
      HrDashboardStatsModel.fromJson(
        await _client.getObject(ApiPaths.hrDashboard),
      );
}
