import '../../../../core/contracts/paginated.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_paths.dart';
import '../models/workflow_models.dart';

abstract class WorkflowRemoteDataSource {
  Future<Paginated<WorkflowDefinitionModel>> listWorkflowDefinitions(ListQuery query);
  Future<WorkflowDefinitionModel> getWorkflowDefinition(String id);
  Future<WorkflowDefinitionModel> createWorkflowDefinition(Map<String, dynamic> payload);
  Future<WorkflowDefinitionModel> updateWorkflowDefinition(String id, Map<String, dynamic> payload);
  Future<void> deleteWorkflowDefinition(String id);
  Future<WorkflowDefinitionModel> activateWorkflowDefinition(String id);
  Future<WorkflowDefinitionModel> deactivateWorkflowDefinition(String id);

  Future<Paginated<WorkflowInstanceModel>> listWorkflowInstances(ListQuery query);
  Future<WorkflowInstanceModel> getWorkflowInstance(String id);
  Future<WorkflowInstanceModel> createWorkflowInstance(Map<String, dynamic> payload);
  Future<WorkflowInstanceModel> advanceWorkflowInstance(String id);
  Future<WorkflowInstanceModel> cancelWorkflowInstance(String id);

  Future<Paginated<WorkflowTaskModel>> listWorkflowTasks(ListQuery query);
  Future<WorkflowTaskModel> approveWorkflowTask(String id);
  Future<WorkflowTaskModel> rejectWorkflowTask(String id);
  Future<WorkflowTaskModel> delegateWorkflowTask(String id, Map<String, dynamic> payload);
  Future<WorkflowTaskModel> escalateWorkflowTask(String id);

  Future<Paginated<SlaRuleModel>> listSlaRules(ListQuery query);
  Future<SlaRuleModel> createSlaRule(Map<String, dynamic> payload);
  Future<SlaRuleModel> updateSlaRule(String id, Map<String, dynamic> payload);
  Future<void> deleteSlaRule(String id);
}

class WorkflowRemoteDataSourceImpl implements WorkflowRemoteDataSource {
  const WorkflowRemoteDataSourceImpl(this._client);

  final ApiClient _client;

  @override
  Future<Paginated<WorkflowDefinitionModel>> listWorkflowDefinitions(ListQuery query) =>
      _client.getPaginated<WorkflowDefinitionModel>(
        ApiPaths.workflowDefinitions, query, WorkflowDefinitionModel.fromJson,);

  @override
  Future<WorkflowDefinitionModel> getWorkflowDefinition(String id) async =>
      WorkflowDefinitionModel.fromJson(
        await _client.getObject(ApiPaths.workflowDefinition(id)),);

  @override
  Future<WorkflowDefinitionModel> createWorkflowDefinition(Map<String, dynamic> payload) async =>
      WorkflowDefinitionModel.fromJson(
        await _client.post(ApiPaths.workflowDefinitions, body: payload),);

  @override
  Future<WorkflowDefinitionModel> updateWorkflowDefinition(
    String id, Map<String, dynamic> payload,) async =>
      WorkflowDefinitionModel.fromJson(
        await _client.patch(ApiPaths.workflowDefinition(id), body: payload),);

  @override
  Future<void> deleteWorkflowDefinition(String id) =>
      _client.delete(ApiPaths.workflowDefinition(id));

  @override
  Future<WorkflowDefinitionModel> activateWorkflowDefinition(String id) async =>
      WorkflowDefinitionModel.fromJson(
        await _client.post(ApiPaths.workflowDefinitionActivate(id)),);

  @override
  Future<WorkflowDefinitionModel> deactivateWorkflowDefinition(String id) async =>
      WorkflowDefinitionModel.fromJson(
        await _client.post(ApiPaths.workflowDefinitionDeactivate(id)),);

  @override
  Future<Paginated<WorkflowInstanceModel>> listWorkflowInstances(ListQuery query) =>
      _client.getPaginated<WorkflowInstanceModel>(
        ApiPaths.workflowInstances, query, WorkflowInstanceModel.fromJson,);

  @override
  Future<WorkflowInstanceModel> getWorkflowInstance(String id) async =>
      WorkflowInstanceModel.fromJson(
        await _client.getObject(ApiPaths.workflowInstance(id)),);

  @override
  Future<WorkflowInstanceModel> createWorkflowInstance(Map<String, dynamic> payload) async =>
      WorkflowInstanceModel.fromJson(
        await _client.post(ApiPaths.workflowInstances, body: payload),);

  @override
  Future<WorkflowInstanceModel> advanceWorkflowInstance(String id) async =>
      WorkflowInstanceModel.fromJson(
        await _client.post(ApiPaths.workflowInstanceAdvance(id)),);

  @override
  Future<WorkflowInstanceModel> cancelWorkflowInstance(String id) async =>
      WorkflowInstanceModel.fromJson(
        await _client.post(ApiPaths.workflowInstanceCancel(id)),);

  @override
  Future<Paginated<WorkflowTaskModel>> listWorkflowTasks(ListQuery query) =>
      _client.getPaginated<WorkflowTaskModel>(
        ApiPaths.workflowTasks, query, WorkflowTaskModel.fromJson,);

  @override
  Future<WorkflowTaskModel> approveWorkflowTask(String id) async =>
      WorkflowTaskModel.fromJson(
        await _client.post(ApiPaths.workflowTaskApprove(id)),);

  @override
  Future<WorkflowTaskModel> rejectWorkflowTask(String id) async =>
      WorkflowTaskModel.fromJson(
        await _client.post(ApiPaths.workflowTaskReject(id)),);

  @override
  Future<WorkflowTaskModel> delegateWorkflowTask(
    String id, Map<String, dynamic> payload,) async =>
      WorkflowTaskModel.fromJson(
        await _client.post(ApiPaths.workflowTaskDelegate(id), body: payload),);

  @override
  Future<WorkflowTaskModel> escalateWorkflowTask(String id) async =>
      WorkflowTaskModel.fromJson(
        await _client.post(ApiPaths.workflowTaskEscalate(id)),);

  @override
  Future<Paginated<SlaRuleModel>> listSlaRules(ListQuery query) =>
      _client.getPaginated<SlaRuleModel>(
        ApiPaths.slaRules, query, SlaRuleModel.fromJson,);

  @override
  Future<SlaRuleModel> createSlaRule(Map<String, dynamic> payload) async =>
      SlaRuleModel.fromJson(
        await _client.post(ApiPaths.slaRules, body: payload),);

  @override
  Future<SlaRuleModel> updateSlaRule(String id, Map<String, dynamic> payload) async =>
      SlaRuleModel.fromJson(
        await _client.patch(ApiPaths.slaRule(id), body: payload),);

  @override
  Future<void> deleteSlaRule(String id) =>
      _client.delete(ApiPaths.slaRule(id));
}
