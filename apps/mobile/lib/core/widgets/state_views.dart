import 'package:flutter/material.dart';

import '../../app/theme/design_tokens.dart';
import '../error/failures.dart';

/// Loading placeholder for a full screen region.
class LoadingView extends StatelessWidget {
  const LoadingView({this.label, super.key});

  final String? label;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          const CircularProgressIndicator(strokeWidth: 2),
          if (label != null) ...<Widget>[
            const SizedBox(height: Spacing.x4),
            Text(label!, style: Theme.of(context).textTheme.bodySmall),
          ],
        ],
      ),
    );
  }
}

/// Empty result state — never a dead end; always offers the next action.
class EmptyView extends StatelessWidget {
  const EmptyView({
    required this.title,
    this.message,
    this.actionLabel,
    this.onAction,
    this.icon = Icons.inbox_outlined,
    super.key,
  });

  final String title;
  final String? message;
  final String? actionLabel;
  final VoidCallback? onAction;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(Spacing.x8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            Icon(icon, size: Spacing.x12, color: t.textTertiary),
            const SizedBox(height: Spacing.x4),
            Text(title, style: Theme.of(context).textTheme.titleMedium),
            if (message != null) ...<Widget>[
              const SizedBox(height: Spacing.x2),
              Text(
                message!,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
            if (actionLabel != null && onAction != null) ...<Widget>[
              const SizedBox(height: Spacing.x6),
              FilledButton(onPressed: onAction, child: Text(actionLabel!)),
            ],
          ],
        ),
      ),
    );
  }
}

/// Renders a [Failure] with the right affordance for its kind.
///
/// A 403 offers no retry (retrying a permission denial is pointless); a network
/// failure does. The correlation id is surfaced so support can find the request
/// in the API logs.
class FailureView extends StatelessWidget {
  const FailureView({required this.failure, this.onRetry, super.key});

  final Failure failure;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;
    final bool canRetry = onRetry != null && failure is! ForbiddenFailure;

    final (IconData icon, Color tone) = switch (failure) {
      ForbiddenFailure() => (Icons.lock_outline, t.warning),
      UnauthorizedFailure() => (Icons.lock_outline, t.warning),
      NetworkFailure() => (Icons.wifi_off_outlined, t.textTertiary),
      NotFoundFailure() => (Icons.search_off_outlined, t.textTertiary),
      RateLimitFailure() => (Icons.timer_outlined, t.warning),
      _ => (Icons.error_outline, t.danger),
    };

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(Spacing.x8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            Icon(icon, size: Spacing.x12, color: tone),
            const SizedBox(height: Spacing.x4),
            Text(
              failure.message,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyLarge,
            ),
            if (failure.requestId != null) ...<Widget>[
              const SizedBox(height: Spacing.x2),
              SelectableText(
                'Reference: ${failure.requestId}',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
            if (canRetry) ...<Widget>[
              const SizedBox(height: Spacing.x6),
              OutlinedButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh),
                label: const Text('Try again'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// Thin banner shown when the screen is rendering cached data.
class StaleDataBanner extends StatelessWidget {
  const StaleDataBanner({required this.cachedAt, super.key});

  final DateTime cachedAt;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;
    return Container(
      width: double.infinity,
      color: t.warningLight,
      padding: const EdgeInsets.symmetric(
        horizontal: Spacing.x4,
        vertical: Spacing.x2,
      ),
      child: Row(
        children: <Widget>[
          Icon(Icons.cloud_off_outlined, size: TypeScale.base, color: t.warning),
          const SizedBox(width: Spacing.x2),
          Expanded(
            child: Text(
              'Offline — showing data from ${_relative(cachedAt)}',
              style: TextStyle(color: t.warning, fontSize: TypeScale.xs),
            ),
          ),
        ],
      ),
    );
  }

  static String _relative(DateTime at) {
    final Duration delta = DateTime.now().toUtc().difference(at.toUtc());
    if (delta.inMinutes < 1) return 'moments ago';
    if (delta.inHours < 1) return '${delta.inMinutes} min ago';
    if (delta.inDays < 1) return '${delta.inHours} h ago';
    return '${delta.inDays} d ago';
  }
}
