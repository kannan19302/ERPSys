import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/rbac/permissions.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/permission_gate.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/crm.dart';
import '../providers/crm_providers.dart';

class LeadSourceListPage extends ConsumerStatefulWidget {
  const LeadSourceListPage({super.key});

  static const String routeName = 'lead-sources';
  static const String routePath = '/crm/sources';

  @override
  ConsumerState<LeadSourceListPage> createState() => _LeadSourceListPageState();
}

class _LeadSourceListPageState extends ConsumerState<LeadSourceListPage> {
  @override
  Widget build(BuildContext context) {
    final CrmListState<LeadSource> state = ref.watch(leadSourcesProvider);
    final LeadSourcesController controller =
        ref.read(leadSourcesProvider.notifier);
    final Palette t = context.tokens;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Lead Sources'),
      ),
      floatingActionButton: PermissionGate(
        permission: Permissions.crmSourceCreate,
        child: FloatingActionButton(
          onPressed: () => _showCreateDialog(context, controller),
          tooltip: 'New lead source',
          child: const Icon(Icons.add),
        ),
      ),
      body: Column(
        children: <Widget>[
          Padding(
            padding: const EdgeInsets.fromLTRB(
              Spacing.x4, Spacing.x3, Spacing.x4, Spacing.x2,
            ),
            child: Row(
              children: <Widget>[
                Text(
                  state.isLoading
                      ? 'Loading…'
                      : '${state.meta.total} source${state.meta.total == 1 ? '' : 's'}',
                  style: TextStyle(
                    color: t.textSecondary,
                    fontSize: TypeScale.xs,
                  ),
                ),
              ],
            ),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(
    CrmListState<LeadSource> state,
    LeadSourcesController controller,
  ) {
    if (state.isLoading && state.items.isEmpty) {
      return const LoadingView();
    }
    final Failure? failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }

    return PaginatedListView<LeadSource>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No lead sources',
      emptyMessage: 'Add a lead source to get started.',
      itemBuilder: (BuildContext context, LeadSource source, int index) =>
          Dismissible(
        key: ValueKey<String>(source.id),
        direction: DismissDirection.endToStart,
        background: Container(
          alignment: Alignment.centerRight,
          padding: const EdgeInsets.only(right: Spacing.x4),
          color: context.tokens.danger,
          child: const Icon(Icons.delete_outline, color: Colors.white),
        ),
        confirmDismiss: (_) async {
          final bool? confirmed = await showDialog<bool>(
            context: context,
            builder: (BuildContext dialogContext) => AlertDialog(
              title: const Text('Delete source?'),
              content: Text('Delete "${source.name}"?'),
              actions: <Widget>[
                TextButton(
                  onPressed: () => Navigator.of(dialogContext).pop(false),
                  child: const Text('Cancel'),
                ),
                FilledButton(
                  onPressed: () => Navigator.of(dialogContext).pop(true),
                  child: const Text('Delete'),
                ),
              ],
            ),
          );
          return confirmed ?? false;
        },
        onDismissed: (_) {
          controller.delete(source.id);
        },
        child: _SourceTile(source: source),
      ),
    );
  }

  Future<void> _showCreateDialog(
    BuildContext context,
    LeadSourcesController controller,
  ) {
    final TextEditingController nameController = TextEditingController();

    return showDialog<void>(
      context: context,
      builder: (BuildContext dialogContext) => AlertDialog(
        title: const Text('New Lead Source'),
        content: TextField(
          controller: nameController,
          autofocus: true,
          textCapitalization: TextCapitalization.words,
          decoration: const InputDecoration(
            hintText: 'Source name',
          ),
        ),
        actions: <Widget>[
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              final String name = nameController.text.trim();
              if (name.isEmpty) return;
              Navigator.of(dialogContext).pop();
              controller.create(name);
            },
            child: const Text('Create'),
          ),
        ],
      ),
    );
  }
}

class _SourceTile extends StatelessWidget {
  const _SourceTile({required this.source});

  final LeadSource source;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    return UiCard(
      padding: const EdgeInsets.all(Spacing.x3),
      child: Row(
        children: <Widget>[
          Container(
            height: Spacing.x10,
            width: Spacing.x10,
            decoration: BoxDecoration(
              color: t.bgSunken,
              borderRadius: Radii.control,
            ),
            alignment: Alignment.center,
            child: Icon(
              Icons.label_outline,
              size: TypeScale.xl,
              color: t.textSecondary,
            ),
          ),
          const SizedBox(width: Spacing.x3),
          Expanded(
            child: Text(
              source.name,
              style: Theme.of(context).textTheme.labelLarge,
            ),
          ),
        ],
      ),
    );
  }
}
