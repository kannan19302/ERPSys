import 'package:flutter/material.dart';

import '../../app/theme/design_tokens.dart';
import '../contracts/paginated.dart';
import '../error/failures.dart';
import 'state_views.dart';

/// Server-paginated list with pull-to-refresh and infinite scroll.
///
/// AGENTS.md Rule 25 requires server-side pagination for any list that can
/// exceed 20 records; this widget is the mobile enforcement point — it only
/// ever asks the backend for the next `page`, never slices a full payload
/// client-side.
class PaginatedListView<T> extends StatefulWidget {
  const PaginatedListView({
    required this.items,
    required this.meta,
    required this.itemBuilder,
    required this.onRefresh,
    required this.onLoadMore,
    this.isLoadingMore = false,
    this.loadMoreFailure,
    this.emptyTitle = 'Nothing here yet',
    this.emptyMessage,
    this.padding = const EdgeInsets.all(Spacing.x4),
    this.header,
    super.key,
  });

  final List<T> items;
  final PaginationMeta meta;
  final Widget Function(BuildContext, T, int) itemBuilder;
  final Future<void> Function() onRefresh;
  final VoidCallback onLoadMore;
  final bool isLoadingMore;
  final Failure? loadMoreFailure;
  final String emptyTitle;
  final String? emptyMessage;
  final EdgeInsets padding;
  final Widget? header;

  @override
  State<PaginatedListView<T>> createState() => _PaginatedListViewState<T>();
}

class _PaginatedListViewState<T> extends State<PaginatedListView<T>> {
  final ScrollController _controller = ScrollController();

  /// Prefetch threshold: start the next page before the user hits the bottom.
  static const double _prefetchExtent = 400;

  @override
  void initState() {
    super.initState();
    _controller.addListener(_maybeLoadMore);
  }

  @override
  void dispose() {
    _controller
      ..removeListener(_maybeLoadMore)
      ..dispose();
    super.dispose();
  }

  void _maybeLoadMore() {
    if (widget.isLoadingMore || !widget.meta.hasMore) return;
    if (!_controller.hasClients) return;
    final double remaining =
        _controller.position.maxScrollExtent - _controller.position.pixels;
    if (remaining <= _prefetchExtent) widget.onLoadMore();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.items.isEmpty) {
      return RefreshIndicator(
        onRefresh: widget.onRefresh,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: <Widget>[
            if (widget.header != null) widget.header!,
            SizedBox(
              height: MediaQuery.sizeOf(context).height * 0.6,
              child: EmptyView(
                title: widget.emptyTitle,
                message: widget.emptyMessage,
              ),
            ),
          ],
        ),
      );
    }

    final int headerCount = widget.header == null ? 0 : 1;
    final bool showFooter = widget.isLoadingMore || widget.loadMoreFailure != null;

    return RefreshIndicator(
      onRefresh: widget.onRefresh,
      child: ListView.separated(
        controller: _controller,
        padding: widget.padding,
        physics: const AlwaysScrollableScrollPhysics(),
        itemCount: widget.items.length + headerCount + (showFooter ? 1 : 0),
        separatorBuilder: (_, int index) =>
            index < headerCount ? const SizedBox.shrink() : const SizedBox(height: Spacing.x3),
        itemBuilder: (BuildContext context, int index) {
          if (headerCount == 1 && index == 0) return widget.header!;

          final int itemIndex = index - headerCount;
          if (itemIndex < widget.items.length) {
            return widget.itemBuilder(context, widget.items[itemIndex], itemIndex);
          }
          return _Footer(
            isLoading: widget.isLoadingMore,
            failure: widget.loadMoreFailure,
            onRetry: widget.onLoadMore,
          );
        },
      ),
    );
  }
}

class _Footer extends StatelessWidget {
  const _Footer({required this.isLoading, required this.failure, required this.onRetry});

  final bool isLoading;
  final Failure? failure;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: Spacing.x6),
        child: Center(
          child: SizedBox(
            height: Spacing.x5,
            width: Spacing.x5,
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
        ),
      );
    }
    final Failure? error = failure;
    if (error == null) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: Spacing.x4),
      child: Column(
        children: <Widget>[
          Text(error.message, style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: Spacing.x2),
          TextButton(onPressed: onRetry, child: const Text('Load more')),
        ],
      ),
    );
  }
}
