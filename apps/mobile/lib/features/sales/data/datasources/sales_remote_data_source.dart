import '../../../../core/contracts/paginated.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_paths.dart';
import '../models/sales_models.dart';

abstract class SalesRemoteDataSource {
  Future<Paginated<QuotationModel>> listQuotations(ListQuery query);

  Future<QuotationModel> getQuotation(String id);

  Future<QuotationModel> createQuotation(Map<String, dynamic> payload);

  Future<QuotationModel> updateQuotation(String id, Map<String, dynamic> payload);

  Future<void> deleteQuotation(String id);

  Future<QuotationModel> submitQuotation(String id);

  Future<QuotationModel> acceptQuotation(String id);

  Future<SalesOrderModel> convertQuotation(String id);

  Future<Paginated<SalesOrderModel>> listSalesOrders(ListQuery query);

  Future<SalesOrderModel> getSalesOrder(String id);

  Future<SalesOrderModel> createSalesOrder(Map<String, dynamic> payload);

  Future<SalesOrderModel> updateSalesOrder(String id, Map<String, dynamic> payload);

  Future<void> deleteSalesOrder(String id);

  Future<SalesOrderModel> confirmSalesOrder(String id);

  Future<SalesOrderModel> cancelSalesOrder(String id);

  Future<Paginated<DeliveryNoteModel>> listDeliveryNotes(ListQuery query);

  Future<DeliveryNoteModel> getDeliveryNote(String id);

  Future<DeliveryNoteModel> createDeliveryNote(Map<String, dynamic> payload);

  Future<DeliveryNoteModel> updateDeliveryNote(String id, Map<String, dynamic> payload);

  Future<void> deleteDeliveryNote(String id);

  Future<DeliveryNoteModel> submitDeliveryNote(String id);

  Future<Paginated<SalesReturnModel>> listSalesReturns(ListQuery query);

  Future<SalesReturnModel> getSalesReturn(String id);

  Future<SalesReturnModel> createSalesReturn(Map<String, dynamic> payload);

  Future<void> deleteSalesReturn(String id);

  Future<SalesReturnModel> approveSalesReturn(String id);

  Future<SalesReturnModel> rejectSalesReturn(String id);

  Future<List<SalesPipelineModel>> listPipelines();

  Future<Paginated<OpportunityModel>> listOpportunities(ListQuery query);

  Future<OpportunityModel> getOpportunity(String id);

  Future<OpportunityModel> createOpportunity(Map<String, dynamic> payload);

  Future<OpportunityModel> updateOpportunity(String id, Map<String, dynamic> payload);

  Future<void> deleteOpportunity(String id);

  Future<OpportunityModel> updateOpportunityStage(String id, String stage);

  Future<SalesPipelineModel> getSalesPipeline(String id);

  Future<List<SalesActivityModel>> listSalesActivity();

  Future<SalesActivityModel> logSalesActivity(Map<String, dynamic> payload);
}

class SalesRemoteDataSourceImpl implements SalesRemoteDataSource {
  const SalesRemoteDataSourceImpl(this._client);

  final ApiClient _client;

  @override
  Future<Paginated<QuotationModel>> listQuotations(ListQuery query) =>
      _client.getPaginated<QuotationModel>(
        ApiPaths.quotations,
        query,
        QuotationModel.fromJson,
      );

  @override
  Future<QuotationModel> getQuotation(String id) async =>
      QuotationModel.fromJson(await _client.getObject(ApiPaths.quotation(id)));

  @override
  Future<QuotationModel> createQuotation(Map<String, dynamic> payload) async =>
      QuotationModel.fromJson(
        await _client.post(ApiPaths.quotations, body: payload),
      );

  @override
  Future<QuotationModel> updateQuotation(
    String id,
    Map<String, dynamic> payload,
  ) async =>
      QuotationModel.fromJson(
        await _client.patch(ApiPaths.quotation(id), body: payload),
      );

  @override
  Future<void> deleteQuotation(String id) => _client.delete(ApiPaths.quotation(id));

  @override
  Future<QuotationModel> submitQuotation(String id) async =>
      QuotationModel.fromJson(
        await _client.post(ApiPaths.quotationSubmit(id)),
      );

  @override
  Future<QuotationModel> acceptQuotation(String id) async =>
      QuotationModel.fromJson(
        await _client.post(ApiPaths.quotationAccept(id)),
      );

  @override
  Future<SalesOrderModel> convertQuotation(String id) async =>
      SalesOrderModel.fromJson(
        await _client.post(ApiPaths.quotationConvert(id)),
      );

  @override
  Future<Paginated<SalesOrderModel>> listSalesOrders(ListQuery query) =>
      _client.getPaginated<SalesOrderModel>(
        ApiPaths.salesOrders,
        query,
        SalesOrderModel.fromJson,
      );

  @override
  Future<SalesOrderModel> getSalesOrder(String id) async =>
      SalesOrderModel.fromJson(await _client.getObject(ApiPaths.salesOrder(id)));

  @override
  Future<SalesOrderModel> createSalesOrder(Map<String, dynamic> payload) async =>
      SalesOrderModel.fromJson(
        await _client.post(ApiPaths.salesOrders, body: payload),
      );

  @override
  Future<SalesOrderModel> updateSalesOrder(
    String id,
    Map<String, dynamic> payload,
  ) async =>
      SalesOrderModel.fromJson(
        await _client.patch(ApiPaths.salesOrder(id), body: payload),
      );

