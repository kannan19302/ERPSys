import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/fixed_assets.dart';
import '../repositories/fixed_assets_repository.dart';

class ListFixedAssetsUseCase extends UseCase<Cacheable<Paginated<FixedAsset>>, ListQuery> {
  const ListFixedAssetsUseCase(this._repository);
  final FixedAssetsRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<FixedAsset>>>> call(ListQuery params) =>
      _repository.listFixedAssets(params);
}

class GetFixedAssetUseCase extends UseCase<FixedAsset, String> {
  const GetFixedAssetUseCase(this._repository);
  final FixedAssetsRepository _repository;
  @override
  Future<Result<FixedAsset>> call(String id) => _repository.getFixedAsset(id);
}

class SaveFixedAssetParams {
  const SaveFixedAssetParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveFixedAssetUseCase extends UseCase<FixedAsset, SaveFixedAssetParams> {
  const SaveFixedAssetUseCase(this._repository);
  final FixedAssetsRepository _repository;
  @override
  Future<Result<FixedAsset>> call(SaveFixedAssetParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createFixedAsset(params.payload)
        : _repository.updateFixedAsset(id, params.payload);
  }
}

class DeleteFixedAssetUseCase extends UseCase<void, String> {
  const DeleteFixedAssetUseCase(this._repository);
  final FixedAssetsRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteFixedAsset(id);
}

class DisposeFixedAssetParams {
  const DisposeFixedAssetParams({required this.id, required this.payload});
  final String id;
  final Map<String, dynamic> payload;
}

class DisposeFixedAssetUseCase extends UseCase<FixedAsset, DisposeFixedAssetParams> {
  const DisposeFixedAssetUseCase(this._repository);
  final FixedAssetsRepository _repository;
  @override
  Future<Result<FixedAsset>> call(DisposeFixedAssetParams params) =>
      _repository.disposeFixedAsset(params.id, params.payload);
}

class ListDepreciationSchedulesUseCase
    extends UseCase<Cacheable<Paginated<AssetDepreciationSchedule>>, ListQuery> {
  const ListDepreciationSchedulesUseCase(this._repository);
  final FixedAssetsRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<AssetDepreciationSchedule>>>> call(
    ListQuery params) =>
      _repository.listDepreciationSchedules(params);
}

class ListMaintenanceSchedulesUseCase
    extends UseCase<Cacheable<Paginated<AssetMaintenanceSchedule>>, ListQuery> {
  const ListMaintenanceSchedulesUseCase(this._repository);
  final FixedAssetsRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<AssetMaintenanceSchedule>>>> call(
    ListQuery params) =>
      _repository.listMaintenanceSchedules(params);
}

class ListDisposalsUseCase
    extends UseCase<Cacheable<Paginated<AssetDisposal>>, ListQuery> {
  const ListDisposalsUseCase(this._repository);
  final FixedAssetsRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<AssetDisposal>>>> call(ListQuery params) =>
      _repository.listDisposals(params);
}

class GetDisposalUseCase extends UseCase<AssetDisposal, String> {
  const GetDisposalUseCase(this._repository);
  final FixedAssetsRepository _repository;
  @override
  Future<Result<AssetDisposal>> call(String id) =>
      _repository.getDisposal(id);
}

class SaveDisposalParams {
  const SaveDisposalParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveDisposalUseCase
    extends UseCase<AssetDisposal, SaveDisposalParams> {
  const SaveDisposalUseCase(this._repository);
  final FixedAssetsRepository _repository;
  @override
  Future<Result<AssetDisposal>> call(SaveDisposalParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createDisposal(params.payload)
        : _repository.updateDisposal(id, params.payload);
  }
}

class GetMaintenanceScheduleUseCase
    extends UseCase<AssetMaintenanceSchedule, String> {
  const GetMaintenanceScheduleUseCase(this._repository);
  final FixedAssetsRepository _repository;
  @override
  Future<Result<AssetMaintenanceSchedule>> call(String id) =>
      _repository.getMaintenanceSchedule(id);
}

class SaveMaintenanceScheduleParams {
  const SaveMaintenanceScheduleParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveMaintenanceScheduleUseCase
    extends UseCase<AssetMaintenanceSchedule, SaveMaintenanceScheduleParams> {
  const SaveMaintenanceScheduleUseCase(this._repository);
  final FixedAssetsRepository _repository;
  @override
  Future<Result<AssetMaintenanceSchedule>> call(
      SaveMaintenanceScheduleParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createMaintenanceSchedule(params.payload)
        : _repository.updateMaintenanceSchedule(id, params.payload);
  }
}
