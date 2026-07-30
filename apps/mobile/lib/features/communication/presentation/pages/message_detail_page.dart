import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/permission_gate.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/widgets/state_views.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/state_views.dart';
import '../../domain/entities/communication.dart';
import '../providers/communication_providers.dart';

class MessageDetailPage extends ConsumerWidget {
  const MessageDetailPage({required this.messageId, super.key});

  static const String routeName = 'message-detail';
  static const String routePath = '/communication/messages/:id';

  final String messageId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<Message> msgAsync =
        ref.watch(messageDetailProvider(messageId));

    return Scaffold(
      appBar: AppBar(title: const Text('Message')),
      body: msgAsync.when(
        loading: () => const LoadingView(),
        error: (Object error, StackTrace _) => FailureView(
          failure: error is Failure ? error : const ServerFailure('Could not load message.'),
          onRetry: () => ref.invalidate(messageDetailProvider(messageId)),
        ),
        data: (Message message) => _MessageDetail(message: message),
      ),
    );
  }
}

class _MessageDetail extends StatelessWidget {
  const _MessageDetail({required this.message});

  final Message message;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    return ListView(
      padding: const EdgeInsets.all(Spacing.x4),
      children: <Widget>[
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(Spacing.x4),
          decoration: BoxDecoration(
            color: t.bgElevated,
            borderRadius: Radii.card,
            border: Border.all(color: t.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Row(
                children: <Widget>[
                  CircleAvatar(
                    backgroundColor: t.primaryLight,
                    child: Text(
                      message.senderName.isNotEmpty
                          ? message.senderName[0].toUpperCase()
                          : '?',
                      style: TextStyle(color: t.primary, fontWeight: TypeScale.semibold),
                    ),
                  ),
                  const SizedBox(width: Spacing.x3),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: <Widget>[
                        Text(message.senderName, style: Theme.of(context).textTheme.titleMedium),
                        Text(
                          Formatters.dateTime(message.createdAt),
                          style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: Spacing.x2_5, vertical: Spacing.x1),
                    decoration: BoxDecoration(
                      color: t.primaryLight,
                      borderRadius: Radii.pill,
                    ),
                    child: Text(
                      message.messageType,
                      style: TextStyle(
                        color: t.primary,
                        fontSize: TypeScale.xs,
                        fontWeight: TypeScale.medium,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: Spacing.x4),
              const Divider(),
              const SizedBox(height: Spacing.x2),
              Text(message.content, style: Theme.of(context).textTheme.bodyLarge),
              if (message.editedAt != null) ...<Widget>[
                const SizedBox(height: Spacing.x2),
                Text(
                  'Edited ${Formatters.relative(message.editedAt!)}',
                  style: TextStyle(color: t.textTertiary, fontSize: TypeScale.xs),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }
}