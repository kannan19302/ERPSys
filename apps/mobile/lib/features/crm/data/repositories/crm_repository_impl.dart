import '../../../../core/contracts/paginated.dart';
import '../../../../core/error/error_mapper.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/storage/response_cache.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/crm.dart';
import '../../domain/repositories/crm_repository.dart';
import '../datasources/crm_remote_data_source.dart';
import '../models/crm_models.dart';

class CrmRepositoryImpl implements CrmRepository {
  const CrmRepositoryImpl({
    required CrmRemoteDataSource remote,
    required ResponseCache cache,
    required String tenantId,
  })  : _remote = remote,
        _cache = cache,
        _tenantId = tenantId;

  static const String _customersNamespace = 'crm.customers';
  static const String _contactsNamespace = 'crm.contacts';
  static const String _leadsNamespace = 'crm.leads';

  final CrmRemoteDataSource _remote;
  final ResponseCache _cache;
  final String _tenantId;

  // ── Customers ──────────────────────────────────────────────────────────

  @override
  Future<Result<Cacheable<Paginated<Customer>>>> listCustomers(
    ListQuery query,
  ) async {
    try {
      final Paginated<CustomerModel> page = await _remote.listCustomers(query);

      await _cache.write(
        _tenantId, _customersNamespace, query.cacheKey, <String, Object?>{
        'data': page.data.map((CustomerModel p) => p.toJson()).toList(),
        'meta': page.meta.toJson(),
      });

      return Result<Cacheable<Paginated<Customer>>>.ok(
        Cacheable<Paginated<Customer>>(
          value: Paginated<Customer>(data: page.data, meta: page.meta),
        ),
      );
    } on NetworkException catch (error) {
      final CachedEntry<Map<String, dynamic>>? cached =
          _cache.read<Map<String, dynamic>>(
        _tenantId,
        _customersNamespace,
        query.cacheKey,
      );
      if (cached == null) {
        return Result<Cacheable<Paginated<Customer>>>.err(
          mapExceptionToFailure(error),
        );
      }
      return Result<Cacheable<Paginated<Customer>>>.ok(
        Cacheable<Paginated<Customer>>(
          value: Paginated<Customer>.fromJson(
            cached.value,
            CustomerModel.fromJson,
          ),
          cachedAt: cached.cachedAt,
        ),
      );
    } on Object catch (error) {
      return Result<Cacheable<Paginated<Customer>>>.err(
        mapExceptionToFailure(error),
      );
    }
  }

