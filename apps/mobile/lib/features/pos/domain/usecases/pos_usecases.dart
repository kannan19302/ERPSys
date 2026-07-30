import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/pos.dart';
import '../repositories/pos_repository.dart';

class ListPosOrdersUseCase extends UseCase<Cacheable<Paginated<PosOrder>>, ListQuery> {
  const ListPosOrdersUseCase(this._repository);
  final PosRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<PosOrder>>>> call(ListQuery params) => _repository.listPosOrders(params);
}

class GetPosOrderUseCase extends UseCase<PosOrder, String> {
  const GetPosOrderUseCase(this._repository);
  final PosRepository _repository;
  @override
  Future<Result<PosOrder>> call(String id) => _repository.getPosOrder(id);
}

class SavePosOrderParams { const SavePosOrderParams({required this.payload, this.id}); final String? id; final Map<String, dynamic> payload; }

class SavePosOrderUseCase extends UseCase<PosOrder, SavePosOrderParams> {
  const SavePosOrderUseCase(this._repository);
  final PosRepository _repository;
  @override
  Future<Result<PosOrder>> call(SavePosOrderParams params) =>
      params.id == null ? _repository.createPosOrder(params.payload) : _repository.updatePosOrder(params.id!, params.payload);
}

class VoidPosOrderUseCase extends UseCase<PosOrder, String> {
  const VoidPosOrderUseCase(this._repository);
  final PosRepository _repository;
  @override Future<Result<PosOrder>> call(String id) => _repository.voidPosOrder(id);
}

class HoldPosOrderUseCase extends UseCase<PosOrder, String> {
  const HoldPosOrderUseCase(this._repository);
  final PosRepository _repository;
  @override Future<Result<PosOrder>> call(String id) => _repository.holdPosOrder(id);
}

class DeletePosOrderUseCase extends UseCase<void, String> {
  const DeletePosOrderUseCase(this._repository);
  final PosRepository _repository;
  @override Future<Result<void>> call(String id) => _repository.deletePosOrder(id);
}

class ListPosRegistersUseCase extends UseCase<Cacheable<Paginated<PosRegister>>, ListQuery> {
  const ListPosRegistersUseCase(this._repository);
  final PosRepository _repository;
  @override Future<Result<Cacheable<Paginated<PosRegister>>>> call(ListQuery p) => _repository.listPosRegisters(p);
}

class GetPosRegisterUseCase extends UseCase<PosRegister, String> {
  const GetPosRegisterUseCase(this._repository);
  final PosRepository _repository;
  @override Future<Result<PosRegister>> call(String id) => _repository.getPosRegister(id);
}

class SavePosRegisterParams { const SavePosRegisterParams({required this.payload, this.id}); final String? id; final Map<String, dynamic> payload; }

class SavePosRegisterUseCase extends UseCase<PosRegister, SavePosRegisterParams> {
  const SavePosRegisterUseCase(this._repository);
  final PosRepository _repository;
  @override Future<Result<PosRegister>> call(SavePosRegisterParams params) =>
      params.id == null ? _repository.createPosRegister(params.payload) : _repository.updatePosRegister(params.id!, params.payload);
}

class OpenPosRegisterUseCase extends UseCase<PosRegister, String> {
  const OpenPosRegisterUseCase(this._repository);
  final PosRepository _repository;
  @override Future<Result<PosRegister>> call(String id) => _repository.openPosRegister(id);
}

class ClosePosRegisterUseCase extends UseCase<PosRegister, String> {
  const ClosePosRegisterUseCase(this._repository);
  final PosRepository _repository;
  @override Future<Result<PosRegister>> call(String id) => _repository.closePosRegister(id);
}

class DeletePosRegisterUseCase extends UseCase<void, String> {
  const DeletePosRegisterUseCase(this._repository);
  final PosRepository _repository;
  @override Future<Result<void>> call(String id) => _repository.deletePosRegister(id);
}

class ListPosShiftsUseCase extends UseCase<Cacheable<Paginated<PosShift>>, ListQuery> {
  const ListPosShiftsUseCase(this._repository);
  final PosRepository _repository;
  @override Future<Result<Cacheable<Paginated<PosShift>>>> call(ListQuery p) => _repository.listPosShifts(p);
}

class GetPosShiftUseCase extends UseCase<PosShift, String> {
  const GetPosShiftUseCase(this._repository);
  final PosRepository _repository;
  @override Future<Result<PosShift>> call(String id) => _repository.getPosShift(id);
}

class ClosePosShiftUseCase extends UseCase<PosShift, String> {
  const ClosePosShiftUseCase(this._repository);
  final PosRepository _repository;
  @override Future<Result<PosShift>> call(String id) => _repository.closePosShift(id);
}

