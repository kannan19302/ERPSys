import 'package:equatable/equatable.dart';

/// `communication.notification` row (Prisma model `Notification`), as returned
/// by `GET /communication/notifications`.
class AppNotification extends Equatable {
  const AppNotification({
    required this.id,
    required this.title,
    required this.content,
    required this.type,
    required this.status,
    required this.createdAt,
    this.link,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) => AppNotification(
        id: json['id'] as String? ?? '',
        title: json['title'] as String? ?? '',
        content: json['content'] as String? ?? '',
        type: json['type'] as String? ?? 'SYSTEM',
        status: json['status'] as String? ?? 'UNREAD',
        link: json['link'] as String?,
        createdAt: DateTime.tryParse('${json['createdAt']}') ?? DateTime.now(),
      );

  final String id;
  final String title;
  final String content;
  final String type;

  /// UNREAD | READ | ARCHIVED
  final String status;
  final String? link;
  final DateTime createdAt;

  bool get isUnread => status == 'UNREAD';

  @override
  List<Object?> get props =>
      <Object?>[id, title, content, type, status, link, createdAt];
}
