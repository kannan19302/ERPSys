import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../entities/workflow.dart';

class Cacheable<T> {
  const Cacheable({required this.value, this.cachedAt});
  final T value;
  final DateTime? cachedAt;
  bool get isFromCache => cachedAt != null;
}

abstract class WorkflowRepository {
  Future<Result<Cacheable<Paginated<WorkflowDefinition>>>> listWorkflowDefinitions(ListQuery query);
  Future<Result<WorkflowDefinition>> getWorkflowDefinition(String id);
  Future<Result<WorkflowDefinition>> createWorkflowDefinition(Map<String, dynamic> payload);
  Future<Result<WorkflowDefinition>> updateWorkflowDefinition(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteWorkflowDefinition(String id);
  Future<Result<WorkflowDefinition>> activateWorkflowDefinition(String id);
  Future<Result<WorkflowDefinition>> deactivateWorkflowDefinition(String id);

  Future<Result<Cacheable<Paginated<WorkflowInstance>>>> listWorkflowInstances(ListQuery query);
  Future<Result<WorkflowInstance>> getWorkflowInstance(String id);
  Future<Result<WorkflowInstance>> createWorkflowInstance(Map<String, dynamic> payload);
  Future<Result<WorkflowInstance>> advanceWorkflowInstance(String id);
  Future<Result<WorkflowInstance>> cancelWorkflowInstance(String id);

  Future<Result<Cacheable<Paginated<WorkflowTask>>>> listWorkflowTasks(ListQuery query);
  Future<Result<WorkflowTask>> approveWorkflowTask(String id);
  Future<Result<WorkflowTask>> rejectWorkflowTask(String id);
  Future<Result<WorkflowTask>> delegateWorkflowTask(String id, Map<String, dynamic> payload);
  Future<Result<WorkflowTask>> escalateWorkflowTask(String id);
  Future<Result<WorkflowTask>> createWorkflowTask(Map<String, dynamic> payload);
  Future<Result<WorkflowTask>> updateWorkflowTask(String id, Map<String, dynamic> payload);

  Future<Result<Cacheable<Paginated<SlaRule>>>> listSlaRules(ListQuery query);
  Future<Result<SlaRule>> createSlaRule(Map<String, dynamic> payload);
  Future<Result<SlaRule>> updateSlaRule(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteSlaRule(String id);



  Future<Result<WorkflowDefinition>> createDefinition(Map<String, dynamic> payload);
  Future<Result<WorkflowDefinition>> updateDefinition(String id, Map<String, dynamic> payload);
  Future<Result<WorkflowTask>> createTask(Map<String, dynamic> payload);
  Future<Result<WorkflowTask>> updateTask(String id, Map<String, dynamic> payload);
  Future<Result<WorkflowTask>> getWorkflowTask(String id);

}