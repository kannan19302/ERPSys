import '../../../../core/contracts/paginated.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_paths.dart';
import '../models/supply_chain_models.dart';

abstract class SupplyChainRemoteDataSource {
  Future<Paginated<ShipmentModel>> listShipments(ListQuery query);
  Future<ShipmentModel> getShipment(String id);
  Future<ShipmentModel> createShipment(Map<String, dynamic> payload);
  Future<ShipmentModel> updateShipment(String id, Map<String, dynamic> payload);
  Future<void> deleteShipment(String id);
  Future<ShipmentModel> trackShipment(String id);
  Future<ShipmentModel> deliverShipment(String id);

  Future<Paginated<CarrierModel>> listCarriers(ListQuery query);
  Future<CarrierModel> getCarrier(String id);
  Future<CarrierModel> createCarrier(Map<String, dynamic> payload);
  Future<CarrierModel> updateCarrier(String id, Map<String, dynamic> payload);

  Future<Paginated<DemandForecastModel>> listDemandForecasts(ListQuery query);
  Future<DemandForecastModel> generateDemandForecast(Map<String, dynamic> payload);
  Future<DemandForecastModel> promoteDemandForecast(String id);

  Future<Paginated<ReorderSuggestionModel>> listReorderSuggestions(ListQuery query);
  Future<ReorderSuggestionModel> calculateReorder(Map<String, dynamic> payload);
  Future<ReorderSuggestionModel> generateReorderOrders(Map<String, dynamic> payload);
  Future<ReorderSuggestionModel> approveReorderSuggestion(String id);

  Future<Paginated<SupplyChainRouteModel>> listSupplyChainRoutes(ListQuery query);
  Future<SupplyChainRouteModel> getSupplyChainRoute(String id);
  Future<SupplyChainRouteModel> createSupplyChainRoute(Map<String, dynamic> payload);
  Future<SupplyChainRouteModel> updateSupplyChainRoute(String id, Map<String, dynamic> payload);
  Future<void> deleteSupplyChainRoute(String id);

  Future<Paginated<DockAppointmentModel>> listDockAppointments(ListQuery query);
  Future<DockAppointmentModel> getDockAppointment(String id);
  Future<DockAppointmentModel> createDockAppointment(Map<String, dynamic> payload);
  Future<DockAppointmentModel> updateDockAppointment(String id, Map<String, dynamic> payload);
  Future<void> deleteDockAppointment(String id);
  Future<DockAppointmentModel> checkinDockAppointment(String id);
  Future<DockAppointmentModel> completeDockAppointment(String id);

  Future<Paginated<WarehouseTransferModel>> listWarehouseTransfers(ListQuery query);
  Future<WarehouseTransferModel> getWarehouseTransfer(String id);
  Future<WarehouseTransferModel> createWarehouseTransfer(Map<String, dynamic> payload);
  Future<WarehouseTransferModel> updateWarehouseTransfer(String id, Map<String, dynamic> payload);
  Future<void> deleteWarehouseTransfer(String id);
  Future<WarehouseTransferModel> approveWarehouseTransfer(String id);
  Future<WarehouseTransferModel> completeWarehouseTransfer(String id);

  Future<Paginated<TrackingEventModel>> listTrackingEvents(ListQuery query);
  Future<TrackingEventModel> createTrackingEvent(Map<String, dynamic> payload);
}

class SupplyChainRemoteDataSourceImpl implements SupplyChainRemoteDataSource {
  const SupplyChainRemoteDataSourceImpl(this._client);

  final ApiClient _client;

  @override
  Future<Paginated<ShipmentModel>> listShipments(ListQuery query) =>
      _client.getPaginated<ShipmentModel>(
        ApiPaths.shipments, query, ShipmentModel.fromJson,);

  @override
  Future<ShipmentModel> getShipment(String id) async =>
      ShipmentModel.fromJson(
        await _client.getObject(ApiPaths.shipment(id)),);

