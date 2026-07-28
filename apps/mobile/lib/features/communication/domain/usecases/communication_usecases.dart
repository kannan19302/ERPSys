import '../../../../core/contracts/paginated.dart';
import '../../../../core/usecase/result.dart';
import '../../../../core/usecase/usecase.dart';
import '../entities/communication.dart';
import '../repositories/communication_repository.dart';

class ListChannelsUseCase extends UseCase<Cacheable<Paginated<Channel>>, ListQuery> {
  const ListChannelsUseCase(this._repository);
  final CommunicationRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<Channel>>>> call(ListQuery params) =>
      _repository.listChannels(params);
}

class GetChannelUseCase extends UseCase<Channel, String> {
  const GetChannelUseCase(this._repository);
  final CommunicationRepository _repository;
  @override
  Future<Result<Channel>> call(String id) => _repository.getChannel(id);
}

class SaveChannelParams {
  const SaveChannelParams({required this.payload, this.id});
  final String? id;
  final Map<String, dynamic> payload;
}

class SaveChannelUseCase extends UseCase<Channel, SaveChannelParams> {
  const SaveChannelUseCase(this._repository);
  final CommunicationRepository _repository;
  @override
  Future<Result<Channel>> call(SaveChannelParams params) {
    final String? id = params.id;
    return id == null
        ? _repository.createChannel(params.payload)
        : _repository.updateChannel(id, params.payload);
  }
}

class DeleteChannelUseCase extends UseCase<void, String> {
  const DeleteChannelUseCase(this._repository);
  final CommunicationRepository _repository;
  @override
  Future<Result<void>> call(String id) => _repository.deleteChannel(id);
}

class JoinChannelUseCase extends UseCase<Channel, String> {
  const JoinChannelUseCase(this._repository);
  final CommunicationRepository _repository;
  @override
  Future<Result<Channel>> call(String id) => _repository.joinChannel(id);
}

class LeaveChannelUseCase extends UseCase<Channel, String> {
  const LeaveChannelUseCase(this._repository);
  final CommunicationRepository _repository;
  @override
  Future<Result<Channel>> call(String id) => _repository.leaveChannel(id);
}

class ListChannelMessagesUseCase extends UseCase<Cacheable<Paginated<Message>>, ListChannelMessagesParams> {
  const ListChannelMessagesUseCase(this._repository);
  final CommunicationRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<Message>>>> call(ListChannelMessagesParams params) =>
      _repository.listChannelMessages(params.channelId, params.query);
}

class ListChannelMessagesParams {
  const ListChannelMessagesParams({required this.channelId, required this.query});
  final String channelId;
  final ListQuery query;
}

class GetMessageUseCase extends UseCase<Message, String> {
  const GetMessageUseCase(this._repository);
  final CommunicationRepository _repository;
  @override
  Future<Result<Message>> call(String id) => _repository.getMessage(id);
}

class SendMessageUseCase extends UseCase<Message, Map<String, dynamic>> {
  const SendMessageUseCase(this._repository);
  final CommunicationRepository _repository;
  @override
  Future<Result<Message>> call(Map<String, dynamic> payload) =>
      _repository.sendMessage(payload);
}

class ReactToMessageUseCase extends UseCase<Message, ReactToMessageParams> {
  const ReactToMessageUseCase(this._repository);
  final CommunicationRepository _repository;
  @override
  Future<Result<Message>> call(ReactToMessageParams params) =>
      _repository.reactToMessage(params.messageId, params.payload);
}

class ReactToMessageParams {
  const ReactToMessageParams({required this.messageId, required this.payload});
  final String messageId;
  final Map<String, dynamic> payload;
}

class ListDirectMessagesUseCase extends UseCase<Cacheable<Paginated<DirectMessage>>, ListQuery> {
  const ListDirectMessagesUseCase(this._repository);
  final CommunicationRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<DirectMessage>>>> call(ListQuery params) =>
      _repository.listDirectMessages(params);
}

class SendDirectMessageUseCase extends UseCase<DirectMessage, Map<String, dynamic>> {
  const SendDirectMessageUseCase(this._repository);
  final CommunicationRepository _repository;
  @override
  Future<Result<DirectMessage>> call(Map<String, dynamic> payload) =>
      _repository.sendDirectMessage(payload);
}

class ListMeetingsUseCase extends UseCase<Cacheable<Paginated<Meeting>>, ListQuery> {
  const ListMeetingsUseCase(this._repository);
  final CommunicationRepository _repository;
  @override
  Future<Result<Cacheable<Paginated<Meeting>>>> call(ListQuery params) =>
      _repository.listMeetings(params);
}

class GetMeetingUseCase extends UseCase<Meeting, String> {
  const GetMeetingUseCase(this._repository);
  final CommunicationRepository _repository;
  @override
  Future<Result<Meeting>> call(String id) => _repository.getMeeting(id);
}

class CreateMeetingUseCase extends UseCase<Meeting, Map<String, dynamic>> {
  const CreateMeetingUseCase(this._repository);
  final CommunicationRepository _repository;
  @override
  Future<Result<Meeting>> call(Map<String, dynamic> payload) =>
      _repository.createMeeting(payload);
}

class JoinMeetingUseCase extends UseCase<Meeting, String> {
  const JoinMeetingUseCase(this._repository);
  final CommunicationRepository _repository;
  @override
  Future<Result<Meeting>> call(String id) => _repository.joinMeeting(id);
}

class EndMeetingUseCase extends UseCase<Meeting, String> {
  const EndMeetingUseCase(this._repository);
  final CommunicationRepository _repository;
  @override
  Future<Result<Meeting>> call(String id) => _repository.endMeeting(id);
}
