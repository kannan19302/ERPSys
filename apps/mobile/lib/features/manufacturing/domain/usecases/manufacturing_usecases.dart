import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/manufacturing.dart';
import '../repositories/manufacturing_repository.dart';

// ── BOM ──

class ListBomsUseCase extends UseCase<Cacheable<Paginated<Bom>>, ListQuery> {
  const ListBomsUseCase(this._repository);
  final ManufacturingRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<Bom>>>> call(ListQuery params) =>
      _repository.listBoms(params);
}

class GetBomUseCase extends UseCase<Bom, String> {
  const GetBomUseCase(this._repository);
  final ManufacturingRepository _repository;
  @override
  Future<Result<Bom>> call(String id) => _repository.getBom(id);
}

class SaveBomParams {
  const SaveBomParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveBomUseCase extends UseCase<Bom, SaveBomParams> {
  const SaveBomUseCase(this._repository);
  final ManufacturingRepository _repository;
  @override
  Future<Result<Bom>> call(SaveBomParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createBom(params.payload)
        : _repository.updateBom(id, params.payload);
  }
}

class DeleteBomUseCase extends UseCase<void, String> {
  const DeleteBomUseCase(this._repository);
  final ManufacturingRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteBom(id);
}

class ExplodeBomUseCase extends UseCase<Bom, String> {
  const ExplodeBomUseCase(this._repository);
  final ManufacturingRepository _repository;
  @override
  Future<Result<Bom>> call(String id) => _repository.getBom(id);
}

// ── Work Order ──

class ListWorkOrdersUseCase extends UseCase<Cacheable<Paginated<WorkOrder>>, ListQuery> {
  const ListWorkOrdersUseCase(this._repository);
  final ManufacturingRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<WorkOrder>>>> call(ListQuery params) =>
      _repository.listWorkOrders(params);
}

class GetWorkOrderUseCase extends UseCase<WorkOrder, String> {
  const GetWorkOrderUseCase(this._repository);
  final ManufacturingRepository _repository;
  @override
  Future<Result<WorkOrder>> call(String id) => _repository.getWorkOrder(id);
}

class SaveWorkOrderParams {
  const SaveWorkOrderParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveWorkOrderUseCase extends UseCase<WorkOrder, SaveWorkOrderParams> {
  const SaveWorkOrderUseCase(this._repository);
  final ManufacturingRepository _repository;
  @override
  Future<Result<WorkOrder>> call(SaveWorkOrderParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createWorkOrder(params.payload)
        : _repository.updateWorkOrder(id, params.payload);
  }
}

class DeleteWorkOrderUseCase extends UseCase<void, String> {
  const DeleteWorkOrderUseCase(this._repository);
  final ManufacturingRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteWorkOrder(id);
}

class StartWorkOrderUseCase extends UseCase<WorkOrder, String> {
  const StartWorkOrderUseCase(this._repository);
  final ManufacturingRepository _repository;
  @override
  Future<Result<WorkOrder>> call(String id) => _repository.startWorkOrder(id);
}

class CompleteWorkOrderUseCase extends UseCase<WorkOrder, String> {
  const CompleteWorkOrderUseCase(this._repository);
  final ManufacturingRepository _repository;
  @override
  Future<Result<WorkOrder>> call(String id) => _repository.completeWorkOrder(id);
}

class CancelWorkOrderUseCase extends UseCase<WorkOrder, String> {
  const CancelWorkOrderUseCase(this._repository);
  final ManufacturingRepository _repository;
  @override
  Future<Result<WorkOrder>> call(String id) => _repository.cancelWorkOrder(id);
}

// ── MRP / Production Plan ──

class ListMrpRunsUseCase extends UseCase<Cacheable<Paginated<MrpRun>>, ListQuery> {
  const ListMrpRunsUseCase(this._repository);
  final ManufacturingRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<MrpRun>>>> call(ListQuery params) =>
      _repository.listMrpRuns(params);
}

class GetMrpRunUseCase extends UseCase<MrpRun, String> {
  const GetMrpRunUseCase(this._repository);
  final ManufacturingRepository _repository;
  @override
  Future<Result<MrpRun>> call(String id) => _repository.getMrpRun(id);
}

class CreateMrpRunUseCase extends UseCase<MrpRun, Map<String, dynamic>> {
  const CreateMrpRunUseCase(this._repository);
  final ManufacturingRepository _repository;
  @override
  Future<Result<MrpRun>> call(Map<String, dynamic> params) =>
      _repository.createMrpRun(params);
}

// ── Workstation ──

class ListWorkstationsUseCase extends UseCase<Cacheable<Paginated<Workstation>>, ListQuery> {
  const ListWorkstationsUseCase(this._repository);
  final ManufacturingRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<Workstation>>>> call(ListQuery params) =>
      _repository.listWorkstations(params);
}

class GetWorkstationUseCase extends UseCase<Workstation, String> {
  const GetWorkstationUseCase(this._repository);
  final ManufacturingRepository _repository;
  @override
  Future<Result<Workstation>> call(String id) => _repository.getWorkstation(id);
}

class SaveWorkstationParams {
  const SaveWorkstationParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveWorkstationUseCase extends UseCase<Workstation, SaveWorkstationParams> {
  const SaveWorkstationUseCase(this._repository);
  final ManufacturingRepository _repository;
  @override
  Future<Result<Workstation>> call(SaveWorkstationParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createWorkstation(params.payload)
        : _repository.updateWorkstation(id, params.payload);
  }
}

class DeleteWorkstationUseCase extends UseCase<void, String> {
  const DeleteWorkstationUseCase(this._repository);
  final ManufacturingRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteWorkstation(id);
}

// ── Routing ──

class ListRoutingsUseCase extends UseCase<Cacheable<Paginated<Routing>>, ListQuery> {
  const ListRoutingsUseCase(this._repository);
  final ManufacturingRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<Routing>>>> call(ListQuery params) =>
      _repository.listRoutings(params);
}

class GetRoutingUseCase extends UseCase<Routing, String> {
  const GetRoutingUseCase(this._repository);
  final ManufacturingRepository _repository;
  @override
  Future<Result<Routing>> call(String id) => _repository.getRouting(id);
}

class SaveRoutingParams {
  const SaveRoutingParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveRoutingUseCase extends UseCase<Routing, SaveRoutingParams> {
  const SaveRoutingUseCase(this._repository);
  final ManufacturingRepository _repository;
  @override
  Future<Result<Routing>> call(SaveRoutingParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createRouting(params.payload)
        : _repository.updateRouting(id, params.payload);
  }
}

class DeleteRoutingUseCase extends UseCase<void, String> {
  const DeleteRoutingUseCase(this._repository);
  final ManufacturingRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteRouting(id);
}

// ── Quality Inspection ──

class ListQualityInspectionsUseCase extends UseCase<Cacheable<Paginated<QualityInspection>>, ListQuery> {
  const ListQualityInspectionsUseCase(this._repository);
  final ManufacturingRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<QualityInspection>>>> call(ListQuery params) =>
      _repository.listQualityInspections(params);
}

class GetQualityInspectionUseCase extends UseCase<QualityInspection, String> {
  const GetQualityInspectionUseCase(this._repository);
  final ManufacturingRepository _repository;
  @override
  Future<Result<QualityInspection>> call(String id) =>
      _repository.getQualityInspection(id);
}

class SaveQualityInspectionParams {
  const SaveQualityInspectionParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveQualityInspectionUseCase extends UseCase<QualityInspection, SaveQualityInspectionParams> {
  const SaveQualityInspectionUseCase(this._repository);
  final ManufacturingRepository _repository;
  @override
  Future<Result<QualityInspection>> call(SaveQualityInspectionParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createQualityInspection(params.payload)
        : _repository.updateQualityInspection(id, params.payload);
  }
}

class DeleteQualityInspectionUseCase extends UseCase<void, String> {
  const DeleteQualityInspectionUseCase(this._repository);
  final ManufacturingRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteQualityInspection(id);
}

// ── Engineering Change Order ──

class ListEngineeringChangeOrdersUseCase extends UseCase<Cacheable<Paginated<EngineeringChangeOrder>>, ListQuery> {
  const ListEngineeringChangeOrdersUseCase(this._repository);
  final ManufacturingRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<EngineeringChangeOrder>>>> call(ListQuery params) =>
      _repository.listEngineeringChangeOrders(params);
}

class GetEngineeringChangeOrderUseCase extends UseCase<EngineeringChangeOrder, String> {
  const GetEngineeringChangeOrderUseCase(this._repository);
  final ManufacturingRepository _repository;
  @override
  Future<Result<EngineeringChangeOrder>> call(String id) =>
      _repository.getEngineeringChangeOrder(id);
}

class SaveEngineeringChangeOrderParams {
  const SaveEngineeringChangeOrderParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveEngineeringChangeOrderUseCase extends UseCase<EngineeringChangeOrder, SaveEngineeringChangeOrderParams> {
  const SaveEngineeringChangeOrderUseCase(this._repository);
  final ManufacturingRepository _repository;
  @override
  Future<Result<EngineeringChangeOrder>> call(SaveEngineeringChangeOrderParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createEngineeringChangeOrder(params.payload)
        : _repository.updateEngineeringChangeOrder(id, params.payload);
  }
}

class DeleteEngineeringChangeOrderUseCase extends UseCase<void, String> {
  const DeleteEngineeringChangeOrderUseCase(this._repository);
  final ManufacturingRepository _repository;
  @override
  Future<Result<void>> call(String id) =>
      _repository.deleteEngineeringChangeOrder(id);
}

class ApproveEngineeringChangeOrderUseCase extends UseCase<EngineeringChangeOrder, String> {
  const ApproveEngineeringChangeOrderUseCase(this._repository);
  final ManufacturingRepository _repository;
  @override
  Future<Result<EngineeringChangeOrder>> call(String id) =>
      _repository.approveEngineeringChangeOrder(id);
}