  @override
  Future<ShipmentModel> createShipment(Map<String, dynamic> payload) async =>
      ShipmentModel.fromJson(
        await _client.post(ApiPaths.shipments, body: payload),);

  @override
  Future<ShipmentModel> updateShipment(
    String id, Map<String, dynamic> payload,) async =>
      ShipmentModel.fromJson(
        await _client.patch(ApiPaths.shipment(id), body: payload),);

  @override
  Future<void> deleteShipment(String id) =>
      _client.delete(ApiPaths.shipment(id));

  @override
  Future<ShipmentModel> trackShipment(String id) async =>
      ShipmentModel.fromJson(
        await _client.post(ApiPaths.shipmentTrack(id)),);

  @override
  Future<ShipmentModel> deliverShipment(String id) async =>
      ShipmentModel.fromJson(
        await _client.post(ApiPaths.shipmentDeliver(id)),);

  @override
  Future<Paginated<CarrierModel>> listCarriers(ListQuery query) =>
      _client.getPaginated<CarrierModel>(
        ApiPaths.carriers, query, CarrierModel.fromJson,);

  @override
  Future<CarrierModel> getCarrier(String id) async =>
      CarrierModel.fromJson(await _client.getObject(ApiPaths.carrier(id)));

  @override
  Future<CarrierModel> createCarrier(Map<String, dynamic> payload) async =>
      CarrierModel.fromJson(await _client.post(ApiPaths.carriers, body: payload));

  @override
  Future<CarrierModel> updateCarrier(
    String id, Map<String, dynamic> payload,) async =>
      CarrierModel.fromJson(
        await _client.patch(ApiPaths.carrier(id), body: payload),);

  @override
  Future<Paginated<DemandForecastModel>> listDemandForecasts(ListQuery query) =>
      _client.getPaginated<DemandForecastModel>(
        ApiPaths.demandForecast, query, DemandForecastModel.fromJson,);

  @override
  Future<DemandForecastModel> generateDemandForecast(
    Map<String, dynamic> payload,) async =>
      DemandForecastModel.fromJson(
        await _client.post(ApiPaths.demandForecastGenerate, body: payload),);

  @override
  Future<DemandForecastModel> promoteDemandForecast(String id) async =>
      DemandForecastModel.fromJson(
        await _client.post(ApiPaths.demandForecastPromote(id)),);

  @override
  Future<Paginated<ReorderSuggestionModel>> listReorderSuggestions(
    ListQuery query,) =>
      _client.getPaginated<ReorderSuggestionModel>(
        ApiPaths.reorderSuggestions, query, ReorderSuggestionModel.fromJson,);

  @override
  Future<ReorderSuggestionModel> calculateReorder(
    Map<String, dynamic> payload,) async =>
      ReorderSuggestionModel.fromJson(
        await _client.post(ApiPaths.reorderCalculate, body: payload),);

  @override
  Future<ReorderSuggestionModel> generateReorderOrders(
    Map<String, dynamic> payload,) async =>
      ReorderSuggestionModel.fromJson(
        await _client.post(ApiPaths.reorderGenerate, body: payload),);

  @override
  Future<ReorderSuggestionModel> approveReorderSuggestion(String id) async =>
      ReorderSuggestionModel.fromJson(
        await _client.post(ApiPaths.reorderSuggestionApprove(id)),);

  @override
  Future<Paginated<SupplyChainRouteModel>> listSupplyChainRoutes(ListQuery query) =>
      _client.getPaginated<SupplyChainRouteModel>(
        ApiPaths.supplyChainRoutes, query, SupplyChainRouteModel.fromJson,);

  @override
  Future<SupplyChainRouteModel> getSupplyChainRoute(String id) async =>
      SupplyChainRouteModel.fromJson(
        await _client.getObject(ApiPaths.supplyChainRoute(id)),);

  @override
  Future<SupplyChainRouteModel> createSupplyChainRoute(Map<String, dynamic> payload) async =>
      SupplyChainRouteModel.fromJson(
        await _client.post(ApiPaths.supplyChainRoutes, body: payload),);

