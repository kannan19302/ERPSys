import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/blockchain.dart';
import '../repositories/blockchain_repository.dart';

class ListBlockchainTransactionsUseCase extends UseCase<Cacheable<Paginated<BlockchainTransaction>>, ListQuery> {
  const ListBlockchainTransactionsUseCase(this._repository);
  final BlockchainRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<BlockchainTransaction>>>> call(ListQuery params) =>
      _repository.listTransactions(params);
}

class GetBlockchainTransactionUseCase extends UseCase<BlockchainTransaction, String> {
  const GetBlockchainTransactionUseCase(this._repository);
  final BlockchainRepository _repository;
  @override
  Future<Result<BlockchainTransaction>> call(String id) => _repository.getTransaction(id);
}

class ListBlockchainContractsUseCase extends UseCase<Cacheable<Paginated<BlockchainContract>>, ListQuery> {
  const ListBlockchainContractsUseCase(this._repository);
  final BlockchainRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<BlockchainContract>>>> call(ListQuery params) =>
      _repository.listContracts(params);
}

class ListBlockchainAuditEntriesUseCase extends UseCase<Cacheable<Paginated<BlockchainAuditEntry>>, ListQuery> {
  const ListBlockchainAuditEntriesUseCase(this._repository);
  final BlockchainRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<BlockchainAuditEntry>>>> call(ListQuery params) =>
      _repository.listAuditEntries(params);
}

class ListBlockchainNetworkHealthUseCase extends UseCase<Cacheable<Paginated<BlockchainNetworkHealth>>, ListQuery> {
  const ListBlockchainNetworkHealthUseCase(this._repository);
  final BlockchainRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<BlockchainNetworkHealth>>>> call(ListQuery params) =>
      _repository.listNetworkHealth(params);
}
