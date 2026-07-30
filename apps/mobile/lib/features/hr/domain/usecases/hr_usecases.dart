import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/hr.dart';
import '../repositories/hr_repository.dart';

// ── Employees ──────────────────────────────────────────────────────────────

class ListEmployeesUseCase
    extends UseCase<Cacheable<Paginated<Employee>>, ListQuery> {
  const ListEmployeesUseCase(this._repository);

  final HrRepository _repository;

  @override
  Future<Result<Cacheable<Paginated<Employee>>>> call(ListQuery params) =>
      _repository.listEmployees(params);
}

class GetEmployeeUseCase extends UseCase<Employee, String> {
  const GetEmployeeUseCase(this._repository);

  final HrRepository _repository;

  @override
  Future<Result<Employee>> call(String id) => _repository.getEmployee(id);
}

class SaveEmployeeParams {
  const SaveEmployeeParams({required this.payload, this.id});

  final String? id;
  final Map<String, dynamic> payload;
}

class SaveEmployeeUseCase extends UseCase<Employee, SaveEmployeeParams> {
  const SaveEmployeeUseCase(this._repository);

  final HrRepository _repository;

  @override
  Future<Result<Employee>> call(SaveEmployeeParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createEmployee(params.payload)
        : _repository.updateEmployee(id, params.payload);
  }
}

class DeleteEmployeeUseCase extends UseCase<void, String> {
  const DeleteEmployeeUseCase(this._repository);

  final HrRepository _repository;

  @override
  Future<Result<void>> call(String id) => _repository.deleteEmployee(id);
}

// ── Departments ────────────────────────────────────────────────────────────

class ListDepartmentsUseCase
    extends UseCase<Cacheable<Paginated<Department>>, ListQuery> {
  const ListDepartmentsUseCase(this._repository);

  final HrRepository _repository;

  @override
  Future<Result<Cacheable<Paginated<Department>>>> call(ListQuery params) =>
      _repository.listDepartments(params);
}

class GetDepartmentUseCase extends UseCase<Department, String> {
  const GetDepartmentUseCase(this._repository);

  final HrRepository _repository;

  @override
  Future<Result<Department>> call(String id) => _repository.getDepartment(id);
}

class SaveDepartmentParams {
  const SaveDepartmentParams({required this.payload, this.id});

  final String? id;
  final Map<String, dynamic> payload;
}

class SaveDepartmentUseCase extends UseCase<Department, SaveDepartmentParams> {
  const SaveDepartmentUseCase(this._repository);

  final HrRepository _repository;

  @override
  Future<Result<Department>> call(SaveDepartmentParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createDepartment(params.payload)
        : _repository.updateDepartment(id, params.payload);
  }
}

// ── Leave Requests ─────────────────────────────────────────────────────────

class ListLeaveRequestsUseCase
    extends UseCase<Cacheable<Paginated<LeaveRequest>>, ListQuery> {
  const ListLeaveRequestsUseCase(this._repository);

  final HrRepository _repository;

  @override
  Future<Result<Cacheable<Paginated<LeaveRequest>>>> call(ListQuery params) =>
      _repository.listLeaveRequests(params);
}

class GetLeaveRequestUseCase extends UseCase<LeaveRequest, String> {
  const GetLeaveRequestUseCase(this._repository);

  final HrRepository _repository;

  @override
  Future<Result<LeaveRequest>> call(String id) =>
      _repository.getLeaveRequest(id);
}

class SaveLeaveRequestParams {
  const SaveLeaveRequestParams({required this.payload, this.id});

  final String? id;
  final Map<String, dynamic> payload;
}

class SaveLeaveRequestUseCase
    extends UseCase<LeaveRequest, SaveLeaveRequestParams> {
  const SaveLeaveRequestUseCase(this._repository);

  final HrRepository _repository;

  @override
  Future<Result<LeaveRequest>> call(SaveLeaveRequestParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createLeaveRequest(params.payload)
        : _repository.approveLeave(id);
  }
}

class ApproveLeaveUseCase extends UseCase<LeaveRequest, String> {
  const ApproveLeaveUseCase(this._repository);

  final HrRepository _repository;

  @override
  Future<Result<LeaveRequest>> call(String id) =>
      _repository.approveLeave(id);
}

class RejectLeaveUseCase extends UseCase<LeaveRequest, String> {
  const RejectLeaveUseCase(this._repository);

  final HrRepository _repository;

  @override
  Future<Result<LeaveRequest>> call(String id) => _repository.rejectLeave(id);
}