  @override
  Future<Result<Customer>> getCustomer(String id) async {
    try {
      return Result<Customer>.ok(await _remote.getCustomer(id));
    } on Object catch (error) {
      return Result<Customer>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<Customer>> createCustomer(Map<String, dynamic> payload) async {
    try {
      final Customer created = await _remote.createCustomer(payload);
      await _cache.clearTenant(_tenantId);
      return Result<Customer>.ok(created);
    } on Object catch (error) {
      return Result<Customer>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<Customer>> updateCustomer(
    String id,
    Map<String, dynamic> payload,
  ) async {
    try {
      final Customer updated = await _remote.updateCustomer(id, payload);
      await _cache.clearTenant(_tenantId);
      return Result<Customer>.ok(updated);
    } on Object catch (error) {
      return Result<Customer>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<void>> deleteCustomer(String id) async {
    try {
      await _remote.deleteCustomer(id);
      await _cache.clearTenant(_tenantId);
      return const Result<void>.ok(null);
    } on Object catch (error) {
      return Result<void>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<Paginated<Contact>>> getCustomerContacts(
    String customerId,
    ListQuery query,
  ) async {
    try {
      final Paginated<ContactModel> page =
          await _remote.getCustomerContacts(customerId, query);
      return Result<Paginated<Contact>>.ok(
        Paginated<Contact>(data: page.data, meta: page.meta),
      );
    } on Object catch (error) {
      return Result<Paginated<Contact>>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<Map<String, dynamic>>> getCustomerStats(String id) async {
    try {
      return Result<Map<String, dynamic>>.ok(await _remote.getCustomerStats(id));
    } on Object catch (error) {
      return Result<Map<String, dynamic>>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<List<Activity>>> getCustomerTimeline(String id) async {
    try {
      return Result<List<Activity>>.ok(await _remote.getCustomerTimeline(id));
    } on Object catch (error) {
      return Result<List<Activity>>.err(mapExceptionToFailure(error));
    }
  }

  // ── Contacts ───────────────────────────────────────────────────────────

  @override
  Future<Result<Cacheable<Paginated<Contact>>>> listContacts(
    ListQuery query,
  ) async {
    try {
      final Paginated<ContactModel> page = await _remote.listContacts(query);

      await _cache.write(
        _tenantId, _contactsNamespace, query.cacheKey, <String, Object?>{
        'data': page.data.map((ContactModel p) => p.toJson()).toList(),
        'meta': page.meta.toJson(),
      });

      return Result<Cacheable<Paginated<Contact>>>.ok(
        Cacheable<Paginated<Contact>>(
          value: Paginated<Contact>(data: page.data, meta: page.meta),
        ),
      );
    } on NetworkException catch (error) {
      final CachedEntry<Map<String, dynamic>>? cached =
          _cache.read<Map<String, dynamic>>(
        _tenantId,
        _contactsNamespace,
        query.cacheKey,
      );
      if (cached == null) {
        return Result<Cacheable<Paginated<Contact>>>.err(
          mapExceptionToFailure(error),
        );
      }
      return Result<Cacheable<Paginated<Contact>>>.ok(
        Cacheable<Paginated<Contact>>(
          value: Paginated<Contact>.fromJson(
            cached.value,
            ContactModel.fromJson,
          ),
          cachedAt: cached.cachedAt,
        ),
      );
    } on Object catch (error) {
      return Result<Cacheable<Paginated<Contact>>>.err(
        mapExceptionToFailure(error),
      );
    }
  }

  @override
  Future<Result<Contact>> getContact(String id) async {
    try {
      return Result<Contact>.ok(await _remote.getContact(id));
    } on Object catch (error) {
      return Result<Contact>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<Contact>> createContact(Map<String, dynamic> payload) async {
    try {
      final Contact created = await _remote.createContact(payload);
      await _cache.clearTenant(_tenantId);
      return Result<Contact>.ok(created);
    } on Object catch (error) {
      return Result<Contact>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<Contact>> updateContact(
    String id,
    Map<String, dynamic> payload,
  ) async {
    try {
      final Contact updated = await _remote.updateContact(id, payload);
      await _cache.clearTenant(_tenantId);
      return Result<Contact>.ok(updated);
    } on Object catch (error) {
      return Result<Contact>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<void>> deleteContact(String id) async {
    try {
      await _remote.deleteContact(id);
      await _cache.clearTenant(_tenantId);
      return const Result<void>.ok(null);
    } on Object catch (error) {
      return Result<void>.err(mapExceptionToFailure(error));
    }
  }

  // ── Leads ──────────────────────────────────────────────────────────────

  @override
  Future<Result<Cacheable<Paginated<Lead>>>> listLeads(ListQuery query) async {
    try {
      final Paginated<LeadModel> page = await _remote.listLeads(query);

      await _cache.write(
        _tenantId, _leadsNamespace, query.cacheKey, <String, Object?>{
        'data': page.data.map((LeadModel p) => p.toJson()).toList(),
        'meta': page.meta.toJson(),
      });

      return Result<Cacheable<Paginated<Lead>>>.ok(
        Cacheable<Paginated<Lead>>(
          value: Paginated<Lead>(data: page.data, meta: page.meta),
        ),
      );
    } on NetworkException catch (error) {
      final CachedEntry<Map<String, dynamic>>? cached =
          _cache.read<Map<String, dynamic>>(
        _tenantId,
        _leadsNamespace,
        query.cacheKey,
      );
      if (cached == null) {
        return Result<Cacheable<Paginated<Lead>>>.err(
          mapExceptionToFailure(error),
        );
      }
      return Result<Cacheable<Paginated<Lead>>>.ok(
        Cacheable<Paginated<Lead>>(
          value: Paginated<Lead>.fromJson(
            cached.value,
            LeadModel.fromJson,
          ),
          cachedAt: cached.cachedAt,
        ),
      );
    } on Object catch (error) {
      return Result<Cacheable<Paginated<Lead>>>.err(
        mapExceptionToFailure(error),
      );
    }
  }

  @override
  Future<Result<Lead>> getLead(String id) async {
    try {
      return Result<Lead>.ok(await _remote.getLead(id));
    } on Object catch (error) {
      return Result<Lead>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<Lead>> createLead(Map<String, dynamic> payload) async {
    try {
      final Lead created = await _remote.createLead(payload);
      await _cache.clearTenant(_tenantId);
      return Result<Lead>.ok(created);
    } on Object catch (error) {
      return Result<Lead>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<Lead>> updateLead(String id, Map<String, dynamic> payload) async {
    try {
      final Lead updated = await _remote.updateLead(id, payload);
      await _cache.clearTenant(_tenantId);
      return Result<Lead>.ok(updated);
    } on Object catch (error) {
      return Result<Lead>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<void>> deleteLead(String id) async {
    try {
      await _remote.deleteLead(id);
      await _cache.clearTenant(_tenantId);
      return const Result<void>.ok(null);
    } on Object catch (error) {
      return Result<void>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<Lead>> convertLead(String id) async {
    try {
      return Result<Lead>.ok(await _remote.convertLead(id));
    } on Object catch (error) {
      return Result<Lead>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<Lead>> qualifyLead(String id) async {
    try {
      return Result<Lead>.ok(await _remote.qualifyLead(id));
    } on Object catch (error) {
      return Result<Lead>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<Lead>> disqualifyLead(String id) async {
    try {
      return Result<Lead>.ok(await _remote.disqualifyLead(id));
    } on Object catch (error) {
      return Result<Lead>.err(mapExceptionToFailure(error));
    }
  }

  // ── Activities ─────────────────────────────────────────────────────────

  @override
  Future<Result<Paginated<Activity>>> listActivities(ListQuery query) async {
    try {
      final Paginated<ActivityModel> page = await _remote.listActivities(query);
      return Result<Paginated<Activity>>.ok(
        Paginated<Activity>(data: page.data, meta: page.meta),
      );
    } on Object catch (error) {
      return Result<Paginated<Activity>>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<Activity>> createActivity(Map<String, dynamic> payload) async {
    try {
      return Result<Activity>.ok(await _remote.createActivity(payload));
    } on Object catch (error) {
      return Result<Activity>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<Activity>> getActivity(String id) async {
    try {
      return Result<Activity>.ok(await _remote.getActivity(id));
    } on Object catch (error) {
      return Result<Activity>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<Activity>> updateActivity(
    String id,
    Map<String, dynamic> payload,
  ) async {
    try {
      return Result<Activity>.ok(await _remote.updateActivity(id, payload));
    } on Object catch (error) {
      return Result<Activity>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<void>> deleteActivity(String id) async {
    try {
      await _remote.deleteActivity(id);
      return const Result<void>.ok(null);
    } on Object catch (error) {
      return Result<void>.err(mapExceptionToFailure(error));
    }
  }

  // ── Lead Sources ───────────────────────────────────────────────────────

  @override
  Future<Result<Paginated<LeadSource>>> listLeadSources(ListQuery query) async {
    try {
      final Paginated<LeadSourceModel> page = await _remote.listLeadSources(query);
      return Result<Paginated<LeadSource>>.ok(
        Paginated<LeadSource>(data: page.data, meta: page.meta),
      );
    } on Object catch (error) {
      return Result<Paginated<LeadSource>>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<LeadSource>> createLeadSource(Map<String, dynamic> payload) async {
    try {
      return Result<LeadSource>.ok(await _remote.createLeadSource(payload));
    } on Object catch (error) {
      return Result<LeadSource>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<void>> deleteLeadSource(String id) async {
    try {
      await _remote.deleteLeadSource(id);
      return const Result<void>.ok(null);
    } on Object catch (error) {
      return Result<void>.err(mapExceptionToFailure(error));
    }
  }

  // ── Email Templates ────────────────────────────────────────────────────

  @override
  Future<Result<EmailTemplate>> getEmailTemplate(String id) async {
    try {
      return Result<EmailTemplate>.ok(await _remote.getEmailTemplate(id));
    } on Object catch (error) {
      return Result<EmailTemplate>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<Paginated<EmailTemplate>>> listEmailTemplates(
    ListQuery query,
  ) async {
    try {
      final Paginated<EmailTemplateModel> page =
          await _remote.listEmailTemplates(query);
      return Result<Paginated<EmailTemplate>>.ok(
        Paginated<EmailTemplate>(data: page.data, meta: page.meta),
      );
    } on Object catch (error) {
      return Result<Paginated<EmailTemplate>>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<EmailTemplate>> createEmailTemplate(
    Map<String, dynamic> payload,
  ) async {
    try {
      return Result<EmailTemplate>.ok(await _remote.createEmailTemplate(payload));
    } on Object catch (error) {
      return Result<EmailTemplate>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<EmailTemplate>> updateEmailTemplate(
    String id,
    Map<String, dynamic> payload,
  ) async {
    try {
      final EmailTemplate updated =
          await _remote.updateEmailTemplate(id, payload);
      await _cache.clearTenant(_tenantId);
      return Result<EmailTemplate>.ok(updated);
    } on Object catch (error) {
      return Result<EmailTemplate>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<void>> deleteEmailTemplate(String id) async {
    try {
      await _remote.deleteEmailTemplate(id);
      await _cache.clearTenant(_tenantId);
      return const Result<void>.ok(null);
    } on Object catch (error) {
      return Result<void>.err(mapExceptionToFailure(error));
    }
  }
}
