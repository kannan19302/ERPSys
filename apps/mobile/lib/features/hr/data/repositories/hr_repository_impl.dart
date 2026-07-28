import '../../../../core/contracts/paginated.dart';
import '../../../../core/error/error_mapper.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/storage/response_cache.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/hr.dart';
import '../../domain/repositories/hr_repository.dart';
import '../datasources/hr_remote_data_source.dart';
import '../models/hr_models.dart';

class HrRepositoryImpl implements HrRepository {
  const HrRepositoryImpl({
    required HrRemoteDataSource remote,
    required ResponseCache cache,
    required String tenantId,
  })  : _remote = remote,
        _cache = cache,
        _tenantId = tenantId;

  static const String _empNamespace = 'hr.employees';
  static const String _deptNamespace = 'hr.departments';
  static const String _leaveNamespace = 'hr.leave-requests';
  static const String _attNamespace = 'hr.attendance';
  static const String _tsNamespace = 'hr.timesheets';
  static const String _prNamespace = 'hr.payroll-runs';
  static const String _psNamespace = 'hr.payslips';
  static const String _ssNamespace = 'hr.salary-structures';
  static const String _dashboardNamespace = 'hr.dashboard';

  final HrRemoteDataSource _remote;
  final ResponseCache _cache;
  final String _tenantId;

  // ── Generics ───────────────────────────────────────────────────────────

  Future<Result<Cacheable<Paginated<T>>>> _paginated<T, M>(
    Future<Paginated<M>> Function() fetch,
    Paginated<T> Function(Paginated<M>) map,
    String namespace,
    String cacheKey,
  ) async {
    try {
      final Paginated<M> page = await fetch();
      await _cache.write(_tenantId, namespace, cacheKey, <String, Object?>{
        'data': page.data.map((M m) => (m as dynamic).toJson()).toList(),
        'meta': page.meta.toJson(),
      });
      return Result<Cacheable<Paginated<T>>>.ok(
        Cacheable<Paginated<T>>(value: map(page)),
      );
    } on NetworkException catch (error) {
      final cached =
          _cache.read<Map<String, dynamic>>(_tenantId, namespace, cacheKey);
      if (cached == null) {
        return Result<Cacheable<Paginated<T>>>.err(
          mapExceptionToFailure(error),
        );
      }
      return Result<Cacheable<Paginated<T>>>.ok(
        Cacheable<Paginated<T>>(
          value: Paginated<T>.fromJson(
            cached.value,
            (Map<String, dynamic> j) =>
                (namespace == _empNamespace
                    ? EmployeeModel.fromJson(j)
                    : namespace == _deptNamespace
                        ? DepartmentModel.fromJson(j)
                        : namespace == _leaveNamespace
                            ? LeaveRequestModel.fromJson(j)
                            : namespace == _attNamespace
                                ? AttendanceModel.fromJson(j)
                                : namespace == _tsNamespace
                                    ? TimesheetModel.fromJson(j)
                                    : namespace == _prNamespace
                                        ? PayrollRunModel.fromJson(j)
                                        : namespace == _psNamespace
                                            ? PayslipModel.fromJson(j)
                                            : SalaryStructureModel.fromJson(j))
                    as T,
          ),
          cachedAt: cached.cachedAt,
        ),
      );
    } on Object catch (error) {
      return Result<Cacheable<Paginated<T>>>.err(
        mapExceptionToFailure(error),
      );
    }
  }

  Future<Result<T>> _single<T>(
    Future<T> Function() fetch,
    String namespace,
    String cacheKey,
  ) async {
    try {
      return Result<T>.ok(await fetch());
    } on NetworkException catch (error) {
      final cached =
          _cache.read<Map<String, dynamic>>(_tenantId, namespace, cacheKey);
      if (cached == null) {
        return Result<T>.err(mapExceptionToFailure(error));
      }
      return Result<T>.ok(
        (namespace == _dashboardNamespace
            ? HrDashboardStatsModel.fromJson(cached.value)
            : _parseSingle(namespace, cached.value)) as T,
      );
    } on Object catch (error) {
      return Result<T>.err(mapExceptionToFailure(error));
    }
  }

  dynamic _parseSingle(String namespace, Map<String, dynamic> json) =>
      switch (namespace) {
        _empNamespace => EmployeeModel.fromJson(json),
        _deptNamespace => DepartmentModel.fromJson(json),
        _leaveNamespace => LeaveRequestModel.fromJson(json),
        _tsNamespace => TimesheetModel.fromJson(json),
        _prNamespace => PayrollRunModel.fromJson(json),
        _psNamespace => PayslipModel.fromJson(json),
        _ => json,
      };