// ── Leave Types ────────────────────────────────────────────────────────────

class ListLeaveTypesUseCase extends UseCase<List<LeaveType>, NoParams> {
  const ListLeaveTypesUseCase(this._repository);

  final HrRepository _repository;

  @override
  Future<Result<List<LeaveType>>> call(NoParams params) =>
      _repository.listLeaveTypes();
}

class SaveLeaveTypeParams {
  const SaveLeaveTypeParams({required this.payload, this.id});

  final String? id;
  final Map<String, dynamic> payload;
}

class SaveLeaveTypeUseCase extends UseCase<LeaveType, SaveLeaveTypeParams> {
  const SaveLeaveTypeUseCase(this._repository);

  final HrRepository _repository;

  @override
  Future<Result<LeaveType>> call(SaveLeaveTypeParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createLeaveType(params.payload)
        : _repository.createLeaveType(params.payload);
  }
}

// ── Attendance ─────────────────────────────────────────────────────────────

class ListAttendanceUseCase
    extends UseCase<Cacheable<Paginated<Attendance>>, ListQuery> {
  const ListAttendanceUseCase(this._repository);

  final HrRepository _repository;

  @override
  Future<Result<Cacheable<Paginated<Attendance>>>> call(ListQuery params) =>
      _repository.listAttendance(params);
}

class SaveAttendanceParams {
  const SaveAttendanceParams({required this.payload, this.id});

  final String? id;
  final Map<String, dynamic> payload;
}

class SaveAttendanceUseCase
    extends UseCase<Attendance, SaveAttendanceParams> {
  const SaveAttendanceUseCase(this._repository);

  final HrRepository _repository;

  @override
  Future<Result<Attendance>> call(SaveAttendanceParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createAttendance(params.payload)
        : _repository.updateAttendance(id, params.payload);
  }
}

// ── Timesheets ─────────────────────────────────────────────────────────────

class ListTimesheetsUseCase
    extends UseCase<Cacheable<Paginated<Timesheet>>, ListQuery> {
  const ListTimesheetsUseCase(this._repository);

  final HrRepository _repository;

  @override
  Future<Result<Cacheable<Paginated<Timesheet>>>> call(ListQuery params) =>
      _repository.listTimesheets(params);
}

class GetTimesheetUseCase extends UseCase<Timesheet, String> {
  const GetTimesheetUseCase(this._repository);

  final HrRepository _repository;

  @override
  Future<Result<Timesheet>> call(String id) => _repository.getTimesheet(id);
}

class SaveTimesheetParams {
  const SaveTimesheetParams({required this.payload, this.id});

  final String? id;
  final Map<String, dynamic> payload;
}

class SaveTimesheetUseCase extends UseCase<Timesheet, SaveTimesheetParams> {
  const SaveTimesheetUseCase(this._repository);

  final HrRepository _repository;

  @override
  Future<Result<Timesheet>> call(SaveTimesheetParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.updateTimesheet(id ?? '', params.payload)
        : _repository.updateTimesheet(id, params.payload);
  }
}

class SubmitTimesheetUseCase extends UseCase<Timesheet, String> {
  const SubmitTimesheetUseCase(this._repository);

  final HrRepository _repository;

  @override
  Future<Result<Timesheet>> call(String id) =>
      _repository.submitTimesheet(id);
}

class ApproveTimesheetUseCase extends UseCase<Timesheet, String> {
  const ApproveTimesheetUseCase(this._repository);

  final HrRepository _repository;

  @override
  Future<Result<Timesheet>> call(String id) =>
      _repository.approveTimesheet(id);
}

// ── Payroll ────────────────────────────────────────────────────────────────

class ListPayrollRunsUseCase
    extends UseCase<Cacheable<Paginated<PayrollRun>>, ListQuery> {
  const ListPayrollRunsUseCase(this._repository);

  final HrRepository _repository;

  @override
  Future<Result<Cacheable<Paginated<PayrollRun>>>> call(ListQuery params) =>
      _repository.listPayrollRuns(params);
}

class GetPayrollRunUseCase extends UseCase<PayrollRun, String> {
  const GetPayrollRunUseCase(this._repository);

  final HrRepository _repository;

  @override
  Future<Result<PayrollRun>> call(String id) => _repository.getPayrollRun(id);
}

class SavePayrollRunParams {
  const SavePayrollRunParams({required this.payload, this.id});

  final String? id;
  final Map<String, dynamic> payload;
}

