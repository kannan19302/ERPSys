import '../../../../core/error/exceptions.dart';
import '../../domain/entities/hr.dart';

double asDouble(Object? value) => switch (value) {
      final num v => v.toDouble(),
      final String v => double.tryParse(v) ?? 0,
      _ => 0,
    };

int asInt(Object? value) => switch (value) {
      final int v => v,
      final num v => v.toInt(),
      final String v => int.tryParse(v) ?? 0,
      _ => 0,
    };

DateTime? parseDate(Object? value) {
  if (value == null) return null;
  if (value is DateTime) return value;
  return DateTime.tryParse('$value');
}

// ── Employee ───────────────────────────────────────────────────────────────

class EmployeeModel extends Employee {
  const EmployeeModel({
    required super.id,
    required super.employeeNumber,
    required super.firstName,
    required super.lastName,
    required super.email,
    super.phone,
    super.department,
    super.departmentId,
    super.position,
    super.status,
    super.hireDate,
    super.salaryMode,
    super.baseSalary,
    super.imageUrl,
    super.supervisorId,
    super.createdAt,
    super.updatedAt,
  });

  factory EmployeeModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('Employee is missing its id');
    return EmployeeModel(
      id: id,
      employeeNumber: json['employeeNumber'] as String? ?? '',
      firstName: json['firstName'] as String? ?? '',
      lastName: json['lastName'] as String? ?? '',
      email: json['email'] as String? ?? '',
      phone: json['phone'] as String?,
      department: json['department'] as String?,
      departmentId: json['departmentId'] as String?,
      position: json['position'] as String?,
      status: json['status'] as String? ?? EmployeeStatus.active,
      hireDate: parseDate(json['hireDate']),
      salaryMode: json['salaryMode'] as String?,
      baseSalary: asDouble(json['baseSalary']),
      imageUrl: json['imageUrl'] as String?,
      supervisorId: json['supervisorId'] as String?,
      createdAt: parseDate(json['createdAt']),
      updatedAt: parseDate(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'employeeNumber': employeeNumber,
        'firstName': firstName,
        'lastName': lastName,
        'email': email,
        'phone': phone,
        'department': department,
        'departmentId': departmentId,
        'position': position,
        'status': status,
        'hireDate': hireDate?.toIso8601String(),
        'salaryMode': salaryMode,
        'baseSalary': baseSalary,
        'imageUrl': imageUrl,
        'supervisorId': supervisorId,
        'createdAt': createdAt?.toIso8601String(),
        'updatedAt': updatedAt?.toIso8601String(),
      };
}

// ── Department ─────────────────────────────────────────────────────────────

class DepartmentModel extends Department {
  const DepartmentModel({
    required super.id,
    required super.name,
    super.headEmployeeId,
    super.headName,
    super.parentDepartmentId,
    super.description,
    super.createdAt,
  });

  factory DepartmentModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('Department is missing its id');
    return DepartmentModel(
      id: id,
      name: json['name'] as String? ?? '',
      headEmployeeId: json['headEmployeeId'] as String?,
      headName: json['headName'] as String?,
      parentDepartmentId: json['parentDepartmentId'] as String?,
      description: json['description'] as String?,
      createdAt: parseDate(json['createdAt']),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'headEmployeeId': headEmployeeId,
        'headName': headName,
        'parentDepartmentId': parentDepartmentId,
        'description': description,
        'createdAt': createdAt?.toIso8601String(),
      };
}

// ── LeaveRequest ───────────────────────────────────────────────────────────

class LeaveRequestModel extends LeaveRequest {
  const LeaveRequestModel({
    required super.id,
    required super.employeeId,
    required super.employeeName,
    required super.leaveTypeId,
    required super.leaveTypeName,
    required super.fromDate,
    required super.toDate,
    required super.days,
    super.status,
    super.reason,
    super.approverId,
    super.approvedAt,
    super.createdAt,
  });

