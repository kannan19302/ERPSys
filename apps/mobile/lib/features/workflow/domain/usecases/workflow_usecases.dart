import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/workflow.dart';
import '../repositories/workflow_repository.dart';

class SaveWorkflowDefinitionParams {
  const SaveWorkflowDefinitionParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveWorkflowDefinitionUseCase extends UseCase<WorkflowDefinition, SaveWorkflowDefinitionParams> {
  const SaveWorkflowDefinitionUseCase(this._repository);
  final WorkflowRepository _repository;
  @override
  Future<Result<WorkflowDefinition>> call(SaveWorkflowDefinitionParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createDefinition(params.payload)
        : _repository.updateDefinition(id, params.payload);
  }
}

class ListWorkflowDefinitionsUseCase extends UseCase<Cacheable<Paginated<WorkflowDefinition>>, ListQuery> {
  const ListWorkflowDefinitionsUseCase(this._repository);
  final WorkflowRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<WorkflowDefinition>>>> call(ListQuery params) =>
      _repository.listWorkflowDefinitions(params);
}

class GetWorkflowDefinitionUseCase extends UseCase<WorkflowDefinition, String> {
  const GetWorkflowDefinitionUseCase(this._repository);
  final WorkflowRepository _repository;
  @override
  Future<Result<WorkflowDefinition>> call(String id) =>
      _repository.getWorkflowDefinition(id);
}

class DeleteWorkflowDefinitionUseCase extends UseCase<void, String> {
  const DeleteWorkflowDefinitionUseCase(this._repository);
  final WorkflowRepository _repository;
  @override
  Future<Result<void>> call(String id) =>
      _repository.deleteWorkflowDefinition(id);
}

class ActivateWorkflowDefinitionUseCase extends UseCase<WorkflowDefinition, String> {
  const ActivateWorkflowDefinitionUseCase(this._repository);
  final WorkflowRepository _repository;
  @override
  Future<Result<WorkflowDefinition>> call(String id) =>
      _repository.activateWorkflowDefinition(id);
}

class DeactivateWorkflowDefinitionUseCase extends UseCase<WorkflowDefinition, String> {
  const DeactivateWorkflowDefinitionUseCase(this._repository);
  final WorkflowRepository _repository;
  @override
  Future<Result<WorkflowDefinition>> call(String id) =>
      _repository.deactivateWorkflowDefinition(id);
}

class ListWorkflowInstancesUseCase extends UseCase<Cacheable<Paginated<WorkflowInstance>>, ListQuery> {
  const ListWorkflowInstancesUseCase(this._repository);
  final WorkflowRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<WorkflowInstance>>>> call(ListQuery params) =>
      _repository.listWorkflowInstances(params);
}

class GetWorkflowInstanceUseCase extends UseCase<WorkflowInstance, String> {
  const GetWorkflowInstanceUseCase(this._repository);
  final WorkflowRepository _repository;
  @override
  Future<Result<WorkflowInstance>> call(String id) =>
      _repository.getWorkflowInstance(id);
}

class CreateWorkflowInstanceUseCase extends UseCase<WorkflowInstance, Map<String, dynamic>> {
  const CreateWorkflowInstanceUseCase(this._repository);
  final WorkflowRepository _repository;
  @override
  Future<Result<WorkflowInstance>> call(Map<String, dynamic> payload) =>
      _repository.createWorkflowInstance(payload);
}

class AdvanceWorkflowInstanceUseCase extends UseCase<WorkflowInstance, String> {
  const AdvanceWorkflowInstanceUseCase(this._repository);
  final WorkflowRepository _repository;
  @override
  Future<Result<WorkflowInstance>> call(String id) =>
      _repository.advanceWorkflowInstance(id);
}

class CancelWorkflowInstanceUseCase extends UseCase<WorkflowInstance, String> {
  const CancelWorkflowInstanceUseCase(this._repository);
  final WorkflowRepository _repository;
  @override
  Future<Result<WorkflowInstance>> call(String id) =>
      _repository.cancelWorkflowInstance(id);
}

class SaveWorkflowTaskParams {
  const SaveWorkflowTaskParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveWorkflowTaskUseCase extends UseCase<WorkflowTask, SaveWorkflowTaskParams> {
  const SaveWorkflowTaskUseCase(this._repository);
  final WorkflowRepository _repository;
  @override
  Future<Result<WorkflowTask>> call(SaveWorkflowTaskParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createTask(params.payload)
        : _repository.updateTask(id, params.payload);
  }
}

class ListWorkflowTasksUseCase extends UseCase<Cacheable<Paginated<WorkflowTask>>, ListQuery> {
  const ListWorkflowTasksUseCase(this._repository);
  final WorkflowRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<WorkflowTask>>>> call(ListQuery params) =>
      _repository.listWorkflowTasks(params);
}

class ApproveWorkflowTaskUseCase extends UseCase<WorkflowTask, String> {
  const ApproveWorkflowTaskUseCase(this._repository);
  final WorkflowRepository _repository;
  @override
  Future<Result<WorkflowTask>> call(String id) =>
      _repository.approveWorkflowTask(id);
}

class RejectWorkflowTaskUseCase extends UseCase<WorkflowTask, String> {
  const RejectWorkflowTaskUseCase(this._repository);
  final WorkflowRepository _repository;
  @override
  Future<Result<WorkflowTask>> call(String id) =>
      _repository.rejectWorkflowTask(id);
}

class DelegateWorkflowTaskUseCase extends UseCase<WorkflowTask, DelegateWorkflowTaskParams> {
  const DelegateWorkflowTaskUseCase(this._repository);
  final WorkflowRepository _repository;
  @override
  Future<Result<WorkflowTask>> call(DelegateWorkflowTaskParams params) =>
      _repository.delegateWorkflowTask(params.taskId, params.payload);
}

class DelegateWorkflowTaskParams {
  const DelegateWorkflowTaskParams({required this.taskId, required this.payload});
  final String taskId;
  final Map<String, dynamic> payload;
}

class EscalateWorkflowTaskUseCase extends UseCase<WorkflowTask, String> {
  const EscalateWorkflowTaskUseCase(this._repository);
  final WorkflowRepository _repository;
  @override
  Future<Result<WorkflowTask>> call(String id) =>
      _repository.escalateWorkflowTask(id);
}

class GetWorkflowTaskUseCase extends UseCase<WorkflowTask, String> {
  const GetWorkflowTaskUseCase(this._repository);
  final WorkflowRepository _repository;
  @override
  Future<Result<WorkflowTask>> call(String id) =>
      _repository.getWorkflowTask(id);
}

class ListSlaRulesUseCase extends UseCase<Cacheable<Paginated<SlaRule>>, ListQuery> {
  const ListSlaRulesUseCase(this._repository);
  final WorkflowRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<SlaRule>>>> call(ListQuery params) =>
      _repository.listSlaRules(params);
}

