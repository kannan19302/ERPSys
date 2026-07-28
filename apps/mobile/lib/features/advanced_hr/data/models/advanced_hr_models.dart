import '../../../../core/error/exceptions.dart';
import '../../domain/entities/advanced_hr.dart';

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


class CompensationBandModel extends CompensationBand {
  const CompensationBandModel({
    required super.id,
    required super.name,
    required super.minSalary,
    required super.maxSalary,
    super.currency = 'USD',
    super.grade,
    super.status = 'ACTIVE',
    super.notes,
    super.createdAt,
  });

  factory CompensationBandModel.fromJson(Map<String, dynamic> json) {
    final id = json['id'];
    if (id is! String) throw const ParseException('CompensationBand missing id');
    return CompensationBandModel(
      id: id,
      name: json['name'] as String? ?? '',
      minSalary: asDouble(json['minSalary']),
      maxSalary: asDouble(json['maxSalary']),
      currency: json['currency'] as String? ?? 'USD',
      grade: json['grade'] as String?,
      status: json['status'] as String? ?? 'ACTIVE',
      notes: json['notes'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'minSalary': minSalary,
        'maxSalary': maxSalary,
        'currency': currency,
        'grade': grade,
        'status': status,
        'notes': notes,
        'createdAt': createdAt?.toIso8601String(),
      };
}

class BenefitPlanModel extends BenefitPlan {
  const BenefitPlanModel({
    required super.id,
    required super.name,
    required super.planType,
    super.status = 'ACTIVE',
    super.provider,
    super.monthlyCost = 0,
    super.employeeCostShare = 0,
    super.description,
    super.enrollmentDeadline,
    super.createdAt,
  });

  factory BenefitPlanModel.fromJson(Map<String, dynamic> json) {
    final id = json['id'];
    if (id is! String) throw const ParseException('BenefitPlan missing id');
    return BenefitPlanModel(
      id: id,
      name: json['name'] as String? ?? '',
      planType: json['planType'] as String? ?? '',
      status: json['status'] as String? ?? 'ACTIVE',
      provider: json['provider'] as String?,
      monthlyCost: asDouble(json['monthlyCost']),
      employeeCostShare: asDouble(json['employeeCostShare']),
      description: json['description'] as String?,
      enrollmentDeadline: DateTime.tryParse('${json['enrollmentDeadline']}'),
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'planType': planType,
        'status': status,
        'provider': provider,
        'monthlyCost': monthlyCost,
        'employeeCostShare': employeeCostShare,
        'description': description,
        'enrollmentDeadline': enrollmentDeadline?.toIso8601String(),
        'createdAt': createdAt?.toIso8601String(),
      };
}

class SuccessionPlanModel extends SuccessionPlan {
  const SuccessionPlanModel({
    required super.id,
    required super.title,
    required super.position,
    super.status = 'ACTIVE',
    super.primarySuccessor,
    super.secondarySuccessor,
    super.readinessLevel = 'DEVELOPING',
    super.notes,
    super.createdAt,
  });

  factory SuccessionPlanModel.fromJson(Map<String, dynamic> json) {
    final id = json['id'];
    if (id is! String) throw const ParseException('SuccessionPlan missing id');
    return SuccessionPlanModel(
      id: id,
      title: json['title'] as String? ?? '',
      position: json['position'] as String? ?? '',
      status: json['status'] as String? ?? 'ACTIVE',
      primarySuccessor: json['primarySuccessor'] as String?,
      secondarySuccessor: json['secondarySuccessor'] as String?,
      readinessLevel: json['readinessLevel'] as String? ?? 'DEVELOPING',
      notes: json['notes'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'title': title,
        'position': position,
        'status': status,
        'primarySuccessor': primarySuccessor,
        'secondarySuccessor': secondarySuccessor,
        'readinessLevel': readinessLevel,
        'notes': notes,
        'createdAt': createdAt?.toIso8601String(),
      };
}

class WorkforceAnalyticModel extends WorkforceAnalytic {
  const WorkforceAnalyticModel({
    required super.id,
    required super.metricName,
    super.metricValue = 0,
    super.period,
    super.department,
    super.previousValue,
    super.changePercent,
    super.dimension,
    super.createdAt,
  });

  factory WorkforceAnalyticModel.fromJson(Map<String, dynamic> json) {
    final id = json['id'];
    if (id is! String) throw const ParseException('WorkforceAnalytic missing id');
    return WorkforceAnalyticModel(
      id: id,
      metricName: json['metricName'] as String? ?? '',
      metricValue: asDouble(json['metricValue']),
      period: json['period'] as String?,
      department: json['department'] as String?,
      previousValue: asDouble(json['previousValue']),
      changePercent: asDouble(json['changePercent']),
      dimension: json['dimension'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'metricName': metricName,
        'metricValue': metricValue,
        'period': period,
        'department': department,
        'previousValue': previousValue,
        'changePercent': changePercent,
        'dimension': dimension,
        'createdAt': createdAt?.toIso8601String(),
      };
}

class LearningPathModel extends LearningPath {
  const LearningPathModel({
    required super.id,
    required super.title,
    required super.category,
    super.status = 'ACTIVE',
    super.estimatedHours = 0,
    super.enrolledCount = 0,
    super.completionRate = 0,
    super.description,
    super.createdAt,
  });

  factory LearningPathModel.fromJson(Map<String, dynamic> json) {
    final id = json['id'];
    if (id is! String) throw const ParseException('LearningPath missing id');
    return LearningPathModel(
      id: id,
      title: json['title'] as String? ?? '',
      category: json['category'] as String? ?? '',
      status: json['status'] as String? ?? 'ACTIVE',
      estimatedHours: asDouble(json['estimatedHours']),
      enrolledCount: asInt(json['enrolledCount']),
      completionRate: asDouble(json['completionRate']),
      description: json['description'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'title': title,
        'category': category,
        'status': status,
        'estimatedHours': estimatedHours,
        'enrolledCount': enrolledCount,
        'completionRate': completionRate,
        'description': description,
        'createdAt': createdAt?.toIso8601String(),
      };
}
