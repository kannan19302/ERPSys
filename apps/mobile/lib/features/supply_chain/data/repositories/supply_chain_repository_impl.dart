import '../../../../core/contracts/paginated.dart';
import '../../../../core/error/error_mapper.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/storage/response_cache.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/supply_chain.dart';
import '../../domain/repositories/supply_chain_repository.dart';
import '../datasources/supply_chain_remote_data_source.dart';
import '../models/supply_chain_models.dart';

class SupplyChainRepositoryImpl implements SupplyChainRepository {
  const SupplyChainRepositoryImpl({
    required SupplyChainRemoteDataSource remote,
    required ResponseCache cache,
    required String tenantId,
  })  : _remote = remote,
        _cache = cache,
        _tenantId = tenantId;

  static const String _shipmentNamespace = 'supply-chain.shipments';
  static const String _carrierNamespace = 'supply-chain.carriers';
  static const String _forecastNamespace = 'supply-chain.forecasts';
  static const String _reorderNamespace = 'supply-chain.reorder-suggestions';
  static const String _routeNamespace = 'supply-chain.routes';
  static const String _dockNamespace = 'supply-chain.dock-appointments';
  static const String _transferNamespace = 'supply-chain.warehouse-transfers';
  static const String _trackingNamespace = 'supply-chain.tracking-events';

  final SupplyChainRemoteDataSource _remote;
  final ResponseCache _cache;
  final String _tenantId;

