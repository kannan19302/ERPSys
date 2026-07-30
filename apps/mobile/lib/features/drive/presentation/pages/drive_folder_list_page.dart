import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../domain/entities/drive.dart';
import '../providers/drive_providers.dart';

class DriveFolderListPage extends ConsumerStatefulWidget {
  const DriveFolderListPage({super.key});
  static const String routeName = 'drive-folders';
  static const String routePath = '/drive/folders';
  @override
  ConsumerState<DriveFolderListPage> createState() => _DriveFolderListPageState();
}

class _DriveFolderListPageState extends ConsumerState<DriveFolderListPage> {
  @override
  Widget build(BuildContext context) {
    final state = ref.watch(driveFolderListControllerProvider);
    final controller = ref.read(driveFolderListControllerProvider.notifier);
    return Scaffold(
      appBar: AppBar(title: const Text('Drive Folders')),
      body: _body(state, controller),
    );
  }

  Widget _body(DriveFolderListState state, DriveFolderListController controller) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }
    return PaginatedListView<DriveFolder>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No folders found',
      emptyMessage: 'Folders in your Drive will appear here.',
      itemBuilder: (_, DriveFolder f, __) => Card(
        margin: EdgeInsets.zero,
        child: Padding(
          padding: const EdgeInsets.all(Spacing.x3),
          child: Row(children: [
            Icon(Icons.folder, size: TypeScale.base, color: f.color != null ? Color(int.parse(f.color!.replaceFirst('#', '0xFF'))) : context.tokens.textSecondary),
            const SizedBox(width: Spacing.x2),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(f.name, style: Theme.of(context).textTheme.titleSmall),
                  const SizedBox(height: Spacing.x1),
                  Text('${f.fileCount} files',
                      style: TextStyle(color: context.tokens.textSecondary, fontSize: TypeScale.xs)),
                ],
              ),
            ),
          ]),
        ),
      ),
    );
  }
}
