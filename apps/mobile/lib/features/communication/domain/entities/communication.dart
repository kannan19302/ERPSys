import 'package:equatable/equatable.dart';

class Channel extends Equatable {
  const Channel({
    required this.id,
    required this.name,
    this.description,
    required this.type,
    required this.memberCount,
    required this.isArchived,
    required this.createdAt,
  });

  final String id;
  final String name;
  final String? description;
  final String type;
  final int memberCount;
  final bool isArchived;
  final DateTime createdAt;

  @override
  List<Object?> get props => <Object?>[
        id,
        name,
        description,
        type,
        memberCount,
        isArchived,
        createdAt,
      ];
}

class Message extends Equatable {
  const Message({
    required this.id,
    required this.channelId,
    required this.senderId,
    required this.senderName,
    required this.content,
    required this.messageType,
    required this.createdAt,
    required this.updatedAt,
    this.editedAt,
  });

  final String id;
  final String channelId;
  final String senderId;
  final String senderName;
  final String content;
  final String messageType;
  final DateTime createdAt;
  final DateTime updatedAt;
  final DateTime? editedAt;

  @override
  List<Object?> get props => <Object?>[
        id,
        channelId,
        senderId,
        senderName,
        content,
        messageType,
        createdAt,
        updatedAt,
        editedAt,
      ];
}

class MessageReaction extends Equatable {
  const MessageReaction({
    required this.id,
    required this.messageId,
    required this.userId,
    required this.emoji,
  });

  final String id;
  final String messageId;
  final String userId;
  final String emoji;

  @override
  List<Object?> get props => <Object?>[
        id,
        messageId,
        userId,
        emoji,
      ];
}

class DirectMessage extends Equatable {
  const DirectMessage({
    required this.id,
    required this.senderId,
    required this.senderName,
    required this.receiverId,
    required this.receiverName,
    required this.content,
    required this.createdAt,
  });

  final String id;
  final String senderId;
  final String senderName;
  final String receiverId;
  final String receiverName;
  final String content;
  final DateTime createdAt;

  @override
  List<Object?> get props => <Object?>[
        id,
        senderId,
        senderName,
        receiverId,
        receiverName,
        content,
        createdAt,
      ];
}

class Meeting extends Equatable {
  const Meeting({
    required this.id,
    required this.title,
    this.code,
    this.hostName,
    required this.status,
    required this.startTime,
    this.endTime,
    required this.participantCount,
    required this.createdAt,
  });

  final String id;
  final String title;
  final String? code;
  final String? hostName;
  final String status;
  final DateTime startTime;
  final DateTime? endTime;
  final int participantCount;
  final DateTime createdAt;

  @override
  List<Object?> get props => <Object?>[
        id,
        title,
        code,
        hostName,
        status,
        startTime,
        endTime,
        participantCount,
        createdAt,
      ];
}
