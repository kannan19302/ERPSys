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

class ListSupplyChainRoutesUseCase extends UseCase<Cacheable<Paginated<SupplyChainRoute>>, ListQuery> {
  const ListSupplyChainRoutesUseCase(this._repository);
  final SupplyChainRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<SupplyChainRoute>>>> call(ListQuery params) =>
      _repository.listSupplyChainRoutes(params);
}

class GetSupplyChainRouteUseCase extends UseCase<SupplyChainRoute, String> {
  const GetSupplyChainRouteUseCase(this._repository);
  final SupplyChainRepository _repository;
  @override
  Future<Result<SupplyChainRoute>> call(String id) => _repository.getSupplyChainRoute(id);
}

class SaveSupplyChainRouteParams {
  const SaveSupplyChainRouteParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveSupplyChainRouteUseCase extends UseCase<SupplyChainRoute, SaveSupplyChainRouteParams> {
  const SaveSupplyChainRouteUseCase(this._repository);
  final SupplyChainRepository _repository;
  @override
  Future<Result<SupplyChainRoute>> call(SaveSupplyChainRouteParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createSupplyChainRoute(params.payload)
        : _repository.updateSupplyChainRoute(id, params.payload);
  }
}

class DeleteSupplyChainRouteUseCase extends UseCase<void, String> {
  const DeleteSupplyChainRouteUseCase(this._repository);
  final SupplyChainRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteSupplyChainRoute(id);
}

class ListDockAppointmentsUseCase extends UseCase<Cacheable<Paginated<DockAppointment>>, ListQuery> {
  const ListDockAppointmentsUseCase(this._repository);
  final SupplyChainRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<DockAppointment>>>> call(ListQuery params) =>
      _repository.listDockAppointments(params);
}

class GetDockAppointmentUseCase extends UseCase<DockAppointment, String> {
  const GetDockAppointmentUseCase(this._repository);
  final SupplyChainRepository _repository;
  @override
  Future<Result<DockAppointment>> call(String id) => _repository.getDockAppointment(id);
}

class SaveDockAppointmentParams {
  const SaveDockAppointmentParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveDockAppointmentUseCase extends UseCase<DockAppointment, SaveDockAppointmentParams> {
  const SaveDockAppointmentUseCase(this._repository);
  final SupplyChainRepository _repository;
  @override
  Future<Result<DockAppointment>> call(SaveDockAppointmentParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createDockAppointment(params.payload)
        : _repository.updateDockAppointment(id, params.payload);
  }
}

class DeleteDockAppointmentUseCase extends UseCase<void, String> {
  const DeleteDockAppointmentUseCase(this._repository);
  final SupplyChainRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteDockAppointment(id);
}

class CheckinDockAppointmentUseCase extends UseCase<DockAppointment, String> {
  const CheckinDockAppointmentUseCase(this._repository);
  final SupplyChainRepository _repository;
  @override
  Future<Result<DockAppointment>> call(String id) => _repository.checkinDockAppointment(id);
}

class CompleteDockAppointmentUseCase extends UseCase<DockAppointment, String> {
  const CompleteDockAppointmentUseCase(this._repository);
  final SupplyChainRepository _repository;
  @override
  Future<Result<DockAppointment>> call(String id) => _repository.completeDockAppointment(id);
}

class ListWarehouseTransfersUseCase extends UseCase<Cacheable<Paginated<WarehouseTransfer>>, ListQuery> {
  const ListWarehouseTransfersUseCase(this._repository);
  final SupplyChainRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<WarehouseTransfer>>>> call(ListQuery params) =>
      _repository.listWarehouseTransfers(params);
}

class GetWarehouseTransferUseCase extends UseCase<WarehouseTransfer, String> {
  const GetWarehouseTransferUseCase(this._repository);
  final SupplyChainRepository _repository;
  @override
  Future<Result<WarehouseTransfer>> call(String id) => _repository.getWarehouseTransfer(id);
}

class SaveWarehouseTransferParams {
  const SaveWarehouseTransferParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveWarehouseTransferUseCase extends UseCase<WarehouseTransfer, SaveWarehouseTransferParams> {
  const SaveWarehouseTransferUseCase(this._repository);
  final SupplyChainRepository _repository;
  @override
  Future<Result<WarehouseTransfer>> call(SaveWarehouseTransferParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createWarehouseTransfer(params.payload)
        : _repository.updateWarehouseTransfer(id, params.payload);
  }
}

class DeleteWarehouseTransferUseCase extends UseCase<void, String> {
  const DeleteWarehouseTransferUseCase(this._repository);
  final SupplyChainRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteWarehouseTransfer(id);
}

class ApproveWarehouseTransferUseCase extends UseCase<WarehouseTransfer, String> {
  const ApproveWarehouseTransferUseCase(this._repository);
  final SupplyChainRepository _repository;
  @override
  Future<Result<WarehouseTransfer>> call(String id) => _repository.approveWarehouseTransfer(id);
}

class CompleteWarehouseTransferUseCase extends UseCase<WarehouseTransfer, String> {
  const CompleteWarehouseTransferUseCase(this._repository);
  final SupplyChainRepository _repository;
  @override
  Future<Result<WarehouseTransfer>> call(String id) => _repository.completeWarehouseTransfer(id);
}

class ListTrackingEventsUseCase extends UseCase<Cacheable<Paginated<TrackingEvent>>, ListQuery> {
  const ListTrackingEventsUseCase(this._repository);
  final SupplyChainRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<TrackingEvent>>>> call(ListQuery params) =>
      _repository.listTrackingEvents(params);
}

class CreateTrackingEventUseCase extends UseCase<TrackingEvent, Map<String, dynamic>> {
  const CreateTrackingEventUseCase(this._repository);
  final SupplyChainRepository _repository;
  @override
  Future<Result<TrackingEvent>> call(Map<String, dynamic> params) =>
      _repository.createTrackingEvent(params);
}