  factory LeaveRequestModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('LeaveRequest is missing its id');
    return LeaveRequestModel(
      id: id,
      employeeId: json['employeeId'] as String? ?? '',
      employeeName: json['employeeName'] as String? ?? '',
      leaveTypeId: json['leaveTypeId'] as String? ?? '',
      leaveTypeName: json['leaveTypeName'] as String? ?? '',
      fromDate: parseDate(json['fromDate']) ?? DateTime.now(),
      toDate: parseDate(json['toDate']) ?? DateTime.now(),
      days: asDouble(json['days']),
      status: json['status'] as String? ?? LeaveRequestStatus.pending,
      reason: json['reason'] as String?,
      approverId: json['approverId'] as String?,
      approvedAt: parseDate(json['approvedAt']),
      createdAt: parseDate(json['createdAt']),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'employeeId': employeeId,
        'employeeName': employeeName,
        'leaveTypeId': leaveTypeId,
        'leaveTypeName': leaveTypeName,
        'fromDate': fromDate.toIso8601String(),
        'toDate': toDate.toIso8601String(),
        'days': days,
        'status': status,
        'reason': reason,
        'approverId': approverId,
        'approvedAt': approvedAt?.toIso8601String(),
        'createdAt': createdAt?.toIso8601String(),
      };
}

// ── LeaveType ──────────────────────────────────────────────────────────────

class LeaveTypeModel extends LeaveType {
  const LeaveTypeModel({
    required super.id,
    required super.name,
    required super.daysAllowed,
    super.isPaid,
    super.requiresApproval,
    super.color,
    super.createdAt,
  });

  factory LeaveTypeModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('LeaveType is missing its id');
    return LeaveTypeModel(
      id: id,
      name: json['name'] as String? ?? '',
      daysAllowed: asDouble(json['daysAllowed']),
      isPaid: json['isPaid'] as bool? ?? true,
      requiresApproval: json['requiresApproval'] as bool? ?? true,
      color: json['color'] as String?,
      createdAt: parseDate(json['createdAt']),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'daysAllowed': daysAllowed,
        'isPaid': isPaid,
        'requiresApproval': requiresApproval,
        'color': color,
        'createdAt': createdAt?.toIso8601String(),
      };
}

// ── Attendance ─────────────────────────────────────────────────────────────

class AttendanceModel extends Attendance {
  const AttendanceModel({
    required super.id,
    required super.employeeId,
    required super.employeeName,
    required super.date,
    super.clockIn,
    super.clockOut,
    super.status,
    super.hoursWorked,
    super.notes,
  });

  factory AttendanceModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('Attendance is missing its id');
    return AttendanceModel(
      id: id,
      employeeId: json['employeeId'] as String? ?? '',
      employeeName: json['employeeName'] as String? ?? '',
      date: parseDate(json['date']) ?? DateTime.now(),
      clockIn: parseDate(json['clockIn']),
      clockOut: parseDate(json['clockOut']),
      status: json['status'] as String? ?? AttendanceStatus.present,
      hoursWorked: asDouble(json['hoursWorked']),
      notes: json['notes'] as String?,
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'employeeId': employeeId,
        'employeeName': employeeName,
        'date': date.toIso8601String(),
        'clockIn': clockIn?.toIso8601String(),
        'clockOut': clockOut?.toIso8601String(),
        'status': status,
        'hoursWorked': hoursWorked,
        'notes': notes,
      };
}

// ── Timesheet ──────────────────────────────────────────────────────────────

class TimesheetEntryModel extends TimesheetEntry {
  const TimesheetEntryModel({
    required super.id,
    required super.date,
    super.projectName,
    super.taskName,
    super.hours,
    super.description,
  });

  factory TimesheetEntryModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('TimesheetEntry is missing its id');
    return TimesheetEntryModel(
      id: id,
      date: parseDate(json['date']) ?? DateTime.now(),
      projectName: json['projectName'] as String?,
      taskName: json['taskName'] as String?,
      hours: asDouble(json['hours']),
      description: json['description'] as String?,
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'date': date.toIso8601String(),
        'projectName': projectName,
        'taskName': taskName,
        'hours': hours,
        'description': description,
      };
}

class TimesheetModel extends Timesheet {
  const TimesheetModel({
    required super.id,
    required super.employeeId,
    required super.employeeName,
    required super.weekStart,
    super.totalHours,
    super.status,
    required super.entries,
    super.createdAt,
  });

