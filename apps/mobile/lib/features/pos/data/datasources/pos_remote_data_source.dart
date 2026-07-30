import '../../../../core/contracts/paginated.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_paths.dart';
import '../models/pos_models.dart';

abstract class PosRemoteDataSource {
  Future<Paginated<PosOrderModel>> listPosOrders(ListQuery query);
  Future<PosOrderModel> getPosOrder(String id);
  Future<PosOrderModel> createPosOrder(Map<String, dynamic> payload);
  Future<PosOrderModel> updatePosOrder(String id, Map<String, dynamic> payload);
  Future<void> deletePosOrder(String id);
  Future<PosOrderModel> voidPosOrder(String id);
  Future<PosOrderModel> holdPosOrder(String id);

  Future<Paginated<PosRegisterModel>> listPosRegisters(ListQuery query);
  Future<PosRegisterModel> getPosRegister(String id);
  Future<PosRegisterModel> createPosRegister(Map<String, dynamic> payload);
  Future<PosRegisterModel> updatePosRegister(String id, Map<String, dynamic> payload);
  Future<void> deletePosRegister(String id);
  Future<PosRegisterModel> openPosRegister(String id);
  Future<PosRegisterModel> closePosRegister(String id);

  Future<Paginated<PosShiftModel>> listPosShifts(ListQuery query);
  Future<PosShiftModel> getPosShift(String id);
  Future<PosShiftModel> createPosShift(Map<String, dynamic> payload);
  Future<PosShiftModel> closePosShift(String id);

  Future<Paginated<PosTerminalModel>> listPosTerminals(ListQuery query);
  Future<PosTerminalModel> getPosTerminal(String id);
  Future<PosTerminalModel> createPosTerminal(Map<String, dynamic> payload);
  Future<PosTerminalModel> updatePosTerminal(String id, Map<String, dynamic> payload);
  Future<void> deletePosTerminal(String id);

  Future<Paginated<PosDiscountModel>> listPosDiscounts(ListQuery query);
  Future<PosDiscountModel> getPosDiscount(String id);
  Future<PosDiscountModel> createPosDiscount(Map<String, dynamic> payload);
  Future<PosDiscountModel> updatePosDiscount(String id, Map<String, dynamic> payload);
  Future<void> deletePosDiscount(String id);

  Future<Paginated<PosLoyaltyProgramModel>> listPosLoyaltyPrograms(ListQuery query);
  Future<PosLoyaltyProgramModel> getPosLoyaltyProgram(String id);
  Future<PosLoyaltyProgramModel> createPosLoyaltyProgram(Map<String, dynamic> payload);
  Future<PosLoyaltyProgramModel> updatePosLoyaltyProgram(String id, Map<String, dynamic> payload);
  Future<void> deletePosLoyaltyProgram(String id);

  Future<Paginated<PosLoyaltyMemberModel>> listPosLoyaltyMembers(ListQuery query);
  Future<PosLoyaltyMemberModel> getPosLoyaltyMember(String id);
  Future<PosLoyaltyMemberModel> createPosLoyaltyMember(Map<String, dynamic> payload);

  Future<Paginated<PosLoyaltyTransactionModel>> listPosLoyaltyTransactions(ListQuery query);
  Future<PosLoyaltyTransactionModel> createPosLoyaltyTransaction(Map<String, dynamic> payload);

  Future<Paginated<PosCouponModel>> listPosCoupons(ListQuery query);
  Future<PosCouponModel> getPosCoupon(String id);
  Future<PosCouponModel> createPosCoupon(Map<String, dynamic> payload);
  Future<PosCouponModel> updatePosCoupon(String id, Map<String, dynamic> payload);
  Future<void> deletePosCoupon(String id);

  Future<Paginated<PosGiftCardModel>> listPosGiftCards(ListQuery query);
  Future<PosGiftCardModel> getPosGiftCard(String id);
  Future<PosGiftCardModel> createPosGiftCard(Map<String, dynamic> payload);
  Future<void> deletePosGiftCard(String id);

  Future<Paginated<PosPriceListModel>> listPosPriceLists(ListQuery query);
  Future<PosPriceListModel> getPosPriceList(String id);
  Future<PosPriceListModel> createPosPriceList(Map<String, dynamic> payload);
  Future<PosPriceListModel> updatePosPriceList(String id, Map<String, dynamic> payload);
  Future<void> deletePosPriceList(String id);
}

class PosRemoteDataSourceImpl implements PosRemoteDataSource {
  const PosRemoteDataSourceImpl(this._client);

  final ApiClient _client;

  @override
  Future<Paginated<PosOrderModel>> listPosOrders(ListQuery query) =>
      _client.getPaginated<PosOrderModel>(ApiPaths.posOrders, query, PosOrderModel.fromJson);

  @override
  Future<PosOrderModel> getPosOrder(String id) async =>
      PosOrderModel.fromJson(await _client.getObject(ApiPaths.posOrder(id)));

