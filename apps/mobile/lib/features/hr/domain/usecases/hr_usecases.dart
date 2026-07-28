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

// ── Attendance ─────────────────────────────────────────────────────────────

class ListAttendanceUseCase
    extends UseCase<Cacheable<Paginated<Attendance>>, ListQuery> {
  const ListAttendanceUseCase(this._repository);

  final HrRepository _repository;

  @override
  Future<Result<Cacheable<Paginated<Attendance>>>> call(ListQuery params) =>
      _repository.listAttendance(params);
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

// ── Payslips ───────────────────────────────────────────────────────────────

class ListPayslipsUseCase
    extends UseCase<Cacheable<Paginated<Payslip>>, ListQuery> {
  const ListPayslipsUseCase(this._repository);

  final HrRepository _repository;

  @override
  Future<Result<Cacheable<Paginated<Payslip>>>> call(ListQuery params) =>
      _repository.listPayslips(params);
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
