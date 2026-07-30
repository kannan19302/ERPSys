import '../../../../core/contracts/paginated.dart';
import '../../../../core/error/error_mapper.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/storage/response_cache.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/sales.dart';
import '../../domain/repositories/sales_repository.dart';
import '../datasources/sales_remote_data_source.dart';
import '../models/sales_models.dart';

class SalesRepositoryImpl implements SalesRepository {
  const SalesRepositoryImpl({
    required SalesRemoteDataSource remote,
    required ResponseCache cache,
    required String tenantId,
  })  : _remote = remote,
        _cache = cache,
        _tenantId = tenantId;

  static const String _quotationsNamespace = 'sales.quotations';
  static const String _ordersNamespace = 'sales.orders';
  final SalesRemoteDataSource _remote;
  final ResponseCache _cache;
  final String _tenantId;

  @override
  Future<Result<Cacheable<Paginated<Quotation>>>> listQuotations(
    ListQuery query,
  ) async {
    try {
      final Paginated<QuotationModel> page = await _remote.listQuotations(query);

      await _cache.write(_tenantId, _quotationsNamespace, query.cacheKey, <String, Object?>{
        'data': page.data.map((QuotationModel p) => p.toJson()).toList(),
        'meta': page.meta.toJson(),
      });

      return Result<Cacheable<Paginated<Quotation>>>.ok(
        Cacheable<Paginated<Quotation>>(
          value: Paginated<Quotation>(data: page.data, meta: page.meta),
        ),
      );
    } on NetworkException catch (error) {
      final CachedEntry<Map<String, dynamic>>? cached =
          _cache.read<Map<String, dynamic>>(
        _tenantId,
        _quotationsNamespace,
        query.cacheKey,
      );
      if (cached == null) {
        return Result<Cacheable<Paginated<Quotation>>>.err(
          mapExceptionToFailure(error),
        );
      }
      return Result<Cacheable<Paginated<Quotation>>>.ok(
        Cacheable<Paginated<Quotation>>(
          value: Paginated<Quotation>.fromJson(
            cached.value,
            QuotationModel.fromJson,
          ),
          cachedAt: cached.cachedAt,
        ),
      );
    } on Object catch (error) {
      return Result<Cacheable<Paginated<Quotation>>>.err(
        mapExceptionToFailure(error),
      );
    }
  }

