import 'package:equatable/equatable.dart';

class CompensationBand extends Equatable {
  const CompensationBand({
    required this.id,
    required this.name,
    required this.minSalary,
    required this.maxSalary,
    this.currency = 'USD',
    this.grade,
    this.status = 'ACTIVE',
    this.notes,
    this.createdAt,
  });

  final String id;
  final String name;
  final double minSalary;
  final double maxSalary;
  final String currency;
  final String? grade;
  final String status;
  final String? notes;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id, name, minSalary, maxSalary, currency,
        grade, status, notes, createdAt,
      ];
}

class BenefitPlan extends Equatable {
  const BenefitPlan({
    required this.id,
    required this.name,
    required this.planType,
    this.status = 'ACTIVE',
    this.provider,
    this.monthlyCost = 0,
    this.employeeCostShare = 0,
    this.description,
    this.enrollmentDeadline,
    this.createdAt,
  });

  final String id;
  final String name;
  final String planType;
  final String status;
  final String? provider;
  final double monthlyCost;
  final double employeeCostShare;
  final String? description;
  final DateTime? enrollmentDeadline;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id, name, planType, status, provider, monthlyCost,
        employeeCostShare, description, enrollmentDeadline, createdAt,
      ];
}

class SuccessionPlan extends Equatable {
  const SuccessionPlan({
    required this.id,
    required this.title,
    required this.position,
    this.status = 'ACTIVE',
    this.primarySuccessor,
    this.secondarySuccessor,
    this.readinessLevel = 'DEVELOPING',
    this.notes,
    this.createdAt,
  });

  final String id;
  final String title;
  final String position;
  final String status;
  final String? primarySuccessor;
  final String? secondarySuccessor;
  final String readinessLevel;
  final String? notes;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id, title, position, status, primarySuccessor,
        secondarySuccessor, readinessLevel, notes, createdAt,
      ];
}

class WorkforceAnalytic extends Equatable {
  const WorkforceAnalytic({
    required this.id,
    required this.metricName,
    this.metricValue = 0,
    this.period,
    this.department,
    this.previousValue,
    this.changePercent,
    this.dimension,
    this.createdAt,
  });

  final String id;
  final String metricName;
  final double metricValue;
  final String? period;
  final String? department;
  final double? previousValue;
  final double? changePercent;
  final String? dimension;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id, metricName, metricValue, period, department,
        previousValue, changePercent, dimension, createdAt,
      ];
}

class LearningPath extends Equatable {
  const LearningPath({
    required this.id,
    required this.title,
    required this.category,
    this.status = 'ACTIVE',
    this.estimatedHours = 0,
    this.enrolledCount = 0,
    this.completionRate = 0,
    this.description,
    this.createdAt,
  });

  final String id;
  final String title;
  final String category;
  final String status;
  final double estimatedHours;
  final int enrolledCount;
  final double completionRate;
  final String? description;
  final DateTime? createdAt;

  @override
  List<Object?> get props => <Object?>[
        id, title, category, status, estimatedHours,
        enrolledCount, completionRate, description, createdAt,
      ];
}
