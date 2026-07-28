import '../../../../core/contracts/paginated.dart';
import '../../../../core/error/error_mapper.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/storage/response_cache.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/communication.dart';
import '../../domain/repositories/communication_repository.dart';
import '../datasources/communication_remote_data_source.dart';
import '../models/communication_models.dart';

class CommunicationRepositoryImpl implements CommunicationRepository {
  const CommunicationRepositoryImpl({
    required CommunicationRemoteDataSource remote,
    required ResponseCache cache,
    required String tenantId,
  })  : _remote = remote,
        _cache = cache,
        _tenantId = tenantId;

  static const String _channelNamespace = 'communication.channels';
  static const String _messageNamespace = 'communication.messages';
  static const String _directMessageNamespace = 'communication.direct-messages';
  static const String _meetingNamespace = 'communication.meetings';

  final CommunicationRemoteDataSource _remote;
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
  Future<Result<Cacheable<Paginated<Channel>>>> listChannels(ListQuery query) =>
      _paginated(_channelNamespace, query, () => _remote.listChannels(query),
        ChannelModel.fromJson);

  @override
  Future<Result<Channel>> getChannel(String id) =>
      _single(() => _remote.getChannel(id));

  @override
  Future<Result<Channel>> createChannel(Map<String, dynamic> payload) =>
      _write(() => _remote.createChannel(payload));

  @override
  Future<Result<Channel>> updateChannel(String id, Map<String, dynamic> payload) =>
      _write(() => _remote.updateChannel(id, payload));

  @override
  Future<Result<void>> deleteChannel(String id) =>
      _delete(() => _remote.deleteChannel(id));

  @override
  Future<Result<Channel>> joinChannel(String id) =>
      _single(() => _remote.joinChannel(id));

  @override
  Future<Result<Channel>> leaveChannel(String id) =>
      _single(() => _remote.leaveChannel(id));

  @override
  Future<Result<Cacheable<Paginated<Message>>>> listChannelMessages(
    String channelId, ListQuery query) =>
      _paginated('$_messageNamespace.$channelId', query,
        () => _remote.listChannelMessages(channelId, query),
        MessageModel.fromJson);

  @override
  Future<Result<Message>> getMessage(String id) =>
      _single(() => _remote.getMessage(id));

  @override
  Future<Result<Message>> sendMessage(Map<String, dynamic> payload) =>
      _write(() => _remote.sendMessage(payload));

  @override
  Future<Result<Message>> updateMessage(String id, Map<String, dynamic> payload) =>
      _write(() => _remote.updateMessage(id, payload));

  @override
  Future<Result<void>> deleteMessage(String id) =>
      _delete(() => _remote.deleteMessage(id));

  @override
  Future<Result<Message>> reactToMessage(String id, Map<String, dynamic> payload) =>
      _write(() => _remote.reactToMessage(id, payload));

  @override
  Future<Result<Message>> replyToMessage(String id, Map<String, dynamic> payload) =>
      _write(() => _remote.replyToMessage(id, payload));

  @override
  Future<Result<Message>> forwardMessage(String id, Map<String, dynamic> payload) =>
      _write(() => _remote.forwardMessage(id, payload));

  @override
  Future<Result<Cacheable<Paginated<DirectMessage>>>> listDirectMessages(ListQuery query) =>
      _paginated(_directMessageNamespace, query,
        () => _remote.listDirectMessages(query),
        DirectMessageModel.fromJson);

  @override
  Future<Result<DirectMessage>> sendDirectMessage(Map<String, dynamic> payload) =>
      _write(() => _remote.sendDirectMessage(payload));

  @override
  Future<Result<Cacheable<Paginated<Meeting>>>> listMeetings(ListQuery query) =>
      _paginated(_meetingNamespace, query, () => _remote.listMeetings(query),
        MeetingModel.fromJson);

  @override
  Future<Result<Meeting>> getMeeting(String id) =>
      _single(() => _remote.getMeeting(id));

  @override
  Future<Result<Meeting>> createMeeting(Map<String, dynamic> payload) =>
      _write(() => _remote.createMeeting(payload));

  @override
  Future<Result<Meeting>> joinMeeting(String id) =>
      _single(() => _remote.joinMeeting(id));

  @override
  Future<Result<Meeting>> leaveMeeting(String id) =>
      _single(() => _remote.leaveMeeting(id));

  @override
  Future<Result<Meeting>> endMeeting(String id) =>
      _single(() => _remote.endMeeting(id));
}
