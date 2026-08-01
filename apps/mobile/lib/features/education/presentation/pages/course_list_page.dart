import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';

import '../../domain/entities/education.dart';
import '../providers/education_providers.dart';

class CourseListPage extends ConsumerStatefulWidget {
  const CourseListPage({super.key});
  static const String routeName = 'courses';
  static const String routePath = '/education/courses';
  @override
  ConsumerState<CourseListPage> createState() => _CourseListPageState();
}

class _CourseListPageState extends ConsumerState<CourseListPage> {
  final TextEditingController _search = TextEditingController();

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(courseListControllerProvider);
    final controller = ref.read(courseListControllerProvider.notifier);
    final t = context.tokens;

    return Scaffold(
      appBar: AppBar(title: const Text('Courses')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(Spacing.x4, Spacing.x3, Spacing.x4, Spacing.x2),
            child: TextField(
              controller: _search,
              onChanged: controller.search,
              textInputAction: TextInputAction.search,
              decoration: InputDecoration(
                hintText: 'Search course name or code',
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
                    : '${state.meta.total} course${state.meta.total == 1 ? '' : 's'}',
                style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs),
              ),
            ],),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(CourseListState state, CourseListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }
    return PaginatedListView<Course>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No courses found',
      emptyMessage: 'Courses created in UniERP will appear here.',
      itemBuilder: (_, Course c, __) => Card(
        margin: EdgeInsets.zero,
        child: Padding(
          padding: const EdgeInsets.all(Spacing.x3),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(c.name,
                          style: Theme.of(context).textTheme.titleSmall,),
                      const SizedBox(height: 2),
                      Text(c.code,
                          style: TextStyle(color: context.tokens.textSecondary, fontSize: TypeScale.xs),),
                    ],
                  ),
                ),
                UiStatusBadge(
                  label: c.status,
                  tone: c.status == 'ACTIVE' ? UiTone.success : UiTone.neutral,
                ),
              ],),
              if (c.instructor != null) ...[
                const SizedBox(height: Spacing.x1),
                Text('Instructor: ${c.instructor}',
                    style: const TextStyle(fontSize: TypeScale.xs),),
              ],
              if (c.credits > 0) ...[
                const SizedBox(height: Spacing.x1),
                Text('${c.credits} credits | ${c.durationHours}h',
                    style: TextStyle(color: context.tokens.textSecondary, fontSize: TypeScale.xs),),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
