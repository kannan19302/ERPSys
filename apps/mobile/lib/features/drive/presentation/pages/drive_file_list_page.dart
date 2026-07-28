import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../domain/entities/drive.dart';
import '../providers/drive_providers.dart';

class DriveFileListPage extends ConsumerStatefulWidget {
  const DriveFileListPage({super.key});
  static const String routeName = 'drive-files';
  static const String routePath = '/drive/files';
  @override
  ConsumerState<DriveFileListPage> createState() => _DriveFileListPageState();
}

class _DriveFileListPageState extends ConsumerState<DriveFileListPage> {
  final TextEditingController _search = TextEditingController();

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(driveFileListControllerProvider);
    final controller = ref.read(driveFileListControllerProvider.notifier);
    return Scaffold(
      appBar: AppBar(title: const Text('Drive Files')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(Spacing.x4, Spacing.x3, Spacing.x4, Spacing.x2),
            child: TextField(
              controller: _search,
              onChanged: controller.search,
              textInputAction: TextInputAction.search,
              decoration: InputDecoration(
                hintText: 'Search files',
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
                    : '${state.meta.total} file${state.meta.total == 1 ? '' : 's'}',
                style: TextStyle(color: context.tokens.textSecondary, fontSize: TypeScale.xs),
              ),
            ]),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(DriveFileListState state, DriveFileListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }
    return PaginatedListView<DriveFile>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No files found',
      emptyMessage: 'Files in your Drive will appear here.',
      itemBuilder: (_, DriveFile f, __) => Card(
        margin: EdgeInsets.zero,
        child: Padding(
          padding: const EdgeInsets.all(Spacing.x3),
          child: Row(children: [
            Icon(Icons.insert_drive_file, size: TypeScale.base, color: context.tokens.textSecondary),
            const SizedBox(width: Spacing.x2),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(f.name, style: Theme.of(context).textTheme.titleSmall),
                  const SizedBox(height: Spacing.x1),
                  Text('${f.mimeType} · ${f.size} bytes',
                      style: TextStyle(color: context.tokens.textSecondary, fontSize: TypeScale.xs)),
                ],
              ),
            ),
            if (f.isStarred) Icon(Icons.star, size: TypeScale.sm, color: context.tokens.warning),
          ]),
        ),
      ),
    );
  }
}
