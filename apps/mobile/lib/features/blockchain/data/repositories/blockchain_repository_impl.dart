import '../../../../core/contracts/paginated.dart';
import '../../../../core/error/error_mapper.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/storage/response_cache.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/blockchain.dart';
import '../../domain/repositories/blockchain_repository.dart';
import '../datasources/blockchain_remote_data_source.dart';
import '../models/blockchain_models.dart';

class BlockchainRepositoryImpl implements BlockchainRepository {
  const BlockchainRepositoryImpl({
    required BlockchainRemoteDataSource remote,
    required ResponseCache cache,
    required String tenantId,
  })  : _remote = remote,
        _cache = cache,
        _tenantId = tenantId;

  static const String _txNamespace = 'blockchain.transactions';
  static const String _contractNamespace = 'blockchain.contracts';
  static const String _auditNamespace = 'blockchain.audit';
  static const String _healthNamespace = 'blockchain.network-health';

  final BlockchainRemoteDataSource _remote;
  final ResponseCache _cache;
  final String _tenantId;

  Future<Result<Cacheable<Paginated<T>>>> _paginated<T>(
    String namespace,
    ListQuery query,
    Future<Paginated<T>> Function() fetch,
    T Function(Map<String, dynamic>) fromJson,
  ) async {
    try {
      final page = await fetch();
      final jsonItems = page.data
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

  @override
  Future<Result<Cacheable<Paginated<BlockchainTransaction>>>> listTransactions(
    ListQuery query) =>
      _paginated(_txNamespace, query, () => _remote.listTransactions(query),
        BlockchainTransactionModel.fromJson);

  @override
  Future<Result<BlockchainTransaction>> getTransaction(String id) =>
      _single(() => _remote.getTransaction(id));

  @override
  Future<Result<Cacheable<Paginated<BlockchainContract>>>> listContracts(
    ListQuery query) =>
      _paginated(_contractNamespace, query, () => _remote.listContracts(query),
        BlockchainContractModel.fromJson);

  @override
  Future<Result<BlockchainContract>> getContract(String id) =>
      _single(() => _remote.getContract(id));

  @override
  Future<Result<Cacheable<Paginated<BlockchainAuditEntry>>>> listAuditEntries(
    ListQuery query) =>
      _paginated(_auditNamespace, query, () => _remote.listAuditEntries(query),
        BlockchainAuditEntryModel.fromJson);

  @override
  Future<Result<BlockchainAuditEntry>> getAuditEntry(String id) =>
      _single(() => _remote.getAuditEntry(id));

  @override
  Future<Result<Cacheable<Paginated<BlockchainNetworkHealth>>>> listNetworkHealth(
    ListQuery query) =>
      _paginated(_healthNamespace, query, () => _remote.listNetworkHealth(query),
        BlockchainNetworkHealthModel.fromJson);

  @override
  Future<Result<BlockchainNetworkHealth>> getNetworkHealth(String id) =>
      _single(() => _remote.getNetworkHealth(id));
}
