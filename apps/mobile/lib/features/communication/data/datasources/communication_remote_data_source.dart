import '../../../../core/contracts/paginated.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_paths.dart';
import '../models/communication_models.dart';

abstract class CommunicationRemoteDataSource {
  Future<Paginated<ChannelModel>> listChannels(ListQuery query);
  Future<ChannelModel> getChannel(String id);
  Future<ChannelModel> createChannel(Map<String, dynamic> payload);
  Future<ChannelModel> updateChannel(String id, Map<String, dynamic> payload);
  Future<void> deleteChannel(String id);
  Future<ChannelModel> joinChannel(String id);
  Future<ChannelModel> leaveChannel(String id);

  Future<Paginated<MessageModel>> listChannelMessages(String channelId, ListQuery query);
  Future<MessageModel> getMessage(String id);
  Future<MessageModel> sendMessage(Map<String, dynamic> payload);
  Future<MessageModel> updateMessage(String id, Map<String, dynamic> payload);
  Future<void> deleteMessage(String id);
  Future<MessageModel> reactToMessage(String id, Map<String, dynamic> payload);
  Future<MessageModel> replyToMessage(String id, Map<String, dynamic> payload);
  Future<MessageModel> forwardMessage(String id, Map<String, dynamic> payload);

  Future<Paginated<DirectMessageModel>> listDirectMessages(ListQuery query);
  Future<DirectMessageModel> sendDirectMessage(Map<String, dynamic> payload);

  Future<Paginated<MeetingModel>> listMeetings(ListQuery query);
  Future<MeetingModel> getMeeting(String id);
  Future<MeetingModel> createMeeting(Map<String, dynamic> payload);
  Future<MeetingModel> joinMeeting(String id);
  Future<MeetingModel> leaveMeeting(String id);
  Future<MeetingModel> endMeeting(String id);
}

class CommunicationRemoteDataSourceImpl implements CommunicationRemoteDataSource {
  const CommunicationRemoteDataSourceImpl(this._client);

  final ApiClient _client;

  @override
  Future<Paginated<ChannelModel>> listChannels(ListQuery query) =>
      _client.getPaginated<ChannelModel>(
        ApiPaths.channels, query, ChannelModel.fromJson);

  @override
  Future<ChannelModel> getChannel(String id) async =>
      ChannelModel.fromJson(await _client.getObject(ApiPaths.channel(id)));

  @override
  Future<ChannelModel> createChannel(Map<String, dynamic> payload) async =>
      ChannelModel.fromJson(await _client.post(ApiPaths.channels, body: payload));

  @override
  Future<ChannelModel> updateChannel(String id, Map<String, dynamic> payload) async =>
      ChannelModel.fromJson(await _client.patch(ApiPaths.channel(id), body: payload));

  @override
  Future<void> deleteChannel(String id) => _client.delete(ApiPaths.channel(id));

  @override
  Future<ChannelModel> joinChannel(String id) async =>
      ChannelModel.fromJson(await _client.post(ApiPaths.channelJoin(id)));

  @override
  Future<ChannelModel> leaveChannel(String id) async =>
      ChannelModel.fromJson(await _client.post(ApiPaths.channelLeave(id)));

  @override
  Future<Paginated<MessageModel>> listChannelMessages(String channelId, ListQuery query) =>
      _client.getPaginated<MessageModel>(
        ApiPaths.channelMessages(channelId), query, MessageModel.fromJson);

  @override
  Future<MessageModel> getMessage(String id) async =>
      MessageModel.fromJson(await _client.getObject(ApiPaths.message(id)));

  @override
  Future<MessageModel> sendMessage(Map<String, dynamic> payload) async =>
      MessageModel.fromJson(
        await _client.post(ApiPaths.directMessages, body: payload));

  @override
  Future<MessageModel> updateMessage(String id, Map<String, dynamic> payload) async =>
      MessageModel.fromJson(await _client.patch(ApiPaths.message(id), body: payload));

  @override
  Future<void> deleteMessage(String id) => _client.delete(ApiPaths.message(id));

  @override
  Future<MessageModel> reactToMessage(String id, Map<String, dynamic> payload) async =>
      MessageModel.fromJson(
        await _client.post(ApiPaths.messageReact(id), body: payload));

  @override
  Future<MessageModel> replyToMessage(String id, Map<String, dynamic> payload) async =>
      MessageModel.fromJson(
        await _client.post(ApiPaths.messageReply(id), body: payload));

  @override
  Future<MessageModel> forwardMessage(String id, Map<String, dynamic> payload) async =>
      MessageModel.fromJson(
        await _client.post(ApiPaths.messageForward(id), body: payload));

  @override
  Future<Paginated<DirectMessageModel>> listDirectMessages(ListQuery query) =>
      _client.getPaginated<DirectMessageModel>(
        ApiPaths.directMessages, query, DirectMessageModel.fromJson);

  @override
  Future<DirectMessageModel> sendDirectMessage(Map<String, dynamic> payload) async =>
      DirectMessageModel.fromJson(
        await _client.post(ApiPaths.directMessages, body: payload));

  @override
  Future<Paginated<MeetingModel>> listMeetings(ListQuery query) =>
      _client.getPaginated<MeetingModel>(
        ApiPaths.meetings, query, MeetingModel.fromJson);

  @override
  Future<MeetingModel> getMeeting(String id) async =>
      MeetingModel.fromJson(await _client.getObject(ApiPaths.meeting(id)));

  @override
  Future<MeetingModel> createMeeting(Map<String, dynamic> payload) async =>
      MeetingModel.fromJson(await _client.post(ApiPaths.meetings, body: payload));

  @override
  Future<MeetingModel> joinMeeting(String id) async =>
      MeetingModel.fromJson(await _client.post(ApiPaths.meetingJoin(id)));

  @override
  Future<MeetingModel> leaveMeeting(String id) async =>
      MeetingModel.fromJson(await _client.post(ApiPaths.meetingLeave(id)));

  @override
  Future<MeetingModel> endMeeting(String id) async =>
      MeetingModel.fromJson(await _client.post(ApiPaths.meetingEnd(id)));
}
