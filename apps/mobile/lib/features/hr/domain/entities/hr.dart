import 'package:equatable/equatable.dart';

// ── Status constants ───────────────────────────────────────────────────────

class EmployeeStatus {
  const EmployeeStatus._();
  static const String active = 'ACTIVE';
  static const String inactive = 'INACTIVE';
  static const String terminated = 'TERMINATED';
}

class LeaveRequestStatus {
  const LeaveRequestStatus._();
  static const String pending = 'PENDING';
  static const String approved = 'APPROVED';
  static const String rejected = 'REJECTED';
  static const String cancelled = 'CANCELLED';
}

class AttendanceStatus {
  const AttendanceStatus._();
  static const String present = 'PRESENT';
  static const String absent = 'ABSENT';
  static const String late = 'LATE';
  static const String halfDay = 'HALF_DAY';
  static const String holiday = 'HOLIDAY';
}

class TimesheetStatus {
  const TimesheetStatus._();
  static const String draft = 'DRAFT';
  static const String submitted = 'SUBMITTED';
  static const String approved = 'APPROVED';
  static const String rejected = 'REJECTED';
}

class PayrollRunStatus {
  const PayrollRunStatus._();
  static const String draft = 'DRAFT';
  static const String completed = 'COMPLETED';
  static const String reversed = 'REVERSED';
}

class SalaryComponentType {
  const SalaryComponentType._();
  static const String earning = 'EARNING';
  static const String deduction = 'DEDUCTION';
}

// ── Entities ───────────────────────────────────────────────────────────────

class Employee extends Equatable {
  const Employee({
    required this.id,
    required this.employeeNumber,
    required this.firstName,
    required this.lastName,
    required this.email,
    this.phone,
    this.department,
    this.departmentId,
    this.position,
    this.status = EmployeeStatus.active,
    this.hireDate,
    this.salaryMode,
    this.baseSalary,
    this.imageUrl,
    this.supervisorId,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String employeeNumber;
  final String firstName;
  final String lastName;
  final String email;
  final String? phone;
  final String? department;
  final String? departmentId;
  final String? position;
  final String status;
  final DateTime? hireDate;
  final String? salaryMode;
  final double? baseSalary;
  final String? imageUrl;
  final String? supervisorId;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  String get fullName => '$firstName $lastName';

  @override
  List<Object?> get props => <Object?>[
        id,
        employeeNumber,
        firstName,
        lastName,
        email,
        phone,
        department,
        departmentId,
        position,
        status,
        hireDate,
        salaryMode,
        baseSalary,
        imageUrl,
        supervisorId,
        createdAt,
        updatedAt,
      ];
}

class Department extends Equatable {
  const Department({
    required this.id,
    required this.name,
    this.headEmployeeId,
    this.headName,
    this.parentDepartmentId,
    this.description,
    this.createdAt,
  });

  final String id;
  final String name;
  final String? headEmployeeId;
  final String? headName;
  final String? parentDepartmentId;
  final String? description;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id,
        name,
        headEmployeeId,
        headName,
        parentDepartmentId,
        description,
        createdAt,
      ];
}

class LeaveRequest extends Equatable {
  const LeaveRequest({
    required this.id,
    required this.employeeId,
    required this.employeeName,
    required this.leaveTypeId,
    required this.leaveTypeName,
    required this.fromDate,
    required this.toDate,
    required this.days,
    this.status = LeaveRequestStatus.pending,
    this.reason,
    this.approverId,
    this.approvedAt,
    this.createdAt,
  });

  final String id;
  final String employeeId;
  final String employeeName;
  final String leaveTypeId;
  final String leaveTypeName;
  final DateTime fromDate;
  final DateTime toDate;
  final double days;
  final String status;
  final String? reason;
  final String? approverId;
  final DateTime? approvedAt;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id,
        employeeId,
        employeeName,
        leaveTypeId,
        leaveTypeName,
        fromDate,
        toDate,
        days,
        status,
        reason,
        approverId,
        approvedAt,
        createdAt,
      ];
}

class LeaveType extends Equatable {
  const LeaveType({
    required this.id,
    required this.name,
    required this.daysAllowed,
    this.isPaid = true,
    this.requiresApproval = true,
    this.color,
    this.createdAt,
  });

  final String id;
  final String name;
  final double daysAllowed;
  final bool isPaid;
  final bool requiresApproval;
  final String? color;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id,
        name,
        daysAllowed,
        isPaid,
        requiresApproval,
        color,
        createdAt,
      ];
}

class Attendance extends Equatable {
  const Attendance({
    required this.id,
    required this.employeeId,
    required this.employeeName,
    required this.date,
    this.clockIn,
    this.clockOut,
    this.status = AttendanceStatus.present,
    this.hoursWorked,
    this.notes,
  });

  final String id;
  final String employeeId;
  final String employeeName;
  final DateTime date;
  final DateTime? clockIn;
  final DateTime? clockOut;
  final String status;
  final double? hoursWorked;
  final String? notes;

