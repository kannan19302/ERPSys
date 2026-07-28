import '../../../../core/contracts/paginated.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_paths.dart';
import '../models/crm_models.dart';

abstract class CrmRemoteDataSource {
  Future<Paginated<CustomerModel>> listCustomers(ListQuery query);

  Future<CustomerModel> getCustomer(String id);

  Future<CustomerModel> createCustomer(Map<String, dynamic> payload);

  Future<CustomerModel> updateCustomer(String id, Map<String, dynamic> payload);

  Future<void> deleteCustomer(String id);

  Future<Paginated<ContactModel>> getCustomerContacts(String customerId, ListQuery query);

  Future<Map<String, dynamic>> getCustomerStats(String id);

  Future<List<ActivityModel>> getCustomerTimeline(String id);

  Future<Paginated<ContactModel>> listContacts(ListQuery query);

  Future<ContactModel> getContact(String id);

  Future<ContactModel> createContact(Map<String, dynamic> payload);

  Future<ContactModel> updateContact(String id, Map<String, dynamic> payload);

  Future<void> deleteContact(String id);

  Future<Paginated<LeadModel>> listLeads(ListQuery query);

  Future<LeadModel> getLead(String id);

  Future<LeadModel> createLead(Map<String, dynamic> payload);

  Future<LeadModel> updateLead(String id, Map<String, dynamic> payload);

  Future<void> deleteLead(String id);

  Future<LeadModel> convertLead(String id);

  Future<LeadModel> qualifyLead(String id);

  Future<LeadModel> disqualifyLead(String id);

  Future<Paginated<ActivityModel>> listActivities(ListQuery query);

  Future<ActivityModel> createActivity(Map<String, dynamic> payload);

  Future<Paginated<LeadSourceModel>> listLeadSources(ListQuery query);

  Future<LeadSourceModel> createLeadSource(Map<String, dynamic> payload);

  Future<Paginated<EmailTemplateModel>> listEmailTemplates(ListQuery query);

  Future<EmailTemplateModel> createEmailTemplate(Map<String, dynamic> payload);

  Future<EmailTemplateModel> updateEmailTemplate(String id, Map<String, dynamic> payload);

  Future<void> deleteEmailTemplate(String id);
}

class CrmRemoteDataSourceImpl implements CrmRemoteDataSource {
  const CrmRemoteDataSourceImpl(this._client);

  final ApiClient _client;

  @override
  Future<Paginated<CustomerModel>> listCustomers(ListQuery query) =>
      _client.getPaginated<CustomerModel>(
        ApiPaths.customers,
        query,
        CustomerModel.fromJson,
      );

  @override
  Future<CustomerModel> getCustomer(String id) async =>
      CustomerModel.fromJson(await _client.getObject(ApiPaths.customer(id)));

  @override
  Future<CustomerModel> createCustomer(Map<String, dynamic> payload) async =>
      CustomerModel.fromJson(
        await _client.post(ApiPaths.customers, body: payload),
      );

  @override
  Future<CustomerModel> updateCustomer(
    String id,
    Map<String, dynamic> payload,
  ) async =>
      CustomerModel.fromJson(
        await _client.patch(ApiPaths.customer(id), body: payload),
      );

  @override
  Future<void> deleteCustomer(String id) => _client.delete(ApiPaths.customer(id));

  @override
  Future<Paginated<ContactModel>> getCustomerContacts(
    String customerId,
    ListQuery query,
  ) =>
      _client.getPaginated<ContactModel>(
        ApiPaths.customerContacts(customerId),
        query,
        ContactModel.fromJson,
      );

  @override
  Future<Map<String, dynamic>> getCustomerStats(String id) async =>
      await _client.getObject(ApiPaths.customerStats(id));

  @override
  Future<List<ActivityModel>> getCustomerTimeline(String id) async {
    final List<Map<String, dynamic>> raw =
        await _client.getList(ApiPaths.customerTimeline(id));
    return raw.map(ActivityModel.fromJson).toList(growable: false);
  }

