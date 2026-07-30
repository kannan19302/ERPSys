import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/permission_gate.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../../../core/rbac/permissions.dart';
import '../../../../core/utils/formatters.dart';
import '../../domain/entities/projects.dart';
import '../providers/projects_providers.dart';

class ProjectPortfolioListPage extends ConsumerStatefulWidget {
  const ProjectPortfolioListPage({super.key});
  static const String routeName = 'project-portfolios';
  static const String routePath = '/projects/portfolios';
  @override
  ConsumerState<ProjectPortfolioListPage> createState() => _ProjectPortfolioListPageState();
}

class _ProjectPortfolioListPageState extends ConsumerState<ProjectPortfolioListPage> {
  final TextEditingController _search = TextEditingController();

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(projectPortfolioListControllerProvider);
    final controller = ref.read(projectPortfolioListControllerProvider.notifier);
    final t = context.tokens;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Portfolios'),
      ),
      floatingActionButton: PermissionGate(
        permission: Permissions.productCreate,
        child: FloatingActionButton.extended(
          onPressed: () => context.pushNamed('project-portfolio-new'),
          icon: const Icon(Icons.add),
          label: const Text('New Portfolio'),
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
                hintText: 'Search portfolio name',
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
                state.isLoading ? 'Loading...' : '${state.meta.total} portfolio${state.meta.total == 1 ? '' : 's'}',
                style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs),
              ),
            ]),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(ProjectPortfolioListState state, ProjectPortfolioListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }

    return PaginatedListView<ProjectPortfolio>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No portfolios',
      emptyMessage: state.query.search?.isNotEmpty ?? false
          ? 'Nothing matches "${state.query.search}".'
          : 'Portfolios created in UniERP will appear here.',
      itemBuilder: (_, ProjectPortfolio p, __) => _PortfolioTile(
        portfolio: p,
        onTap: () => context.pushNamed(
          'project-portfolio-detail',
          pathParameters: <String, String>{'id': p.id},
        ),
      ),
    );
  }
}

class _PortfolioTile extends StatelessWidget {
  const _PortfolioTile({required this.portfolio, required this.onTap});
  final ProjectPortfolio portfolio;
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
                Expanded(child: Text(portfolio.name,
                    style: Theme.of(context).textTheme.titleSmall)),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: Spacing.x2_5, vertical: Spacing.x1),
                  decoration: BoxDecoration(color: t.primaryLight, borderRadius: Radii.pill),
                  child: Text('${portfolio.projectCount} projects',
                      style: TextStyle(color: t.primary, fontSize: TypeScale.xs)),
                ),
              ]),
              if (portfolio.description != null && portfolio.description!.isNotEmpty) ...[
                const SizedBox(height: Spacing.x1),
                Text(portfolio.description!, style: TextStyle(color: t.textSecondary)),
              ],
              const SizedBox(height: Spacing.x1),
              Text('Budget: ${Formatters.currency(portfolio.totalBudget)}',
                  style: Theme.of(context).textTheme.labelLarge),
            ],
          ),
        ),
      ),
    );
  }
}