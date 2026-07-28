import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../entities/blockchain.dart';

class Cacheable<T> {
  const Cacheable({required this.value, this.cachedAt});
  final T value;
  final DateTime? cachedAt;
  bool get isFromCache => cachedAt != null;
}

abstract class BlockchainRepository {
  Future<Result<Cacheable<Paginated<BlockchainTransaction>>>> listTransactions(ListQuery query);
  Future<Result<BlockchainTransaction>> getTransaction(String id);

  Future<Result<Cacheable<Paginated<BlockchainContract>>>> listContracts(ListQuery query);
  Future<Result<BlockchainContract>> getContract(String id);

  Future<Result<Cacheable<Paginated<BlockchainAuditEntry>>>> listAuditEntries(ListQuery query);
  Future<Result<BlockchainAuditEntry>> getAuditEntry(String id);

  Future<Result<Cacheable<Paginated<BlockchainNetworkHealth>>>> listNetworkHealth(ListQuery query);
  Future<Result<BlockchainNetworkHealth>> getNetworkHealth(String id);
}