  @override
  Future<PosOrderModel> createPosOrder(Map<String, dynamic> payload) async =>
      PosOrderModel.fromJson(await _client.post(ApiPaths.posOrders, body: payload));

  @override
  Future<PosOrderModel> updatePosOrder(String id, Map<String, dynamic> payload) async =>
      PosOrderModel.fromJson(await _client.patch(ApiPaths.posOrder(id), body: payload));

  @override
  Future<void> deletePosOrder(String id) => _client.delete(ApiPaths.posOrder(id));

  @override
  Future<PosOrderModel> voidPosOrder(String id) async =>
      PosOrderModel.fromJson(await _client.post(ApiPaths.posOrderVoid(id)));

  @override
  Future<PosOrderModel> holdPosOrder(String id) async =>
      PosOrderModel.fromJson(await _client.post(ApiPaths.posOrderHold(id)));

  @override
  Future<Paginated<PosRegisterModel>> listPosRegisters(ListQuery query) =>
      _client.getPaginated<PosRegisterModel>(ApiPaths.posRegisters, query, PosRegisterModel.fromJson);

  @override
  Future<PosRegisterModel> getPosRegister(String id) async =>
      PosRegisterModel.fromJson(await _client.getObject(ApiPaths.posRegister(id)));

  @override
  Future<PosRegisterModel> createPosRegister(Map<String, dynamic> payload) async =>
      PosRegisterModel.fromJson(await _client.post(ApiPaths.posRegisters, body: payload));

  @override
  Future<PosRegisterModel> updatePosRegister(String id, Map<String, dynamic> payload) async =>
      PosRegisterModel.fromJson(await _client.patch(ApiPaths.posRegister(id), body: payload));

  @override
  Future<void> deletePosRegister(String id) => _client.delete(ApiPaths.posRegister(id));

  @override
  Future<PosRegisterModel> openPosRegister(String id) async =>
      PosRegisterModel.fromJson(await _client.post(ApiPaths.posRegisterOpen(id)));

  @override
  Future<PosRegisterModel> closePosRegister(String id) async =>
      PosRegisterModel.fromJson(await _client.post(ApiPaths.posRegisterClose(id)));

  @override
  Future<Paginated<PosShiftModel>> listPosShifts(ListQuery query) =>
      _client.getPaginated<PosShiftModel>(ApiPaths.posShifts, query, PosShiftModel.fromJson);

  @override
  Future<PosShiftModel> getPosShift(String id) async =>
      PosShiftModel.fromJson(await _client.getObject(ApiPaths.posShift(id)));

  @override
  Future<PosShiftModel> createPosShift(Map<String, dynamic> payload) async =>
      PosShiftModel.fromJson(await _client.post(ApiPaths.posShifts, body: payload));

  @override
  Future<PosShiftModel> closePosShift(String id) async =>
      PosShiftModel.fromJson(await _client.post(ApiPaths.posShiftClose(id)));

  @override
  Future<Paginated<PosTerminalModel>> listPosTerminals(ListQuery query) =>
      _client.getPaginated<PosTerminalModel>(ApiPaths.posTerminals, query, PosTerminalModel.fromJson);

  @override
  Future<PosTerminalModel> getPosTerminal(String id) async =>
      PosTerminalModel.fromJson(await _client.getObject(ApiPaths.posTerminal(id)));

  @override
  Future<PosTerminalModel> createPosTerminal(Map<String, dynamic> payload) async =>
      PosTerminalModel.fromJson(await _client.post(ApiPaths.posTerminals, body: payload));

  @override
  Future<PosTerminalModel> updatePosTerminal(String id, Map<String, dynamic> payload) async =>
      PosTerminalModel.fromJson(await _client.patch(ApiPaths.posTerminal(id), body: payload));

  @override
  Future<void> deletePosTerminal(String id) => _client.delete(ApiPaths.posTerminal(id));

  @override
  Future<Paginated<PosDiscountModel>> listPosDiscounts(ListQuery query) =>
      _client.getPaginated<PosDiscountModel>(ApiPaths.posDiscounts, query, PosDiscountModel.fromJson);

  @override
  Future<PosDiscountModel> getPosDiscount(String id) async =>
      PosDiscountModel.fromJson(await _client.getObject('${ApiPaths.posDiscounts}/$id'));

  @override
  Future<PosDiscountModel> createPosDiscount(Map<String, dynamic> payload) async =>
      PosDiscountModel.fromJson(await _client.post(ApiPaths.posDiscounts, body: payload));

  @override
  Future<PosDiscountModel> updatePosDiscount(String id, Map<String, dynamic> payload) async =>
      PosDiscountModel.fromJson(await _client.patch('${ApiPaths.posDiscounts}/$id', body: payload));

  @override
  Future<void> deletePosDiscount(String id) => _client.delete('${ApiPaths.posDiscounts}/$id');

  @override
  Future<Paginated<PosLoyaltyProgramModel>> listPosLoyaltyPrograms(ListQuery query) =>
      _client.getPaginated<PosLoyaltyProgramModel>(ApiPaths.posLoyaltyPrograms, query, PosLoyaltyProgramModel.fromJson);

