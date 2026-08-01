import '../../../../core/contracts/paginated.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_paths.dart';
import '../models/fixed_assets_models.dart';

abstract class FixedAssetsRemoteDataSource {
  Future<Paginated<FixedAssetModel>> listFixedAssets(ListQuery query);
  Future<FixedAssetModel> getFixedAsset(String id);
  Future<FixedAssetModel> createFixedAsset(Map<String, dynamic> payload);
  Future<FixedAssetModel> updateFixedAsset(String id, Map<String, dynamic> payload);
  Future<void> deleteFixedAsset(String id);
  Future<FixedAssetModel> disposeFixedAsset(String id, Map<String, dynamic> payload);

  Future<Paginated<AssetDepreciationScheduleModel>> listDepreciationSchedules(ListQuery query);
  Future<AssetDepreciationScheduleModel> recordDepreciation(Map<String, dynamic> payload);

  Future<Paginated<AssetMaintenanceScheduleModel>> listMaintenanceSchedules(ListQuery query);
  Future<AssetMaintenanceScheduleModel> getMaintenanceSchedule(String id);
  Future<AssetMaintenanceScheduleModel> createMaintenanceSchedule(Map<String, dynamic> payload);
  Future<AssetMaintenanceScheduleModel> updateMaintenanceSchedule(String id, Map<String, dynamic> payload);
  Future<void> deleteMaintenanceSchedule(String id);
  Future<AssetMaintenanceScheduleModel> completeMaintenanceSchedule(String id);

  Future<Paginated<AssetDisposalModel>> listDisposals(ListQuery query);
  Future<AssetDisposalModel> getDisposal(String id);
  Future<AssetDisposalModel> createDisposal(Map<String, dynamic> payload);
  Future<void> approveDisposal(String id);
  Future<void> deleteDisposal(String id);
}

class FixedAssetsRemoteDataSourceImpl implements FixedAssetsRemoteDataSource {
  const FixedAssetsRemoteDataSourceImpl(this._client);

  final ApiClient _client;

  @override
  Future<Paginated<FixedAssetModel>> listFixedAssets(ListQuery query) =>
      _client.getPaginated<FixedAssetModel>(
        ApiPaths.fixedAssets, query, FixedAssetModel.fromJson,);

  @override
  Future<FixedAssetModel> getFixedAsset(String id) async =>
      FixedAssetModel.fromJson(await _client.getObject(ApiPaths.fixedAsset(id)));

  @override
  Future<FixedAssetModel> createFixedAsset(Map<String, dynamic> payload) async =>
      FixedAssetModel.fromJson(await _client.post(ApiPaths.fixedAssets, body: payload));

  @override
  Future<FixedAssetModel> updateFixedAsset(String id, Map<String, dynamic> payload) async =>
      FixedAssetModel.fromJson(await _client.patch(ApiPaths.fixedAsset(id), body: payload));

  @override
  Future<void> deleteFixedAsset(String id) =>
      _client.delete(ApiPaths.fixedAsset(id));

  @override
  Future<FixedAssetModel> disposeFixedAsset(String id, Map<String, dynamic> payload) async =>
      FixedAssetModel.fromJson(
        await _client.post('${ApiPaths.fixedAsset(id)}/dispose', body: payload),);

  @override
  Future<Paginated<AssetDepreciationScheduleModel>> listDepreciationSchedules(ListQuery query) =>
      _client.getPaginated<AssetDepreciationScheduleModel>(
        ApiPaths.assetDepreciation, query, AssetDepreciationScheduleModel.fromJson,);

  @override
  Future<AssetDepreciationScheduleModel> recordDepreciation(Map<String, dynamic> payload) async =>
      AssetDepreciationScheduleModel.fromJson(
        await _client.post(ApiPaths.assetDepreciation, body: payload),);

  @override
  Future<Paginated<AssetMaintenanceScheduleModel>> listMaintenanceSchedules(ListQuery query) =>
      _client.getPaginated<AssetMaintenanceScheduleModel>(
        ApiPaths.assetMaintenance, query, AssetMaintenanceScheduleModel.fromJson,);

  @override
  Future<AssetMaintenanceScheduleModel> getMaintenanceSchedule(String id) async =>
      AssetMaintenanceScheduleModel.fromJson(
        await _client.getObject(ApiPaths.assetMaintenanceSchedule(id)),);

  @override
  Future<AssetMaintenanceScheduleModel> createMaintenanceSchedule(
    Map<String, dynamic> payload,) async =>
      AssetMaintenanceScheduleModel.fromJson(
        await _client.post(ApiPaths.assetMaintenance, body: payload),);

  @override
  Future<AssetMaintenanceScheduleModel> updateMaintenanceSchedule(
    String id, Map<String, dynamic> payload,) async =>
      AssetMaintenanceScheduleModel.fromJson(
        await _client.patch(ApiPaths.assetMaintenanceSchedule(id), body: payload),);

  @override
  Future<void> deleteMaintenanceSchedule(String id) =>
      _client.delete(ApiPaths.assetMaintenanceSchedule(id));

  @override
  Future<AssetMaintenanceScheduleModel> completeMaintenanceSchedule(String id) async =>
      AssetMaintenanceScheduleModel.fromJson(
        await _client.post('${ApiPaths.assetMaintenanceSchedule(id)}/complete'),);

  @override
  Future<Paginated<AssetDisposalModel>> listDisposals(ListQuery query) =>
      _client.getPaginated<AssetDisposalModel>(
        ApiPaths.assetDisposals, query, AssetDisposalModel.fromJson,);

  @override
  Future<AssetDisposalModel> getDisposal(String id) async =>
      AssetDisposalModel.fromJson(await _client.getObject(ApiPaths.assetDisposal(id)));

  @override
  Future<AssetDisposalModel> createDisposal(Map<String, dynamic> payload) async =>
      AssetDisposalModel.fromJson(await _client.post(ApiPaths.assetDisposals, body: payload));

  @override
  Future<void> approveDisposal(String id) async {
    await _client.post('${ApiPaths.assetDisposal(id)}/approve');
  }

  @override
  Future<void> deleteDisposal(String id) =>
      _client.delete(ApiPaths.assetDisposal(id));
}
