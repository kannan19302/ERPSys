import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/crm.dart';
import '../repositories/crm_repository.dart';

// ── Customers ──────────────────────────────────────────────────────────────

class ListCustomersUseCase
    extends UseCase<Cacheable<Paginated<Customer>>, ListQuery> {
  const ListCustomersUseCase(this._repository);

  final CrmRepository _repository;

  @override
  Future<Result<Cacheable<Paginated<Customer>>>> call(ListQuery params) =>
      _repository.listCustomers(params);
}

class GetCustomerUseCase extends UseCase<Customer, String> {
  const GetCustomerUseCase(this._repository);

  final CrmRepository _repository;

  @override
  Future<Result<Customer>> call(String id) => _repository.getCustomer(id);
}

class SaveCustomerParams {
  const SaveCustomerParams({required this.payload, this.id});

  final String? id;
  final Map<String, dynamic> payload;
}

class SaveCustomerUseCase extends UseCase<Customer, SaveCustomerParams> {
  const SaveCustomerUseCase(this._repository);

  final CrmRepository _repository;

  @override
  Future<Result<Customer>> call(SaveCustomerParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createCustomer(params.payload)
        : _repository.updateCustomer(id, params.payload);
  }
}

class DeleteCustomerUseCase extends UseCase<void, String> {
  const DeleteCustomerUseCase(this._repository);

  final CrmRepository _repository;

  @override
  Future<Result<void>> call(String id) => _repository.deleteCustomer(id);
}

class GetCustomerTimelineUseCase
    extends UseCase<List<Activity>, String> {
  const GetCustomerTimelineUseCase(this._repository);

  final CrmRepository _repository;

  @override
  Future<Result<List<Activity>>> call(String id) =>
      _repository.getCustomerTimeline(id);
}

class GetCustomerStatsUseCase
    extends UseCase<Map<String, dynamic>, String> {
  const GetCustomerStatsUseCase(this._repository);

  final CrmRepository _repository;

  @override
  Future<Result<Map<String, dynamic>>> call(String id) =>
      _repository.getCustomerStats(id);
}

class GetCustomerContactsUseCase
    extends UseCase<Paginated<Contact>, SaveCustomerContactsParams> {
  const GetCustomerContactsUseCase(this._repository);

  final CrmRepository _repository;

  @override
  Future<Result<Paginated<Contact>>> call(SaveCustomerContactsParams params) =>
      _repository.getCustomerContacts(params.customerId, params.query);
}

class SaveCustomerContactsParams {
  const SaveCustomerContactsParams({
    required this.customerId,
    required this.query,
  });

  final String customerId;
  final ListQuery query;
}

// ── Contacts ───────────────────────────────────────────────────────────────

class ListContactsUseCase
    extends UseCase<Cacheable<Paginated<Contact>>, ListQuery> {
  const ListContactsUseCase(this._repository);

  final CrmRepository _repository;

  @override
  Future<Result<Cacheable<Paginated<Contact>>>> call(ListQuery params) =>
      _repository.listContacts(params);
}

class GetContactUseCase extends UseCase<Contact, String> {
  const GetContactUseCase(this._repository);

  final CrmRepository _repository;

  @override
  Future<Result<Contact>> call(String id) => _repository.getContact(id);
}

class SaveContactUseCase extends UseCase<Contact, SaveCustomerParams> {
  const SaveContactUseCase(this._repository);

  final CrmRepository _repository;

  @override
  Future<Result<Contact>> call(SaveCustomerParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createContact(params.payload)
        : _repository.updateContact(id, params.payload);
  }
}

class DeleteContactUseCase extends UseCase<void, String> {
  const DeleteContactUseCase(this._repository);

  final CrmRepository _repository;

  @override
  Future<Result<void>> call(String id) => _repository.deleteContact(id);
}

// ── Leads ──────────────────────────────────────────────────────────────────

class ListLeadsUseCase
    extends UseCase<Cacheable<Paginated<Lead>>, ListQuery> {
  const ListLeadsUseCase(this._repository);

  final CrmRepository _repository;

  @override
  Future<Result<Cacheable<Paginated<Lead>>>> call(ListQuery params) =>
      _repository.listLeads(params);
}

class GetLeadUseCase extends UseCase<Lead, String> {
  const GetLeadUseCase(this._repository);

  final CrmRepository _repository;

  @override
  Future<Result<Lead>> call(String id) => _repository.getLead(id);
}

class SaveLeadUseCase extends UseCase<Lead, SaveCustomerParams> {
  const SaveLeadUseCase(this._repository);

  final CrmRepository _repository;

  @override
  Future<Result<Lead>> call(SaveCustomerParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createLead(params.payload)
        : _repository.updateLead(id, params.payload);
  }
}

