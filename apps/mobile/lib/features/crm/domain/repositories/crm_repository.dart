import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../entities/crm.dart';

class Cacheable<T> {
  const Cacheable({required this.value, this.cachedAt});

  final T value;

  final DateTime? cachedAt;

  bool get isFromCache => cachedAt != null;
}

abstract class CrmRepository {
  Future<Result<Cacheable<Paginated<Customer>>>> listCustomers(ListQuery query);

  Future<Result<Customer>> getCustomer(String id);

  Future<Result<Customer>> createCustomer(Map<String, dynamic> payload);

  Future<Result<Customer>> updateCustomer(String id, Map<String, dynamic> payload);

  Future<Result<void>> deleteCustomer(String id);

  Future<Result<Paginated<Contact>>> getCustomerContacts(
    String customerId,
    ListQuery query,
  );

  Future<Result<Map<String, dynamic>>> getCustomerStats(String id);

  Future<Result<List<Activity>>> getCustomerTimeline(String id);

  Future<Result<Cacheable<Paginated<Contact>>>> listContacts(ListQuery query);

  Future<Result<Contact>> getContact(String id);

  Future<Result<Contact>> createContact(Map<String, dynamic> payload);

  Future<Result<Contact>> updateContact(String id, Map<String, dynamic> payload);

  Future<Result<void>> deleteContact(String id);

  Future<Result<Cacheable<Paginated<Lead>>>> listLeads(ListQuery query);

  Future<Result<Lead>> getLead(String id);

  Future<Result<Lead>> createLead(Map<String, dynamic> payload);

  Future<Result<Lead>> updateLead(String id, Map<String, dynamic> payload);

  Future<Result<void>> deleteLead(String id);

  Future<Result<Lead>> convertLead(String id);

  Future<Result<Lead>> qualifyLead(String id);

  Future<Result<Lead>> disqualifyLead(String id);

  Future<Result<Paginated<Activity>>> listActivities(ListQuery query);

  Future<Result<Activity>> createActivity(Map<String, dynamic> payload);

  Future<Result<Paginated<LeadSource>>> listLeadSources(ListQuery query);

  Future<Result<LeadSource>> createLeadSource(Map<String, dynamic> payload);

  Future<Result<Paginated<EmailTemplate>>> listEmailTemplates(ListQuery query);

  Future<Result<EmailTemplate>> createEmailTemplate(Map<String, dynamic> payload);

  Future<Result<EmailTemplate>> updateEmailTemplate(
    String id,
    Map<String, dynamic> payload,
  );

  Future<Result<void>> deleteEmailTemplate(String id);
}
