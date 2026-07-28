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

  Future<Result<Cacheable<Paginated<QualityInspection>>>> listQualityInspections(ListQuery query);
  Future<Result<QualityInspection>> getQualityInspection(String id);
}
