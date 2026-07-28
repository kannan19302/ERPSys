import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/supply_chain.dart';
import '../repositories/supply_chain_repository.dart';

class ListShipmentsUseCase extends UseCase<Cacheable<Paginated<Shipment>>, ListQuery> {
  const ListShipmentsUseCase(this._repository);
  final SupplyChainRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<Shipment>>>> call(ListQuery params) =>
      _repository.listShipments(params);
}

class GetShipmentUseCase extends UseCase<Shipment, String> {
  const GetShipmentUseCase(this._repository);
  final SupplyChainRepository _repository;
  @override
  Future<Result<Shipment>> call(String id) => _repository.getShipment(id);
}

class SaveShipmentParams {
  const SaveShipmentParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveShipmentUseCase extends UseCase<Shipment, SaveShipmentParams> {
  const SaveShipmentUseCase(this._repository);
  final SupplyChainRepository _repository;
  @override
  Future<Result<Shipment>> call(SaveShipmentParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createShipment(params.payload)
        : _repository.updateShipment(id, params.payload);
  }
}

class DeleteShipmentUseCase extends UseCase<void, String> {
  const DeleteShipmentUseCase(this._repository);
  final SupplyChainRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteShipment(id);
}

class TrackShipmentUseCase extends UseCase<Shipment, String> {
  const TrackShipmentUseCase(this._repository);
  final SupplyChainRepository _repository;
  @override
  Future<Result<Shipment>> call(String id) => _repository.trackShipment(id);
}

class DeliverShipmentUseCase extends UseCase<Shipment, String> {
  const DeliverShipmentUseCase(this._repository);
  final SupplyChainRepository _repository;
  @override
  Future<Result<Shipment>> call(String id) => _repository.deliverShipment(id);
}

class ListCarriersUseCase extends UseCase<Cacheable<Paginated<Carrier>>, ListQuery> {
  const ListCarriersUseCase(this._repository);
  final SupplyChainRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<Carrier>>>> call(ListQuery params) =>
      _repository.listCarriers(params);
}

class GetCarrierUseCase extends UseCase<Carrier, String> {
  const GetCarrierUseCase(this._repository);
  final SupplyChainRepository _repository;
  @override
  Future<Result<Carrier>> call(String id) => _repository.getCarrier(id);
}

class SaveCarrierParams {
  const SaveCarrierParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveCarrierUseCase extends UseCase<Carrier, SaveCarrierParams> {
  const SaveCarrierUseCase(this._repository);
  final SupplyChainRepository _repository;
  @override
  Future<Result<Carrier>> call(SaveCarrierParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createCarrier(params.payload)
        : _repository.updateCarrier(id, params.payload);
  }
}

class ListDemandForecastsUseCase extends UseCase<Cacheable<Paginated<DemandForecast>>, ListQuery> {
  const ListDemandForecastsUseCase(this._repository);
  final SupplyChainRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<DemandForecast>>>> call(ListQuery params) =>
      _repository.listDemandForecasts(params);
}

class GenerateDemandForecastUseCase extends UseCase<DemandForecast, Map<String, dynamic>> {
  const GenerateDemandForecastUseCase(this._repository);
  final SupplyChainRepository _repository;
  @override
  Future<Result<DemandForecast>> call(Map<String, dynamic> params) =>
      _repository.generateDemandForecast(params);
}

class PromoteDemandForecastUseCase extends UseCase<DemandForecast, String> {
  const PromoteDemandForecastUseCase(this._repository);
  final SupplyChainRepository _repository;
  @override
  Future<Result<DemandForecast>> call(String id) =>
      _repository.promoteDemandForecast(id);
}

class ListReorderSuggestionsUseCase extends UseCase<Cacheable<Paginated<ReorderSuggestion>>, ListQuery> {
  const ListReorderSuggestionsUseCase(this._repository);
  final SupplyChainRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<ReorderSuggestion>>>> call(ListQuery params) =>
      _repository.listReorderSuggestions(params);
}

class CalculateReorderUseCase extends UseCase<ReorderSuggestion, Map<String, dynamic>> {
  const CalculateReorderUseCase(this._repository);
  final SupplyChainRepository _repository;
  @override
  Future<Result<ReorderSuggestion>> call(Map<String, dynamic> params) =>
      _repository.calculateReorder(params);
}

class GenerateReorderOrdersUseCase extends UseCase<ReorderSuggestion, Map<String, dynamic>> {
  const GenerateReorderOrdersUseCase(this._repository);
  final SupplyChainRepository _repository;
  @override
  Future<Result<ReorderSuggestion>> call(Map<String, dynamic> params) =>
      _repository.generateReorderOrders(params);
}

class ApproveReorderSuggestionUseCase extends UseCase<ReorderSuggestion, String> {
  const ApproveReorderSuggestionUseCase(this._repository);
  final SupplyChainRepository _repository;
  @override
  Future<Result<ReorderSuggestion>> call(String id) =>
      _repository.approveReorderSuggestion(id);
}
