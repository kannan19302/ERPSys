import '../../../../core/error/exceptions.dart';
import '../../domain/entities/projects.dart';

class ProjectModel extends Project {
  const ProjectModel({
    required super.id,
    required super.name,
    required super.description,
    required super.status,
    required super.priority,
    super.startDate,
    super.endDate,
    required super.budget,
    required super.actualCost,
    super.managerName,
    super.customerName,
    required super.progress,
    required super.createdAt,
    required super.updatedAt,
  });

  factory ProjectModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('Project is missing its id');
    }
    return ProjectModel(
      id: id,
      name: json['name'] as String? ?? '',
      description: json['description'] as String? ?? '',
      status: json['status'] as String? ?? 'PLANNING',
      priority: json['priority'] as String? ?? 'MEDIUM',
      startDate: DateTime.tryParse('${json['startDate']}'),
      endDate: DateTime.tryParse('${json['endDate']}'),
      budget: asDouble(json['budget']),
      actualCost: asDouble(json['actualCost']),
      managerName: json['managerName'] as String?,
      customerName: json['customerName'] as String?,
      progress: asDouble(json['progress']),
      createdAt: DateTime.tryParse('${json['createdAt']}') ?? DateTime.now(),
      updatedAt: DateTime.tryParse('${json['updatedAt']}') ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'description': description,
        'status': status,
        'priority': priority,
        'startDate': startDate?.toIso8601String(),
        'endDate': endDate?.toIso8601String(),
        'budget': budget,
        'actualCost': actualCost,
        'managerName': managerName,
        'customerName': customerName,
        'progress': progress,
        'createdAt': createdAt.toIso8601String(),
        'updatedAt': updatedAt.toIso8601String(),
      };
}

class TaskModel extends Task {
  const TaskModel({
    required super.id,
    required super.projectId,
    required super.title,
    super.description,
    required super.status,
    super.assigneeName,
    required super.priority,
    super.estimatedHours,
    super.actualHours,
    super.dueDate,
    required super.createdAt,
  });

  factory TaskModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('Task is missing its id');
    }
    return TaskModel(
      id: id,
      projectId: json['projectId'] as String? ?? '',
      title: json['title'] as String? ?? '',
      description: json['description'] as String?,
      status: json['status'] as String? ?? 'TODO',
      assigneeName: json['assigneeName'] as String?,
      priority: json['priority'] as String? ?? 'MEDIUM',
      estimatedHours: asDouble(json['estimatedHours']),
      actualHours: asDouble(json['actualHours']),
      dueDate: DateTime.tryParse('${json['dueDate']}'),
      createdAt: DateTime.tryParse('${json['createdAt']}') ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'projectId': projectId,
        'title': title,
        'description': description,
        'status': status,
        'assigneeName': assigneeName,
        'priority': priority,
        'estimatedHours': estimatedHours,
        'actualHours': actualHours,
        'dueDate': dueDate?.toIso8601String(),
        'createdAt': createdAt.toIso8601String(),
      };
}

class MilestoneModel extends Milestone {
  const MilestoneModel({
    required super.id,
    required super.projectId,
    required super.title,
    required super.dueDate,
    required super.status,
    required super.createdAt,
  });

  factory MilestoneModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('Milestone is missing its id');
    }
    return MilestoneModel(
      id: id,
      projectId: json['projectId'] as String? ?? '',
      title: json['title'] as String? ?? '',
      dueDate: DateTime.tryParse('${json['dueDate']}') ?? DateTime.now(),
      status: json['status'] as String? ?? 'PENDING',
      createdAt: DateTime.tryParse('${json['createdAt']}') ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'projectId': projectId,
        'title': title,
        'dueDate': dueDate.toIso8601String(),
        'status': status,
        'createdAt': createdAt.toIso8601String(),
      };
}

class TimesheetModel extends Timesheet {
  const TimesheetModel({
    required super.id,
    required super.projectId,
    super.projectName,
    required super.employeeId,
    super.employeeName,
    required super.date,
    required super.hours,
    super.description,
    required super.status,
    required super.createdAt,
  });

  factory TimesheetModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('Timesheet is missing its id');
    }
    return TimesheetModel(
      id: id,
      projectId: json['projectId'] as String? ?? '',
      projectName: json['projectName'] as String?,
      employeeId: json['employeeId'] as String? ?? '',
      employeeName: json['employeeName'] as String?,
      date: DateTime.tryParse('${json['date']}') ?? DateTime.now(),
      hours: asDouble(json['hours']),
      description: json['description'] as String?,
      status: json['status'] as String? ?? 'SUBMITTED',
      createdAt: DateTime.tryParse('${json['createdAt']}') ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'projectId': projectId,
        'projectName': projectName,
        'employeeId': employeeId,
        'employeeName': employeeName,
        'date': date.toIso8601String(),
        'hours': hours,
        'description': description,
        'status': status,
        'createdAt': createdAt.toIso8601String(),
      };
}

class ProjectBudgetModel extends ProjectBudget {
  const ProjectBudgetModel({
    required super.id,
    required super.projectId,
    required super.category,
    required super.budgetedAmount,
    required super.spentAmount,
    required super.remainingAmount,
  });

  factory ProjectBudgetModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('ProjectBudget is missing its id');
    }
    return ProjectBudgetModel(
      id: id,
      projectId: json['projectId'] as String? ?? '',
      category: json['category'] as String? ?? '',
      budgetedAmount: asDouble(json['budgetedAmount']),
      spentAmount: asDouble(json['spentAmount']),
      remainingAmount: asDouble(json['remainingAmount']),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'projectId': projectId,
        'category': category,
        'budgetedAmount': budgetedAmount,
        'spentAmount': spentAmount,
        'remainingAmount': remainingAmount,
      };
}

class ProjectRiskModel extends ProjectRisk {
  const ProjectRiskModel({
    required super.id,
    required super.projectId,
    required super.title,
    super.description,
    required super.probability,
    required super.impact,
    required super.status,
    super.mitigationPlan,
    required super.createdAt,
  });

  factory ProjectRiskModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('ProjectRisk is missing its id');
    }
    return ProjectRiskModel(
      id: id,
      projectId: json['projectId'] as String? ?? '',
      title: json['title'] as String? ?? '',
      description: json['description'] as String?,
      probability: json['probability'] as String? ?? 'LOW',
      impact: json['impact'] as String? ?? 'LOW',
      status: json['status'] as String? ?? 'IDENTIFIED',
      mitigationPlan: json['mitigationPlan'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}') ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'projectId': projectId,
        'title': title,
        'description': description,
        'probability': probability,
        'impact': impact,
        'status': status,
        'mitigationPlan': mitigationPlan,
        'createdAt': createdAt.toIso8601String(),
      };
}

class ProjectPortfolioModel extends ProjectPortfolio {
  const ProjectPortfolioModel({
    required super.id,
    required super.name,
    super.description,
    required super.projectCount,
    required super.totalBudget,
    required super.createdAt,
  });

  factory ProjectPortfolioModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('ProjectPortfolio is missing its id');
    }
    return ProjectPortfolioModel(
      id: id,
      name: json['name'] as String? ?? '',
      description: json['description'] as String?,
      projectCount: asInt(json['projectCount']),
      totalBudget: asDouble(json['totalBudget']),
      createdAt: DateTime.tryParse('${json['createdAt']}') ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'description': description,
        'projectCount': projectCount,
        'totalBudget': totalBudget,
        'createdAt': createdAt.toIso8601String(),
      };
}

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
