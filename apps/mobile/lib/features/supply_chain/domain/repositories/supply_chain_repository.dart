import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../entities/supply_chain.dart';

class Cacheable<T> {
  const Cacheable({required this.value, this.cachedAt});
  final T value;
  final DateTime? cachedAt;
  bool get isFromCache => cachedAt != null;
}

abstract class SupplyChainRepository {
  Future<Result<Cacheable<Paginated<Shipment>>>> listShipments(ListQuery query);
  Future<Result<Shipment>> getShipment(String id);
  Future<Result<Shipment>> createShipment(Map<String, dynamic> payload);
  Future<Result<Shipment>> updateShipment(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteShipment(String id);
  Future<Result<Shipment>> trackShipment(String id);
  Future<Result<Shipment>> deliverShipment(String id);

  Future<Result<Cacheable<Paginated<Carrier>>>> listCarriers(ListQuery query);
  Future<Result<Carrier>> getCarrier(String id);
  Future<Result<Carrier>> createCarrier(Map<String, dynamic> payload);
  Future<Result<Carrier>> updateCarrier(String id, Map<String, dynamic> payload);

  Future<Result<Cacheable<Paginated<DemandForecast>>>> listDemandForecasts(ListQuery query);
  Future<Result<DemandForecast>> generateDemandForecast(Map<String, dynamic> payload);
  Future<Result<DemandForecast>> promoteDemandForecast(String id);

  Future<Result<Cacheable<Paginated<ReorderSuggestion>>>> listReorderSuggestions(ListQuery query);
  Future<Result<ReorderSuggestion>> calculateReorder(Map<String, dynamic> payload);
  Future<Result<ReorderSuggestion>> generateReorderOrders(Map<String, dynamic> payload);
  Future<Result<ReorderSuggestion>> approveReorderSuggestion(String id);
}
