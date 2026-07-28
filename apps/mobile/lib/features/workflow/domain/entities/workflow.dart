import 'package:equatable/equatable.dart';

class WorkflowDefinition extends Equatable {
  const WorkflowDefinition({
    required this.id,
    required this.name,
    this.description,
    this.module,
    required this.isActive,
    required this.version,
    this.steps,
    required this.createdAt,
    required this.updatedAt,
  });

  final String id;
  final String name;
  final String? description;
  final String? module;
  final bool isActive;
  final int version;
  final List<dynamic>? steps;
  final DateTime createdAt;
  final DateTime updatedAt;

  @override
  List<Object?> get props => <Object?>[
        id,
        name,
        description,
        module,
        isActive,
        version,
        steps,
        createdAt,
        updatedAt,
      ];
}

class WorkflowInstance extends Equatable {
  const WorkflowInstance({
    required this.id,
    required this.definitionId,
    this.definitionName,
    this.documentId,
    this.documentType,
    required this.status,
    this.currentStep,
    this.initiatedBy,
    required this.createdAt,
    this.completedAt,
  });

  final String id;
  final String definitionId;
  final String? definitionName;
  final String? documentId;
  final String? documentType;
  final String status;
  final String? currentStep;
  final String? initiatedBy;
  final DateTime createdAt;
  final DateTime? completedAt;

  @override
  List<Object?> get props => <Object?>[
        id,
        definitionId,
        definitionName,
        documentId,
        documentType,
        status,
        currentStep,
        initiatedBy,
        createdAt,
        completedAt,
      ];
}

class WorkflowTask extends Equatable {
  const WorkflowTask({
    required this.id,
    required this.instanceId,
    this.stepName,
    this.assignedTo,
    required this.status,
    this.dueDate,
    required this.createdAt,
    this.completedAt,
  });

  final String id;
  final String instanceId;
  final String? stepName;
  final String? assignedTo;
  final String status;
  final DateTime? dueDate;
  final DateTime createdAt;
  final DateTime? completedAt;

  @override
  List<Object?> get props => <Object?>[
        id,
        instanceId,
        stepName,
        assignedTo,
        status,
        dueDate,
        createdAt,
        completedAt,
      ];
}

class SlaRule extends Equatable {
  const SlaRule({
    required this.id,
    required this.name,
    required this.workflowDefinitionId,
    required this.duration,
    required this.unit,
    this.severity,
    required this.createdAt,
  });

  final String id;
  final String name;
  final String workflowDefinitionId;
  final int duration;
  final String unit;
  final String? severity;
  final DateTime createdAt;

  @override
  List<Object?> get props => <Object?>[
        id,
        name,
        workflowDefinitionId,
        duration,
        unit,
        severity,
        createdAt,
      ];
}