  Future<Result<T>> _write<T>(
    Future<T> Function() fetch,
  ) async {
    try {
      final T result = await fetch();
      await _cache.clearTenant(_tenantId);
      return Result<T>.ok(result);
    } on Object catch (error) {
      return Result<T>.err(mapExceptionToFailure(error));
    }
  }

  Future<Result<void>> _delete(
    Future<void> Function() delete,
  ) async {
    try {
      await delete();
      await _cache.clearTenant(_tenantId);
      return const Result<void>.ok(null);
    } on Object catch (error) {
      return Result<void>.err(mapExceptionToFailure(error));
    }
  }

  // ── Employees ─────────────────────────────────────────────────────────

  @override
  Future<Result<Cacheable<Paginated<Employee>>>> listEmployees(
    ListQuery query,
  ) =>
      _paginated<Employee, EmployeeModel>(
        () => _remote.listEmployees(query),
        (Paginated<EmployeeModel> p) => Paginated<Employee>(
          data: p.data,
          meta: p.meta,
        ),
        _empNamespace,
        query.cacheKey,
      );

  @override
  Future<Result<Employee>> getEmployee(String id) =>
      _single<Employee>(() => _remote.getEmployee(id), _empNamespace, id);

  @override
  Future<Result<Employee>> createEmployee(Map<String, dynamic> payload) =>
      _write<Employee>(() => _remote.createEmployee(payload));

  @override
  Future<Result<Employee>> updateEmployee(
    String id,
    Map<String, dynamic> payload,
  ) =>
      _write<Employee>(() => _remote.updateEmployee(id, payload));

  @override
  Future<Result<void>> deleteEmployee(String id) =>
      _delete(() => _remote.deleteEmployee(id));

  // ── Departments ───────────────────────────────────────────────────────

  @override
  Future<Result<Cacheable<Paginated<Department>>>> listDepartments(
    ListQuery query,
  ) =>
      _paginated<Department, DepartmentModel>(
        () => _remote.listDepartments(query),
        (Paginated<DepartmentModel> p) => Paginated<Department>(
          data: p.data,
          meta: p.meta,
        ),
        _deptNamespace,
        query.cacheKey,
      );

  @override
  Future<Result<Department>> getDepartment(String id) =>
      _single<Department>(
        () => _remote.getDepartment(id),
        _deptNamespace,
        id,
      );

  @override
  Future<Result<Department>> createDepartment(Map<String, dynamic> payload) =>
      _write<Department>(() => _remote.createDepartment(payload));

  @override
  Future<Result<Department>> updateDepartment(
    String id,
    Map<String, dynamic> payload,
  ) =>
      _write<Department>(() => _remote.updateDepartment(id, payload));

  // ── Leave ─────────────────────────────────────────────────────────────

  @override
  Future<Result<Cacheable<Paginated<LeaveRequest>>>> listLeaveRequests(
    ListQuery query,
  ) =>
      _paginated<LeaveRequest, LeaveRequestModel>(
        () => _remote.listLeaveRequests(query),
        (Paginated<LeaveRequestModel> p) => Paginated<LeaveRequest>(
          data: p.data,
          meta: p.meta,
        ),
        _leaveNamespace,
        query.cacheKey,
      );

  @override
  Future<Result<LeaveRequest>> getLeaveRequest(String id) =>
      _single<LeaveRequest>(
        () => _remote.getLeaveRequest(id),
        _leaveNamespace,
        id,
      );

  @override
  Future<Result<LeaveRequest>> createLeaveRequest(
    Map<String, dynamic> payload,
  ) =>
      _write<LeaveRequest>(() => _remote.createLeaveRequest(payload));

  @override
  Future<Result<LeaveRequest>> approveLeave(String id) =>
      _write<LeaveRequest>(() => _remote.approveLeave(id));

  @override
  Future<Result<LeaveRequest>> rejectLeave(String id) =>
      _write<LeaveRequest>(() => _remote.rejectLeave(id));

  // ── Leave types ───────────────────────────────────────────────────────

