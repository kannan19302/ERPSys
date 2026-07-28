import '../../../../core/error/exceptions.dart';
import '../../domain/entities/communication.dart';

class ChannelModel extends Channel {
  const ChannelModel({
    required super.id,
    required super.name,
    super.description,
    required super.type,
    required super.memberCount,
    required super.isArchived,
    required super.createdAt,
  });

  factory ChannelModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('Channel is missing its id');
    }
    return ChannelModel(
      id: id,
      name: json['name'] as String? ?? '',
      description: json['description'] as String?,
      type: json['type'] as String? ?? 'PUBLIC',
      memberCount: asInt(json['memberCount']),
      isArchived: json['isArchived'] as bool? ?? false,
      createdAt: DateTime.tryParse('${json['createdAt']}') ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'name': name,
        'description': description,
        'type': type,
        'memberCount': memberCount,
        'isArchived': isArchived,
        'createdAt': createdAt.toIso8601String(),
      };
}

class MessageModel extends Message {
  const MessageModel({
    required super.id,
    required super.channelId,
    required super.senderId,
    required super.senderName,
    required super.content,
    required super.messageType,
    required super.createdAt,
    required super.updatedAt,
    super.editedAt,
  });

  factory MessageModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('Message is missing its id');
    }
    return MessageModel(
      id: id,
      channelId: json['channelId'] as String? ?? '',
      senderId: json['senderId'] as String? ?? '',
      senderName: json['senderName'] as String? ?? '',
      content: json['content'] as String? ?? '',
      messageType: json['messageType'] as String? ?? 'TEXT',
      createdAt: DateTime.tryParse('${json['createdAt']}') ?? DateTime.now(),
      updatedAt: DateTime.tryParse('${json['updatedAt']}') ?? DateTime.now(),
      editedAt: DateTime.tryParse('${json['editedAt']}'),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'channelId': channelId,
        'senderId': senderId,
        'senderName': senderName,
        'content': content,
        'messageType': messageType,
        'createdAt': createdAt.toIso8601String(),
        'updatedAt': updatedAt.toIso8601String(),
        'editedAt': editedAt?.toIso8601String(),
      };
}

class MessageReactionModel extends MessageReaction {
  const MessageReactionModel({
    required super.id,
    required super.messageId,
    required super.userId,
    required super.emoji,
  });

  factory MessageReactionModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('MessageReaction is missing its id');
    }
    return MessageReactionModel(
      id: id,
      messageId: json['messageId'] as String? ?? '',
      userId: json['userId'] as String? ?? '',
      emoji: json['emoji'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'messageId': messageId,
        'userId': userId,
        'emoji': emoji,
      };
}

class DirectMessageModel extends DirectMessage {
  const DirectMessageModel({
    required super.id,
    required super.senderId,
    required super.senderName,
    required super.receiverId,
    required super.receiverName,
    required super.content,
    required super.createdAt,
  });

  factory DirectMessageModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('DirectMessage is missing its id');
    }
    return DirectMessageModel(
      id: id,
      senderId: json['senderId'] as String? ?? '',
      senderName: json['senderName'] as String? ?? '',
      receiverId: json['receiverId'] as String? ?? '',
      receiverName: json['receiverName'] as String? ?? '',
      content: json['content'] as String? ?? '',
      createdAt: DateTime.tryParse('${json['createdAt']}') ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'senderId': senderId,
        'senderName': senderName,
        'receiverId': receiverId,
        'receiverName': receiverName,
        'content': content,
        'createdAt': createdAt.toIso8601String(),
      };
}

class MeetingModel extends Meeting {
  const MeetingModel({
    required super.id,
    required super.title,
    super.code,
    super.hostName,
    required super.status,
    required super.startTime,
    super.endTime,
    required super.participantCount,
    required super.createdAt,
  });

  factory MeetingModel.fromJson(Map<String, dynamic> json) {
    final Object? id = json['id'];
    if (id is! String) {
      throw const ParseException('Meeting is missing its id');
    }
    return MeetingModel(
      id: id,
      title: json['title'] as String? ?? '',
      code: json['code'] as String?,
      hostName: json['hostName'] as String?,
      status: json['status'] as String? ?? 'SCHEDULED',
      startTime: DateTime.tryParse('${json['startTime']}') ?? DateTime.now(),
      endTime: DateTime.tryParse('${json['endTime']}'),
      participantCount: asInt(json['participantCount']),
      createdAt: DateTime.tryParse('${json['createdAt']}') ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'title': title,
        'code': code,
        'hostName': hostName,
        'status': status,
        'startTime': startTime.toIso8601String(),
        'endTime': endTime?.toIso8601String(),
        'participantCount': participantCount,
        'createdAt': createdAt.toIso8601String(),
      };
}

double asDouble(Object? value) => switch (value) {
      final num v => v.toDouble(),
      final String v => double.tryParse(v) ?? 0,
      _ => 0,
    };

int asInt(Object? value) => switch (value) {
      final int v => v,
      final num v => v.toInt(),
      final String v => int.tryParse(v) ?? 0,
      _ => 0,
    };
