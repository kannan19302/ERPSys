import '../../../../core/contracts/paginated.dart';
import '../../../../core/error/error_mapper.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/storage/response_cache.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/fixed_assets.dart';
import '../../domain/repositories/fixed_assets_repository.dart';
import '../datasources/fixed_assets_remote_data_source.dart';
import '../models/fixed_assets_models.dart';

class FixedAssetsRepositoryImpl implements FixedAssetsRepository {
  const FixedAssetsRepositoryImpl({
    required FixedAssetsRemoteDataSource remote,
    required ResponseCache cache,
    required String tenantId,
  })  : _remote = remote,
        _cache = cache,
        _tenantId = tenantId;

  static const String _assetNamespace = 'fixed-assets.assets';
  static const String _depreciationNamespace = 'fixed-assets.depreciation';
  static const String _maintenanceNamespace = 'fixed-assets.maintenance';
  static const String _disposalNamespace = 'fixed-assets.disposals';

  final FixedAssetsRemoteDataSource _remote;
  final ResponseCache _cache;
  final String _tenantId;

  Future<Result<Cacheable<Paginated<T>>>> _paginated<T>(
    String namespace,
    ListQuery query,
    Future<Paginated<T>> Function() fetch,
    T Function(Map<String, dynamic>) fromJson,
  ) async {
    try {
      final Paginated<T> page = await fetch();
      final List<Map<String, dynamic>> jsonItems = page.data
          .map((dynamic e) => (e as dynamic).toJson() as Map<String, dynamic>)
          .toList(growable: false);
      await _cache.write(_tenantId, namespace, query.cacheKey, <String, Object?>{
        'data': jsonItems,
        'meta': page.meta.toJson(),
      });
      return Result<Cacheable<Paginated<T>>>.ok(
        Cacheable<Paginated<T>>(value: page),
      );
    } on NetworkException catch (error) {
      final cached = _cache.read<Map<String, dynamic>>(_tenantId, namespace, query.cacheKey);
      if (cached == null) {
        return Result<Cacheable<Paginated<T>>>.err(mapExceptionToFailure(error));
      }
      return Result<Cacheable<Paginated<T>>>.ok(
        Cacheable<Paginated<T>>(
          value: Paginated<T>.fromJson(cached.value, fromJson),
          cachedAt: cached.cachedAt,
        ),
      );
    } on Object catch (error) {
      return Result<Cacheable<Paginated<T>>>.err(mapExceptionToFailure(error));
    }
  }

  Future<Result<T>> _single<T>(Future<T> Function() fetch) async {
    try {
      return Result<T>.ok(await fetch());
    } on Object catch (error) {
      return Result<T>.err(mapExceptionToFailure(error));
    }
  }

  Future<Result<void>> _delete(Future<void> Function() action) async {
    try {
      await action();
      await _cache.clearTenant(_tenantId);
      return const Result<void>.ok(null);
    } on Object catch (error) {
      return Result<void>.err(mapExceptionToFailure(error));
    }
  }

  Future<Result<T>> _write<T>(Future<T> Function() action) async {
    try {
      final T result = await action();
      await _cache.clearTenant(_tenantId);
      return Result<T>.ok(result);
    } on Object catch (error) {
      return Result<T>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<Cacheable<Paginated<FixedAsset>>>> listFixedAssets(ListQuery query) =>
      _paginated(_assetNamespace, query, () => _remote.listFixedAssets(query),
        FixedAssetModel.fromJson,);

  @override
  Future<Result<FixedAsset>> getFixedAsset(String id) =>
      _single(() => _remote.getFixedAsset(id));

  @override
  Future<Result<FixedAsset>> createFixedAsset(Map<String, dynamic> p) =>
      _write(() => _remote.createFixedAsset(p));

  @override
  Future<Result<FixedAsset>> updateFixedAsset(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateFixedAsset(id, p));

  @override
  Future<Result<void>> deleteFixedAsset(String id) =>
      _delete(() => _remote.deleteFixedAsset(id));

  @override
  Future<Result<FixedAsset>> disposeFixedAsset(String id, Map<String, dynamic> p) =>
      _single(() => _remote.disposeFixedAsset(id, p));

  @override
  Future<Result<Cacheable<Paginated<AssetDepreciationSchedule>>>>
      listDepreciationSchedules(ListQuery query) =>
          _paginated(_depreciationNamespace, query,
            () => _remote.listDepreciationSchedules(query),
            AssetDepreciationScheduleModel.fromJson,);

  @override
  Future<Result<AssetDepreciationSchedule>> recordDepreciation(Map<String, dynamic> p) =>
      _write(() => _remote.recordDepreciation(p));

  @override
  Future<Result<Cacheable<Paginated<AssetMaintenanceSchedule>>>>
      listMaintenanceSchedules(ListQuery query) =>
          _paginated(_maintenanceNamespace, query,
            () => _remote.listMaintenanceSchedules(query),
            AssetMaintenanceScheduleModel.fromJson,);

  @override
  Future<Result<AssetMaintenanceSchedule>> getMaintenanceSchedule(String id) =>
      _single(() => _remote.getMaintenanceSchedule(id));

  @override
  Future<Result<AssetMaintenanceSchedule>> createMaintenanceSchedule(
    Map<String, dynamic> p,) =>
      _write(() => _remote.createMaintenanceSchedule(p));

  @override
  Future<Result<AssetMaintenanceSchedule>> updateMaintenanceSchedule(
    String id, Map<String, dynamic> p,) =>
      _write(() => _remote.updateMaintenanceSchedule(id, p));

  @override
  Future<Result<void>> deleteMaintenanceSchedule(String id) =>
      _delete(() => _remote.deleteMaintenanceSchedule(id));

  @override
  Future<Result<AssetMaintenanceSchedule>> completeMaintenanceSchedule(String id) =>
      _single(() => _remote.completeMaintenanceSchedule(id));

  @override
  Future<Result<Cacheable<Paginated<AssetDisposal>>>> listDisposals(ListQuery query) =>
      _paginated(_disposalNamespace, query, () => _remote.listDisposals(query),
        AssetDisposalModel.fromJson,);

  @override
  Future<Result<AssetDisposal>> getDisposal(String id) =>
      _single(() => _remote.getDisposal(id));

  @override
  Future<Result<AssetDisposal>> createDisposal(Map<String, dynamic> p) =>
      _write(() => _remote.createDisposal(p));

  @override
  Future<Result<void>> approveDisposal(String id) =>
      _single(() async => _remote.approveDisposal(id));

  @override
  Future<Result<void>> deleteDisposal(String id) =>
      _delete(() => _remote.deleteDisposal(id));

  @override
  Future<Result<AssetDisposal>> updateDisposal(String id, Map<String, dynamic> p) async => throw UnimplementedError();

}
