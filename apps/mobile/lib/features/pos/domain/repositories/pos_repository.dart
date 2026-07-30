import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../entities/pos.dart';

class Cacheable<T> {
  const Cacheable({required this.value, this.cachedAt});
  final T value;
  final DateTime? cachedAt;
  bool get isFromCache => cachedAt != null;
}

abstract class PosRepository {
  Future<Result<Cacheable<Paginated<PosOrder>>>> listPosOrders(ListQuery query);
  Future<Result<PosOrder>> getPosOrder(String id);
  Future<Result<PosOrder>> createPosOrder(Map<String, dynamic> payload);
  Future<Result<PosOrder>> updatePosOrder(String id, Map<String, dynamic> payload);
  Future<Result<void>> deletePosOrder(String id);
  Future<Result<PosOrder>> voidPosOrder(String id);
  Future<Result<PosOrder>> holdPosOrder(String id);

  Future<Result<Cacheable<Paginated<PosRegister>>>> listPosRegisters(ListQuery query);
  Future<Result<PosRegister>> getPosRegister(String id);
  Future<Result<PosRegister>> createPosRegister(Map<String, dynamic> payload);
  Future<Result<PosRegister>> updatePosRegister(String id, Map<String, dynamic> payload);
  Future<Result<void>> deletePosRegister(String id);
  Future<Result<PosRegister>> openPosRegister(String id);
  Future<Result<PosRegister>> closePosRegister(String id);

  Future<Result<Cacheable<Paginated<PosShift>>>> listPosShifts(ListQuery query);
  Future<Result<PosShift>> getPosShift(String id);
  Future<Result<PosShift>> createPosShift(Map<String, dynamic> payload);
  Future<Result<PosShift>> closePosShift(String id);

  Future<Result<Cacheable<Paginated<PosTerminal>>>> listPosTerminals(ListQuery query);
  Future<Result<PosTerminal>> getPosTerminal(String id);
  Future<Result<PosTerminal>> createPosTerminal(Map<String, dynamic> payload);
  Future<Result<PosTerminal>> updatePosTerminal(String id, Map<String, dynamic> payload);
  Future<Result<void>> deletePosTerminal(String id);

  Future<Result<Cacheable<Paginated<PosDiscount>>>> listPosDiscounts(ListQuery query);
  Future<Result<PosDiscount>> getPosDiscount(String id);
  Future<Result<PosDiscount>> createPosDiscount(Map<String, dynamic> payload);
  Future<Result<PosDiscount>> updatePosDiscount(String id, Map<String, dynamic> payload);
  Future<Result<void>> deletePosDiscount(String id);

  Future<Result<Cacheable<Paginated<PosLoyaltyProgram>>>> listPosLoyaltyPrograms(ListQuery query);
  Future<Result<PosLoyaltyProgram>> getPosLoyaltyProgram(String id);
  Future<Result<PosLoyaltyProgram>> createPosLoyaltyProgram(Map<String, dynamic> payload);
  Future<Result<PosLoyaltyProgram>> updatePosLoyaltyProgram(String id, Map<String, dynamic> payload);
  Future<Result<void>> deletePosLoyaltyProgram(String id);

  Future<Result<Cacheable<Paginated<PosLoyaltyMember>>>> listPosLoyaltyMembers(ListQuery query);
  Future<Result<PosLoyaltyMember>> getPosLoyaltyMember(String id);
  Future<Result<PosLoyaltyMember>> createPosLoyaltyMember(Map<String, dynamic> payload);

  Future<Result<Cacheable<Paginated<PosLoyaltyTransaction>>>> listPosLoyaltyTransactions(ListQuery query);
  Future<Result<PosLoyaltyTransaction>> createPosLoyaltyTransaction(Map<String, dynamic> payload);

  Future<Result<Cacheable<Paginated<PosCoupon>>>> listPosCoupons(ListQuery query);
  Future<Result<PosCoupon>> getPosCoupon(String id);
  Future<Result<PosCoupon>> createPosCoupon(Map<String, dynamic> payload);
  Future<Result<PosCoupon>> updatePosCoupon(String id, Map<String, dynamic> payload);
  Future<Result<void>> deletePosCoupon(String id);

  Future<Result<Cacheable<Paginated<PosGiftCard>>>> listPosGiftCards(ListQuery query);
  Future<Result<PosGiftCard>> getPosGiftCard(String id);
  Future<Result<PosGiftCard>> createPosGiftCard(Map<String, dynamic> payload);
  Future<Result<void>> deletePosGiftCard(String id);

  Future<Result<Cacheable<Paginated<PosPriceList>>>> listPosPriceLists(ListQuery query);
  Future<Result<PosPriceList>> getPosPriceList(String id);
  Future<Result<PosPriceList>> createPosPriceList(Map<String, dynamic> payload);
  Future<Result<PosPriceList>> updatePosPriceList(String id, Map<String, dynamic> payload);
  Future<Result<void>> deletePosPriceList(String id);
}