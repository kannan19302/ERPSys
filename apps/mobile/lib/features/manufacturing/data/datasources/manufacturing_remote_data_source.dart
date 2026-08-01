import '../../../../core/contracts/paginated.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_paths.dart';
import '../models/manufacturing_models.dart';

abstract class ManufacturingRemoteDataSource {
  Future<Paginated<BomModel>> listBoms(ListQuery query);
  Future<BomModel> getBom(String id);
  Future<BomModel> createBom(Map<String, dynamic> payload);
  Future<BomModel> updateBom(String id, Map<String, dynamic> payload);
  Future<void> deleteBom(String id);
  Future<BomModel> explodeBom(String id);

  Future<Paginated<WorkOrderModel>> listWorkOrders(ListQuery query);
  Future<WorkOrderModel> getWorkOrder(String id);
  Future<WorkOrderModel> createWorkOrder(Map<String, dynamic> payload);
  Future<WorkOrderModel> updateWorkOrder(String id, Map<String, dynamic> payload);
  Future<void> deleteWorkOrder(String id);
  Future<WorkOrderModel> startWorkOrder(String id);
  Future<WorkOrderModel> completeWorkOrder(String id);
  Future<WorkOrderModel> cancelWorkOrder(String id);

  Future<Paginated<MrpRunModel>> listMrpRuns(ListQuery query);
  Future<MrpRunModel> getMrpRun(String id);
  Future<MrpRunModel> createMrpRun(Map<String, dynamic> payload);

  Future<Paginated<WorkstationModel>> listWorkstations(ListQuery query);
  Future<WorkstationModel> getWorkstation(String id);
  Future<WorkstationModel> createWorkstation(Map<String, dynamic> payload);
  Future<WorkstationModel> updateWorkstation(String id, Map<String, dynamic> payload);
  Future<void> deleteWorkstation(String id);

  Future<Paginated<RoutingModel>> listRoutings(ListQuery query);
  Future<RoutingModel> getRouting(String id);
  Future<RoutingModel> createRouting(Map<String, dynamic> payload);
  Future<RoutingModel> updateRouting(String id, Map<String, dynamic> payload);
  Future<void> deleteRouting(String id);

  Future<Paginated<QualityInspectionModel>> listQualityInspections(ListQuery query);
  Future<QualityInspectionModel> getQualityInspection(String id);
  Future<QualityInspectionModel> createQualityInspection(Map<String, dynamic> payload);
  Future<QualityInspectionModel> updateQualityInspection(String id, Map<String, dynamic> payload);
  Future<void> deleteQualityInspection(String id);

  Future<Paginated<EngineeringChangeOrderModel>> listEngineeringChangeOrders(ListQuery query);
  Future<EngineeringChangeOrderModel> getEngineeringChangeOrder(String id);
  Future<EngineeringChangeOrderModel> createEngineeringChangeOrder(Map<String, dynamic> payload);
  Future<EngineeringChangeOrderModel> updateEngineeringChangeOrder(String id, Map<String, dynamic> payload);
  Future<void> deleteEngineeringChangeOrder(String id);
  Future<EngineeringChangeOrderModel> approveEngineeringChangeOrder(String id);
}

class ManufacturingRemoteDataSourceImpl implements ManufacturingRemoteDataSource {
  const ManufacturingRemoteDataSourceImpl(this._client);

  final ApiClient _client;

  @override
  Future<Paginated<BomModel>> listBoms(ListQuery query) =>
      _client.getPaginated<BomModel>(ApiPaths.boms, query, BomModel.fromJson);

  @override
  Future<BomModel> getBom(String id) async =>
      BomModel.fromJson(await _client.getObject(ApiPaths.bom(id)));

  @override
  Future<BomModel> createBom(Map<String, dynamic> payload) async =>
      BomModel.fromJson(await _client.post(ApiPaths.boms, body: payload));

  @override
  Future<BomModel> updateBom(String id, Map<String, dynamic> payload) async =>
      BomModel.fromJson(await _client.patch(ApiPaths.bom(id), body: payload));

  @override
  Future<void> deleteBom(String id) => _client.delete(ApiPaths.bom(id));

  @override
  Future<BomModel> explodeBom(String id) async =>
      BomModel.fromJson(await _client.post(ApiPaths.bomExplode(id)));

  @override
  Future<Paginated<WorkOrderModel>> listWorkOrders(ListQuery query) =>
      _client.getPaginated<WorkOrderModel>(
        ApiPaths.workOrders, query, WorkOrderModel.fromJson,);

  @override
  Future<WorkOrderModel> getWorkOrder(String id) async =>
      WorkOrderModel.fromJson(await _client.getObject(ApiPaths.workOrder(id)));

  @override
  Future<WorkOrderModel> createWorkOrder(Map<String, dynamic> payload) async =>
      WorkOrderModel.fromJson(
        await _client.post(ApiPaths.workOrders, body: payload),);

  @override
  Future<WorkOrderModel> updateWorkOrder(
    String id, Map<String, dynamic> payload,) async =>
      WorkOrderModel.fromJson(
        await _client.patch(ApiPaths.workOrder(id), body: payload),);

  @override
  Future<void> deleteWorkOrder(String id) =>
      _client.delete(ApiPaths.workOrder(id));

  @override
  Future<WorkOrderModel> startWorkOrder(String id) async =>
      WorkOrderModel.fromJson(
        await _client.post(ApiPaths.workOrderStart(id)),);

