import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/communication.dart';
import '../providers/communication_providers.dart';

class MessageListPage extends ConsumerStatefulWidget {
  const MessageListPage({required this.channelId, super.key});
  final String channelId;

  static const String routeName = 'channel-messages';
  static const String routePath = '/communication/channels/:id/messages';

  @override
  ConsumerState<MessageListPage> createState() => _MessageListPageState();
}

class _MessageListPageState extends ConsumerState<MessageListPage> {
  final TextEditingController _messageInput = TextEditingController();

  @override
  void dispose() {
    _messageInput.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(messageListControllerProvider(widget.channelId));
    final controller = ref.read(messageListControllerProvider(widget.channelId).notifier);
    final t = context.tokens;

    return Scaffold(
      appBar: AppBar(title: const Text('Messages')),
      body: Column(
        children: [
          Expanded(
            child: _body(state, controller),
          ),
          Container(
            decoration: BoxDecoration(
              color: t.bgElevated,
              border: Border(top: BorderSide(color: t.border)),
            ),
            padding: const EdgeInsets.fromLTRB(Spacing.x4, Spacing.x2, Spacing.x4, Spacing.x4),
            child: SafeArea(
              top: false,
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _messageInput,
                      maxLines: 3,
                      minLines: 1,
                      textInputAction: TextInputAction.send,
                      decoration: const InputDecoration(
                        hintText: 'Type a message...',
                        isDense: true,
                      ),
                      onSubmitted: (String value) {
                        if (value.trim().isEmpty) return;
                        controller.sendMessage(<String, dynamic>{
                          'channelId': widget.channelId,
                          'content': value.trim(),
                          'messageType': 'TEXT',
                        });
                        _messageInput.clear();
                      },
                    ),
                  ),
                  const SizedBox(width: Spacing.x2),
                  IconButton(
                    icon: const Icon(Icons.send),
                    color: t.primary,
                    onPressed: () {
                      final String text = _messageInput.text.trim();
                      if (text.isEmpty) return;
                      controller.sendMessage(<String, dynamic>{
                        'channelId': widget.channelId,
                        'content': text,
                        'messageType': 'TEXT',
                      });
                      _messageInput.clear();
                    },
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _body(MessageListState state, MessageListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }

    return PaginatedListView<Message>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No messages yet',
      emptyMessage: 'Be the first to send a message in this channel.',
      itemBuilder: (_, Message msg, __) => _MessageTile(message: msg),
    );
  }
}

class _MessageTile extends StatelessWidget {
  const _MessageTile({required this.message});
  final Message message;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;

    return UiCard(
      padding: const EdgeInsets.all(Spacing.x3),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            CircleAvatar(
              radius: 14,
              child: Text(
                message.senderName.isNotEmpty
                    ? message.senderName[0].toUpperCase()
                    : '?',
                style: const TextStyle(fontSize: TypeScale.xs),
              ),
            ),
            const SizedBox(width: Spacing.x2),
            Expanded(
              child: Text(
                message.senderName,
                style: Theme.of(context).textTheme.labelLarge,
              ),
            ),
            Text(
              Formatters.relative(message.createdAt),
              style: TextStyle(
                color: t.textTertiary,
                fontSize: TypeScale.xs,
              ),
            ),
          ],),
          const SizedBox(height: Spacing.x2),
          Text(message.content),
          if (message.editedAt != null) ...[
            const SizedBox(height: Spacing.x1),
            Text(
              '(edited)',
              style: TextStyle(
                color: t.textTertiary,
                fontSize: TypeScale.xs,
                fontStyle: FontStyle.italic,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
