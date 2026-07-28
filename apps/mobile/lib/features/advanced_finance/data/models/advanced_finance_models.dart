import '../../../../core/error/exceptions.dart';
import '../../domain/entities/advanced_finance.dart';

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

List<T> _parseItems<T>(List<dynamic>? raw, T Function(Map<String, dynamic>) fromJson) =>
    raw?.map((e) => fromJson(e as Map<String, dynamic>)).toList(growable: false) ?? const [];

class MultiCurrencyRateModel extends MultiCurrencyRate {
  const MultiCurrencyRateModel({
    required super.id,
    required super.fromCurrency,
    required super.toCurrency,
    required super.rate,
    super.rateDate,
    super.source,
    super.createdAt,
  });

  factory MultiCurrencyRateModel.fromJson(Map<String, dynamic> json) {
    final id = json['id'];
    if (id is! String) throw const ParseException('MultiCurrencyRate missing id');
    return MultiCurrencyRateModel(
      id: id,
      fromCurrency: json['fromCurrency'] as String? ?? '',
      toCurrency: json['toCurrency'] as String? ?? '',
      rate: asDouble(json['rate']),
      rateDate: DateTime.tryParse('${json['rateDate']}'),
      source: json['source'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'fromCurrency': fromCurrency,
        'toCurrency': toCurrency,
        'rate': rate,
        'rateDate': rateDate?.toIso8601String(),
        'source': source,
        'createdAt': createdAt?.toIso8601String(),
      };
}

class ConsolidationReportModel extends ConsolidationReport {
  const ConsolidationReportModel({
    required super.id,
    required super.title,
    required super.period,
    super.status = 'DRAFT',
    super.totalRevenue = 0,
    super.totalExpenses = 0,
    super.netIncome = 0,
    super.currency,
    super.notes,
    super.createdAt,
  });

  factory ConsolidationReportModel.fromJson(Map<String, dynamic> json) {
    final id = json['id'];
    if (id is! String) throw const ParseException('ConsolidationReport missing id');
    return ConsolidationReportModel(
      id: id,
      title: json['title'] as String? ?? '',
      period: json['period'] as String? ?? '',
      status: json['status'] as String? ?? 'DRAFT',
      totalRevenue: asDouble(json['totalRevenue']),
      totalExpenses: asDouble(json['totalExpenses']),
      netIncome: asDouble(json['netIncome']),
      currency: json['currency'] as String?,
      notes: json['notes'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'title': title,
        'period': period,
        'status': status,
        'totalRevenue': totalRevenue,
        'totalExpenses': totalExpenses,
        'netIncome': netIncome,
        'currency': currency,
        'notes': notes,
        'createdAt': createdAt?.toIso8601String(),
      };
}

class IntercompanyAgreementModel extends IntercompanyAgreement {
  const IntercompanyAgreementModel({
    required super.id,
    required super.agreementNumber,
    required super.title,
    required super.status,
    super.fromEntity,
    super.toEntity,
    super.totalAmount = 0,
    super.currency = 'USD',
    super.startDate,
    super.endDate,
    super.notes,
    super.createdAt,
  });

  factory IntercompanyAgreementModel.fromJson(Map<String, dynamic> json) {
    final id = json['id'];
    if (id is! String) throw const ParseException('IntercompanyAgreement missing id');
    return IntercompanyAgreementModel(
      id: id,
      agreementNumber: json['agreementNumber'] as String? ?? '',
      title: json['title'] as String? ?? '',
      status: json['status'] as String? ?? 'DRAFT',
      fromEntity: json['fromEntity'] as String?,
      toEntity: json['toEntity'] as String?,
      totalAmount: asDouble(json['totalAmount']),
      currency: json['currency'] as String? ?? 'USD',
      startDate: DateTime.tryParse('${json['startDate']}'),
      endDate: DateTime.tryParse('${json['endDate']}'),
      notes: json['notes'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'agreementNumber': agreementNumber,
        'title': title,
        'status': status,
        'fromEntity': fromEntity,
        'toEntity': toEntity,
        'totalAmount': totalAmount,
        'currency': currency,
        'startDate': startDate?.toIso8601String(),
        'endDate': endDate?.toIso8601String(),
        'notes': notes,
        'createdAt': createdAt?.toIso8601String(),
      };
}

class CostAllocationModel extends CostAllocation {
  const CostAllocationModel({
    required super.id,
    required super.description,
    required super.status,
    super.totalAmount = 0,
    super.fromCostCenter,
    super.toCostCenters = const <String>[],
    super.method = 'EQUAL',
    super.allocationDate,
    super.notes,
    super.createdAt,
  });

  factory CostAllocationModel.fromJson(Map<String, dynamic> json) {
    final id = json['id'];
    if (id is! String) throw const ParseException('CostAllocation missing id');
    return CostAllocationModel(
      id: id,
      description: json['description'] as String? ?? '',
      status: json['status'] as String? ?? 'DRAFT',
      totalAmount: asDouble(json['totalAmount']),
      fromCostCenter: json['fromCostCenter'] as String?,
      toCostCenters: _parseItems<String>(json['toCostCenters'] as List<dynamic>?, (e) => e['id'] as String? ?? ''),
      method: json['method'] as String? ?? 'EQUAL',
      allocationDate: DateTime.tryParse('${json['allocationDate']}'),
      notes: json['notes'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'description': description,
        'status': status,
        'totalAmount': totalAmount,
        'fromCostCenter': fromCostCenter,
        'toCostCenters': toCostCenters,
        'method': method,
        'allocationDate': allocationDate?.toIso8601String(),
        'notes': notes,
        'createdAt': createdAt?.toIso8601String(),
      };
}

class RevenueRecognitionEntryModel extends RevenueRecognitionEntry {
  const RevenueRecognitionEntryModel({
    required super.id,
    required super.sourceType,
    required super.sourceId,
    super.status = 'PENDING',
    super.totalAmount = 0,
    super.recognizedAmount = 0,
    super.deferredAmount = 0,
    super.scheduleDate,
    super.recognitionDate,
    super.notes,
    super.createdAt,
  });

  factory RevenueRecognitionEntryModel.fromJson(Map<String, dynamic> json) {
    final id = json['id'];
    if (id is! String) throw const ParseException('RevenueRecognitionEntry missing id');
    return RevenueRecognitionEntryModel(
      id: id,
      sourceType: json['sourceType'] as String? ?? '',
      sourceId: json['sourceId'] as String? ?? '',
      status: json['status'] as String? ?? 'PENDING',
      totalAmount: asDouble(json['totalAmount']),
      recognizedAmount: asDouble(json['recognizedAmount']),
      deferredAmount: asDouble(json['deferredAmount']),
      scheduleDate: DateTime.tryParse('${json['scheduleDate']}'),
      recognitionDate: DateTime.tryParse('${json['recognitionDate']}'),
      notes: json['notes'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'sourceType': sourceType,
        'sourceId': sourceId,
        'status': status,
        'totalAmount': totalAmount,
        'recognizedAmount': recognizedAmount,
        'deferredAmount': deferredAmount,
        'scheduleDate': scheduleDate?.toIso8601String(),
        'recognitionDate': recognitionDate?.toIso8601String(),
        'notes': notes,
        'createdAt': createdAt?.toIso8601String(),
      };
}

class BudgetVersionModel extends BudgetVersion {
  const BudgetVersionModel({
    required super.id,
    required super.name,
    required super.fiscalYear,
    super.status = 'DRAFT',
    super.version,
    super.plannedRevenue = 0,
    super.plannedExpenses = 0,
    super.notes,
    super.createdAt,
  });

  factory BudgetVersionModel.fromJson(Map<String, dynamic> json) {
    final id = json['id'];
    if (id is! String) throw const ParseException('BudgetVersion missing id');
    return BudgetVersionModel(
      id: id,
      name: json['name'] as String? ?? '',
      fiscalYear: json['fiscalYear'] as String? ?? '',
      status: json['status'] as String? ?? 'DRAFT',
      version: asInt(json['version']),
      plannedRevenue: asDouble(json['plannedRevenue']),
      plannedExpenses: asDouble(json['plannedExpenses']),
      notes: json['notes'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'fiscalYear': fiscalYear,
        'status': status,
        'version': version,
        'plannedRevenue': plannedRevenue,
        'plannedExpenses': plannedExpenses,
        'notes': notes,
        'createdAt': createdAt?.toIso8601String(),
      };
}

class FinancialCloseTaskModel extends FinancialCloseTask {
  const FinancialCloseTaskModel({
    required super.id,
    required super.title,
    required super.period,
    super.status = 'PENDING',
    super.assignedTo,
    super.priority = 'MEDIUM',
    super.dueDate,
    super.completedAt,
    super.notes,
    super.createdAt,
  });

  factory FinancialCloseTaskModel.fromJson(Map<String, dynamic> json) {
    final id = json['id'];
    if (id is! String) throw const ParseException('FinancialCloseTask missing id');
    return FinancialCloseTaskModel(
      id: id,
      title: json['title'] as String? ?? '',
      period: json['period'] as String? ?? '',
      status: json['status'] as String? ?? 'PENDING',
      assignedTo: json['assignedTo'] as String?,
      priority: json['priority'] as String? ?? 'MEDIUM',
      dueDate: DateTime.tryParse('${json['dueDate']}'),
      completedAt: DateTime.tryParse('${json['completedAt']}'),
      notes: json['notes'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'title': title,
        'period': period,
        'status': status,
        'assignedTo': assignedTo,
        'priority': priority,
        'dueDate': dueDate?.toIso8601String(),
        'completedAt': completedAt?.toIso8601String(),
        'notes': notes,
        'createdAt': createdAt?.toIso8601String(),
      };
}

class AuditTrailEntryModel extends AuditTrailEntry {
  const AuditTrailEntryModel({
    required super.id,
    required super.entityType,
    required super.entityId,
    required super.action,
    super.userId,
    super.userName,
    super.changes,
    super.ipAddress,
    super.createdAt,
  });

  factory AuditTrailEntryModel.fromJson(Map<String, dynamic> json) {
    final id = json['id'];
    if (id is! String) throw const ParseException('AuditTrailEntry missing id');
    return AuditTrailEntryModel(
      id: id,
      entityType: json['entityType'] as String? ?? '',
      entityId: json['entityId'] as String? ?? '',
      action: json['action'] as String? ?? '',
      userId: json['userId'] as String?,
      userName: json['userName'] as String?,
      changes: json['changes'] as String?,
      ipAddress: json['ipAddress'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'entityType': entityType,
        'entityId': entityId,
        'action': action,
        'userId': userId,
        'userName': userName,
        'changes': changes,
        'ipAddress': ipAddress,
        'createdAt': createdAt?.toIso8601String(),
      };
}
