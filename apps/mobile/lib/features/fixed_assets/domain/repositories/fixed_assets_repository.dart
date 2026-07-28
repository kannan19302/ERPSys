import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../entities/fixed_assets.dart';

class Cacheable<T> {
  const Cacheable({required this.value, this.cachedAt});
  final T value;
  final DateTime? cachedAt;
  bool get isFromCache => cachedAt != null;
}

abstract class FixedAssetsRepository {
  Future<Result<Cacheable<Paginated<FixedAsset>>>> listFixedAssets(ListQuery query);
  Future<Result<FixedAsset>> getFixedAsset(String id);
  Future<Result<FixedAsset>> createFixedAsset(Map<String, dynamic> payload);
  Future<Result<FixedAsset>> updateFixedAsset(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteFixedAsset(String id);
  Future<Result<FixedAsset>> disposeFixedAsset(String id, Map<String, dynamic> payload);

  Future<Result<Cacheable<Paginated<AssetDepreciationSchedule>>>> listDepreciationSchedules(
    ListQuery query);
  Future<Result<AssetDepreciationSchedule>> recordDepreciation(Map<String, dynamic> payload);

  Future<Result<Cacheable<Paginated<AssetMaintenanceSchedule>>>> listMaintenanceSchedules(
    ListQuery query);
  Future<Result<AssetMaintenanceSchedule>> getMaintenanceSchedule(String id);
  Future<Result<AssetMaintenanceSchedule>> createMaintenanceSchedule(Map<String, dynamic> payload);
  Future<Result<AssetMaintenanceSchedule>> updateMaintenanceSchedule(
    String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteMaintenanceSchedule(String id);
  Future<Result<AssetMaintenanceSchedule>> completeMaintenanceSchedule(String id);

  Future<Result<Cacheable<Paginated<AssetDisposal>>>> listDisposals(ListQuery query);
  Future<Result<AssetDisposal>> getDisposal(String id);
  Future<Result<AssetDisposal>> createDisposal(Map<String, dynamic> payload);
  Future<Result<void>> approveDisposal(String id);
  Future<Result<void>> deleteDisposal(String id);
}
