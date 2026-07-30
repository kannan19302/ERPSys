import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/rbac/permissions.dart';
import '../../../../core/widgets/paginated_list_view.dart';
import '../../../../core/widgets/permission_gate.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/crm.dart';
import '../providers/crm_providers.dart';

class EmailTemplateListPage extends ConsumerStatefulWidget {
  const EmailTemplateListPage({super.key});

  static const String routeName = 'email-templates';
  static const String routePath = '/crm/email-templates';

  @override
  ConsumerState<EmailTemplateListPage> createState() => _EmailTemplateListPageState();
}

class _EmailTemplateListPageState extends ConsumerState<EmailTemplateListPage> {
  final TextEditingController _search = TextEditingController();
  String? _categoryFilter;

  static const Map<String, String> _categoryFilters = <String, String>{
    'SALES': 'Sales',
    'MARKETING': 'Marketing',
    'SUPPORT': 'Support',
    'GENERAL': 'General',
  };

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final CrmListState<EmailTemplate> state = ref.watch(emailTemplatesProvider);
    final EmailTemplatesController controller =
        ref.read(emailTemplatesProvider.notifier);
    final Palette t = context.tokens;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Email Templates'),
      ),
      floatingActionButton: PermissionGate(
        permission: Permissions.crmTemplateCreate,
        child: FloatingActionButton.extended(
          onPressed: () => context.pushNamed('email-template-new'),
          icon: const Icon(Icons.add),
          label: const Text('New template'),
        ),
      ),
      body: Column(
        children: <Widget>[
          Padding(
            padding: const EdgeInsets.fromLTRB(
              Spacing.x4, Spacing.x3, Spacing.x4, Spacing.x2,
            ),
            child: TextField(
              controller: _search,
              onChanged: controller.search,
              textInputAction: TextInputAction.search,
              decoration: InputDecoration(
                hintText: 'Search name or subject',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _search.text.isEmpty
                    ? null
                    : IconButton(
                        icon: const Icon(Icons.close),
                        tooltip: 'Clear search',
                        onPressed: () {
                          _search.clear();
                          controller.search('');
                        },
                      ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: Spacing.x4),
            child: Row(
              children: <Widget>[
                Text(
                  state.isLoading
                      ? 'Loading…'
                      : '${state.meta.total} template${state.meta.total == 1 ? '' : 's'}',
                  style: TextStyle(
                    color: t.textSecondary,
                    fontSize: TypeScale.xs,
                  ),
                ),
                const Spacer(),
                DropdownButton<String?>(
                  value: _categoryFilter,
                  hint: const Text('Category'),
                  underline: const SizedBox.shrink(),
                  items: _categoryFilters.entries
                      .map(
                        (MapEntry<String, String> e) => DropdownMenuItem<String>(
                          value: e.key,
                          child: Text(e.value),
                        ),
                      )
                      .toList(),
                  onChanged: (String? value) {
                    setState(() => _categoryFilter = value);
                    if (value == null) {
                      controller.applyFilters(const <String, String>{});
                    } else {
                      controller.applyFilters(<String, String>{'category': value});
                    }
                  },
                ),
              ],
            ),
          ),
          Expanded(child: _body(state, controller)),
        ],
      ),
    );
  }

  Widget _body(
    CrmListState<EmailTemplate> state,
    EmailTemplatesController controller,
  ) {
    if (state.isLoading && state.items.isEmpty) {
      return const LoadingView();
    }
    final Failure? failure = state.failure;
    if (failure != null && state.items.isEmpty) {
      return FailureView(failure: failure, onRetry: controller.refresh);
    }

    return PaginatedListView<EmailTemplate>(
      items: state.items,
      meta: state.meta,
      isLoadingMore: state.isLoadingMore,
      loadMoreFailure: state.loadMoreFailure,
      onRefresh: controller.refresh,
      onLoadMore: controller.loadMore,
      emptyTitle: 'No templates found',
      emptyMessage: state.query.search?.isNotEmpty ?? false
          ? 'Nothing matches "${state.query.search}".'
          : 'Email templates will appear here.',
      itemBuilder: (BuildContext context, EmailTemplate template, _) =>
          _TemplateTile(
        template: template,
        onTap: () => context.pushNamed(
          'email-template-detail',
          pathParameters: <String, String>{'id': template.id},
        ),
      ),
    );
  }
}

class _TemplateTile extends StatelessWidget {
  const _TemplateTile({required this.template, this.onTap});

  final EmailTemplate template;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    return UiCard(
      onTap: onTap,
      padding: const EdgeInsets.all(Spacing.x3),
      child: Row(
        children: <Widget>[
          Container(
            height: Spacing.x10,
            width: Spacing.x10,
            decoration: BoxDecoration(
              color: t.primaryLight,
              borderRadius: Radii.control,
            ),
            alignment: Alignment.center,
            child: Icon(
              Icons.email_outlined,
              size: TypeScale.xl,
              color: t.primary,
            ),
          ),
          const SizedBox(width: Spacing.x3),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  template.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.labelLarge,
                ),
                const SizedBox(height: Spacing.x0_5),
                Text(
                  template.subject,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: t.textTertiary,
                    fontSize: TypeScale.xs,
                  ),
                ),
              ],
            ),
          ),
          if (template.category != null) ...<Widget>[
            const SizedBox(width: Spacing.x2),
            Container(
              padding: const EdgeInsets.symmetric(
                horizontal: Spacing.x2_5,
                vertical: Spacing.x1,
              ),
              decoration: BoxDecoration(
                color: t.bgSunken,
                borderRadius: Radii.pill,
              ),
              child: Text(
                template.category!,
                style: TextStyle(
                  color: t.textSecondary,
                  fontSize: TypeScale.xs,
                  fontWeight: TypeScale.medium,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
