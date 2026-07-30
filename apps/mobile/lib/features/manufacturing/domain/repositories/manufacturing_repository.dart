import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../entities/manufacturing.dart';

class Cacheable<T> {
  const Cacheable({required this.value, this.cachedAt});
  final T value;
  final DateTime? cachedAt;
  bool get isFromCache => cachedAt != null;
}

abstract class ManufacturingRepository {
  Future<Result<Cacheable<Paginated<Bom>>>> listBoms(ListQuery query);
  Future<Result<Bom>> getBom(String id);
  Future<Result<Bom>> createBom(Map<String, dynamic> payload);
  Future<Result<Bom>> updateBom(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteBom(String id);

  Future<Result<Cacheable<Paginated<WorkOrder>>>> listWorkOrders(ListQuery query);
  Future<Result<WorkOrder>> getWorkOrder(String id);
  Future<Result<WorkOrder>> createWorkOrder(Map<String, dynamic> payload);
  Future<Result<WorkOrder>> updateWorkOrder(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteWorkOrder(String id);
  Future<Result<WorkOrder>> startWorkOrder(String id);
  Future<Result<WorkOrder>> completeWorkOrder(String id);
  Future<Result<WorkOrder>> cancelWorkOrder(String id);

  Future<Result<Cacheable<Paginated<MrpRun>>>> listMrpRuns(ListQuery query);
  Future<Result<MrpRun>> getMrpRun(String id);
  Future<Result<MrpRun>> createMrpRun(Map<String, dynamic> payload);

  Future<Result<Cacheable<Paginated<Workstation>>>> listWorkstations(ListQuery query);
  Future<Result<Workstation>> getWorkstation(String id);
  Future<Result<Workstation>> createWorkstation(Map<String, dynamic> payload);
  Future<Result<Workstation>> updateWorkstation(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteWorkstation(String id);

  Future<Result<Cacheable<Paginated<Routing>>>> listRoutings(ListQuery query);
  Future<Result<Routing>> getRouting(String id);
  Future<Result<Routing>> createRouting(Map<String, dynamic> payload);
  Future<Result<Routing>> updateRouting(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteRouting(String id);

  Future<Result<Cacheable<Paginated<QualityInspection>>>> listQualityInspections(ListQuery query);
  Future<Result<QualityInspection>> getQualityInspection(String id);
  Future<Result<QualityInspection>> createQualityInspection(Map<String, dynamic> payload);
  Future<Result<QualityInspection>> updateQualityInspection(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteQualityInspection(String id);

  Future<Result<Cacheable<Paginated<EngineeringChangeOrder>>>> listEngineeringChangeOrders(ListQuery query);
  Future<Result<EngineeringChangeOrder>> getEngineeringChangeOrder(String id);
  Future<Result<EngineeringChangeOrder>> createEngineeringChangeOrder(Map<String, dynamic> payload);
  Future<Result<EngineeringChangeOrder>> updateEngineeringChangeOrder(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteEngineeringChangeOrder(String id);
  Future<Result<EngineeringChangeOrder>> approveEngineeringChangeOrder(String id);
}