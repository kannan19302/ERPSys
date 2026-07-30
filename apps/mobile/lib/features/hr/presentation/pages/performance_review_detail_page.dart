import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/hr.dart';
import '../providers/hr_providers.dart';

class PerformanceReviewDetailPage extends ConsumerWidget {
  const PerformanceReviewDetailPage(
      {required this.performanceReviewId, super.key});

  static const String routeName = 'performance-review-detail';
  static const String routePath = '/hr/performance-reviews/:id';

  final String performanceReviewId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<PerformanceReview> asyncPr = ref.watch(
      performanceReviewDetailProvider(performanceReviewId),
    );
    final Palette t = context.tokens;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Performance Review'),
        actions: <Widget>[
          if (asyncPr.valueOrNull?.status ==
              PerformanceReviewStatus.draft)
            IconButton(
              icon: const Icon(Icons.send_outlined),
              tooltip: 'Submit',
              onPressed: () => _submit(context, ref),
            ),
        ],
      ),
      body: asyncPr.when(
        loading: () => const LoadingView(),
        error: (Object error, StackTrace _) => FailureView(
          failure: error is Failure
              ? error
              : const ServerFailure('Could not load review.'),
          onRetry: () => ref.invalidate(
            performanceReviewDetailProvider(performanceReviewId),
          ),
        ),
        data: (PerformanceReview pr) => _ReviewDetail(review: pr),
      ),
    );
  }

  Future<void> _submit(BuildContext context, WidgetRef ref) async {
    final bool? confirm = await showDialog<bool>(
      context: context,
      builder: (BuildContext ctx) => AlertDialog(
        title: const Text('Submit review?'),
        content: const Text('This will lock the review for finalization.'),
        actions: <Widget>[
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const Text('Submit'),
          ),
        ],
      ),
    );
    if (confirm != true || !context.mounted) return;

    final result = await ref
        .read(performanceReviewListControllerProvider.notifier)
        .submit(performanceReviewId);

    if (!context.mounted) return;
    result.fold(
      (Failure failure) => ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(failure.message))),
      (_) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Review submitted')),
        );
        ref.invalidate(performanceReviewDetailProvider(performanceReviewId));
      },
    );
  }
}

class _ReviewDetail extends StatelessWidget {
  const _ReviewDetail({required this.review});

  final PerformanceReview review;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    final (String label, UiTone tone) = switch (review.status) {
      PerformanceReviewStatus.draft => ('Draft', UiTone.neutral),
      PerformanceReviewStatus.submitted => ('Submitted', UiTone.warning),
      PerformanceReviewStatus.completed => ('Completed', UiTone.success),
      _ => (review.status, UiTone.neutral),
    };

    return ListView(
      padding: const EdgeInsets.all(Spacing.x4),
      children: <Widget>[
        UiCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Row(
                children: <Widget>[
                  Expanded(
                    child: Text(
                      review.employeeName,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ),
                  UiStatusBadge(label: label, tone: tone),
                ],
              ),
              if (review.reviewerName != null) ...<Widget>[
                const SizedBox(height: Spacing.x1),
                Text(
                  'Reviewed by: ${review.reviewerName}',
                  style: TextStyle(color: t.textSecondary),
                ),
              ],
              const SizedBox(height: Spacing.x2),
              _Row('Period', review.reviewPeriod),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        if (review.goals != null && review.goals!.isNotEmpty)
          UiCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                const UiSectionHeader(title: 'Goals'),
                Text(
                  review.goals!,
                  style: TextStyle(color: t.text, fontSize: TypeScale.sm),
                ),
              ],
            ),
          ),
        if (review.feedback != null && review.feedback!.isNotEmpty) ...<Widget>[
          const SizedBox(height: Spacing.x4),
          UiCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                const UiSectionHeader(title: 'Feedback'),
                Text(
                  review.feedback!,
                  style: TextStyle(color: t.text, fontSize: TypeScale.sm),
                ),
              ],
            ),
          ),
        ],
        if (review.rating != null) ...<Widget>[
          const SizedBox(height: Spacing.x4),
          UiCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                const UiSectionHeader(title: 'Rating'),
                Row(
                  children: List<Widget>.generate(5, (int i) {
                    return Icon(
                      i < review.rating!.round()
                          ? Icons.star
                          : Icons.star_border,
                      color: t.warning,
                      size: TypeScale.x2l,
                    );
                  }),
                ),
                const SizedBox(height: Spacing.x1),
                Text(
                  '${review.rating!.toStringAsFixed(1)} / 5',
                  style: TextStyle(color: t.textSecondary),
                ),
              ],
            ),
          ),
        ],
        if (review.createdAt != null || review.dueDate != null) ...<Widget>[
          const SizedBox(height: Spacing.x4),
          UiCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                const UiSectionHeader(title: 'Timeline'),
                if (review.dueDate != null)
                  _Row('Due Date', Formatters.date(review.dueDate!)),
                if (review.createdAt != null)
                  _Row('Created', Formatters.dateTime(review.createdAt!)),
                if (review.updatedAt != null)
                  _Row('Updated', Formatters.dateTime(review.updatedAt!)),
              ],
            ),
          ),
        ],
      ],
    );
  }
}

class _Row extends StatelessWidget {
  const _Row(this.label, this.value);

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: Spacing.x1_5),
      child: Row(
        children: <Widget>[
          Expanded(
            child: Text(label, style: TextStyle(color: t.textSecondary)),
          ),
          Text(value, style: Theme.of(context).textTheme.labelLarge),
        ],
      ),
    );
  }
}