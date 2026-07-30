import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../domain/entities/storage.dart';
import '../providers/storage_providers.dart';

class StorageFileListPage extends ConsumerStatefulWidget {
  const StorageFileListPage({super.key});
  static const String routeName = 'storage-files';
  static const String routePath = '/storage/files';
  @override
  ConsumerState<StorageFileListPage> createState() => _StorageFileListPageState();
}

class _StorageFileListPageState extends ConsumerState<StorageFileListPage> {
  final TextEditingController _search = TextEditingController();

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(fileListControllerProvider);
    final controller = ref.read(fileListControllerProvider.notifier);
    final palette = context.tokens;
    return Scaffold(
      appBar: AppBar(title: const Text('Storage Files')),
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
                style: TextStyle(color: palette.textSecondary, fontSize: TypeScale.xs),
              ),
            ]),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(FileListState state, FileListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }
    return PaginatedListView<StorageFile>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No files found',
      emptyMessage: 'Files uploaded to UniERP storage will appear here.',
      itemBuilder: (_, StorageFile f, __) => Card(
        margin: EdgeInsets.zero,
        child: Padding(
          padding: const EdgeInsets.all(Spacing.x3),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Icon(Icons.insert_drive_file, size: TypeScale.base, color: context.tokens.textSecondary),
                const SizedBox(width: Spacing.x2),
                Expanded(
                  child: Text(f.name, style: Theme.of(context).textTheme.titleSmall),
                ),
              ]),
              const SizedBox(height: Spacing.x1),
              Text('${f.bucket} · ${f.mimeType ?? "unknown type"}',
                  style: TextStyle(color: context.tokens.textSecondary, fontSize: TypeScale.xs)),
            ],
          ),
        ),
      ),
    );
  }
}
