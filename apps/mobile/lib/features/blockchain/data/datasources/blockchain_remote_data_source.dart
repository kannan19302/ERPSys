import '../../../../core/contracts/paginated.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_paths.dart';
import '../models/blockchain_models.dart';

abstract class BlockchainRemoteDataSource {
  Future<Paginated<BlockchainTransactionModel>> listTransactions(ListQuery query);
  Future<BlockchainTransactionModel> getTransaction(String id);

  Future<Paginated<BlockchainContractModel>> listContracts(ListQuery query);
  Future<BlockchainContractModel> getContract(String id);

  Future<Paginated<BlockchainAuditEntryModel>> listAuditEntries(ListQuery query);
  Future<BlockchainAuditEntryModel> getAuditEntry(String id);

  Future<Paginated<BlockchainNetworkHealthModel>> listNetworkHealth(ListQuery query);
  Future<BlockchainNetworkHealthModel> getNetworkHealth(String id);
}

class BlockchainRemoteDataSourceImpl implements BlockchainRemoteDataSource {
  const BlockchainRemoteDataSourceImpl(this._client);

  final ApiClient _client;

  @override
  Future<Paginated<BlockchainTransactionModel>> listTransactions(ListQuery query) =>
      _client.getPaginated<BlockchainTransactionModel>(
        ApiPaths.blockchainExplorer, query, BlockchainTransactionModel.fromJson);

  @override
  Future<BlockchainTransactionModel> getTransaction(String id) async =>
      BlockchainTransactionModel.fromJson(
        await _client.getObject(ApiPaths.blockchainExplorer));

  @override
  Future<Paginated<BlockchainContractModel>> listContracts(ListQuery query) =>
      _client.getPaginated<BlockchainContractModel>(
        ApiPaths.blockchainContracts, query, BlockchainContractModel.fromJson);

  @override
  Future<BlockchainContractModel> getContract(String id) async =>
      BlockchainContractModel.fromJson(
        await _client.getObject(ApiPaths.blockchainContracts));

  @override
  Future<Paginated<BlockchainAuditEntryModel>> listAuditEntries(ListQuery query) =>
      _client.getPaginated<BlockchainAuditEntryModel>(
        ApiPaths.blockchainAudit, query, BlockchainAuditEntryModel.fromJson);

  @override
  Future<BlockchainAuditEntryModel> getAuditEntry(String id) async =>
      BlockchainAuditEntryModel.fromJson(
        await _client.getObject(ApiPaths.blockchainAudit));

  @override
  Future<Paginated<BlockchainNetworkHealthModel>> listNetworkHealth(ListQuery query) =>
      _client.getPaginated<BlockchainNetworkHealthModel>(
        ApiPaths.blockchainNetworkHealth, query, BlockchainNetworkHealthModel.fromJson);

  @override
  Future<BlockchainNetworkHealthModel> getNetworkHealth(String id) async =>
      BlockchainNetworkHealthModel.fromJson(
        await _client.getObject(ApiPaths.blockchainNetworkHealth));
}