class DeleteLeadUseCase extends UseCase<void, String> {
  const DeleteLeadUseCase(this._repository);

  final CrmRepository _repository;

  @override
  Future<Result<void>> call(String id) => _repository.deleteLead(id);
}

class ConvertLeadUseCase extends UseCase<Lead, String> {
  const ConvertLeadUseCase(this._repository);

  final CrmRepository _repository;

  @override
  Future<Result<Lead>> call(String id) => _repository.convertLead(id);
}

class QualifyLeadUseCase extends UseCase<Lead, String> {
  const QualifyLeadUseCase(this._repository);

  final CrmRepository _repository;

  @override
  Future<Result<Lead>> call(String id) => _repository.qualifyLead(id);
}

class DisqualifyLeadUseCase extends UseCase<Lead, String> {
  const DisqualifyLeadUseCase(this._repository);

  final CrmRepository _repository;

  @override
  Future<Result<Lead>> call(String id) => _repository.disqualifyLead(id);
}

// ── Activities ─────────────────────────────────────────────────────────────

class ListActivitiesUseCase
    extends UseCase<Paginated<Activity>, ListQuery> {
  const ListActivitiesUseCase(this._repository);

  final CrmRepository _repository;

  @override
  Future<Result<Paginated<Activity>>> call(ListQuery params) =>
      _repository.listActivities(params);
}

class CreateActivityUseCase
    extends UseCase<Activity, Map<String, dynamic>> {
  const CreateActivityUseCase(this._repository);

  final CrmRepository _repository;

  @override
  Future<Result<Activity>> call(Map<String, dynamic> params) =>
      _repository.createActivity(params);
}

class GetActivityUseCase extends UseCase<Activity, String> {
  const GetActivityUseCase(this._repository);

  final CrmRepository _repository;

  @override
  Future<Result<Activity>> call(String id) => _repository.getActivity(id);
}

class UpdateActivityUseCase extends UseCase<Activity, SaveCustomerParams> {
  const UpdateActivityUseCase(this._repository);

  final CrmRepository _repository;

  @override
  Future<Result<Activity>> call(SaveCustomerParams params) =>
      _repository.updateActivity(params.id!, params.payload);
}

class DeleteActivityUseCase extends UseCase<void, String> {
  const DeleteActivityUseCase(this._repository);

  final CrmRepository _repository;

  @override
  Future<Result<void>> call(String id) => _repository.deleteActivity(id);
}

// ── Email Templates ─────────────────────────────────────────────────────────

class ListEmailTemplatesUseCase
    extends UseCase<Paginated<EmailTemplate>, ListQuery> {
  const ListEmailTemplatesUseCase(this._repository);

  final CrmRepository _repository;

  @override
  Future<Result<Paginated<EmailTemplate>>> call(ListQuery params) =>
      _repository.listEmailTemplates(params);
}

class GetEmailTemplateUseCase extends UseCase<EmailTemplate, String> {
  const GetEmailTemplateUseCase(this._repository);

  final CrmRepository _repository;

  @override
  Future<Result<EmailTemplate>> call(String id) =>
      _repository.getEmailTemplate(id);
}

class SaveEmailTemplateUseCase
    extends UseCase<EmailTemplate, SaveCustomerParams> {
  const SaveEmailTemplateUseCase(this._repository);

  final CrmRepository _repository;

  @override
  Future<Result<EmailTemplate>> call(SaveCustomerParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createEmailTemplate(params.payload)
        : _repository.updateEmailTemplate(id, params.payload);
  }
}

class DeleteEmailTemplateUseCase extends UseCase<void, String> {
  const DeleteEmailTemplateUseCase(this._repository);

  final CrmRepository _repository;

  @override
  Future<Result<void>> call(String id) =>
      _repository.deleteEmailTemplate(id);
}

// ── Lead Sources ────────────────────────────────────────────────────────────

class ListLeadSourcesUseCase
    extends UseCase<Paginated<LeadSource>, ListQuery> {
  const ListLeadSourcesUseCase(this._repository);

  final CrmRepository _repository;

  @override
  Future<Result<Paginated<LeadSource>>> call(ListQuery params) =>
      _repository.listLeadSources(params);
}

class CreateLeadSourceUseCase
    extends UseCase<LeadSource, Map<String, dynamic>> {
  const CreateLeadSourceUseCase(this._repository);

  final CrmRepository _repository;

  @override
  Future<Result<LeadSource>> call(Map<String, dynamic> params) =>
      _repository.createLeadSource(params);
}

class DeleteLeadSourceUseCase extends UseCase<void, String> {
  const DeleteLeadSourceUseCase(this._repository);

  final CrmRepository _repository;

  @override
  Future<Result<void>> call(String id) =>
      _repository.deleteLeadSource(id);
}
