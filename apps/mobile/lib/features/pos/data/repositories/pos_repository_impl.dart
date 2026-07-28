import '../../../../core/contracts/paginated.dart';
import '../../../../core/error/error_mapper.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/storage/response_cache.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/pos.dart';
import '../../domain/repositories/pos_repository.dart';
import '../datasources/pos_remote_data_source.dart';
import '../models/pos_models.dart';

class PosRepositoryImpl implements PosRepository {
  const PosRepositoryImpl({
    required PosRemoteDataSource remote,
    required ResponseCache cache,
    required String tenantId,
  })  : _remote = remote,
        _cache = cache,
        _tenantId = tenantId;

  static const String _orderNamespace = 'pos.orders';
  static const String _registerNamespace = 'pos.registers';
  static const String _shiftNamespace = 'pos.shifts';
  static const String _terminalNamespace = 'pos.terminals';
  static const String _discountNamespace = 'pos.discounts';
  static const String _loyaltyProgramNamespace = 'pos.loyalty-programs';
  static const String _loyaltyMemberNamespace = 'pos.loyalty-members';
  static const String _giftCardNamespace = 'pos.gift-cards';

  final PosRemoteDataSource _remote;
  final ResponseCache _cache;
  final String _tenantId;

  Future<Result<Cacheable<Paginated<T>>>> _paginated<T>(
    String namespace,
    ListQuery query,
    Future<Paginated<T>> Function() fetch,
    T Function(Map<String, dynamic>) fromJson,
  ) async {
    try {
      final Paginated<T> page = await fetch();
      final List<Map<String, dynamic>> jsonItems = page.data
          .map((dynamic e) => (e as dynamic).toJson() as Map<String, dynamic>)
          .toList(growable: false);
      await _cache.write(_tenantId, namespace, query.cacheKey, <String, Object?>{
        'data': jsonItems,
        'meta': page.meta.toJson(),
      });
      return Result<Cacheable<Paginated<T>>>.ok(
        Cacheable<Paginated<T>>(value: page),
      );
    } on NetworkException catch (error) {
      final cached = _cache.read<Map<String, dynamic>>(_tenantId, namespace, query.cacheKey);
      if (cached == null) {
        return Result<Cacheable<Paginated<T>>>.err(mapExceptionToFailure(error));
      }
      return Result<Cacheable<Paginated<T>>>.ok(
        Cacheable<Paginated<T>>(
          value: Paginated<T>.fromJson(cached.value, fromJson),
          cachedAt: cached.cachedAt,
        ),
      );
    } on Object catch (error) {
      return Result<Cacheable<Paginated<T>>>.err(mapExceptionToFailure(error));
    }
  }

  Future<Result<T>> _single<T>(Future<T> Function() fetch) async {
    try {
      return Result<T>.ok(await fetch());
    } on Object catch (error) {
      return Result<T>.err(mapExceptionToFailure(error));
    }
  }

  Future<Result<void>> _delete(Future<void> Function() action) async {
    try {
      await action();
      await _cache.clearTenant(_tenantId);
      return const Result<void>.ok(null);
    } on Object catch (error) {
      return Result<void>.err(mapExceptionToFailure(error));
    }
  }

  Future<Result<T>> _write<T>(Future<T> Function() action) async {
    try {
      final T result = await action();
      await _cache.clearTenant(_tenantId);
      return Result<T>.ok(result);
    } on Object catch (error) {
      return Result<T>.err(mapExceptionToFailure(error));
    }
  }

  @override
  Future<Result<Cacheable<Paginated<PosOrder>>>> listPosOrders(ListQuery q) =>
      _paginated(_orderNamespace, q, () => _remote.listPosOrders(q),
        PosOrderModel.fromJson);

  @override
  Future<Result<PosOrder>> getPosOrder(String id) =>
      _single(() => _remote.getPosOrder(id));

  @override
  Future<Result<PosOrder>> createPosOrder(Map<String, dynamic> p) =>
      _write(() => _remote.createPosOrder(p));

  @override
  Future<Result<PosOrder>> updatePosOrder(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updatePosOrder(id, p));