  @override
  Future<Result<Quotation>> getQuotation(String id) async {
    try {
      return Result<Quotation>.ok(await _remote.getQuotation(id));
    } on Object catch (error) {
      return Result<Quotation>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<Quotation>> createQuotation(Map<String, dynamic> payload) async {
    try {
      final Quotation created = await _remote.createQuotation(payload);
      await _cache.clearTenant(_tenantId);
      return Result<Quotation>.ok(created);
    } on Object catch (error) {
      return Result<Quotation>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<Quotation>> updateQuotation(
    String id,
    Map<String, dynamic> payload,
  ) async {
    try {
      final Quotation updated = await _remote.updateQuotation(id, payload);
      await _cache.clearTenant(_tenantId);
      return Result<Quotation>.ok(updated);
    } on Object catch (error) {
      return Result<Quotation>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<void>> deleteQuotation(String id) async {
    try {
      await _remote.deleteQuotation(id);
      await _cache.clearTenant(_tenantId);
      return const Result<void>.ok(null);
    } on Object catch (error) {
      return Result<void>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<Quotation>> submitQuotation(String id) async {
    try {
      return Result<Quotation>.ok(await _remote.submitQuotation(id));
    } on Object catch (error) {
      return Result<Quotation>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<Quotation>> acceptQuotation(String id) async {
    try {
      return Result<Quotation>.ok(await _remote.acceptQuotation(id));
    } on Object catch (error) {
      return Result<Quotation>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<SalesOrder>> convertQuotation(String id) async {
    try {
      final SalesOrder order = await _remote.convertQuotation(id);
      await _cache.clearTenant(_tenantId);
      return Result<SalesOrder>.ok(order);
    } on Object catch (error) {
      return Result<SalesOrder>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<Cacheable<Paginated<SalesOrder>>>> listSalesOrders(
    ListQuery query,
  ) async {
    try {
      final Paginated<SalesOrderModel> page = await _remote.listSalesOrders(query);

      await _cache.write(_tenantId, _ordersNamespace, query.cacheKey, <String, Object?>{
        'data': page.data.map((SalesOrderModel p) => p.toJson()).toList(),
        'meta': page.meta.toJson(),
      });

      return Result<Cacheable<Paginated<SalesOrder>>>.ok(
        Cacheable<Paginated<SalesOrder>>(
          value: Paginated<SalesOrder>(data: page.data, meta: page.meta),
        ),
      );
    } on NetworkException catch (error) {
      final CachedEntry<Map<String, dynamic>>? cached =
          _cache.read<Map<String, dynamic>>(
        _tenantId,
        _ordersNamespace,
        query.cacheKey,
      );
      if (cached == null) {
        return Result<Cacheable<Paginated<SalesOrder>>>.err(
          mapExceptionToFailure(error),
        );
      }
      return Result<Cacheable<Paginated<SalesOrder>>>.ok(
        Cacheable<Paginated<SalesOrder>>(
          value: Paginated<SalesOrder>.fromJson(
            cached.value,
            SalesOrderModel.fromJson,
          ),
          cachedAt: cached.cachedAt,
        ),
      );
    } on Object catch (error) {
      return Result<Cacheable<Paginated<SalesOrder>>>.err(
        mapExceptionToFailure(error),
      );
    }
  }

  @override
  Future<Result<SalesOrder>> getSalesOrder(String id) async {
    try {
      return Result<SalesOrder>.ok(await _remote.getSalesOrder(id));
    } on Object catch (error) {
      return Result<SalesOrder>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<SalesOrder>> createSalesOrder(Map<String, dynamic> payload) async {
    try {
      final SalesOrder created = await _remote.createSalesOrder(payload);
      await _cache.clearTenant(_tenantId);
      return Result<SalesOrder>.ok(created);
    } on Object catch (error) {
      return Result<SalesOrder>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<SalesOrder>> updateSalesOrder(
    String id,
    Map<String, dynamic> payload,
  ) async {
    try {
      final SalesOrder updated = await _remote.updateSalesOrder(id, payload);
      await _cache.clearTenant(_tenantId);
      return Result<SalesOrder>.ok(updated);
    } on Object catch (error) {
      return Result<SalesOrder>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<void>> deleteSalesOrder(String id) async {
    try {
      await _remote.deleteSalesOrder(id);
      await _cache.clearTenant(_tenantId);
      return const Result<void>.ok(null);
    } on Object catch (error) {
      return Result<void>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<SalesOrder>> confirmSalesOrder(String id) async {
    try {
      return Result<SalesOrder>.ok(await _remote.confirmSalesOrder(id));
    } on Object catch (error) {
      return Result<SalesOrder>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<SalesOrder>> cancelSalesOrder(String id) async {
    try {
      return Result<SalesOrder>.ok(await _remote.cancelSalesOrder(id));
    } on Object catch (error) {
      return Result<SalesOrder>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<Paginated<DeliveryNote>>> listDeliveryNotes(ListQuery query) async {
    try {
      final Paginated<DeliveryNoteModel> page = await _remote.listDeliveryNotes(query);
      return Result<Paginated<DeliveryNote>>.ok(
        Paginated<DeliveryNote>(data: page.data, meta: page.meta),
      );
    } on Object catch (error) {
      return Result<Paginated<DeliveryNote>>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<DeliveryNote>> getDeliveryNote(String id) async {
    try {
      return Result<DeliveryNote>.ok(await _remote.getDeliveryNote(id));
    } on Object catch (error) {
      return Result<DeliveryNote>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<DeliveryNote>> createDeliveryNote(Map<String, dynamic> payload) async {
    try {
      final DeliveryNote created = await _remote.createDeliveryNote(payload);
      await _cache.clearTenant(_tenantId);
      return Result<DeliveryNote>.ok(created);
    } on Object catch (error) {
      return Result<DeliveryNote>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<DeliveryNote>> updateDeliveryNote(
    String id,
    Map<String, dynamic> payload,
  ) async {
    try {
      final DeliveryNote updated = await _remote.updateDeliveryNote(id, payload);
      await _cache.clearTenant(_tenantId);
      return Result<DeliveryNote>.ok(updated);
    } on Object catch (error) {
      return Result<DeliveryNote>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<void>> deleteDeliveryNote(String id) async {
    try {
      await _remote.deleteDeliveryNote(id);
      await _cache.clearTenant(_tenantId);
      return const Result<void>.ok(null);
    } on Object catch (error) {
      return Result<void>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<DeliveryNote>> submitDeliveryNote(String id) async {
    try {
      return Result<DeliveryNote>.ok(await _remote.submitDeliveryNote(id));
    } on Object catch (error) {
      return Result<DeliveryNote>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<Paginated<SalesReturn>>> listSalesReturns(ListQuery query) async {
    try {
      final Paginated<SalesReturnModel> page = await _remote.listSalesReturns(query);
      return Result<Paginated<SalesReturn>>.ok(
        Paginated<SalesReturn>(data: page.data, meta: page.meta),
      );
    } on Object catch (error) {
      return Result<Paginated<SalesReturn>>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<SalesReturn>> getSalesReturn(String id) async {
    try {
      return Result<SalesReturn>.ok(await _remote.getSalesReturn(id));
    } on Object catch (error) {
      return Result<SalesReturn>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<SalesReturn>> createSalesReturn(Map<String, dynamic> payload) async {
    try {
      final SalesReturn created = await _remote.createSalesReturn(payload);
      await _cache.clearTenant(_tenantId);
      return Result<SalesReturn>.ok(created);
    } on Object catch (error) {
      return Result<SalesReturn>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<void>> deleteSalesReturn(String id) async {
    try {
      await _remote.deleteSalesReturn(id);
      await _cache.clearTenant(_tenantId);
      return const Result<void>.ok(null);
    } on Object catch (error) {
      return Result<void>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<SalesReturn>> approveSalesReturn(String id) async {
    try {
      return Result<SalesReturn>.ok(await _remote.approveSalesReturn(id));
    } on Object catch (error) {
      return Result<SalesReturn>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<SalesReturn>> rejectSalesReturn(String id) async {
    try {
      return Result<SalesReturn>.ok(await _remote.rejectSalesReturn(id));
    } on Object catch (error) {
      return Result<SalesReturn>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<List<SalesPipeline>>> listPipelines() async {
    try {
      return Result<List<SalesPipeline>>.ok(await _remote.listPipelines());
    } on Object catch (error) {
      return Result<List<SalesPipeline>>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<Paginated<Opportunity>>> listOpportunities(ListQuery query) async {
    try {
      final Paginated<OpportunityModel> page = await _remote.listOpportunities(query);
      return Result<Paginated<Opportunity>>.ok(
        Paginated<Opportunity>(data: page.data, meta: page.meta),
      );
    } on Object catch (error) {
      return Result<Paginated<Opportunity>>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<Opportunity>> getOpportunity(String id) async {
    try {
      return Result<Opportunity>.ok(await _remote.getOpportunity(id));
    } on Object catch (error) {
      return Result<Opportunity>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<Opportunity>> createOpportunity(Map<String, dynamic> payload) async {
    try {
      final Opportunity created = await _remote.createOpportunity(payload);
      await _cache.clearTenant(_tenantId);
      return Result<Opportunity>.ok(created);
    } on Object catch (error) {
      return Result<Opportunity>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<Opportunity>> updateOpportunity(
    String id,
    Map<String, dynamic> payload,
  ) async {
    try {
      final Opportunity updated = await _remote.updateOpportunity(id, payload);
      await _cache.clearTenant(_tenantId);
      return Result<Opportunity>.ok(updated);
    } on Object catch (error) {
      return Result<Opportunity>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<void>> deleteOpportunity(String id) async {
    try {
      await _remote.deleteOpportunity(id);
      await _cache.clearTenant(_tenantId);
      return const Result<void>.ok(null);
    } on Object catch (error) {
      return Result<void>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<Opportunity>> updateOpportunityStage(String id, String stage) async {
    try {
      return Result<Opportunity>.ok(await _remote.updateOpportunityStage(id, stage));
    } on Object catch (error) {
      return Result<Opportunity>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<SalesPipeline>> getSalesPipeline(String id) async {
    try {
      return Result<SalesPipeline>.ok(await _remote.getSalesPipeline(id));
    } on Object catch (error) {
      return Result<SalesPipeline>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<List<SalesActivity>>> listSalesActivity() async {
    try {
      return Result<List<SalesActivity>>.ok(await _remote.listSalesActivity());
    } on Object catch (error) {
      return Result<List<SalesActivity>>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<SalesActivity>> logSalesActivity(Map<String, dynamic> payload) async {
    try {
      return Result<SalesActivity>.ok(await _remote.logSalesActivity(payload));
    } on Object catch (error) {
      return Result<SalesActivity>.err(mapExceptionToFailure(error));
    }
  }
}
