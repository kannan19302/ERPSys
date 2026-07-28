import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../entities/hr.dart';

class Cacheable<T> {
  const Cacheable({required this.value, this.cachedAt});

  final T value;
  final DateTime? cachedAt;

  bool get isFromCache => cachedAt != null;
}

abstract class HrRepository {
  // Employees
  Future<Result<Cacheable<Paginated<Employee>>>> listEmployees(ListQuery query);
  Future<Result<Employee>> getEmployee(String id);
  Future<Result<Employee>> createEmployee(Map<String, dynamic> payload);
  Future<Result<Employee>> updateEmployee(
    String id,
    Map<String, dynamic> payload,
  );
  Future<Result<void>> deleteEmployee(String id);

  // Departments
  Future<Result<Cacheable<Paginated<Department>>>> listDepartments(
    ListQuery query,
  );
  Future<Result<Department>> getDepartment(String id);
  Future<Result<Department>> createDepartment(Map<String, dynamic> payload);
  Future<Result<Department>> updateDepartment(
    String id,
    Map<String, dynamic> payload,
  );

  // Leave
  Future<Result<Cacheable<Paginated<LeaveRequest>>>> listLeaveRequests(
    ListQuery query,
  );
  Future<Result<LeaveRequest>> getLeaveRequest(String id);
  Future<Result<LeaveRequest>> createLeaveRequest(
    Map<String, dynamic> payload,
  );
  Future<Result<LeaveRequest>> approveLeave(String id);
  Future<Result<LeaveRequest>> rejectLeave(String id);

  // Leave types
  Future<Result<List<LeaveType>>> listLeaveTypes();
  Future<Result<LeaveType>> createLeaveType(Map<String, dynamic> payload);

  // Attendance
  Future<Result<Cacheable<Paginated<Attendance>>>> listAttendance(
    ListQuery query,
  );
  Future<Result<Attendance>> createAttendance(Map<String, dynamic> payload);
  Future<Result<Attendance>> updateAttendance(
    String id,
    Map<String, dynamic> payload,
  );

  // Timesheets
  Future<Result<Cacheable<Paginated<Timesheet>>>> listTimesheets(
    ListQuery query,
  );
  Future<Result<Timesheet>> getTimesheet(String id);
  Future<Result<Timesheet>> updateTimesheet(
    String id,
    Map<String, dynamic> payload,
  );
  Future<Result<Timesheet>> submitTimesheet(String id);
  Future<Result<Timesheet>> approveTimesheet(String id);

  // Payroll
  Future<Result<PayrollRun>> createPayrollRun(Map<String, dynamic> payload);
  Future<Result<Cacheable<Paginated<PayrollRun>>>> listPayrollRuns(
    ListQuery query,
  );
  Future<Result<PayrollRun>> getPayrollRun(String id);
  Future<Result<PayrollRun>> reversePayrollRun(String id);

  // Payslips
  Future<Result<Cacheable<Paginated<Payslip>>>> listPayslips(ListQuery query);
  Future<Result<Payslip>> getPayslip(String id);

  // Salary structures
  Future<Result<Cacheable<Paginated<SalaryStructure>>>>
      listSalaryStructures(ListQuery query);
  Future<Result<SalaryStructure>> createSalaryStructure(
    Map<String, dynamic> payload,
  );

  // Org chart & dashboard
  Future<Result<List<OrgChartNode>>> getOrgChart();
  Future<Result<HrDashboardStats>> getHrDashboard();
}