  factory TimesheetModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('Timesheet is missing its id');
    final List<TimesheetEntryModel> entries =
        (json['entries'] as List<dynamic>?)
                ?.map((dynamic e) =>
                    TimesheetEntryModel.fromJson(e as Map<String, dynamic>))
                .toList(growable: false) ??
            const <TimesheetEntryModel>[];
    return TimesheetModel(
      id: id,
      employeeId: json['employeeId'] as String? ?? '',
      employeeName: json['employeeName'] as String? ?? '',
      weekStart: parseDate(json['weekStart']) ?? DateTime.now(),
      totalHours: asDouble(json['totalHours']),
      status: json['status'] as String? ?? TimesheetStatus.draft,
      entries: entries,
      createdAt: parseDate(json['createdAt']),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'employeeId': employeeId,
        'employeeName': employeeName,
        'weekStart': weekStart.toIso8601String(),
        'totalHours': totalHours,
        'status': status,
        'entries': entries.map((TimesheetEntry e) => (e as TimesheetEntryModel).toJson()).toList(),
        'createdAt': createdAt?.toIso8601String(),
      };
}

// ── PayrollRun ─────────────────────────────────────────────────────────────

class PayrollRunModel extends PayrollRun {
  const PayrollRunModel({
    required super.id,
    required super.name,
    required super.periodStart,
    required super.periodEnd,
    super.status,
    super.totalEmployees,
    super.totalSalary,
    super.runDate,
    super.createdAt,
  });

  factory PayrollRunModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('PayrollRun is missing its id');
    return PayrollRunModel(
      id: id,
      name: json['name'] as String? ?? '',
      periodStart: parseDate(json['periodStart']) ?? DateTime.now(),
      periodEnd: parseDate(json['periodEnd']) ?? DateTime.now(),
      status: json['status'] as String? ?? PayrollRunStatus.draft,
      totalEmployees: asInt(json['totalEmployees']),
      totalSalary: asDouble(json['totalSalary']),
      runDate: parseDate(json['runDate']),
      createdAt: parseDate(json['createdAt']),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'periodStart': periodStart.toIso8601String(),
        'periodEnd': periodEnd.toIso8601String(),
        'status': status,
        'totalEmployees': totalEmployees,
        'totalSalary': totalSalary,
        'runDate': runDate?.toIso8601String(),
        'createdAt': createdAt?.toIso8601String(),
      };
}

// ── Payslip ────────────────────────────────────────────────────────────────

class PayslipModel extends Payslip {
  const PayslipModel({
    required super.id,
    required super.employeeId,
    required super.employeeName,
    required super.payrollRunId,
    super.baseSalary,
    super.totalEarnings,
    super.totalDeductions,
    super.netPay,
    super.status,
    super.generatedDate,
  });

  factory PayslipModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('Payslip is missing its id');
    return PayslipModel(
      id: id,
      employeeId: json['employeeId'] as String? ?? '',
      employeeName: json['employeeName'] as String? ?? '',
      payrollRunId: json['payrollRunId'] as String? ?? '',
      baseSalary: asDouble(json['baseSalary']),
      totalEarnings: asDouble(json['totalEarnings']),
      totalDeductions: asDouble(json['totalDeductions']),
      netPay: asDouble(json['netPay']),
      status: json['status'] as String?,
      generatedDate: parseDate(json['generatedDate']),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'employeeId': employeeId,
        'employeeName': employeeName,
        'payrollRunId': payrollRunId,
        'baseSalary': baseSalary,
        'totalEarnings': totalEarnings,
        'totalDeductions': totalDeductions,
        'netPay': netPay,
        'status': status,
        'generatedDate': generatedDate?.toIso8601String(),
      };
}

// ── SalaryComponent ────────────────────────────────────────────────────────

class SalaryComponentModel extends SalaryComponent {
  const SalaryComponentModel({
    required super.id,
    required super.type,
    required super.name,
    super.amount,
    super.isTaxable,
  });

