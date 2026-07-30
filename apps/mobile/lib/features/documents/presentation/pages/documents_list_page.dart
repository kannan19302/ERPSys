import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/documents.dart';
import '../providers/documents_providers.dart';

class DocumentsListPage extends ConsumerStatefulWidget {
  const DocumentsListPage({super.key});
  static const String routeName = 'documents';
  static const String routePath = '/documents';
  @override
  ConsumerState<DocumentsListPage> createState() => _DocumentsListPageState();
}

class _DocumentsListPageState extends ConsumerState<DocumentsListPage> {
  final TextEditingController _search = TextEditingController();

  static const Map<String, String> _sortOptions = <String, String>{
    '-createdAt': 'Newest first',
    'createdAt': 'Oldest first',
    'name': 'Name A-Z',
    '-name': 'Name Z-A',
  };

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(documentListControllerProvider);
    final controller = ref.read(documentListControllerProvider.notifier);
    final t = context.tokens;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Documents'),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.swap_vert),
            tooltip: 'Sort',
            initialValue: state.query.sort,
            onSelected: controller.applySort,
            itemBuilder: (_) => _sortOptions.entries
                .map((e) => PopupMenuItem<String>(
                    value: e.key, child: Text(e.value)))
                .toList(),
          ),
        ],
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
                hintText: 'Search documents',
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
                    : '${state.meta.total} document${state.meta.total == 1 ? '' : 's'}',
                style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs),
              ),
            ]),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(DocumentListState state, DocumentListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }

    return PaginatedListView<Document>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No documents',
      emptyMessage: state.query.search?.isNotEmpty ?? false
          ? 'Nothing matches "${state.query.search}".'
          : 'Documents uploaded in UniERP will appear here.',
      itemBuilder: (_, Document doc, __) => _DocumentTile(
        document: doc,
        onTap: () {},
      ),
    );
  }
}

class _DocumentTile extends StatelessWidget {
  const _DocumentTile({required this.document, required this.onTap});
  final Document document;
  final VoidCallback onTap;

  IconData _fileIcon(String fileType) => switch (fileType.toLowerCase()) {
        'pdf' => Icons.picture_as_pdf,
        'doc' || 'docx' => Icons.description,
        'xls' || 'xlsx' || 'csv' => Icons.table_chart,
        'jpg' || 'jpeg' || 'png' || 'gif' || 'webp' => Icons.image,
        'zip' || 'rar' || '7z' => Icons.folder_zip,
        _ => Icons.insert_drive_file,
      };

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;

    return UiCard(
      padding: const EdgeInsets.all(Spacing.x3),
      onTap: onTap,
      child: Row(
        children: [
          Icon(_fileIcon(document.fileType), size: Spacing.x6, color: t.primary),
          const SizedBox(width: Spacing.x3),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  Expanded(
                    child: Text(document.name,
                        style: Theme.of(context).textTheme.titleSmall,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis),
                  ),
                  if (document.starred)
                    const Icon(Icons.star, size: TypeScale.base, color: Colors.amber),
                ]),
                const SizedBox(height: Spacing.x1),
                Row(children: [
                  Text(document.fileType.toUpperCase(),
                      style: TextStyle(color: t.textTertiary, fontSize: TypeScale.xs)),
                  const SizedBox(width: Spacing.x2),
                  Text(Formatters.compact(document.fileSize),
                      style: TextStyle(color: t.textTertiary, fontSize: TypeScale.xs)),
                  if (document.folderName != null) ...<Widget>[
                    const SizedBox(width: Spacing.x2),
                    Text('in ${document.folderName}',
                        style: TextStyle(color: t.textTertiary, fontSize: TypeScale.xs)),
                  ],
                ]),
                const SizedBox(height: Spacing.x1),
                UiStatusBadge(
                  label: document.status,
                  tone: _statusTone(document.status),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  UiTone _statusTone(String status) => switch (status) {
        'ACTIVE' => UiTone.success,
        'DRAFT' => UiTone.neutral,
        'ARCHIVED' => UiTone.warning,
        'PENDING_APPROVAL' => UiTone.info,
        'APPROVED' => UiTone.success,
        'REJECTED' => UiTone.danger,
        _ => UiTone.neutral,
      };
}
