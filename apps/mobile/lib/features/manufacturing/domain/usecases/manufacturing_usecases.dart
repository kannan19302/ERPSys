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
