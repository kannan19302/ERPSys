import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/saas.dart';
import '../repositories/saas_repository.dart';

class ListSaasPlansUseCase extends UseCase<Cacheable<Paginated<SaasPlan>>, ListQuery> {
  const ListSaasPlansUseCase(this._repository);
  final SaasRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<SaasPlan>>>> call(ListQuery params) =>
      _repository.listPlans(params);
}

class GetSaasPlanUseCase extends UseCase<SaasPlan, String> {
  const GetSaasPlanUseCase(this._repository);
  final SaasRepository _repository;
  @override
  Future<Result<SaasPlan>> call(String id) => _repository.getPlan(id);
}

class SaveSaasPlanParams {
  const SaveSaasPlanParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveSaasPlanUseCase extends UseCase<SaasPlan, SaveSaasPlanParams> {
  const SaveSaasPlanUseCase(this._repository);
  final SaasRepository _repository;
  @override
  Future<Result<SaasPlan>> call(SaveSaasPlanParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createPlan(params.payload)
        : _repository.updatePlan(id, params.payload);
  }
}

class DeleteSaasPlanUseCase extends UseCase<void, String> {
  const DeleteSaasPlanUseCase(this._repository);
  final SaasRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deletePlan(id);
}

class ListSaasSubscriptionsUseCase extends UseCase<Cacheable<Paginated<SaasSubscription>>, ListQuery> {
  const ListSaasSubscriptionsUseCase(this._repository);
  final SaasRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<SaasSubscription>>>> call(ListQuery params) =>
      _repository.listSubscriptions(params);
}

class GetSaasSubscriptionUseCase extends UseCase<SaasSubscription, String> {
  const GetSaasSubscriptionUseCase(this._repository);
  final SaasRepository _repository;
  @override
  Future<Result<SaasSubscription>> call(String id) => _repository.getSubscription(id);
}

class SaveSaasSubscriptionParams {
  const SaveSaasSubscriptionParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveSaasSubscriptionUseCase extends UseCase<SaasSubscription, SaveSaasSubscriptionParams> {
  const SaveSaasSubscriptionUseCase(this._repository);
  final SaasRepository _repository;
  @override
  Future<Result<SaasSubscription>> call(SaveSaasSubscriptionParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createSubscription(params.payload)
        : _repository.updateSubscription(id, params.payload);
  }
}

class CancelSaasSubscriptionUseCase extends UseCase<void, String> {
  const CancelSaasSubscriptionUseCase(this._repository);
  final SaasRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.cancelSubscription(id);
}

class ListSaasInvoicesUseCase extends UseCase<Cacheable<Paginated<SaasInvoice>>, ListQuery> {
  const ListSaasInvoicesUseCase(this._repository);
  final SaasRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<SaasInvoice>>>> call(ListQuery params) =>
      _repository.listInvoices(params);
}

class GetSaasInvoiceUseCase extends UseCase<SaasInvoice, String> {
  const GetSaasInvoiceUseCase(this._repository);
  final SaasRepository _repository;
  @override
  Future<Result<SaasInvoice>> call(String id) => _repository.getInvoice(id);
}

class ListSaasUsageUseCase extends UseCase<Cacheable<Paginated<SaasUsageRecord>>, ListQuery> {
  const ListSaasUsageUseCase(this._repository);
  final SaasRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<SaasUsageRecord>>>> call(ListQuery params) =>
      _repository.listUsage(params);
}

class ListSaasQuotasUseCase extends UseCase<Cacheable<Paginated<SaasQuota>>, ListQuery> {
  const ListSaasQuotasUseCase(this._repository);
  final SaasRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<SaasQuota>>>> call(ListQuery params) =>
      _repository.listQuotas(params);
}

class ListSaasTenantsUseCase extends UseCase<Cacheable<Paginated<SaasTenant>>, ListQuery> {
  const ListSaasTenantsUseCase(this._repository);
  final SaasRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<SaasTenant>>>> call(ListQuery params) =>
      _repository.listTenants(params);
}

class GetSaasTenantUseCase extends UseCase<SaasTenant, String> {
  const GetSaasTenantUseCase(this._repository);
  final SaasRepository _repository;
  @override
  Future<Result<SaasTenant>> call(String id) => _repository.getTenant(id);
}

class SaveSaasTenantParams {
  const SaveSaasTenantParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveSaasTenantUseCase extends UseCase<SaasTenant, SaveSaasTenantParams> {
  const SaveSaasTenantUseCase(this._repository);
  final SaasRepository _repository;
  @override
  Future<Result<SaasTenant>> call(SaveSaasTenantParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.updateTenant(params.id ?? '', params.payload)
        : _repository.updateTenant(id, params.payload);
  }
}
