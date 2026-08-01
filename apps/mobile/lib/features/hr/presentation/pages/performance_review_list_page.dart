import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/hr.dart';
import '../providers/hr_providers.dart';

class PerformanceReviewListPage extends ConsumerStatefulWidget {
  const PerformanceReviewListPage({super.key});

  static const String routeName = 'performance-reviews';
  static const String routePath = '/hr/performance-reviews';

  @override
  ConsumerState<PerformanceReviewListPage> createState() =>
      _PerformanceReviewListPageState();
}

class _PerformanceReviewListPageState
    extends ConsumerState<PerformanceReviewListPage> {
  @override
  Widget build(BuildContext context) {
    final PerformanceReviewListState state =
        ref.watch(performanceReviewListControllerProvider);
    final PerformanceReviewListController controller =
        ref.read(performanceReviewListControllerProvider.notifier);
    final Palette t = context.tokens;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Performance Reviews'),
        actions: <Widget>[
          PopupMenuButton<String>(
            icon: const Icon(Icons.filter_list),
            tooltip: 'Filter status',
            onSelected: (String v) {
              controller.applyFilters(
                v.isEmpty ? <String, String>{} : <String, String>{'status': v},
              );
            },
            itemBuilder: (_) => <String>[
              '',
              PerformanceReviewStatus.draft,
              PerformanceReviewStatus.submitted,
              PerformanceReviewStatus.completed,
            ].map(
              (String v) => PopupMenuItem<String>(
                value: v,
                child: Text(
                  v.isEmpty ? 'All' : _statusLabel(v),
                ),
              ),
            ).toList(),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.pushNamed('performance-review-new'),
        icon: const Icon(Icons.add),
        label: const Text('New review'),
      ),
      body: Column(
        children: <Widget>[
          if (state.cachedAt != null) StaleDataBanner(cachedAt: state.cachedAt!),
          Padding(
            padding: const EdgeInsets.fromLTRB(
              Spacing.x4, Spacing.x3, Spacing.x4, Spacing.x2,
            ),
            child: Text(
              state.isLoading
                  ? 'Loading…'
                  : '${state.meta.total} review${state.meta.total == 1 ? '' : 's'}',
              style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs),
            ),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(
    PerformanceReviewListState state,
    PerformanceReviewListController controller,
  ) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }

    return PaginatedListView<PerformanceReview>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No reviews',
      emptyMessage: 'Performance reviews will appear here.',
      itemBuilder: (BuildContext context, PerformanceReview pr, _) =>
          _ReviewTile(
        review: pr,
        onTap: () => context.pushNamed(
          'performance-review-detail',
          pathParameters: <String, String>{'id': pr.id},
        ),
      ),
    );
  }

  static String _statusLabel(String s) => switch (s) {
        PerformanceReviewStatus.draft => 'Draft',
        PerformanceReviewStatus.submitted => 'Submitted',
        PerformanceReviewStatus.completed => 'Completed',
        _ => s,
      };
}

class _ReviewTile extends StatelessWidget {
  const _ReviewTile({required this.review, this.onTap});

  final PerformanceReview review;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    final (String label, UiTone tone) = switch (review.status) {
      PerformanceReviewStatus.draft => ('Draft', UiTone.neutral),
      PerformanceReviewStatus.submitted => ('Submitted', UiTone.warning),
      PerformanceReviewStatus.completed => ('Completed', UiTone.success),
      _ => (review.status, UiTone.neutral),
    };

    return UiCard(
      onTap: onTap,
      padding: const EdgeInsets.all(Spacing.x3),
      child: Row(
        children: <Widget>[
          CircleAvatar(
            radius: Spacing.x4,
            backgroundColor: t.bgSunken,
            child: Icon(Icons.rate_review_outlined,
                color: t.textSecondary, size: TypeScale.lg,),
          ),
          const SizedBox(width: Spacing.x3),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  review.employeeName,
                  style: Theme.of(context).textTheme.labelLarge,
                ),
                const SizedBox(height: Spacing.x0_5),
                Text(
                  'Period: ${review.reviewPeriod}',
                  style: TextStyle(color: t.textTertiary, fontSize: TypeScale.xs),
                ),
                if (review.reviewerName != null)
                  Text(
                    'Reviewer: ${review.reviewerName}',
                    style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs),
                  ),
                if (review.rating != null)
                  _RatingStars(rating: review.rating!),
              ],
            ),
          ),
          const SizedBox(width: Spacing.x2),
          UiStatusBadge(label: label, tone: tone),
        ],
      ),
    );
  }
}

class _RatingStars extends StatelessWidget {
  const _RatingStars({required this.rating});

  final double rating;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List<Widget>.generate(5, (int i) {
        return Icon(
          i < rating.round() ? Icons.star : Icons.star_border,
          size: TypeScale.base,
          color: context.tokens.warning,
        );
      }),
    );
  }
}