  @override
  Future<SupplyChainRouteModel> updateSupplyChainRoute(String id, Map<String, dynamic> payload) async =>
      SupplyChainRouteModel.fromJson(
        await _client.patch(ApiPaths.supplyChainRoute(id), body: payload),);

  @override
  Future<void> deleteSupplyChainRoute(String id) =>
      _client.delete(ApiPaths.supplyChainRoute(id));

  @override
  Future<Paginated<DockAppointmentModel>> listDockAppointments(ListQuery query) =>
      _client.getPaginated<DockAppointmentModel>(
        ApiPaths.dockAppointments, query, DockAppointmentModel.fromJson,);

  @override
  Future<DockAppointmentModel> getDockAppointment(String id) async =>
      DockAppointmentModel.fromJson(
        await _client.getObject(ApiPaths.dockAppointment(id)),);

  @override
  Future<DockAppointmentModel> createDockAppointment(Map<String, dynamic> payload) async =>
      DockAppointmentModel.fromJson(
        await _client.post(ApiPaths.dockAppointments, body: payload),);

  @override
  Future<DockAppointmentModel> updateDockAppointment(String id, Map<String, dynamic> payload) async =>
      DockAppointmentModel.fromJson(
        await _client.patch(ApiPaths.dockAppointment(id), body: payload),);

  @override
  Future<void> deleteDockAppointment(String id) =>
      _client.delete(ApiPaths.dockAppointment(id));

  @override
  Future<DockAppointmentModel> checkinDockAppointment(String id) async =>
      DockAppointmentModel.fromJson(
        await _client.post(ApiPaths.dockAppointmentCheckin(id)),);

  @override
  Future<DockAppointmentModel> completeDockAppointment(String id) async =>
      DockAppointmentModel.fromJson(
        await _client.post(ApiPaths.dockAppointmentComplete(id)),);

  @override
  Future<Paginated<WarehouseTransferModel>> listWarehouseTransfers(ListQuery query) =>
      _client.getPaginated<WarehouseTransferModel>(
        ApiPaths.warehouseTransfers, query, WarehouseTransferModel.fromJson,);

  @override
  Future<WarehouseTransferModel> getWarehouseTransfer(String id) async =>
      WarehouseTransferModel.fromJson(
        await _client.getObject(ApiPaths.warehouseTransfer(id)),);

  @override
  Future<WarehouseTransferModel> createWarehouseTransfer(Map<String, dynamic> payload) async =>
      WarehouseTransferModel.fromJson(
        await _client.post(ApiPaths.warehouseTransfers, body: payload),);

  @override
  Future<WarehouseTransferModel> updateWarehouseTransfer(String id, Map<String, dynamic> payload) async =>
      WarehouseTransferModel.fromJson(
        await _client.patch(ApiPaths.warehouseTransfer(id), body: payload),);

  @override
  Future<void> deleteWarehouseTransfer(String id) =>
      _client.delete(ApiPaths.warehouseTransfer(id));

  @override
  Future<WarehouseTransferModel> approveWarehouseTransfer(String id) async =>
      WarehouseTransferModel.fromJson(
        await _client.post(ApiPaths.warehouseTransferApprove(id)),);

  @override
  Future<WarehouseTransferModel> completeWarehouseTransfer(String id) async =>
      WarehouseTransferModel.fromJson(
        await _client.post(ApiPaths.warehouseTransferComplete(id)),);

  @override
  Future<Paginated<TrackingEventModel>> listTrackingEvents(ListQuery query) =>
      _client.getPaginated<TrackingEventModel>(
        '/supply-chain/tracking-events', query, TrackingEventModel.fromJson,);

  @override
  Future<TrackingEventModel> createTrackingEvent(Map<String, dynamic> payload) async =>
      TrackingEventModel.fromJson(
        await _client.post('/supply-chain/tracking-events', body: payload),);
}