import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/rbac/permissions.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/permission_gate.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../../../core/utils/formatters.dart';
import '../../domain/entities/projects.dart';
import '../providers/projects_providers.dart';

class ProjectListPage extends ConsumerStatefulWidget {
  const ProjectListPage({super.key});
  static const String routeName = 'projects';
  static const String routePath = '/projects';
  @override
  ConsumerState<ProjectListPage> createState() => _ProjectListPageState();
}

class _ProjectListPageState extends ConsumerState<ProjectListPage> {
  final TextEditingController _search = TextEditingController();

  static const Map<String, String> _sortOptions = <String, String>{
    '-createdAt': 'Newest first',
    'createdAt': 'Oldest first',
    'name': 'Name A-Z',
    '-name': 'Name Z-A',
    '-progress': 'Most progress',
    'progress': 'Least progress',
  };

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(projectListControllerProvider);
    final controller = ref.read(projectListControllerProvider.notifier);
    final t = context.tokens;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Projects'),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.swap_vert),
            tooltip: 'Sort',
            initialValue: state.query.sort,
            onSelected: controller.applySort,
            itemBuilder: (_) => _sortOptions.entries
                .map((e) => PopupMenuItem<String>(
                    value: e.key, child: Text(e.value)))
                .toList(),
          ),
        ],
      ),
      floatingActionButton: PermissionGate(
        permission: Permissions.productCreate,
        child: FloatingActionButton.extended(
          onPressed: () {},
          icon: const Icon(Icons.add),
          label: const Text('New Project'),
        ),
      ),
      body: Column(
        children: [
          if (state.cachedAt != null) StaleDataBanner(cachedAt: state.cachedAt!),
          Padding(
            padding: const EdgeInsets.fromLTRB(Spacing.x4, Spacing.x3, Spacing.x4, Spacing.x2),
            child: TextField(
              controller: _search,
              onChanged: controller.search,
              textInputAction: TextInputAction.search,
              decoration: InputDecoration(
                hintText: 'Search project name',
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
                    : '${state.meta.total} project${state.meta.total == 1 ? '' : 's'}',
                style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs),
              ),
            ]),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(ProjectListState state, ProjectListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }

    return PaginatedListView<Project>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No projects',
      emptyMessage: state.query.search?.isNotEmpty ?? false
          ? 'Nothing matches "${state.query.search}".'
          : 'Projects created in UniERP will appear here.',
      itemBuilder: (_, Project project, __) => _ProjectTile(
        project: project,
        onTap: () => context.pushNamed(
          'project-detail',
          pathParameters: <String, String>{'id': project.id},
        ),
      ),
    );
  }
}

class _ProjectTile extends StatelessWidget {
  const _ProjectTile({required this.project, required this.onTap});
  final Project project;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;

    return Card(
      margin: EdgeInsets.zero,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(Spacing.x3),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Expanded(
                  child: Text(project.name,
                      style: Theme.of(context).textTheme.titleSmall),
                ),
                UiStatusBadge(
                  label: project.status,
                  tone: _statusTone(project.status),
                ),
              ]),
              const SizedBox(height: Spacing.x1),
              if (project.customerName != null)
                Text(project.customerName!,
                    style: TextStyle(color: t.textSecondary)),
              const SizedBox(height: Spacing.x1),
              Row(children: [
                if (project.managerName != null) ...[
                  Icon(Icons.person_outline, size: TypeScale.base, color: t.textTertiary),
                  const SizedBox(width: Spacing.x1),
                  Text(project.managerName!,
                      style: TextStyle(color: t.textTertiary, fontSize: TypeScale.xs)),
                  const Spacer(),
                ],
                Text(Formatters.currency(project.budget),
                    style: Theme.of(context).textTheme.labelLarge),
              ]),
              const SizedBox(height: Spacing.x1),
              ClipRRect(
                borderRadius: Radii.pill,
                child: LinearProgressIndicator(
                  value: project.progress / 100,
                  minHeight: 4,
                  backgroundColor: t.bgSunken,
                ),
              ),
              const SizedBox(height: Spacing.x0_5),
              Text('${project.progress.toStringAsFixed(0)}% complete',
                  style: TextStyle(color: t.textTertiary, fontSize: TypeScale.xs)),
            ],
          ),
        ),
      ),
    );
  }

  UiTone _statusTone(String status) => switch (status) {
        'PLANNING' => UiTone.neutral,
        'IN_PROGRESS' => UiTone.info,
        'ON_HOLD' => UiTone.warning,
        'COMPLETED' => UiTone.success,
        'CANCELLED' => UiTone.danger,
        _ => UiTone.neutral,
      };
}
