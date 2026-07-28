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

  Future<Result<Cacheable<Paginated<PosLoyaltyProgram>>>> listPosLoyaltyPrograms(ListQuery query);

  Future<Result<Cacheable<Paginated<PosLoyaltyMember>>>> listPosLoyaltyMembers(ListQuery query);

  Future<Result<Cacheable<Paginated<PosGiftCard>>>> listPosGiftCards(ListQuery query);
}