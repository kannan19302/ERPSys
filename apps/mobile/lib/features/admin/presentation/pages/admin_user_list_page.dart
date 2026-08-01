import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../domain/entities/admin.dart';
import '../providers/admin_providers.dart';

class AdminUserListPage extends ConsumerStatefulWidget {
  const AdminUserListPage({super.key});
  static const String routeName = 'admin-users';
  static const String routePath = '/admin/users';
  @override
  ConsumerState<AdminUserListPage> createState() => _AdminUserListPageState();
}

class _AdminUserListPageState extends ConsumerState<AdminUserListPage> {
  final TextEditingController _search = TextEditingController();

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(adminUserListControllerProvider);
    final controller = ref.read(adminUserListControllerProvider.notifier);
    return Scaffold(
      appBar: AppBar(title: const Text('Users')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(Spacing.x4, Spacing.x3, Spacing.x4, Spacing.x2),
            child: TextField(
              controller: _search,
              onChanged: controller.search,
              textInputAction: TextInputAction.search,
              decoration: InputDecoration(
                hintText: 'Search users',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _search.text.isEmpty
                    ? null
                    : IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () { _search.clear(); controller.search(''); },
                      ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: Spacing.x4),
            child: Row(children: [
              Text(
                state.isLoading
                    ? 'Loading...'
                    : '${state.meta.total} user${state.meta.total == 1 ? '' : 's'}',
                style: TextStyle(color: context.tokens.textSecondary, fontSize: TypeScale.xs),
              ),
            ],),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(AdminUserListState state, AdminUserListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }
    return PaginatedListView<AdminUser>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No users found',
      emptyMessage: 'Users added to the system will appear here.',
      itemBuilder: (_, AdminUser u, __) => Card(
        margin: EdgeInsets.zero,
        child: Padding(
          padding: const EdgeInsets.all(Spacing.x3),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(u.fullName, style: Theme.of(context).textTheme.titleSmall),
              const SizedBox(height: Spacing.x1),
              Text(u.email, style: TextStyle(color: context.tokens.textSecondary, fontSize: TypeScale.xs)),
              if (u.roles.isNotEmpty) ...[
                const SizedBox(height: Spacing.x1),
                Text(u.roles.join(', '), style: TextStyle(color: context.tokens.textTertiary, fontSize: TypeScale.xs)),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
