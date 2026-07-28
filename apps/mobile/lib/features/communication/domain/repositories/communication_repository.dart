import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../entities/communication.dart';

class Cacheable<T> {
  const Cacheable({required this.value, this.cachedAt});
  final T value;
  final DateTime? cachedAt;
  bool get isFromCache => cachedAt != null;
}

abstract class CommunicationRepository {
  Future<Result<Cacheable<Paginated<Channel>>>> listChannels(ListQuery query);
  Future<Result<Channel>> getChannel(String id);
  Future<Result<Channel>> createChannel(Map<String, dynamic> payload);
  Future<Result<Channel>> updateChannel(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteChannel(String id);
  Future<Result<Channel>> joinChannel(String id);
  Future<Result<Channel>> leaveChannel(String id);

  Future<Result<Cacheable<Paginated<Message>>>> listChannelMessages(String channelId, ListQuery query);
  Future<Result<Message>> getMessage(String id);
  Future<Result<Message>> sendMessage(Map<String, dynamic> payload);
  Future<Result<Message>> updateMessage(String id, Map<String, dynamic> payload);
  Future<Result<void>> deleteMessage(String id);
  Future<Result<Message>> reactToMessage(String id, Map<String, dynamic> payload);
  Future<Result<Message>> replyToMessage(String id, Map<String, dynamic> payload);
  Future<Result<Message>> forwardMessage(String id, Map<String, dynamic> payload);

  Future<Result<Cacheable<Paginated<DirectMessage>>>> listDirectMessages(ListQuery query);
  Future<Result<DirectMessage>> sendDirectMessage(Map<String, dynamic> payload);

  Future<Result<Cacheable<Paginated<Meeting>>>> listMeetings(ListQuery query);
  Future<Result<Meeting>> getMeeting(String id);
  Future<Result<Meeting>> createMeeting(Map<String, dynamic> payload);
  Future<Result<Meeting>> joinMeeting(String id);
  Future<Result<Meeting>> leaveMeeting(String id);
  Future<Result<Meeting>> endMeeting(String id);
}