  @override
  List<Object?> get props => <Object?>[
        id,
        employeeId,
        employeeName,
        date,
        clockIn,
        clockOut,
        status,
        hoursWorked,
        notes,
      ];
}

class Timesheet extends Equatable {
  const Timesheet({
    required this.id,
    required this.employeeId,
    required this.employeeName,
    required this.weekStart,
    this.totalHours = 0,
    this.status = TimesheetStatus.draft,
    this.entries = const <TimesheetEntry>[],
    this.createdAt,
  });

  final String id;
  final String employeeId;
  final String employeeName;
  final DateTime weekStart;
  final double totalHours;
  final String status;
  final List<TimesheetEntry> entries;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id,
        employeeId,
        employeeName,
        weekStart,
        totalHours,
        status,
        entries,
        createdAt,
      ];
}

class TimesheetEntry extends Equatable {
  const TimesheetEntry({
    required this.id,
    required this.date,
    this.projectName,
    this.taskName,
    this.hours = 0,
    this.description,
  });

  final String id;
  final DateTime date;
  final String? projectName;
  final String? taskName;
  final double hours;
  final String? description;

  @override
  List<Object?> get props => <Object?>[
        id,
        date,
        projectName,
        taskName,
        hours,
        description,
      ];
}

class PayrollRun extends Equatable {
  const PayrollRun({
    required this.id,
    required this.name,
    required this.periodStart,
    required this.periodEnd,
    this.status = PayrollRunStatus.draft,
    this.totalEmployees = 0,
    this.totalSalary = 0,
    this.runDate,
    this.createdAt,
  });

  final String id;
  final String name;
  final DateTime periodStart;
  final DateTime periodEnd;
  final String status;
  final int totalEmployees;
  final double totalSalary;
  final DateTime? runDate;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id,
        name,
        periodStart,
        periodEnd,
        status,
        totalEmployees,
        totalSalary,
        runDate,
        createdAt,
      ];
}

class Payslip extends Equatable {
  const Payslip({
    required this.id,
    required this.employeeId,
    required this.employeeName,
    required this.payrollRunId,
    this.baseSalary = 0,
    this.totalEarnings = 0,
    this.totalDeductions = 0,
    this.netPay = 0,
    this.status,
    this.generatedDate,
  });

  final String id;
  final String employeeId;
  final String employeeName;
  final String payrollRunId;
  final double baseSalary;
  final double totalEarnings;
  final double totalDeductions;
  final double netPay;
  final String? status;
  final DateTime? generatedDate;

  @override
  List<Object?> get props => <Object?>[
        id,
        employeeId,
        employeeName,
        payrollRunId,
        baseSalary,
        totalEarnings,
        totalDeductions,
        netPay,
        status,
        generatedDate,
      ];
}

class SalaryStructure extends Equatable {
  const SalaryStructure({
    required this.id,
    required this.name,
    required this.employeeId,
    required this.employeeName,
    this.components = const <SalaryComponent>[],
    this.totalAmount = 0,
    this.effectiveFrom,
    this.createdAt,
  });

  final String id;
  final String name;
  final String employeeId;
  final String employeeName;
  final List<SalaryComponent> components;
  final double totalAmount;
  final DateTime? effectiveFrom;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id,
        name,
        employeeId,
        employeeName,
        components,
        totalAmount,
        effectiveFrom,
        createdAt,
      ];
}

class SalaryComponent extends Equatable {
  const SalaryComponent({
    required this.id,
    required this.type,
    required this.name,
    this.amount = 0,
    this.isTaxable = false,
  });

  final String id;
  final String type;
  final String name;
  final double amount;
  final bool isTaxable;

  @override
  List<Object?> get props => <Object?>[
        id,
        type,
        name,
        amount,
        isTaxable,
      ];
}

/// `GET /hr/dashboard/hr-summary`
class HrDashboardStats extends Equatable {
  const HrDashboardStats({
    this.totalEmployees = 0,
    this.activeEmployees = 0,
    this.onLeave = 0,
    this.pendingLeaveRequests = 0,
    this.departments = 0,
    this.openPositions = 0,
  });

  const HrDashboardStats.zero()
      : totalEmployees = 0,
        activeEmployees = 0,
        onLeave = 0,
        pendingLeaveRequests = 0,
        departments = 0,
        openPositions = 0;

  final int totalEmployees;
  final int activeEmployees;
  final int onLeave;
  final int pendingLeaveRequests;
  final int departments;
  final int openPositions;

  @override
  List<Object?> get props => <Object?>[
        totalEmployees,
        activeEmployees,
        onLeave,
        pendingLeaveRequests,
        departments,
        openPositions,
      ];
}

/// `GET /hr/org-chart`
class OrgChartNode extends Equatable {
  const OrgChartNode({
    required this.id,
    required this.name,
    required this.position,
    this.imageUrl,
    this.children = const <OrgChartNode>[],
  });

  final String id;
  final String name;
  final String position;
  final String? imageUrl;
  final List<OrgChartNode> children;

  @override
  List<Object?> get props => <Object?>[
        id,
        name,
        position,
        imageUrl,
        children,
      ];
}
