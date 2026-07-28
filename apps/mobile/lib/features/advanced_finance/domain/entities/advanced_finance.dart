import 'package:equatable/equatable.dart';

class MultiCurrencyRate extends Equatable {
  const MultiCurrencyRate({
    required this.id,
    required this.fromCurrency,
    required this.toCurrency,
    required this.rate,
    this.rateDate,
    this.source,
    this.createdAt,
  });

  final String id;
  final String fromCurrency;
  final String toCurrency;
  final double rate;
  final DateTime? rateDate;
  final String? source;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id, fromCurrency, toCurrency, rate, rateDate, source, createdAt,
      ];
}

class ConsolidationReport extends Equatable {
  const ConsolidationReport({
    required this.id,
    required this.title,
    required this.period,
    this.status = 'DRAFT',
    this.totalRevenue = 0,
    this.totalExpenses = 0,
    this.netIncome = 0,
    this.currency,
    this.notes,
    this.createdAt,
  });

  final String id;
  final String title;
  final String period;
  final String status;
  final double totalRevenue;
  final double totalExpenses;
  final double netIncome;
  final String? currency;
  final String? notes;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id, title, period, status, totalRevenue, totalExpenses,
        netIncome, currency, notes, createdAt,
      ];
}

class IntercompanyAgreement extends Equatable {
  const IntercompanyAgreement({
    required this.id,
    required this.agreementNumber,
    required this.title,
    required this.status,
    this.fromEntity,
    this.toEntity,
    this.totalAmount = 0,
    this.currency = 'USD',
    this.startDate,
    this.endDate,
    this.notes,
    this.createdAt,
  });

  final String id;
  final String agreementNumber;
  final String title;
  final String status;
  final String? fromEntity;
  final String? toEntity;
  final double totalAmount;
  final String currency;
  final DateTime? startDate;
  final DateTime? endDate;
  final String? notes;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id, agreementNumber, title, status, fromEntity, toEntity,
        totalAmount, currency, startDate, endDate, notes, createdAt,
      ];
}

class CostAllocation extends Equatable {
  const CostAllocation({
    required this.id,
    required this.description,
    required this.status,
    this.totalAmount = 0,
    this.fromCostCenter,
    this.toCostCenters = const <String>[],
    this.method = 'EQUAL',
    this.allocationDate,
    this.notes,
    this.createdAt,
  });

  final String id;
  final String description;
  final String status;
  final double totalAmount;
  final String? fromCostCenter;
  final List<String> toCostCenters;
  final String method;
  final DateTime? allocationDate;
  final String? notes;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id, description, status, totalAmount, fromCostCenter,
        toCostCenters, method, allocationDate, notes, createdAt,
      ];
}

class RevenueRecognitionEntry extends Equatable {
  const RevenueRecognitionEntry({
    required this.id,
    required this.sourceType,
    required this.sourceId,
    this.status = 'PENDING',
    this.totalAmount = 0,
    this.recognizedAmount = 0,
    this.deferredAmount = 0,
    this.scheduleDate,
    this.recognitionDate,
    this.notes,
    this.createdAt,
  });

  final String id;
  final String sourceType;
  final String sourceId;
  final String status;
  final double totalAmount;
  final double recognizedAmount;
  final double deferredAmount;
  final DateTime? scheduleDate;
  final DateTime? recognitionDate;
  final String? notes;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id, sourceType, sourceId, status, totalAmount,
        recognizedAmount, deferredAmount, scheduleDate,
        recognitionDate, notes, createdAt,
      ];
}

class BudgetVersion extends Equatable {
  const BudgetVersion({
    required this.id,
    required this.name,
    required this.fiscalYear,
    this.status = 'DRAFT',
    this.version,
    this.plannedRevenue = 0,
    this.plannedExpenses = 0,
    this.notes,
    this.createdAt,
  });

  final String id;
  final String name;
  final String fiscalYear;
  final String status;
  final int? version;
  final double plannedRevenue;
  final double plannedExpenses;
  final String? notes;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id, name, fiscalYear, status, version,
        plannedRevenue, plannedExpenses, notes, createdAt,
      ];
}

class FinancialCloseTask extends Equatable {
  const FinancialCloseTask({
    required this.id,
    required this.title,
    required this.period,
    this.status = 'PENDING',
    this.assignedTo,
    this.priority = 'MEDIUM',
    this.dueDate,
    this.completedAt,
    this.notes,
    this.createdAt,
  });

  final String id;
  final String title;
  final String period;
  final String status;
  final String? assignedTo;
  final String priority;
  final DateTime? dueDate;
  final DateTime? completedAt;
  final String? notes;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id, title, period, status, assignedTo, priority,
        dueDate, completedAt, notes, createdAt,
      ];
}

class AuditTrailEntry extends Equatable {
  const AuditTrailEntry({
    required this.id,
    required this.entityType,
    required this.entityId,
    required this.action,
    this.userId,
    this.userName,
    this.changes,
    this.ipAddress,
    this.createdAt,
  });

  final String id;
  final String entityType;
  final String entityId;
  final String action;
  final String? userId;
  final String? userName;
  final String? changes;
  final String? ipAddress;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id, entityType, entityId, action, userId,
        userName, changes, ipAddress, createdAt,
      ];
}
