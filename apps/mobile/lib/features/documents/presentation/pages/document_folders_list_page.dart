import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/documents.dart';
import '../providers/documents_providers.dart';

class DocumentFoldersListPage extends ConsumerStatefulWidget {
  const DocumentFoldersListPage({super.key});
  static const String routeName = 'document-folders';
  static const String routePath = '/documents/folders';
  @override
  ConsumerState<DocumentFoldersListPage> createState() => _DocumentFoldersListPageState();
}

class _DocumentFoldersListPageState extends ConsumerState<DocumentFoldersListPage> {
  final TextEditingController _search = TextEditingController();

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(folderListControllerProvider);
    final controller = ref.read(folderListControllerProvider.notifier);
    final t = context.tokens;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Document Folders'),
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
                hintText: 'Search folders',
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
                    : '${state.meta.total} folder${state.meta.total == 1 ? '' : 's'}',
                style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs),
              ),
            ]),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(FolderListState state, FolderListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }

    return PaginatedListView<DocumentFolder>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No folders',
      emptyMessage: state.query.search?.isNotEmpty ?? false
          ? 'Nothing matches "${state.query.search}".'
          : 'Document folders created in UniERP will appear here.',
      itemBuilder: (_, DocumentFolder folder, __) => _FolderTile(folder: folder),
    );
  }
}

class _FolderTile extends StatelessWidget {
  const _FolderTile({required this.folder});
  final DocumentFolder folder;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;

    return UiCard(
      padding: const EdgeInsets.all(Spacing.x3),
      child: Row(
        children: [
          Icon(Icons.folder_outlined, size: Spacing.x6, color: t.primary),
          const SizedBox(width: Spacing.x3),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(folder.name,
                    style: Theme.of(context).textTheme.titleSmall),
                if (folder.description != null && folder.description!.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: Spacing.x1),
                    child: Text(folder.description!,
                        style: TextStyle(
                          color: t.textSecondary,
                          fontSize: TypeScale.sm,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis),
                  ),
                const SizedBox(height: Spacing.x1),
                Text('${folder.documentCount} document${folder.documentCount == 1 ? '' : 's'}',
                    style: TextStyle(
                      color: t.textTertiary,
                      fontSize: TypeScale.xs,
                    )),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