class SavePayrollRunUseCase extends UseCase<PayrollRun, SavePayrollRunParams> {
  const SavePayrollRunUseCase(this._repository);

  final HrRepository _repository;

  @override
  Future<Result<PayrollRun>> call(SavePayrollRunParams params) =>
      _repository.createPayrollRun(params.payload);
}

class ReversePayrollRunUseCase extends UseCase<PayrollRun, String> {
  const ReversePayrollRunUseCase(this._repository);

  final HrRepository _repository;

  @override
  Future<Result<PayrollRun>> call(String id) =>
      _repository.reversePayrollRun(id);
}

// ── Payslips ───────────────────────────────────────────────────────────────

class ListPayslipsUseCase
    extends UseCase<Cacheable<Paginated<Payslip>>, ListQuery> {
  const ListPayslipsUseCase(this._repository);

  final HrRepository _repository;

  @override
  Future<Result<Cacheable<Paginated<Payslip>>>> call(ListQuery params) =>
      _repository.listPayslips(params);
}

class GetPayslipUseCase extends UseCase<Payslip, String> {
  const GetPayslipUseCase(this._repository);

  final HrRepository _repository;

  @override
  Future<Result<Payslip>> call(String id) => _repository.getPayslip(id);
}

// ── Salary Structures ──────────────────────────────────────────────────────

class ListSalaryStructuresUseCase
    extends UseCase<Cacheable<Paginated<SalaryStructure>>, ListQuery> {
  const ListSalaryStructuresUseCase(this._repository);

  final HrRepository _repository;

  @override
  Future<Result<Cacheable<Paginated<SalaryStructure>>>> call(
    ListQuery params,
  ) =>
      _repository.listSalaryStructures(params);
}

// ── Performance Reviews ────────────────────────────────────────────────────

class ListPerformanceReviewsUseCase
    extends UseCase<Cacheable<Paginated<PerformanceReview>>, ListQuery> {
  const ListPerformanceReviewsUseCase(this._repository);

  final HrRepository _repository;

  @override
  Future<Result<Cacheable<Paginated<PerformanceReview>>>> call(
    ListQuery params,
  ) =>
      _repository.listPerformanceReviews(params);
}

class GetPerformanceReviewUseCase extends UseCase<PerformanceReview, String> {
  const GetPerformanceReviewUseCase(this._repository);

  final HrRepository _repository;

  @override
  Future<Result<PerformanceReview>> call(String id) =>
      _repository.getPerformanceReview(id);
}

class SavePerformanceReviewParams {
  const SavePerformanceReviewParams({required this.payload, this.id});

  final String? id;
  final Map<String, dynamic> payload;
}

class SavePerformanceReviewUseCase
    extends UseCase<PerformanceReview, SavePerformanceReviewParams> {
  const SavePerformanceReviewUseCase(this._repository);

  final HrRepository _repository;

  @override
  Future<Result<PerformanceReview>> call(SavePerformanceReviewParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createPerformanceReview(params.payload)
        : _repository.updatePerformanceReview(id, params.payload);
  }
}

class SubmitPerformanceReviewUseCase
    extends UseCase<PerformanceReview, String> {
  const SubmitPerformanceReviewUseCase(this._repository);

  final HrRepository _repository;

  @override
  Future<Result<PerformanceReview>> call(String id) =>
      _repository.submitPerformanceReview(id);
}

// ── Leave Allocations ──────────────────────────────────────────────────────

class ListLeaveAllocationsUseCase
    extends UseCase<Cacheable<Paginated<LeaveAllocation>>, ListQuery> {
  const ListLeaveAllocationsUseCase(this._repository);

  final HrRepository _repository;

  @override
  Future<Result<Cacheable<Paginated<LeaveAllocation>>>> call(
    ListQuery params,
  ) =>
      _repository.listLeaveAllocations(params);
}

// ── Org Chart & Dashboard ──────────────────────────────────────────────────

class GetOrgChartUseCase extends UseCase<List<OrgChartNode>, NoParams> {
  const GetOrgChartUseCase(this._repository);

  final HrRepository _repository;

  @override
  Future<Result<List<OrgChartNode>>> call(NoParams params) =>
      _repository.getOrgChart();
}

class GetHrDashboardUseCase extends UseCase<HrDashboardStats, NoParams> {
  const GetHrDashboardUseCase(this._repository);

  final HrRepository _repository;

  @override
  Future<Result<HrDashboardStats>> call(NoParams params) =>
      _repository.getHrDashboard();
}
