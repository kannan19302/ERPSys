import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/projects.dart';
import '../providers/projects_providers.dart';

class ProjectRiskListPage extends ConsumerStatefulWidget {
  const ProjectRiskListPage({super.key});
  static const String routeName = 'project-risks';
  static const String routePath = '/projects/risks';
  @override
  ConsumerState<ProjectRiskListPage> createState() => _ProjectRiskListPageState();
}

class _ProjectRiskListPageState extends ConsumerState<ProjectRiskListPage> {
  final TextEditingController _search = TextEditingController();

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(projectRiskListControllerProvider);
    final controller = ref.read(projectRiskListControllerProvider.notifier);

    return Scaffold(
      appBar: AppBar(title: const Text('Project Risks')),
      body: Column(
        children: [
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(ProjectRiskListState state, ProjectRiskListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }

    return PaginatedListView<ProjectRisk>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: () {},
      emptyTitle: 'No risks',
      emptyMessage: 'Risk entries will appear here.',
      itemBuilder: (_, ProjectRisk r, __) => _RiskTile(risk: r),
    );
  }
}

class _RiskTile extends StatelessWidget {

  const _RiskTile({required this.risk});
  Color _severityColor(dynamic a, [dynamic b]) => Colors.red;
  final ProjectRisk risk;

  UiTone _severityTone(String probability, String impact) {
    final levels = <String, int>{'LOW': 1, 'MEDIUM': 2, 'HIGH': 3, 'CRITICAL': 4};
    final int p = levels[probability] ?? 1;
    final int i = levels[impact] ?? 1;
    final int combined = p * i;
    if (combined >= 9) return UiTone.danger;
    if (combined >= 4) return UiTone.warning;
    return UiTone.neutral;
  }

  UiTone _statusTone(String status) => switch (status) {
        'MITIGATED' || 'CLOSED' => UiTone.success,
        'IN_PROGRESS' => UiTone.info,
        'IDENTIFIED' => UiTone.warning,
        _ => UiTone.neutral,
      };

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    final UiTone sev = _severityTone(risk.probability, risk.impact);

    return Card(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(Spacing.x3),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: Spacing.x2, vertical: Spacing.x0_5),
                decoration: BoxDecoration(
                  color: _severityColor(sev, t).withAlpha(30),
                  borderRadius: Radii.pill,
                ),
                child: Text(
                  '${risk.probability}/${risk.impact}',
                  style: TextStyle(
                    color: _severityColor(sev, t),
                    fontSize: TypeScale.xs,
                    fontWeight: TypeScale.semibold,
                  ),
                ),
              ),
              const SizedBox(width: Spacing.x2),
              Expanded(child: Text(risk.title, style: Theme.of(context).textTheme.titleSmall)),
              UiStatusBadge(label: risk.status, tone: _statusTone(risk.status)),
            ],),
            if (risk.description != null && risk.description!.isNotEmpty) ...[
              const SizedBox(height: Spacing.x1),
              Text(risk.description!, style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs)),
            ],
          ],
        ),
      ),
    );
  }
}