  @override
  Future<void> deleteSalesOrder(String id) => _client.delete(ApiPaths.salesOrder(id));

  @override
  Future<SalesOrderModel> confirmSalesOrder(String id) async =>
      SalesOrderModel.fromJson(
        await _client.post(ApiPaths.salesOrderConfirm(id)),
      );

  @override
  Future<SalesOrderModel> cancelSalesOrder(String id) async =>
      SalesOrderModel.fromJson(
        await _client.post(ApiPaths.salesOrderCancel(id)),
      );

  @override
  Future<Paginated<DeliveryNoteModel>> listDeliveryNotes(ListQuery query) =>
      _client.getPaginated<DeliveryNoteModel>(
        ApiPaths.deliveryNotes,
        query,
        DeliveryNoteModel.fromJson,
      );

  @override
  Future<DeliveryNoteModel> getDeliveryNote(String id) async =>
      DeliveryNoteModel.fromJson(await _client.getObject(ApiPaths.deliveryNote(id)));

  @override
  Future<DeliveryNoteModel> createDeliveryNote(Map<String, dynamic> payload) async =>
      DeliveryNoteModel.fromJson(
        await _client.post(ApiPaths.deliveryNotes, body: payload),
      );

  @override
  Future<DeliveryNoteModel> updateDeliveryNote(
    String id,
    Map<String, dynamic> payload,
  ) async =>
      DeliveryNoteModel.fromJson(
        await _client.patch(ApiPaths.deliveryNote(id), body: payload),
      );

  @override
  Future<void> deleteDeliveryNote(String id) =>
      _client.delete(ApiPaths.deliveryNote(id));

  @override
  Future<DeliveryNoteModel> submitDeliveryNote(String id) async =>
      DeliveryNoteModel.fromJson(
        await _client.post('${ApiPaths.deliveryNote(id)}/submit'),
      );

  @override
  Future<Paginated<SalesReturnModel>> listSalesReturns(ListQuery query) =>
      _client.getPaginated<SalesReturnModel>(
        ApiPaths.salesReturns,
        query,
        SalesReturnModel.fromJson,
      );

  @override
  Future<SalesReturnModel> getSalesReturn(String id) async =>
      SalesReturnModel.fromJson(await _client.getObject(ApiPaths.salesReturn(id)));

  @override
  Future<SalesReturnModel> createSalesReturn(Map<String, dynamic> payload) async =>
      SalesReturnModel.fromJson(
        await _client.post(ApiPaths.salesReturns, body: payload),
      );

  @override
  Future<void> deleteSalesReturn(String id) =>
      _client.delete(ApiPaths.salesReturn(id));

  @override
  Future<SalesReturnModel> approveSalesReturn(String id) async =>
      SalesReturnModel.fromJson(
        await _client.post(ApiPaths.salesReturnApprove(id)),
      );

  @override
  Future<SalesReturnModel> rejectSalesReturn(String id) async =>
      SalesReturnModel.fromJson(
        await _client.post(ApiPaths.salesReturnReject(id)),
      );

  @override
  Future<List<SalesPipelineModel>> listPipelines() async {
    final List<Map<String, dynamic>> raw = await _client.getList(ApiPaths.salesPipelines);
    return raw.map(SalesPipelineModel.fromJson).toList(growable: false);
  }

  @override
  Future<Paginated<OpportunityModel>> listOpportunities(ListQuery query) =>
      _client.getPaginated<OpportunityModel>(
        ApiPaths.opportunities,
        query,
        OpportunityModel.fromJson,
      );

  @override
  Future<OpportunityModel> getOpportunity(String id) async =>
      OpportunityModel.fromJson(
        await _client.getObject(ApiPaths.opportunity(id)),
      );

  @override
  Future<OpportunityModel> createOpportunity(Map<String, dynamic> payload) async =>
      OpportunityModel.fromJson(
        await _client.post(ApiPaths.opportunities, body: payload),
      );

  @override
  Future<OpportunityModel> updateOpportunity(
    String id,
    Map<String, dynamic> payload,
  ) async =>
      OpportunityModel.fromJson(
        await _client.patch(ApiPaths.opportunity(id), body: payload),
      );

  @override
  Future<void> deleteOpportunity(String id) =>
      _client.delete(ApiPaths.opportunity(id));

  @override
  Future<OpportunityModel> updateOpportunityStage(String id, String stage) async =>
      OpportunityModel.fromJson(
        await _client.post(ApiPaths.opportunityStage(id), body: <String, dynamic>{'stage': stage}),
      );

  @override
  Future<SalesPipelineModel> getSalesPipeline(String id) async =>
      SalesPipelineModel.fromJson(
        await _client.getObject(ApiPaths.salesPipeline(id)),
      );

  @override
  Future<List<SalesActivityModel>> listSalesActivity() async {
    final List<Map<String, dynamic>> raw =
        await _client.getList(ApiPaths.salesActivity);
    return raw.map(SalesActivityModel.fromJson).toList(growable: false);
  }

  @override
  Future<SalesActivityModel> logSalesActivity(Map<String, dynamic> payload) async =>
      SalesActivityModel.fromJson(
        await _client.post(ApiPaths.salesActivity, body: payload),
      );
}
