import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/saas_portal.dart';
import '../repositories/saas_portal_repository.dart';

class GetPortalBillingInfoUseCase extends UseCase<PortalBillingInfo, NoParams> {
  const GetPortalBillingInfoUseCase(this._repository);
  final SaasPortalRepository _repository;
  @override
  Future<Result<PortalBillingInfo>> call(NoParams params) => _repository.getBillingInfo();
}

class UpdatePortalBillingInfoUseCase extends UseCase<PortalBillingInfo, Map<String, dynamic>> {
  const UpdatePortalBillingInfoUseCase(this._repository);
  final SaasPortalRepository _repository;
  @override
  Future<Result<PortalBillingInfo>> call(Map<String, dynamic> payload) =>
      _repository.updateBillingInfo(payload);
}

class ListPortalPlansUseCase extends UseCase<Cacheable<Paginated<PortalPlan>>, ListQuery> {
  const ListPortalPlansUseCase(this._repository);
  final SaasPortalRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<PortalPlan>>>> call(ListQuery params) =>
      _repository.listPlans(params);
}

class SavePortalSupportTicketParams {
  const SavePortalSupportTicketParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SavePortalSupportTicketUseCase extends UseCase<PortalSupportTicket, SavePortalSupportTicketParams> {
  const SavePortalSupportTicketUseCase(this._repository);
  final SaasPortalRepository _repository;
  @override
  Future<Result<PortalSupportTicket>> call(SavePortalSupportTicketParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createSupportTicket(params.payload)
        : _repository.updateSupportTicket(id, params.payload);
  }
}

class ListPortalSupportTicketsUseCase extends UseCase<Cacheable<Paginated<PortalSupportTicket>>, ListQuery> {
  const ListPortalSupportTicketsUseCase(this._repository);
  final SaasPortalRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<PortalSupportTicket>>>> call(ListQuery params) =>
      _repository.listSupportTickets(params);
}

class GetPortalSupportTicketUseCase extends UseCase<PortalSupportTicket, String> {
  const GetPortalSupportTicketUseCase(this._repository);
  final SaasPortalRepository _repository;
  @override
  Future<Result<PortalSupportTicket>> call(String id) => _repository.getSupportTicket(id);
}

class CreatePortalSupportTicketUseCase extends UseCase<PortalSupportTicket, Map<String, dynamic>> {
  const CreatePortalSupportTicketUseCase(this._repository);
  final SaasPortalRepository _repository;
  @override
  Future<Result<PortalSupportTicket>> call(Map<String, dynamic> payload) =>
      _repository.createSupportTicket(payload);
}