  factory SalaryComponentModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('SalaryComponent is missing its id');
    return SalaryComponentModel(
      id: id,
      type: json['type'] as String? ?? SalaryComponentType.earning,
      name: json['name'] as String? ?? '',
      amount: asDouble(json['amount']),
      isTaxable: json['isTaxable'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'type': type,
        'name': name,
        'amount': amount,
        'isTaxable': isTaxable,
      };
}

// ── SalaryStructure ────────────────────────────────────────────────────────

class SalaryStructureModel extends SalaryStructure {
  const SalaryStructureModel({
    required super.id,
    required super.name,
    required super.employeeId,
    required super.employeeName,
    super.components,
    super.totalAmount,
    super.effectiveFrom,
    super.createdAt,
  });

  factory SalaryStructureModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('SalaryStructure is missing its id');
    final List<SalaryComponentModel> components =
        (json['components'] as List<dynamic>?)
                ?.map((dynamic e) =>
                    SalaryComponentModel.fromJson(e as Map<String, dynamic>))
                .toList(growable: false) ??
            const <SalaryComponentModel>[];
    return SalaryStructureModel(
      id: id,
      name: json['name'] as String? ?? '',
      employeeId: json['employeeId'] as String? ?? '',
      employeeName: json['employeeName'] as String? ?? '',
      components: components,
      totalAmount: asDouble(json['totalAmount']),
      effectiveFrom: parseDate(json['effectiveFrom']),
      createdAt: parseDate(json['createdAt']),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'employeeId': employeeId,
        'employeeName': employeeName,
        'components': components
            .map((SalaryComponent c) => (c as SalaryComponentModel).toJson())
            .toList(),
        'totalAmount': totalAmount,
        'effectiveFrom': effectiveFrom?.toIso8601String(),
        'createdAt': createdAt?.toIso8601String(),
      };
}

// ── Dashboard stats ────────────────────────────────────────────────────────

class HrDashboardStatsModel extends HrDashboardStats {
  const HrDashboardStatsModel({
    required super.totalEmployees,
    required super.activeEmployees,
    required super.onLeave,
    required super.pendingLeaveRequests,
    required super.departments,
    required super.openPositions,
  });

  factory HrDashboardStatsModel.fromJson(Map<String, dynamic> json) =>
      HrDashboardStatsModel(
        totalEmployees: asInt(json['totalEmployees']),
        activeEmployees: asInt(json['activeEmployees']),
        onLeave: asInt(json['onLeave']),
        pendingLeaveRequests: asInt(json['pendingLeaveRequests']),
        departments: asInt(json['departments']),
        openPositions: asInt(json['openPositions']),
      );

  Map<String, dynamic> toJson() => <String, dynamic>{
        'totalEmployees': totalEmployees,
        'activeEmployees': activeEmployees,
        'onLeave': onLeave,
        'pendingLeaveRequests': pendingLeaveRequests,
        'departments': departments,
        'openPositions': openPositions,
      };
}

// ── Org chart ──────────────────────────────────────────────────────────────

class OrgChartNodeModel extends OrgChartNode {
  const OrgChartNodeModel({
    required super.id,
    required super.name,
    required super.position,
    super.imageUrl,
    required super.children,
  });

  factory OrgChartNodeModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) throw const ParseException('OrgChartNode is missing its id');
    final List<OrgChartNodeModel> children =
        (json['children'] as List<dynamic>?)
                ?.map((dynamic e) =>
                    OrgChartNodeModel.fromJson(e as Map<String, dynamic>))
                .toList(growable: false) ??
            const <OrgChartNodeModel>[];
    return OrgChartNodeModel(
      id: id,
      name: json['name'] as String? ?? '',
      position: json['position'] as String? ?? '',
      imageUrl: json['imageUrl'] as String?,
      children: children,
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'position': position,
        'imageUrl': imageUrl,
        'children':
            children.map((OrgChartNode n) => (n as OrgChartNodeModel).toJson()).toList(),
      };
}