  @override
  Future<Paginated<ContactModel>> listContacts(ListQuery query) =>
      _client.getPaginated<ContactModel>(
        ApiPaths.contacts,
        query,
        ContactModel.fromJson,
      );

  @override
  Future<ContactModel> getContact(String id) async =>
      ContactModel.fromJson(await _client.getObject(ApiPaths.contact(id)));

  @override
  Future<ContactModel> createContact(Map<String, dynamic> payload) async =>
      ContactModel.fromJson(
        await _client.post(ApiPaths.contacts, body: payload),
      );

  @override
  Future<ContactModel> updateContact(
    String id,
    Map<String, dynamic> payload,
  ) async =>
      ContactModel.fromJson(
        await _client.patch(ApiPaths.contact(id), body: payload),
      );

  @override
  Future<void> deleteContact(String id) => _client.delete(ApiPaths.contact(id));

  @override
  Future<Paginated<LeadModel>> listLeads(ListQuery query) =>
      _client.getPaginated<LeadModel>(
        ApiPaths.leads,
        query,
        LeadModel.fromJson,
      );

  @override
  Future<LeadModel> getLead(String id) async =>
      LeadModel.fromJson(await _client.getObject(ApiPaths.lead(id)));

  @override
  Future<LeadModel> createLead(Map<String, dynamic> payload) async =>
      LeadModel.fromJson(
        await _client.post(ApiPaths.leads, body: payload),
      );

  @override
  Future<LeadModel> updateLead(String id, Map<String, dynamic> payload) async =>
      LeadModel.fromJson(
        await _client.patch(ApiPaths.lead(id), body: payload),
      );

  @override
  Future<void> deleteLead(String id) => _client.delete(ApiPaths.lead(id));

  @override
  Future<LeadModel> convertLead(String id) async =>
      LeadModel.fromJson(await _client.post(ApiPaths.leadConvert(id)));

  @override
  Future<LeadModel> qualifyLead(String id) async =>
      LeadModel.fromJson(await _client.post(ApiPaths.leadQualify(id)));

  @override
  Future<LeadModel> disqualifyLead(String id) async =>
      LeadModel.fromJson(await _client.post(ApiPaths.leadDisqualify(id)));

  @override
  Future<Paginated<ActivityModel>> listActivities(ListQuery query) =>
      _client.getPaginated<ActivityModel>(
        ApiPaths.crmActivities,
        query,
        ActivityModel.fromJson,
      );

  @override
  Future<ActivityModel> createActivity(Map<String, dynamic> payload) async =>
      ActivityModel.fromJson(
        await _client.post(ApiPaths.crmActivities, body: payload),
      );

  @override
  Future<Paginated<LeadSourceModel>> listLeadSources(ListQuery query) =>
      _client.getPaginated<LeadSourceModel>(
        ApiPaths.leadSources,
        query,
        LeadSourceModel.fromJson,
      );

  @override
  Future<LeadSourceModel> createLeadSource(Map<String, dynamic> payload) async =>
      LeadSourceModel.fromJson(
        await _client.post(ApiPaths.leadSources, body: payload),
      );

  @override
  Future<Paginated<EmailTemplateModel>> listEmailTemplates(ListQuery query) =>
      _client.getPaginated<EmailTemplateModel>(
        ApiPaths.emailTemplates,
        query,
        EmailTemplateModel.fromJson,
      );

  @override
  Future<EmailTemplateModel> createEmailTemplate(
    Map<String, dynamic> payload,
  ) async =>
      EmailTemplateModel.fromJson(
        await _client.post(ApiPaths.emailTemplates, body: payload),
      );

  @override
  Future<EmailTemplateModel> updateEmailTemplate(
    String id,
    Map<String, dynamic> payload,
  ) async =>
      EmailTemplateModel.fromJson(
        await _client.patch(ApiPaths.emailTemplate(id), body: payload),
      );

  @override
  Future<void> deleteEmailTemplate(String id) =>
      _client.delete(ApiPaths.emailTemplate(id));
}