class ListPosTerminalsUseCase extends UseCase<Cacheable<Paginated<PosTerminal>>, ListQuery> {
  const ListPosTerminalsUseCase(this._repository);
  final PosRepository _repository;
  @override Future<Result<Cacheable<Paginated<PosTerminal>>>> call(ListQuery p) => _repository.listPosTerminals(p);
}

// ── Discounts ────────────────────────────────────────────────────────────────

class ListPosDiscountsUseCase extends UseCase<Cacheable<Paginated<PosDiscount>>, ListQuery> {
  const ListPosDiscountsUseCase(this._repository);
  final PosRepository _repository;
  @override Future<Result<Cacheable<Paginated<PosDiscount>>>> call(ListQuery p) => _repository.listPosDiscounts(p);
}

class GetPosDiscountUseCase extends UseCase<PosDiscount, String> {
  const GetPosDiscountUseCase(this._repository);
  final PosRepository _repository;
  @override Future<Result<PosDiscount>> call(String id) => _repository.getPosDiscount(id);
}

class SavePosDiscountParams { const SavePosDiscountParams({required this.payload, this.id}); final String? id; final Map<String, dynamic> payload; }

class SavePosDiscountUseCase extends UseCase<PosDiscount, SavePosDiscountParams> {
  const SavePosDiscountUseCase(this._repository);
  final PosRepository _repository;
  @override Future<Result<PosDiscount>> call(SavePosDiscountParams params) =>
      params.id == null ? _repository.createPosDiscount(params.payload) : _repository.updatePosDiscount(params.id!, params.payload);
}

class DeletePosDiscountUseCase extends UseCase<void, String> {
  const DeletePosDiscountUseCase(this._repository);
  final PosRepository _repository;
  @override Future<Result<void>> call(String id) => _repository.deletePosDiscount(id);
}

// ── Loyalty Programs ─────────────────────────────────────────────────────────

class ListPosLoyaltyProgramsUseCase extends UseCase<Cacheable<Paginated<PosLoyaltyProgram>>, ListQuery> {
  const ListPosLoyaltyProgramsUseCase(this._repository);
  final PosRepository _repository;
  @override Future<Result<Cacheable<Paginated<PosLoyaltyProgram>>>> call(ListQuery p) => _repository.listPosLoyaltyPrograms(p);
}

class GetPosLoyaltyProgramUseCase extends UseCase<PosLoyaltyProgram, String> {
  const GetPosLoyaltyProgramUseCase(this._repository);
  final PosRepository _repository;
  @override Future<Result<PosLoyaltyProgram>> call(String id) => _repository.getPosLoyaltyProgram(id);
}

class SavePosLoyaltyProgramParams { const SavePosLoyaltyProgramParams({required this.payload, this.id}); final String? id; final Map<String, dynamic> payload; }

class SavePosLoyaltyProgramUseCase extends UseCase<PosLoyaltyProgram, SavePosLoyaltyProgramParams> {
  const SavePosLoyaltyProgramUseCase(this._repository);
  final PosRepository _repository;
  @override Future<Result<PosLoyaltyProgram>> call(SavePosLoyaltyProgramParams params) =>
      params.id == null ? _repository.createPosLoyaltyProgram(params.payload) : _repository.updatePosLoyaltyProgram(params.id!, params.payload);
}

class DeletePosLoyaltyProgramUseCase extends UseCase<void, String> {
  const DeletePosLoyaltyProgramUseCase(this._repository);
  final PosRepository _repository;
  @override Future<Result<void>> call(String id) => _repository.deletePosLoyaltyProgram(id);
}

// ── Loyalty Members ──────────────────────────────────────────────────────────

class ListPosLoyaltyMembersUseCase extends UseCase<Cacheable<Paginated<PosLoyaltyMember>>, ListQuery> {
  const ListPosLoyaltyMembersUseCase(this._repository);
  final PosRepository _repository;
  @override Future<Result<Cacheable<Paginated<PosLoyaltyMember>>>> call(ListQuery p) => _repository.listPosLoyaltyMembers(p);
}

class GetPosLoyaltyMemberUseCase extends UseCase<PosLoyaltyMember, String> {
  const GetPosLoyaltyMemberUseCase(this._repository);
  final PosRepository _repository;
  @override Future<Result<PosLoyaltyMember>> call(String id) => _repository.getPosLoyaltyMember(id);
}

class SavePosLoyaltyMemberUseCase extends UseCase<PosLoyaltyMember, Map<String, dynamic>> {
  const SavePosLoyaltyMemberUseCase(this._repository);
  final PosRepository _repository;
  @override Future<Result<PosLoyaltyMember>> call(Map<String, dynamic> p) => _repository.createPosLoyaltyMember(p);
}