  @override
  Future<WorkOrderModel> completeWorkOrder(String id) async =>
      WorkOrderModel.fromJson(
        await _client.post(ApiPaths.workOrderComplete(id)),);

  @override
  Future<WorkOrderModel> cancelWorkOrder(String id) async =>
      WorkOrderModel.fromJson(
        await _client.post(ApiPaths.workOrderCancel(id)),);

  @override
  Future<Paginated<MrpRunModel>> listMrpRuns(ListQuery query) =>
      _client.getPaginated<MrpRunModel>(
        ApiPaths.mrpRuns, query, MrpRunModel.fromJson,);

  @override
  Future<MrpRunModel> getMrpRun(String id) async =>
      MrpRunModel.fromJson(await _client.getObject('/manufacturing/mrp/runs/$id'));

  @override
  Future<MrpRunModel> createMrpRun(Map<String, dynamic> payload) async =>
      MrpRunModel.fromJson(
        await _client.post(ApiPaths.mrpRun, body: payload),);

  @override
  Future<Paginated<WorkstationModel>> listWorkstations(ListQuery query) =>
      _client.getPaginated<WorkstationModel>(
        ApiPaths.workstations, query, WorkstationModel.fromJson,);

  @override
  Future<WorkstationModel> getWorkstation(String id) async =>
      WorkstationModel.fromJson(
        await _client.getObject(ApiPaths.workstation(id)),);

  @override
  Future<WorkstationModel> createWorkstation(Map<String, dynamic> payload) async =>
      WorkstationModel.fromJson(
        await _client.post(ApiPaths.workstations, body: payload),);

  @override
  Future<WorkstationModel> updateWorkstation(
    String id, Map<String, dynamic> payload,) async =>
      WorkstationModel.fromJson(
        await _client.patch(ApiPaths.workstation(id), body: payload),);

  @override
  Future<void> deleteWorkstation(String id) =>
      _client.delete(ApiPaths.workstation(id));

  @override
  Future<Paginated<RoutingModel>> listRoutings(ListQuery query) =>
      _client.getPaginated<RoutingModel>(
        ApiPaths.routings, query, RoutingModel.fromJson,);

  @override
  Future<RoutingModel> getRouting(String id) async =>
      RoutingModel.fromJson(
        await _client.getObject(ApiPaths.routing(id)),);

  @override
  Future<RoutingModel> createRouting(Map<String, dynamic> payload) async =>
      RoutingModel.fromJson(
        await _client.post(ApiPaths.routings, body: payload),);

  @override
  Future<RoutingModel> updateRouting(
    String id, Map<String, dynamic> payload,) async =>
      RoutingModel.fromJson(
        await _client.patch(ApiPaths.routing(id), body: payload),);

  @override
  Future<void> deleteRouting(String id) =>
      _client.delete(ApiPaths.routing(id));

  @override
  Future<Paginated<QualityInspectionModel>> listQualityInspections(
    ListQuery query,) =>
      _client.getPaginated<QualityInspectionModel>(
        ApiPaths.qualityInspections, query, QualityInspectionModel.fromJson,);

  @override
  Future<QualityInspectionModel> getQualityInspection(String id) async =>
      QualityInspectionModel.fromJson(
        await _client.getObject(ApiPaths.qualityInspection(id)),);

  @override
  Future<QualityInspectionModel> createQualityInspection(
    Map<String, dynamic> payload,) async =>
      QualityInspectionModel.fromJson(
        await _client.post(ApiPaths.qualityInspections, body: payload),);

  @override
  Future<QualityInspectionModel> updateQualityInspection(
    String id, Map<String, dynamic> payload,) async =>
      QualityInspectionModel.fromJson(
        await _client.patch(ApiPaths.qualityInspection(id), body: payload),);

  @override
  Future<void> deleteQualityInspection(String id) =>
      _client.delete(ApiPaths.qualityInspection(id));

  @override
  Future<Paginated<EngineeringChangeOrderModel>> listEngineeringChangeOrders(
    ListQuery query,) =>
      _client.getPaginated<EngineeringChangeOrderModel>(
        ApiPaths.eco, query, EngineeringChangeOrderModel.fromJson,);

  @override
  Future<EngineeringChangeOrderModel> getEngineeringChangeOrder(String id) async =>
      EngineeringChangeOrderModel.fromJson(
        await _client.getObject(ApiPaths.ecoDetail(id)),);

  @override
  Future<EngineeringChangeOrderModel> createEngineeringChangeOrder(
    Map<String, dynamic> payload,) async =>
      EngineeringChangeOrderModel.fromJson(
        await _client.post(ApiPaths.eco, body: payload),);

  @override
  Future<EngineeringChangeOrderModel> updateEngineeringChangeOrder(
    String id, Map<String, dynamic> payload,) async =>
      EngineeringChangeOrderModel.fromJson(
        await _client.patch(ApiPaths.ecoDetail(id), body: payload),);

  @override
  Future<void> deleteEngineeringChangeOrder(String id) =>
      _client.delete(ApiPaths.ecoDetail(id));

  @override
  Future<EngineeringChangeOrderModel> approveEngineeringChangeOrder(
    String id,) async =>
      EngineeringChangeOrderModel.fromJson(
        await _client.post(ApiPaths.ecoApprove(id)),);
}