  @override
  Future<Result<List<LeaveType>>> listLeaveTypes() async {
    try {
      final List<LeaveType> types = await _remote.listLeaveTypes();
      return Result<List<LeaveType>>.ok(types);
    } on Object catch (error) {
      return Result<List<LeaveType>>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<LeaveType>> createLeaveType(Map<String, dynamic> payload) =>
      _write<LeaveType>(() => _remote.createLeaveType(payload));

  // ── Attendance ────────────────────────────────────────────────────────

  @override
  Future<Result<Cacheable<Paginated<Attendance>>>> listAttendance(
    ListQuery query,
  ) =>
      _paginated<Attendance, AttendanceModel>(
        () => _remote.listAttendance(query),
        (Paginated<AttendanceModel> p) => Paginated<Attendance>(
          data: p.data,
          meta: p.meta,
        ),
        _attNamespace,
        query.cacheKey,
      );

  @override
  Future<Result<Attendance>> createAttendance(Map<String, dynamic> payload) =>
      _write<Attendance>(() => _remote.createAttendance(payload));

  @override
  Future<Result<Attendance>> updateAttendance(
    String id,
    Map<String, dynamic> payload,
  ) =>
      _write<Attendance>(() => _remote.updateAttendance(id, payload));

  // ── Timesheets ────────────────────────────────────────────────────────

  @override
  Future<Result<Cacheable<Paginated<Timesheet>>>> listTimesheets(
    ListQuery query,
  ) =>
      _paginated<Timesheet, TimesheetModel>(
        () => _remote.listTimesheets(query),
        (Paginated<TimesheetModel> p) => Paginated<Timesheet>(
          data: p.data,
          meta: p.meta,
        ),
        _tsNamespace,
        query.cacheKey,
      );

  @override
  Future<Result<Timesheet>> getTimesheet(String id) => _single<Timesheet>(
        () => _remote.getTimesheet(id),
        _tsNamespace,
        id,
      );

  @override
  Future<Result<Timesheet>> updateTimesheet(
    String id,
    Map<String, dynamic> payload,
  ) =>
      _write<Timesheet>(() => _remote.updateTimesheet(id, payload));

  @override
  Future<Result<Timesheet>> submitTimesheet(String id) =>
      _write<Timesheet>(() => _remote.submitTimesheet(id));

  @override
  Future<Result<Timesheet>> approveTimesheet(String id) =>
      _write<Timesheet>(() => _remote.approveTimesheet(id));

  // ── Payroll ───────────────────────────────────────────────────────────

  @override
  Future<Result<PayrollRun>> createPayrollRun(Map<String, dynamic> payload) =>
      _write<PayrollRun>(() => _remote.createPayrollRun(payload));

  @override
  Future<Result<Cacheable<Paginated<PayrollRun>>>> listPayrollRuns(
    ListQuery query,
  ) =>
      _paginated<PayrollRun, PayrollRunModel>(
        () => _remote.listPayrollRuns(query),
        (Paginated<PayrollRunModel> p) => Paginated<PayrollRun>(
          data: p.data,
          meta: p.meta,
        ),
        _prNamespace,
        query.cacheKey,
      );

  @override
  Future<Result<PayrollRun>> getPayrollRun(String id) => _single<PayrollRun>(
        () => _remote.getPayrollRun(id),
        _prNamespace,
        id,
      );

  @override
  Future<Result<PayrollRun>> reversePayrollRun(String id) =>
      _write<PayrollRun>(() => _remote.reversePayrollRun(id));

  // ── Payslips ──────────────────────────────────────────────────────────

  @override
  Future<Result<Cacheable<Paginated<Payslip>>>> listPayslips(
    ListQuery query,
  ) =>
      _paginated<Payslip, PayslipModel>(
        () => _remote.listPayslips(query),
        (Paginated<PayslipModel> p) => Paginated<Payslip>(
          data: p.data,
          meta: p.meta,
        ),
        _psNamespace,
        query.cacheKey,
      );

  @override
  Future<Result<Payslip>> getPayslip(String id) => _single<Payslip>(
        () => _remote.getPayslip(id),
        _psNamespace,
        id,
      );

  // ── Salary structures ─────────────────────────────────────────────────

  @override
  Future<Result<Cacheable<Paginated<SalaryStructure>>>>
      listSalaryStructures(ListQuery query) =>
          _paginated<SalaryStructure, SalaryStructureModel>(
            () => _remote.listSalaryStructures(query),
            (Paginated<SalaryStructureModel> p) => Paginated<SalaryStructure>(
              data: p.data,
              meta: p.meta,
            ),
            _ssNamespace,
            query.cacheKey,
          );

  @override
  Future<Result<SalaryStructure>> createSalaryStructure(
    Map<String, dynamic> payload,
  ) =>
      _write<SalaryStructure>(() => _remote.createSalaryStructure(payload));

  // ── Org chart & dashboard ─────────────────────────────────────────────

  @override
  Future<Result<List<OrgChartNode>>> getOrgChart() async {
    try {
      final List<OrgChartNode> nodes = await _remote.getOrgChart();
      return Result<List<OrgChartNode>>.ok(nodes);
    } on Object catch (error) {
      return Result<List<OrgChartNode>>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<HrDashboardStats>> getHrDashboard() =>
      _single<HrDashboardStats>(
        () => _remote.getHrDashboard(),
        _dashboardNamespace,
        'current',
      );
}