// ── Loyalty Transactions ─────────────────────────────────────────────────────

class ListPosLoyaltyTransactionsUseCase extends UseCase<Cacheable<Paginated<PosLoyaltyTransaction>>, ListQuery> {
  const ListPosLoyaltyTransactionsUseCase(this._repository);
  final PosRepository _repository;
  @override Future<Result<Cacheable<Paginated<PosLoyaltyTransaction>>>> call(ListQuery p) => _repository.listPosLoyaltyTransactions(p);
}

// ── Coupons ──────────────────────────────────────────────────────────────────

class ListPosCouponsUseCase extends UseCase<Cacheable<Paginated<PosCoupon>>, ListQuery> {
  const ListPosCouponsUseCase(this._repository);
  final PosRepository _repository;
  @override Future<Result<Cacheable<Paginated<PosCoupon>>>> call(ListQuery p) => _repository.listPosCoupons(p);
}

class GetPosCouponUseCase extends UseCase<PosCoupon, String> {
  const GetPosCouponUseCase(this._repository);
  final PosRepository _repository;
  @override Future<Result<PosCoupon>> call(String id) => _repository.getPosCoupon(id);
}

class SavePosCouponParams { const SavePosCouponParams({required this.payload, this.id}); final String? id; final Map<String, dynamic> payload; }

class SavePosCouponUseCase extends UseCase<PosCoupon, SavePosCouponParams> {
  const SavePosCouponUseCase(this._repository);
  final PosRepository _repository;
  @override Future<Result<PosCoupon>> call(SavePosCouponParams params) =>
      params.id == null ? _repository.createPosCoupon(params.payload) : _repository.updatePosCoupon(params.id!, params.payload);
}

class DeletePosCouponUseCase extends UseCase<void, String> {
  const DeletePosCouponUseCase(this._repository);
  final PosRepository _repository;
  @override Future<Result<void>> call(String id) => _repository.deletePosCoupon(id);
}

// ── Gift Cards ───────────────────────────────────────────────────────────────

class ListPosGiftCardsUseCase extends UseCase<Cacheable<Paginated<PosGiftCard>>, ListQuery> {
  const ListPosGiftCardsUseCase(this._repository);
  final PosRepository _repository;
  @override Future<Result<Cacheable<Paginated<PosGiftCard>>>> call(ListQuery p) => _repository.listPosGiftCards(p);
}

class GetPosGiftCardUseCase extends UseCase<PosGiftCard, String> {
  const GetPosGiftCardUseCase(this._repository);
  final PosRepository _repository;
  @override Future<Result<PosGiftCard>> call(String id) => _repository.getPosGiftCard(id);
}

class SavePosGiftCardUseCase extends UseCase<PosGiftCard, Map<String, dynamic>> {
  const SavePosGiftCardUseCase(this._repository);
  final PosRepository _repository;
  @override Future<Result<PosGiftCard>> call(Map<String, dynamic> p) => _repository.createPosGiftCard(p);
}

class DeletePosGiftCardUseCase extends UseCase<void, String> {
  const DeletePosGiftCardUseCase(this._repository);
  final PosRepository _repository;
  @override Future<Result<void>> call(String id) => _repository.deletePosGiftCard(id);
}

// ── Price Lists ──────────────────────────────────────────────────────────────

class ListPosPriceListsUseCase extends UseCase<Cacheable<Paginated<PosPriceList>>, ListQuery> {
  const ListPosPriceListsUseCase(this._repository);
  final PosRepository _repository;
  @override Future<Result<Cacheable<Paginated<PosPriceList>>>> call(ListQuery p) => _repository.listPosPriceLists(p);
}

class GetPosPriceListUseCase extends UseCase<PosPriceList, String> {
  const GetPosPriceListUseCase(this._repository);
  final PosRepository _repository;
  @override Future<Result<PosPriceList>> call(String id) => _repository.getPosPriceList(id);
}

class SavePosPriceListParams { const SavePosPriceListParams({required this.payload, this.id}); final String? id; final Map<String, dynamic> payload; }

class SavePosPriceListUseCase extends UseCase<PosPriceList, SavePosPriceListParams> {
  const SavePosPriceListUseCase(this._repository);
  final PosRepository _repository;
  @override Future<Result<PosPriceList>> call(SavePosPriceListParams params) =>
      params.id == null ? _repository.createPosPriceList(params.payload) : _repository.updatePosPriceList(params.id!, params.payload);
}

class DeletePosPriceListUseCase extends UseCase<void, String> {
  const DeletePosPriceListUseCase(this._repository);
  final PosRepository _repository;
  @override Future<Result<void>> call(String id) => _repository.deletePosPriceList(id);
}