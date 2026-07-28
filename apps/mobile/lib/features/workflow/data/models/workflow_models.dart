import '../../../../core/error/exceptions.dart';
import '../../domain/entities/workflow.dart';

class WorkflowDefinitionModel extends WorkflowDefinition {
  const WorkflowDefinitionModel({
    required super.id,
    required super.name,
    super.description,
    super.module,
    required super.isActive,
    required super.version,
    super.steps,
    required super.createdAt,
    required super.updatedAt,
  });

  factory WorkflowDefinitionModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('WorkflowDefinition is missing its id');
    }
    return WorkflowDefinitionModel(
      id: id,
      name: json['name'] as String? ?? '',
      description: json['description'] as String?,
      module: json['module'] as String?,
      isActive: json['isActive'] as bool? ?? false,
      version: asInt(json['version']),
      steps: json['steps'] is List ? json['steps'] as List<dynamic> : null,
      createdAt: DateTime.tryParse('${json['createdAt']}') ?? DateTime.now(),
      updatedAt: DateTime.tryParse('${json['updatedAt']}') ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'description': description,
        'module': module,
        'isActive': isActive,
        'version': version,
        'steps': steps,
        'createdAt': createdAt.toIso8601String(),
        'updatedAt': updatedAt.toIso8601String(),
      };
}

class WorkflowInstanceModel extends WorkflowInstance {
  const WorkflowInstanceModel({
    required super.id,
    required super.definitionId,
    super.definitionName,
    super.documentId,
    super.documentType,
    required super.status,
    super.currentStep,
    super.initiatedBy,
    required super.createdAt,
    super.completedAt,
  });

  factory WorkflowInstanceModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('WorkflowInstance is missing its id');
    }
    return WorkflowInstanceModel(
      id: id,
      definitionId: json['definitionId'] as String? ?? '',
      definitionName: json['definitionName'] as String?,
      documentId: json['documentId'] as String?,
      documentType: json['documentType'] as String?,
      status: json['status'] as String? ?? 'RUNNING',
      currentStep: json['currentStep'] as String?,
      initiatedBy: json['initiatedBy'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}') ?? DateTime.now(),
      completedAt: DateTime.tryParse('${json['completedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'definitionId': definitionId,
        'definitionName': definitionName,
        'documentId': documentId,
        'documentType': documentType,
        'status': status,
        'currentStep': currentStep,
        'initiatedBy': initiatedBy,
        'createdAt': createdAt.toIso8601String(),
        'completedAt': completedAt?.toIso8601String(),
      };
}

class WorkflowTaskModel extends WorkflowTask {
  const WorkflowTaskModel({
    required super.id,
    required super.instanceId,
    super.stepName,
    super.assignedTo,
    required super.status,
    super.dueDate,
    required super.createdAt,
    super.completedAt,
  });

  factory WorkflowTaskModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('WorkflowTask is missing its id');
    }
    return WorkflowTaskModel(
      id: id,
      instanceId: json['instanceId'] as String? ?? '',
      stepName: json['stepName'] as String?,
      assignedTo: json['assignedTo'] as String?,
      status: json['status'] as String? ?? 'PENDING',
      dueDate: DateTime.tryParse('${json['dueDate']}'),
      createdAt: DateTime.tryParse('${json['createdAt']}') ?? DateTime.now(),
      completedAt: DateTime.tryParse('${json['completedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'instanceId': instanceId,
        'stepName': stepName,
        'assignedTo': assignedTo,
        'status': status,
        'dueDate': dueDate?.toIso8601String(),
        'createdAt': createdAt.toIso8601String(),
        'completedAt': completedAt?.toIso8601String(),
      };
}

class SlaRuleModel extends SlaRule {
  const SlaRuleModel({
    required super.id,
    required super.name,
    required super.workflowDefinitionId,
    required super.duration,
    required super.unit,
    super.severity,
    required super.createdAt,
  });

  factory SlaRuleModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('SlaRule is missing its id');
    }
    return SlaRuleModel(
      id: id,
      name: json['name'] as String? ?? '',
      workflowDefinitionId: json['workflowDefinitionId'] as String? ?? '',
      duration: asInt(json['duration']),
      unit: json['unit'] as String? ?? 'HOURS',
      severity: json['severity'] as String?,
      createdAt: DateTime.tryParse('${json['createdAt']}') ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'workflowDefinitionId': workflowDefinitionId,
        'duration': duration,
        'unit': unit,
        'severity': severity,
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
