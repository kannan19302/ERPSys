import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/admin.dart';
import '../providers/admin_providers.dart';

class AdminSettingsListPage extends ConsumerStatefulWidget {
  const AdminSettingsListPage({super.key});
  static const String routeName = 'admin-settings';
  static const String routePath = '/admin/settings';
  @override
  ConsumerState<AdminSettingsListPage> createState() => _AdminSettingsListPageState();
}

class _AdminSettingsListPageState extends ConsumerState<AdminSettingsListPage> {
  final TextEditingController _search = TextEditingController();
  String? _categoryFilter;

  static const Map<String, String> _categories = <String, String>{
    'general': 'General',
    'email': 'Email',
    'security': 'Security',
    'localization': 'Localization',
    'billing': 'Billing',
    'notifications': 'Notifications',
    'integrations': 'Integrations',
  };

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final AdminSettingListState state = ref.watch(adminSettingListControllerProvider);
    final AdminSettingListController controller = ref.read(adminSettingListControllerProvider.notifier);
    final Palette t = context.tokens;

    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: Column(
        children: <Widget>[
          Padding(
            padding: const EdgeInsets.fromLTRB(Spacing.x4, Spacing.x3, Spacing.x4, Spacing.x2),
            child: TextField(
              controller: _search,
              onChanged: controller.search,
              textInputAction: TextInputAction.search,
              decoration: InputDecoration(
                hintText: 'Search by key or name',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _search.text.isEmpty ? null : IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () { _search.clear(); controller.search(''); },
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: Spacing.x4),
            child: Row(children: <Widget>[
              Expanded(
                child: Text(
                  state.isLoading ? 'Loading\u2026' : '${state.meta.total} setting${state.meta.total == 1 ? '' : 's'}',
                  style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs),
                ),
              ),
              DropdownButton<String?>(
                value: _categoryFilter,
                hint: const Text('Category'),
                underline: const SizedBox.shrink(),
                items: _categories.entries.map((MapEntry<String, String> e) =>
                  DropdownMenuItem<String?>(value: e.key, child: Text(e.value)),
                ).toList(growable: false)..insert(0, const DropdownMenuItem<String?>(value: null, child: Text('All'))),
                onChanged: (String? v) {
                  setState(() => _categoryFilter = v);
                  if (v == null) { controller.search(''); } else { controller.search(v); }
                },
              ),
            ],),
          ),
          Expanded(child: _body(state, controller, t)),
        ],
      ),
    );
  }

  Widget _body(AdminSettingListState state, AdminSettingListController controller, Palette t) {
    if (state.isLoading && state.items.isEmpty) return const LoadingView();
    final Failure? failure = state.failure;
    if (failure != null && state.items.isEmpty) return FailureView(failure: failure, onRetry: controller.refresh);

    final Map<String, List<AdminSetting>> grouped = <String, List<AdminSetting>>{};
    for (final AdminSetting s in state.items) {
      grouped.putIfAbsent(s.category, () => <AdminSetting>[]).add(s);
    }
    final List<String> categories = grouped.keys.toList()..sort();

    if (state.items.isEmpty) {
      return PaginatedListView<AdminSetting>(
        items: state.items, meta: state.meta,
        isLoadingMore: state.isLoadingMore, loadMoreFailure: state.loadMoreFailure,
        onRefresh: controller.refresh, onLoadMore: controller.loadMore,
        emptyTitle: 'No settings found',
        emptyMessage: 'System settings will appear here.',
        itemBuilder: (_, __, ___) => const SizedBox.shrink(),
      );
    }

    return ListView(
      padding: const EdgeInsets.all(Spacing.x4),
      children: categories.map((String cat) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Padding(
            padding: const EdgeInsets.only(bottom: Spacing.x2),
            child: Text(cat[0].toUpperCase() + cat.substring(1),
                style: Theme.of(context).textTheme.titleMedium,),
          ),
          ...grouped[cat]!.map((AdminSetting s) => Padding(
            padding: const EdgeInsets.only(bottom: Spacing.x2),
            child: UiCard(
              onTap: () => context.pushNamed('admin-setting-detail',
                  pathParameters: <String, String>{'key': s.key},),
              padding: const EdgeInsets.all(Spacing.x3),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Text(s.key, style: Theme.of(context).textTheme.labelLarge),
                  if (s.description != null) ...<Widget>[
                    const SizedBox(height: Spacing.x0_5),
                    Text(s.description!, maxLines: 1, overflow: TextOverflow.ellipsis,
                        style: TextStyle(color: t.textTertiary, fontSize: TypeScale.xs),),
                  ],
                ],
              ),
            ),
          ),),
          const SizedBox(height: Spacing.x3),
        ],
      ),).toList(),
    );
  }
}