import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/pos.dart';
import '../repositories/pos_repository.dart';

class ListPosOrdersUseCase extends UseCase<Cacheable<Paginated<PosOrder>>, ListQuery> {
  const ListPosOrdersUseCase(this._repository);
  final PosRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<PosOrder>>>> call(ListQuery params) =>
      _repository.listPosOrders(params);
}

class GetPosOrderUseCase extends UseCase<PosOrder, String> {
  const GetPosOrderUseCase(this._repository);
  final PosRepository _repository;
  @override
  Future<Result<PosOrder>> call(String id) => _repository.getPosOrder(id);
}

class SavePosOrderParams {
  const SavePosOrderParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SavePosOrderUseCase extends UseCase<PosOrder, SavePosOrderParams> {
  const SavePosOrderUseCase(this._repository);
  final PosRepository _repository;
  @override
  Future<Result<PosOrder>> call(SavePosOrderParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createPosOrder(params.payload)
        : _repository.updatePosOrder(id, params.payload);
  }
}

class VoidPosOrderUseCase extends UseCase<PosOrder, String> {
  const VoidPosOrderUseCase(this._repository);
  final PosRepository _repository;
  @override
  Future<Result<PosOrder>> call(String id) => _repository.voidPosOrder(id);
}

class HoldPosOrderUseCase extends UseCase<PosOrder, String> {
  const HoldPosOrderUseCase(this._repository);
  final PosRepository _repository;
  @override
  Future<Result<PosOrder>> call(String id) => _repository.holdPosOrder(id);
}

class DeletePosOrderUseCase extends UseCase<void, String> {
  const DeletePosOrderUseCase(this._repository);
  final PosRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deletePosOrder(id);
}

class ListPosRegistersUseCase extends UseCase<Cacheable<Paginated<PosRegister>>, ListQuery> {
  const ListPosRegistersUseCase(this._repository);
  final PosRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<PosRegister>>>> call(ListQuery params) =>
      _repository.listPosRegisters(params);
}

class GetPosRegisterUseCase extends UseCase<PosRegister, String> {
  const GetPosRegisterUseCase(this._repository);
  final PosRepository _repository;
  @override
  Future<Result<PosRegister>> call(String id) => _repository.getPosRegister(id);
}

class SavePosRegisterParams {
  const SavePosRegisterParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SavePosRegisterUseCase extends UseCase<PosRegister, SavePosRegisterParams> {
  const SavePosRegisterUseCase(this._repository);
  final PosRepository _repository;
  @override
  Future<Result<PosRegister>> call(SavePosRegisterParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createPosRegister(params.payload)
        : _repository.updatePosRegister(id, params.payload);
  }
}

class OpenPosRegisterUseCase extends UseCase<PosRegister, String> {
  const OpenPosRegisterUseCase(this._repository);
  final PosRepository _repository;
  @override
  Future<Result<PosRegister>> call(String id) => _repository.openPosRegister(id);
}

class ClosePosRegisterUseCase extends UseCase<PosRegister, String> {
  const ClosePosRegisterUseCase(this._repository);
  final PosRepository _repository;
  @override
  Future<Result<PosRegister>> call(String id) => _repository.closePosRegister(id);
}

class DeletePosRegisterUseCase extends UseCase<void, String> {
  const DeletePosRegisterUseCase(this._repository);
  final PosRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deletePosRegister(id);
}

class ListPosShiftsUseCase extends UseCase<Cacheable<Paginated<PosShift>>, ListQuery> {
  const ListPosShiftsUseCase(this._repository);
  final PosRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<PosShift>>>> call(ListQuery params) =>
      _repository.listPosShifts(params);
}

class GetPosShiftUseCase extends UseCase<PosShift, String> {
  const GetPosShiftUseCase(this._repository);
  final PosRepository _repository;
  @override
  Future<Result<PosShift>> call(String id) => _repository.getPosShift(id);
}

class ClosePosShiftUseCase extends UseCase<PosShift, String> {
  const ClosePosShiftUseCase(this._repository);
  final PosRepository _repository;
  @override
  Future<Result<PosShift>> call(String id) => _repository.closePosShift(id);
}

class ListPosTerminalsUseCase extends UseCase<Cacheable<Paginated<PosTerminal>>, ListQuery> {
  const ListPosTerminalsUseCase(this._repository);
  final PosRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<PosTerminal>>>> call(ListQuery params) =>
      _repository.listPosTerminals(params);
}

class ListPosDiscountsUseCase extends UseCase<Cacheable<Paginated<PosDiscount>>, ListQuery> {
  const ListPosDiscountsUseCase(this._repository);
  final PosRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<PosDiscount>>>> call(ListQuery params) =>
      _repository.listPosDiscounts(params);
}

class ListPosLoyaltyProgramsUseCase extends UseCase<Cacheable<Paginated<PosLoyaltyProgram>>, ListQuery> {
  const ListPosLoyaltyProgramsUseCase(this._repository);
  final PosRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<PosLoyaltyProgram>>>> call(ListQuery params) =>
      _repository.listPosLoyaltyPrograms(params);
}

class ListPosLoyaltyMembersUseCase extends UseCase<Cacheable<Paginated<PosLoyaltyMember>>, ListQuery> {
  const ListPosLoyaltyMembersUseCase(this._repository);
  final PosRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<PosLoyaltyMember>>>> call(ListQuery params) =>
      _repository.listPosLoyaltyMembers(params);
}

class ListPosGiftCardsUseCase extends UseCase<Cacheable<Paginated<PosGiftCard>>, ListQuery> {
  const ListPosGiftCardsUseCase(this._repository);
  final PosRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<PosGiftCard>>>> call(ListQuery params) =>
      _repository.listPosGiftCards(params);
}