  @override
  Future<PosLoyaltyProgramModel> getPosLoyaltyProgram(String id) async =>
      PosLoyaltyProgramModel.fromJson(await _client.getObject('${ApiPaths.posLoyaltyPrograms}/$id'));

  @override
  Future<PosLoyaltyProgramModel> createPosLoyaltyProgram(Map<String, dynamic> payload) async =>
      PosLoyaltyProgramModel.fromJson(await _client.post(ApiPaths.posLoyaltyPrograms, body: payload));

  @override
  Future<PosLoyaltyProgramModel> updatePosLoyaltyProgram(String id, Map<String, dynamic> payload) async =>
      PosLoyaltyProgramModel.fromJson(await _client.patch('${ApiPaths.posLoyaltyPrograms}/$id', body: payload));

  @override
  Future<void> deletePosLoyaltyProgram(String id) => _client.delete('${ApiPaths.posLoyaltyPrograms}/$id');

  @override
  Future<Paginated<PosLoyaltyMemberModel>> listPosLoyaltyMembers(ListQuery query) =>
      _client.getPaginated<PosLoyaltyMemberModel>(ApiPaths.posLoyaltyMembers, query, PosLoyaltyMemberModel.fromJson);

  @override
  Future<PosLoyaltyMemberModel> getPosLoyaltyMember(String id) async =>
      PosLoyaltyMemberModel.fromJson(await _client.getObject('${ApiPaths.posLoyaltyMembers}/$id'));

  @override
  Future<PosLoyaltyMemberModel> createPosLoyaltyMember(Map<String, dynamic> payload) async =>
      PosLoyaltyMemberModel.fromJson(await _client.post(ApiPaths.posLoyaltyMembers, body: payload));

  @override
  Future<Paginated<PosLoyaltyTransactionModel>> listPosLoyaltyTransactions(ListQuery query) =>
      _client.getPaginated<PosLoyaltyTransactionModel>('/pos/loyalty-transactions', query, PosLoyaltyTransactionModel.fromJson);

  @override
  Future<PosLoyaltyTransactionModel> createPosLoyaltyTransaction(Map<String, dynamic> payload) async =>
      PosLoyaltyTransactionModel.fromJson(await _client.post('/pos/loyalty-transactions', body: payload));

  @override
  Future<Paginated<PosCouponModel>> listPosCoupons(ListQuery query) =>
      _client.getPaginated<PosCouponModel>(ApiPaths.posCoupons, query, PosCouponModel.fromJson);

  @override
  Future<PosCouponModel> getPosCoupon(String id) async =>
      PosCouponModel.fromJson(await _client.getObject('${ApiPaths.posCoupons}/$id'));

  @override
  Future<PosCouponModel> createPosCoupon(Map<String, dynamic> payload) async =>
      PosCouponModel.fromJson(await _client.post(ApiPaths.posCoupons, body: payload));

  @override
  Future<PosCouponModel> updatePosCoupon(String id, Map<String, dynamic> payload) async =>
      PosCouponModel.fromJson(await _client.patch('${ApiPaths.posCoupons}/$id', body: payload));

  @override
  Future<void> deletePosCoupon(String id) => _client.delete('${ApiPaths.posCoupons}/$id');

  @override
  Future<Paginated<PosGiftCardModel>> listPosGiftCards(ListQuery query) =>
      _client.getPaginated<PosGiftCardModel>(ApiPaths.posGiftCards, query, PosGiftCardModel.fromJson);

  @override
  Future<PosGiftCardModel> getPosGiftCard(String id) async =>
      PosGiftCardModel.fromJson(await _client.getObject('${ApiPaths.posGiftCards}/$id'));

  @override
  Future<PosGiftCardModel> createPosGiftCard(Map<String, dynamic> payload) async =>
      PosGiftCardModel.fromJson(await _client.post(ApiPaths.posGiftCards, body: payload));

  @override
  Future<void> deletePosGiftCard(String id) => _client.delete('${ApiPaths.posGiftCards}/$id');

  @override
  Future<Paginated<PosPriceListModel>> listPosPriceLists(ListQuery query) =>
      _client.getPaginated<PosPriceListModel>(ApiPaths.posPriceLists, query, PosPriceListModel.fromJson);

  @override
  Future<PosPriceListModel> getPosPriceList(String id) async =>
      PosPriceListModel.fromJson(await _client.getObject(ApiPaths.posPriceLists + '/$id'));

  @override
  Future<PosPriceListModel> createPosPriceList(Map<String, dynamic> payload) async =>
      PosPriceListModel.fromJson(await _client.post(ApiPaths.posPriceLists, body: payload));

  @override
  Future<PosPriceListModel> updatePosPriceList(String id, Map<String, dynamic> payload) async =>
      PosPriceListModel.fromJson(await _client.patch(ApiPaths.posPriceLists + '/$id', body: payload));

  @override
  Future<void> deletePosPriceList(String id) => _client.delete(ApiPaths.posPriceLists + '/$id');
}