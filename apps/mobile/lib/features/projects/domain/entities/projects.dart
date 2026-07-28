import 'package:equatable/equatable.dart';

class Project extends Equatable {
  const Project({
    required this.id,
    required this.name,
    required this.description,
    required this.status,
    required this.priority,
    this.startDate,
    this.endDate,
    required this.budget,
    required this.actualCost,
    this.managerName,
    this.customerName,
    required this.progress,
    required this.createdAt,
    required this.updatedAt,
  });

  final String id;
  final String name;
  final String description;
  final String status;
  final String priority;
  final DateTime? startDate;
  final DateTime? endDate;
  final double budget;
  final double actualCost;
  final String? managerName;
  final String? customerName;
  final double progress;
  final DateTime createdAt;
  final DateTime updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id,
        name,
        description,
        status,
        priority,
        startDate,
        endDate,
        budget,
        actualCost,
        managerName,
        customerName,
        progress,
        createdAt,
        updatedAt,
      ];
}

class Task extends Equatable {
  const Task({
    required this.id,
    required this.projectId,
    required this.title,
    this.description,
    required this.status,
    this.assigneeName,
    required this.priority,
    this.estimatedHours,
    this.actualHours,
    this.dueDate,
    required this.createdAt,
  });

  final String id;
  final String projectId;
  final String title;
  final String? description;
  final String status;
  final String? assigneeName;
  final String priority;
  final double? estimatedHours;
  final double? actualHours;
  final DateTime? dueDate;
  final DateTime createdAt;

  @override
  List<Object?> get props => <Object?>[
        id,
        projectId,
        title,
        description,
        status,
        assigneeName,
        priority,
        estimatedHours,
        actualHours,
        dueDate,
        createdAt,
      ];
}

class Milestone extends Equatable {
  const Milestone({
    required this.id,
    required this.projectId,
    required this.title,
    required this.dueDate,
    required this.status,
    required this.createdAt,
  });

  final String id;
  final String projectId;
  final String title;
  final DateTime dueDate;
  final String status;
  final DateTime createdAt;

  @override
  List<Object?> get props => <Object?>[
        id,
        projectId,
        title,
        dueDate,
        status,
        createdAt,
      ];
}

class Timesheet extends Equatable {
  const Timesheet({
    required this.id,
    required this.projectId,
    this.projectName,
    required this.employeeId,
    this.employeeName,
    required this.date,
    required this.hours,
    this.description,
    required this.status,
    required this.createdAt,
  });

  final String id;
  final String projectId;
  final String? projectName;
  final String employeeId;
  final String? employeeName;
  final DateTime date;
  final double hours;
  final String? description;
  final String status;
  final DateTime createdAt;

  @override
  List<Object?> get props => <Object?>[
        id,
        projectId,
        projectName,
        employeeId,
        employeeName,
        date,
        hours,
        description,
        status,
        createdAt,
      ];
}

class ProjectBudget extends Equatable {
  const ProjectBudget({
    required this.id,
    required this.projectId,
    required this.category,
    required this.budgetedAmount,
    required this.spentAmount,
    required this.remainingAmount,
  });

  final String id;
  final String projectId;
  final String category;
  final double budgetedAmount;
  final double spentAmount;
  final double remainingAmount;

  @override
  List<Object?> get props => <Object?>[
        id,
        projectId,
        category,
        budgetedAmount,
        spentAmount,
        remainingAmount,
      ];
}

class ProjectRisk extends Equatable {
  const ProjectRisk({
    required this.id,
    required this.projectId,
    required this.title,
    this.description,
    required this.probability,
    required this.impact,
    required this.status,
    this.mitigationPlan,
    required this.createdAt,
  });

  final String id;
  final String projectId;
  final String title;
  final String? description;
  final String probability;
  final String impact;
  final String status;
  final String? mitigationPlan;
  final DateTime createdAt;

  @override
  List<Object?> get props => <Object?>[
        id,
        projectId,
        title,
        description,
        probability,
        impact,
        status,
        mitigationPlan,
        createdAt,
      ];
}

class ProjectPortfolio extends Equatable {
  const ProjectPortfolio({
    required this.id,
    required this.name,
    this.description,
    required this.projectCount,
    required this.totalBudget,
    required this.createdAt,
  });

  final String id;
  final String name;
  final String? description;
  final int projectCount;
  final double totalBudget;
  final DateTime createdAt;

  @override
  List<Object?> get props => <Object?>[
        id,
        name,
        description,
        projectCount,
        totalBudget,
        createdAt,
      ];
}