  Future<Result<Cacheable<Paginated<T>>>> _paginated<T>(
    String namespace,
    ListQuery query,
    Future<Paginated<T>> Function() fetch,
    T Function(Map<String, dynamic>) fromJson,
  ) async {
    try {
      final Paginated<T> page = await fetch();
      final List<Map<String, dynamic>> jsonItems = page.data
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

  Future<Result<void>> _delete(Future<void> Function() action) async {
    try {
      await action();
      await _cache.clearTenant(_tenantId);
      return const Result<void>.ok(null);
    } on Object catch (error) {
      return Result<void>.err(mapExceptionToFailure(error));
    }
  }

  Future<Result<T>> _write<T>(Future<T> Function() action) async {
    try {
      final T result = await action();
      await _cache.clearTenant(_tenantId);
      return Result<T>.ok(result);
    } on Object catch (error) {
      return Result<T>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<Cacheable<Paginated<Shipment>>>> listShipments(ListQuery query) =>
      _paginated(_shipmentNamespace, query, () => _remote.listShipments(query),
        ShipmentModel.fromJson,);

  @override
  Future<Result<Shipment>> getShipment(String id) =>
      _single(() => _remote.getShipment(id));

  @override
  Future<Result<Shipment>> createShipment(Map<String, dynamic> p) =>
      _write(() => _remote.createShipment(p));

  @override
  Future<Result<Shipment>> updateShipment(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateShipment(id, p));

  @override
  Future<Result<void>> deleteShipment(String id) =>
      _delete(() => _remote.deleteShipment(id));

  @override
  Future<Result<Shipment>> trackShipment(String id) =>
      _single(() => _remote.trackShipment(id));

  @override
  Future<Result<Shipment>> deliverShipment(String id) =>
      _single(() => _remote.deliverShipment(id));

  @override
  Future<Result<Cacheable<Paginated<Carrier>>>> listCarriers(ListQuery q) =>
      _paginated(_carrierNamespace, q, () => _remote.listCarriers(q),
        CarrierModel.fromJson,);

  @override
  Future<Result<Carrier>> getCarrier(String id) =>
      _single(() => _remote.getCarrier(id));

  @override
  Future<Result<Carrier>> createCarrier(Map<String, dynamic> p) =>
      _write(() => _remote.createCarrier(p));

  @override
  Future<Result<Carrier>> updateCarrier(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateCarrier(id, p));

  @override
  Future<Result<Cacheable<Paginated<DemandForecast>>>> listDemandForecasts(ListQuery q) =>
      _paginated(_forecastNamespace, q, () => _remote.listDemandForecasts(q),
        DemandForecastModel.fromJson,);

  @override
  Future<Result<DemandForecast>> generateDemandForecast(Map<String, dynamic> p) =>
      _write(() => _remote.generateDemandForecast(p));

  @override
  Future<Result<DemandForecast>> promoteDemandForecast(String id) =>
      _single(() => _remote.promoteDemandForecast(id));

  @override
  Future<Result<Cacheable<Paginated<ReorderSuggestion>>>> listReorderSuggestions(ListQuery q) =>
      _paginated(_reorderNamespace, q, () => _remote.listReorderSuggestions(q),
        ReorderSuggestionModel.fromJson,);

  @override
  Future<Result<ReorderSuggestion>> calculateReorder(Map<String, dynamic> p) =>
      _write(() => _remote.calculateReorder(p));

  @override
  Future<Result<ReorderSuggestion>> generateReorderOrders(Map<String, dynamic> p) =>
      _write(() => _remote.generateReorderOrders(p));

  @override
  Future<Result<ReorderSuggestion>> approveReorderSuggestion(String id) =>
      _single(() => _remote.approveReorderSuggestion(id));

  @override
  Future<Result<Cacheable<Paginated<SupplyChainRoute>>>> listSupplyChainRoutes(ListQuery q) =>
      _paginated(_routeNamespace, q, () => _remote.listSupplyChainRoutes(q),
        SupplyChainRouteModel.fromJson,);

  @override
  Future<Result<SupplyChainRoute>> getSupplyChainRoute(String id) =>
      _single(() => _remote.getSupplyChainRoute(id));

  @override
  Future<Result<SupplyChainRoute>> createSupplyChainRoute(Map<String, dynamic> p) =>
      _write(() => _remote.createSupplyChainRoute(p));

  @override
  Future<Result<SupplyChainRoute>> updateSupplyChainRoute(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateSupplyChainRoute(id, p));

  @override
  Future<Result<void>> deleteSupplyChainRoute(String id) =>
      _delete(() => _remote.deleteSupplyChainRoute(id));

  @override
  Future<Result<Cacheable<Paginated<DockAppointment>>>> listDockAppointments(ListQuery q) =>
      _paginated(_dockNamespace, q, () => _remote.listDockAppointments(q),
        DockAppointmentModel.fromJson,);

  @override
  Future<Result<DockAppointment>> getDockAppointment(String id) =>
      _single(() => _remote.getDockAppointment(id));

  @override
  Future<Result<DockAppointment>> createDockAppointment(Map<String, dynamic> p) =>
      _write(() => _remote.createDockAppointment(p));

  @override
  Future<Result<DockAppointment>> updateDockAppointment(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateDockAppointment(id, p));

  @override
  Future<Result<void>> deleteDockAppointment(String id) =>
      _delete(() => _remote.deleteDockAppointment(id));

  @override
  Future<Result<DockAppointment>> checkinDockAppointment(String id) =>
      _single(() => _remote.checkinDockAppointment(id));

  @override
  Future<Result<DockAppointment>> completeDockAppointment(String id) =>
      _single(() => _remote.completeDockAppointment(id));

  @override
  Future<Result<Cacheable<Paginated<WarehouseTransfer>>>> listWarehouseTransfers(ListQuery q) =>
      _paginated(_transferNamespace, q, () => _remote.listWarehouseTransfers(q),
        WarehouseTransferModel.fromJson,);

  @override
  Future<Result<WarehouseTransfer>> getWarehouseTransfer(String id) =>
      _single(() => _remote.getWarehouseTransfer(id));

  @override
  Future<Result<WarehouseTransfer>> createWarehouseTransfer(Map<String, dynamic> p) =>
      _write(() => _remote.createWarehouseTransfer(p));

  @override
  Future<Result<WarehouseTransfer>> updateWarehouseTransfer(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updateWarehouseTransfer(id, p));

  @override
  Future<Result<void>> deleteWarehouseTransfer(String id) =>
      _delete(() => _remote.deleteWarehouseTransfer(id));

  @override
  Future<Result<WarehouseTransfer>> approveWarehouseTransfer(String id) =>
      _single(() => _remote.approveWarehouseTransfer(id));

  @override
  Future<Result<WarehouseTransfer>> completeWarehouseTransfer(String id) =>
      _single(() => _remote.completeWarehouseTransfer(id));

  @override
  Future<Result<Cacheable<Paginated<TrackingEvent>>>> listTrackingEvents(ListQuery q) =>
      _paginated(_trackingNamespace, q, () => _remote.listTrackingEvents(q),
        TrackingEventModel.fromJson,);

  @override
  Future<Result<TrackingEvent>> createTrackingEvent(Map<String, dynamic> p) =>
      _write(() => _remote.createTrackingEvent(p));
}