  @override
  Future<Result<void>> deletePosOrder(String id) =>
      _delete(() => _remote.deletePosOrder(id));

  @override
  Future<Result<PosOrder>> voidPosOrder(String id) =>
      _single(() => _remote.voidPosOrder(id));

  @override
  Future<Result<PosOrder>> holdPosOrder(String id) =>
      _single(() => _remote.holdPosOrder(id));

  @override
  Future<Result<Cacheable<Paginated<PosRegister>>>> listPosRegisters(ListQuery q) =>
      _paginated(_registerNamespace, q, () => _remote.listPosRegisters(q),
        PosRegisterModel.fromJson);

  @override
  Future<Result<PosRegister>> getPosRegister(String id) =>
      _single(() => _remote.getPosRegister(id));

  @override
  Future<Result<PosRegister>> createPosRegister(Map<String, dynamic> p) =>
      _write(() => _remote.createPosRegister(p));

  @override
  Future<Result<PosRegister>> updatePosRegister(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updatePosRegister(id, p));

  @override
  Future<Result<void>> deletePosRegister(String id) =>
      _delete(() => _remote.deletePosRegister(id));

  @override
  Future<Result<PosRegister>> openPosRegister(String id) =>
      _single(() => _remote.openPosRegister(id));

  @override
  Future<Result<PosRegister>> closePosRegister(String id) =>
      _single(() => _remote.closePosRegister(id));

  @override
  Future<Result<Cacheable<Paginated<PosShift>>>> listPosShifts(ListQuery q) =>
      _paginated(_shiftNamespace, q, () => _remote.listPosShifts(q),
        PosShiftModel.fromJson);

  @override
  Future<Result<PosShift>> getPosShift(String id) =>
      _single(() => _remote.getPosShift(id));

  @override
  Future<Result<PosShift>> createPosShift(Map<String, dynamic> p) =>
      _write(() => _remote.createPosShift(p));

  @override
  Future<Result<PosShift>> closePosShift(String id) =>
      _single(() => _remote.closePosShift(id));

  @override
  Future<Result<Cacheable<Paginated<PosTerminal>>>> listPosTerminals(ListQuery q) =>
      _paginated(_terminalNamespace, q, () => _remote.listPosTerminals(q),
        PosTerminalModel.fromJson);

  @override
  Future<Result<PosTerminal>> getPosTerminal(String id) =>
      _single(() => _remote.getPosTerminal(id));

  @override
  Future<Result<PosTerminal>> createPosTerminal(Map<String, dynamic> p) =>
      _write(() => _remote.createPosTerminal(p));

  @override
  Future<Result<PosTerminal>> updatePosTerminal(String id, Map<String, dynamic> p) =>
      _write(() => _remote.updatePosTerminal(id, p));

  @override
  Future<Result<void>> deletePosTerminal(String id) =>
      _delete(() => _remote.deletePosTerminal(id));

  @override
  Future<Result<Cacheable<Paginated<PosDiscount>>>> listPosDiscounts(ListQuery q) =>
      _paginated(_discountNamespace, q, () => _remote.listPosDiscounts(q),
        PosDiscountModel.fromJson);

  @override
  Future<Result<Cacheable<Paginated<PosLoyaltyProgram>>>> listPosLoyaltyPrograms(ListQuery q) =>
      _paginated(_loyaltyProgramNamespace, q, () => _remote.listPosLoyaltyPrograms(q),
        PosLoyaltyProgramModel.fromJson);

  @override
  Future<Result<Cacheable<Paginated<PosLoyaltyMember>>>> listPosLoyaltyMembers(ListQuery q) =>
      _paginated(_loyaltyMemberNamespace, q, () => _remote.listPosLoyaltyMembers(q),
        PosLoyaltyMemberModel.fromJson);

  @override
  Future<Result<Cacheable<Paginated<PosGiftCard>>>> listPosGiftCards(ListQuery q) =>
      _paginated(_giftCardNamespace, q, () => _remote.listPosGiftCards(q),
        PosGiftCardModel.fromJson);
}