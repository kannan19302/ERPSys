$base = "C:\Users\kanna\OneDrive\Documents\Antigravity\ERPSys\apps\mobile"

# ── 1. localization/language_form_page.dart ── (already done manually)
# ── 2. localization/translation_form_page.dart

@"
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/localization.dart';
import '../providers/localization_providers.dart';

class TranslationFormPage extends ConsumerStatefulWidget {
  const TranslationFormPage({this.translationId, this.locale, super.key});

  static const String routeName = 'translation-new';
  static const String routeEditName = 'translation-edit';
  static const String routePath = '/localization/translations/new';
  static const String routeEditPath = '/localization/translations/:id/edit';

  final String? translationId;
  final String? locale;

  @override
  ConsumerState<TranslationFormPage> createState() => _TranslationFormPageState();
}

class _TranslationFormPageState extends ConsumerState<TranslationFormPage> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _keyCtrl = TextEditingController();
  final TextEditingController _valueCtrl = TextEditingController();
  final TextEditingController _moduleCtrl = TextEditingController();
  final TextEditingController _localeCtrl = TextEditingController();

  bool _isOverride = false;
  bool _saving = false;

  bool get _isEditing => widget.translationId != null;

  @override
  void initState() {
    super.initState();
    _localeCtrl.text = widget.locale ?? '';
    if (_isEditing) _loadTranslation();
  }

  Future<void> _loadTranslation() async {
    final items = ref.read(translationListControllerProvider).items;
    final t = items.where((e) => e.id == widget.translationId).firstOrNull;
    if (t != null) {
      _keyCtrl.text = t.key;
      _valueCtrl.text = t.value;
      _moduleCtrl.text = t.module ?? '';
      _localeCtrl.text = t.locale ?? '';
      _isOverride = t.isOverride;
    }
  }

  @override
  void dispose() {
    _keyCtrl.dispose(); _valueCtrl.dispose(); _moduleCtrl.dispose(); _localeCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    final payload = <String, dynamic>{
      'key': _keyCtrl.text.trim(),
      'value': _valueCtrl.text.trim(),
      'module': _moduleCtrl.text.trim().isEmpty ? null : _moduleCtrl.text.trim(),
      'locale': _localeCtrl.text.trim().isEmpty ? null : _localeCtrl.text.trim(),
      'isOverride': _isOverride,
    };
    final result = await ref.read(translationListControllerProvider.notifier)
        .save(payload, id: widget.translationId);
    if (!context.mounted) return;
    setState(() => _saving = false);
    result.fold(
      (f) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(f.message))),
      (_) => Navigator.of(context).pop(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_isEditing ? 'Edit Translation' : 'New Translation'),
        actions: [
          TextButton(
            onPressed: _saving ? null : _save,
            child: _saving
                ? const SizedBox(height: Spacing.x5, width: Spacing.x5, child: CircularProgressIndicator(strokeWidth: 2))
                : const Text('Save'),
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(Spacing.x4),
          children: [
            TextFormField(
              controller: _keyCtrl,
              decoration: const InputDecoration(labelText: 'Translation Key *'),
              validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _valueCtrl,
              maxLines: 3,
              decoration: const InputDecoration(labelText: 'Value *', alignLabelWithHint: true),
              validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _localeCtrl,
              decoration: const InputDecoration(labelText: 'Locale', helperText: 'e.g. en, es'),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _moduleCtrl,
              decoration: const InputDecoration(labelText: 'Module'),
            ),
            const SizedBox(height: Spacing.x4),
            SwitchListTile(
              title: const Text('Override'),
              subtitle: const Text('Override system translation'),
              value: _isOverride,
              onChanged: (v) => setState(() => _isOverride = v),
              contentPadding: EdgeInsets.zero,
            ),
          ],
        ),
      ),
    );
  }
}
"@ | Out-File -FilePath "$base\lib\features\localization\presentation\pages\translation_form_page.dart" -Encoding UTF8

Write-Host "translation_form_page.dart created"

# ── 3. marketplace/app_detail_page.dart ──
@"
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/state_views.dart';
import '../../domain/entities/marketplace.dart';
import '../providers/marketplace_providers.dart';

class MarketplaceAppDetailPage extends ConsumerWidget {
  const MarketplaceAppDetailPage({required this.appId, super.key});

  static const String routeName = 'marketplace-app-detail';
  static const String routePath = '/marketplace/apps/:id';

  final String appId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<MarketplaceApp> appAsync = ref.watch(marketplaceAppDetailProvider(appId));

    return Scaffold(
      appBar: AppBar(title: const Text('App')),
      body: appAsync.when(
        loading: () => const LoadingView(),
        error: (Object error, StackTrace _) => FailureView(
          failure: error is Failure ? error : const ServerFailure('Could not load app.'),
          onRetry: () => ref.invalidate(marketplaceAppDetailProvider(appId)),
        ),
        data: (MarketplaceApp app) => _AppDetail(app: app),
      ),
    );
  }
}

class _AppDetail extends StatelessWidget {
  const _AppDetail({required this.app});
  final MarketplaceApp app;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;
    final (String label, Color color, Color bg) = switch (app.status) {
      'PUBLISHED' => ('Published', t.success, t.successLight),
      'DRAFT' => ('Draft', t.textSecondary, t.bgSunken),
      'ARCHIVED' => ('Archived', t.textTertiary, t.bgSunken),
      _ => ('Unknown', t.warning, t.warningLight),
    };

    return ListView(
      padding: const EdgeInsets.all(Spacing.x4),
      children: [
        _SectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                if (app.icon != null) ...[
                  ClipRRect(borderRadius: Radii.md, child: Image.network(app.icon!, width: 48, height: 48, fit: BoxFit.cover)),
                  const SizedBox(width: Spacing.x3),
                ],
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(app.name, style: Theme.of(context).textTheme.titleLarge),
                      if (app.developer != null) Text(app.developer!, style: TextStyle(color: t.textSecondary)),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: Spacing.x2_5, vertical: Spacing.x1),
                  decoration: BoxDecoration(color: bg, borderRadius: Radii.pill),
                  child: Text(label, style: TextStyle(color: color, fontSize: TypeScale.xs, fontWeight: TypeScale.medium)),
                ),
              ]),
              if (app.description != null && app.description!.isNotEmpty) ...[
                const SizedBox(height: Spacing.x3),
                Text(app.description!, style: TextStyle(color: t.textSecondary)),
              ],
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        _SectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const _SectionTitle(title: 'Pricing'),
              _FieldRow('Price', app.price > 0 ? Formatters.currency(app.price, currencyCode: app.currency) : 'Free'),
              _FieldRow('Currency', app.currency),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        _SectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const _SectionTitle(title: 'Stats'),
              _FieldRow('Version', app.version ?? '—'),
              _FieldRow('Rating', app.rating != null ? '${app.rating!.toStringAsFixed(1)} / 5' : 'No ratings'),
              _FieldRow('Downloads', Formatters.compact(app.downloadCount)),
              _FieldRow('Reviews', '${app.reviewCount}'),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        _SectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const _SectionTitle(title: 'Details'),
              _FieldRow('Category', app.category ?? '—'),
              _FieldRow('Developer', app.developer ?? '—'),
              if (app.permissions.isNotEmpty) ...[
                const SizedBox(height: Spacing.x2),
                Text('Permissions', style: TextStyle(color: t.textSecondary, fontSize: TypeScale.xs)),
                const SizedBox(height: Spacing.x1),
                Wrap(
                  spacing: Spacing.x1, runSpacing: Spacing.x1,
                  children: app.permissions.map((p) => Chip(
                    label: Text(p, style: const TextStyle(fontSize: TypeScale.xs)),
                    materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  )).toList(),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.child});
  final Widget child;
  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;
    return Container(
      width: double.infinity, padding: const EdgeInsets.all(Spacing.x4),
      decoration: BoxDecoration(color: t.bgElevated, borderRadius: Radii.card, border: Border.all(color: t.border)),
      child: child,
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.title});
  final String title;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: Spacing.x3),
    child: Text(title, style: Theme.of(context).textTheme.titleMedium),
  );
}

class _FieldRow extends StatelessWidget {
  const _FieldRow(this.label, this.value);
  final String label; final String value;
  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: Spacing.x1_5),
      child: Row(children: [
        Expanded(child: Text(label, style: TextStyle(color: t.textSecondary))),
        Text(value, style: Theme.of(context).textTheme.labelLarge),
      ]),
    );
  }
}
"@ | Out-File -FilePath "$base\lib\features\marketplace\presentation\pages\app_detail_page.dart" -Encoding UTF8

Write-Host "app_detail_page.dart created"

# ── 4. marketplace/app_form_page.dart ──
@"
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/marketplace.dart';
import '../providers/marketplace_providers.dart';

class MarketplaceAppFormPage extends ConsumerStatefulWidget {
  const MarketplaceAppFormPage({this.appId, super.key});

  static const String routeName = 'marketplace-app-new';
  static const String routeEditName = 'marketplace-app-edit';
  static const String routePath = '/marketplace/apps/new';
  static const String routeEditPath = '/marketplace/apps/:id/edit';

  final String? appId;

  @override
  ConsumerState<MarketplaceAppFormPage> createState() => _MarketplaceAppFormPageState();
}

class _MarketplaceAppFormPageState extends ConsumerState<MarketplaceAppFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _descriptionCtrl = TextEditingController();
  final _developerCtrl = TextEditingController();
  final _categoryCtrl = TextEditingController();
  final _priceCtrl = TextEditingController();
  final _permissionsCtrl = TextEditingController();

  String _status = 'DRAFT';
  bool _saving = false;

  bool get _isEditing => widget.appId != null;

  @override
  void initState() {
    super.initState();
    if (_isEditing) _loadApp();
  }

  Future<void> _loadApp() async {
    final app = ref.read(marketplaceAppDetailProvider(widget.appId!)).valueOrNull;
    if (app != null) {
      _nameCtrl.text = app.name;
      _descriptionCtrl.text = app.description ?? '';
      _developerCtrl.text = app.developer ?? '';
      _categoryCtrl.text = app.category ?? '';
      _priceCtrl.text = app.price.toString();
      _permissionsCtrl.text = app.permissions.join(', ');
      _status = app.status;
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose(); _descriptionCtrl.dispose(); _developerCtrl.dispose();
    _categoryCtrl.dispose(); _priceCtrl.dispose(); _permissionsCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    final payload = <String, dynamic>{
      'name': _nameCtrl.text.trim(),
      'description': _descriptionCtrl.text.trim().isEmpty ? null : _descriptionCtrl.text.trim(),
      'developer': _developerCtrl.text.trim().isEmpty ? null : _developerCtrl.text.trim(),
      'category': _categoryCtrl.text.trim().isEmpty ? null : _categoryCtrl.text.trim(),
      'price': double.tryParse(_priceCtrl.text) ?? 0,
      'status': _status,
      'permissions': _permissionsCtrl.text.trim().isEmpty ? [] : _permissionsCtrl.text.split(',').map((s) => s.trim()).where((s) => s.isNotEmpty).toList(),
    };
    final result = await ref.read(marketplaceAppListControllerProvider.notifier)
        .save(payload, id: widget.appId);
    if (!context.mounted) return;
    setState(() => _saving = false);
    result.fold(
      (f) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(f.message))),
      (_) => Navigator.of(context).pop(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_isEditing ? 'Edit App' : 'New App'),
        actions: [
          TextButton(
            onPressed: _saving ? null : _save,
            child: _saving
                ? const SizedBox(height: Spacing.x5, width: Spacing.x5, child: CircularProgressIndicator(strokeWidth: 2))
                : const Text('Save'),
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(Spacing.x4),
          children: [
            TextFormField(controller: _nameCtrl, decoration: const InputDecoration(labelText: 'Name *'), validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null),
            const SizedBox(height: Spacing.x4),
            TextFormField(controller: _descriptionCtrl, maxLines: 3, decoration: const InputDecoration(labelText: 'Description', alignLabelWithHint: true)),
            const SizedBox(height: Spacing.x4),
            TextFormField(controller: _developerCtrl, decoration: const InputDecoration(labelText: 'Developer')),
            const SizedBox(height: Spacing.x4),
            TextFormField(controller: _categoryCtrl, decoration: const InputDecoration(labelText: 'Category')),
            const SizedBox(height: Spacing.x4),
            TextFormField(controller: _priceCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Price')),
            const SizedBox(height: Spacing.x4),
            DropdownButtonFormField<String>(
              value: _status,
              decoration: const InputDecoration(labelText: 'Status'),
              items: const [
                DropdownMenuItem(value: 'DRAFT', child: Text('Draft')),
                DropdownMenuItem(value: 'PUBLISHED', child: Text('Published')),
                DropdownMenuItem(value: 'ARCHIVED', child: Text('Archived')),
              ],
              onChanged: (v) { if (v != null) setState(() => _status = v); },
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(controller: _permissionsCtrl, decoration: const InputDecoration(labelText: 'Permissions', helperText: 'Comma-separated')),
          ],
        ),
      ),
    );
  }
}
"@ | Out-File -FilePath "$base\lib\features\marketplace\presentation\pages\app_form_page.dart" -Encoding UTF8

Write-Host "app_form_page.dart created"

# ── 5. marketplace/version_form_page.dart ──
@"
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/marketplace.dart';
import '../providers/marketplace_providers.dart';

class VersionFormPage extends ConsumerStatefulWidget {
  const VersionFormPage({this.versionId, this.appId, super.key});

  static const String routeName = 'version-new';
  static const String routeEditName = 'version-edit';
  static const String routePath = '/marketplace/versions/new';
  static const String routeEditPath = '/marketplace/versions/:id/edit';

  final String? versionId;
  final String? appId;

  @override
  ConsumerState<VersionFormPage> createState() => _VersionFormPageState();
}

class _VersionFormPageState extends ConsumerState<VersionFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _versionCtrl = TextEditingController();
  final _releaseNotesCtrl = TextEditingController();
  final _fileUrlCtrl = TextEditingController();
  final _fileSizeCtrl = TextEditingController();

  String _status = 'DRAFT';
  bool _saving = false;

  bool get _isEditing => widget.versionId != null;

  @override
  void initState() {
    super.initState();
    if (_isEditing) {
      final items = ref.read(marketplaceAppListControllerProvider).items;
      // Load from existing context
    }
  }

  @override
  void dispose() {
    _versionCtrl.dispose(); _releaseNotesCtrl.dispose();
    _fileUrlCtrl.dispose(); _fileSizeCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    final payload = <String, dynamic>{
      'version': _versionCtrl.text.trim(),
      'releaseNotes': _releaseNotesCtrl.text.trim().isEmpty ? null : _releaseNotesCtrl.text.trim(),
      'fileUrl': _fileUrlCtrl.text.trim().isEmpty ? null : _fileUrlCtrl.text.trim(),
      'fileSize': int.tryParse(_fileSizeCtrl.text),
      'status': _status,
      'appId': widget.appId,
    };
    final result = await ref.read(marketplaceAppListControllerProvider.notifier)
        .saveVersion(payload, id: widget.versionId);
    if (!context.mounted) return;
    setState(() => _saving = false);
    result.fold(
      (f) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(f.message))),
      (_) => Navigator.of(context).pop(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_isEditing ? 'Edit Version' : 'New Version'),
        actions: [
          TextButton(
            onPressed: _saving ? null : _save,
            child: _saving
                ? const SizedBox(height: Spacing.x5, width: Spacing.x5, child: CircularProgressIndicator(strokeWidth: 2))
                : const Text('Save'),
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(Spacing.x4),
          children: [
            TextFormField(controller: _versionCtrl, decoration: const InputDecoration(labelText: 'Version *', hintText: '1.0.0'), validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null),
            const SizedBox(height: Spacing.x4),
            TextFormField(controller: _releaseNotesCtrl, maxLines: 4, decoration: const InputDecoration(labelText: 'Release Notes', alignLabelWithHint: true)),
            const SizedBox(height: Spacing.x4),
            TextFormField(controller: _fileUrlCtrl, keyboardType: TextInputType.url, decoration: const InputDecoration(labelText: 'File URL')),
            const SizedBox(height: Spacing.x4),
            TextFormField(controller: _fileSizeCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'File Size (bytes)')),
            const SizedBox(height: Spacing.x4),
            DropdownButtonFormField<String>(
              value: _status,
              decoration: const InputDecoration(labelText: 'Status'),
              items: const [
                DropdownMenuItem(value: 'DRAFT', child: Text('Draft')),
                DropdownMenuItem(value: 'RELEASED', child: Text('Released')),
                DropdownMenuItem(value: 'DEPRECATED', child: Text('Deprecated')),
              ],
              onChanged: (v) { if (v != null) setState(() => _status = v); },
            ),
          ],
        ),
      ),
    );
  }
}
"@ | Out-File -FilePath "$base\lib\features\marketplace\presentation\pages\version_form_page.dart" -Encoding UTF8

Write-Host "version_form_page.dart created"

# ── 6. marketplace/review_form_page.dart ──
@"
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/marketplace.dart';
import '../providers/marketplace_providers.dart';

class ReviewFormPage extends ConsumerStatefulWidget {
  const ReviewFormPage({this.reviewId, this.appId, super.key});

  static const String routeName = 'review-new';
  static const String routeEditName = 'review-edit';
  static const String routePath = '/marketplace/reviews/new';
  static const String routeEditPath = '/marketplace/reviews/:id/edit';

  final String? reviewId;
  final String? appId;

  @override
  ConsumerState<ReviewFormPage> createState() => _ReviewFormPageState();
}

class _ReviewFormPageState extends ConsumerState<ReviewFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _commentCtrl = TextEditingController();

  double _rating = 5.0;
  bool _saving = false;

  @override
  void dispose() { _commentCtrl.dispose(); super.dispose(); }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    final payload = <String, dynamic>{
      'rating': _rating,
      'comment': _commentCtrl.text.trim().isEmpty ? null : _commentCtrl.text.trim(),
      'appId': widget.appId,
    };
    final result = await ref.read(marketplaceReviewListControllerProvider.notifier)
        .save(payload, id: widget.reviewId);
    if (!context.mounted) return;
    setState(() => _saving = false);
    result.fold(
      (f) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(f.message))),
      (_) => Navigator.of(context).pop(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Write a Review'),
        actions: [
          TextButton(
            onPressed: _saving ? null : _save,
            child: _saving
                ? const SizedBox(height: Spacing.x5, width: Spacing.x5, child: CircularProgressIndicator(strokeWidth: 2))
                : const Text('Submit'),
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(Spacing.x4),
          children: [
            const Text('Rating', style: TextStyle(fontSize: TypeScale.base, fontWeight: TypeScale.medium)),
            const SizedBox(height: Spacing.x2),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(5, (i) {
                final int star = i + 1;
                return IconButton(
                  icon: Icon(star <= _rating ? Icons.star : Icons.star_border, color: Colors.amber, size: 36),
                  onPressed: () => setState(() => _rating = star.toDouble()),
                );
              }),
            ),
            if (_rating > 0) Center(child: Text('${_rating.toStringAsFixed(1)} / 5', style: Theme.of(context).textTheme.bodySmall)),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _commentCtrl,
              maxLines: 5,
              decoration: const InputDecoration(labelText: 'Comment', alignLabelWithHint: true),
            ),
          ],
        ),
      ),
    );
  }
}
"@ | Out-File -FilePath "$base\lib\features\marketplace\presentation\pages\review_form_page.dart" -Encoding UTF8

Write-Host "review_form_page.dart created"

# ── 7. notifications/notification_detail_page.dart ──
@"
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/state_views.dart';
import '../../domain/entities/notification.dart';
import '../providers/notifications_providers.dart';
import '../../../../core/rbac/permissions.dart';
import '../../../../core/widgets/permission_gate.dart';

class NotificationDetailPage extends ConsumerWidget {
  const NotificationDetailPage({required this.notificationId, super.key});

  static const String routeName = 'notification-detail';
  static const String routePath = '/notifications/:id';

  final String notificationId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notificationsAsync = ref.watch(notificationsControllerProvider);
    return notificationsAsync.when(
      loading: () => const Scaffold(body: LoadingView()),
      error: (e, s) => Scaffold(
        appBar: AppBar(title: const Text('Notification')),
        body: FailureView(failure: e is Failure ? e : const ServerFailure('Could not load notification.'), onRetry: () => ref.invalidate(notificationsControllerProvider)),
      ),
      data: (items) {
        final notification = items.where((n) => n.id == notificationId).firstOrNull;
        if (notification == null) {
          return Scaffold(
            appBar: AppBar(title: const Text('Notification')),
            body: const FailureView(failure: NotFoundFailure('Notification not found')),
          );
        }
        // Mark as read
        WidgetsBinding.instance.addPostFrameCallback((_) => ref.read(notificationsControllerProvider.notifier).markRead(notificationId));
        return Scaffold(
          appBar: AppBar(title: const Text('Notification')),
          body: _NotificationDetail(notification: notification),
        );
      },
    );
  }
}

class _NotificationDetail extends StatelessWidget {
  const _NotificationDetail({required this.notification});
  final AppNotification notification;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;
    final (IconData icon, Color color) = switch (notification.type) {
      'INFO' => (Icons.info_outline, t.info),
      'WARNING' => (Icons.warning_amber_outlined, t.warning),
      'ERROR' => (Icons.error_outline, t.danger),
      'SUCCESS' => (Icons.check_circle_outline, t.success),
      _ => (Icons.notifications_outlined, t.textSecondary),
    };

    return ListView(
      padding: const EdgeInsets.all(Spacing.x4),
      children: [
        _SectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Icon(icon, color: color, size: TypeScale.xl2),
                const SizedBox(width: Spacing.x3),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(notification.title, style: Theme.of(context).textTheme.titleLarge),
                      Text(notification.type, style: TextStyle(color: color, fontSize: TypeScale.xs)),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: Spacing.x2_5, vertical: Spacing.x1),
                  decoration: BoxDecoration(
                    color: notification.isUnread ? t.infoLight : t.bgSunken,
                    borderRadius: Radii.pill,
                  ),
                  child: Text(
                    notification.isUnread ? 'Unread' : 'Read',
                    style: TextStyle(
                      color: notification.isUnread ? t.info : t.textSecondary,
                      fontSize: TypeScale.xs, fontWeight: TypeScale.medium,
                    ),
                  ),
                ),
              ]),
              const SizedBox(height: Spacing.x4),
              Text(notification.content, style: TextStyle(color: t.textSecondary, height: 1.5)),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        _SectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const _SectionTitle(title: 'Details'),
              _FieldRow('Type', notification.type),
              _FieldRow('Status', notification.isUnread ? 'Unread' : 'Read'),
              _FieldRow('Created', Formatters.dateTime(notification.createdAt)),
              if (notification.link != null) _FieldRow('Link', notification.link!),
            ],
          ),
        ),
      ],
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.child});
  final Widget child;
  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;
    return Container(
      width: double.infinity, padding: const EdgeInsets.all(Spacing.x4),
      decoration: BoxDecoration(color: t.bgElevated, borderRadius: Radii.card, border: Border.all(color: t.border)),
      child: child,
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.title});
  final String title;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: Spacing.x3),
    child: Text(title, style: Theme.of(context).textTheme.titleMedium),
  );
}

class _FieldRow extends StatelessWidget {
  const _FieldRow(this.label, this.value);
  final String label; final String value;
  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: Spacing.x1_5),
      child: Row(children: [
        Expanded(child: Text(label, style: TextStyle(color: t.textSecondary))),
        Text(value, style: Theme.of(context).textTheme.labelLarge),
      ]),
    );
  }
}
"@ | Out-File -FilePath "$base\lib\features\notifications\presentation\pages\notification_detail_page.dart" -Encoding UTF8

Write-Host "notification_detail_page.dart created"

# ── 8. notifications/notification_preferences_page.dart ──
@"
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/widgets/state_views.dart';
import '../providers/notifications_providers.dart';

class NotificationPreferencesPage extends ConsumerWidget {
  const NotificationPreferencesPage({super.key});

  static const String routeName = 'notification-preferences';
  static const String routePath = '/notifications/preferences';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('Notification Preferences')),
      body: ListView(
        padding: const EdgeInsets.all(Spacing.x4),
        children: [
          _SectionCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const _SectionTitle(title: 'Channels'),
                _PreferenceTile(label: 'In-App Notifications', subtitle: 'Show notifications in the app', value: true),
                _PreferenceTile(label: 'Push Notifications', subtitle: 'Receive push notifications', value: true),
                _PreferenceTile(label: 'Email Notifications', subtitle: 'Receive email digests', value: false),
              ],
            ),
          ),
          const SizedBox(height: Spacing.x4),
          _SectionCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const _SectionTitle(title: 'Types'),
                _PreferenceTile(label: 'System Alerts', value: true),
                _PreferenceTile(label: 'Approval Requests', value: true),
                _PreferenceTile(label: 'Mentions', value: true),
                _PreferenceTile(label: 'Comments & Replies', value: true),
                _PreferenceTile(label: 'Task Reminders', value: true),
                _PreferenceTile(label: 'Marketing', value: false),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _PreferenceTile extends StatelessWidget {
  const _PreferenceTile({required this.label, this.subtitle, required this.value});
  final String label; final String? subtitle; final bool value;

  @override
  Widget build(BuildContext context) {
    return SwitchListTile(
      title: Text(label),
      subtitle: subtitle != null ? Text(subtitle!, style: Theme.of(context).textTheme.bodySmall) : null,
      value: value,
      onChanged: (_) {},
      contentPadding: EdgeInsets.zero,
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.child});
  final Widget child;
  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;
    return Container(
      width: double.infinity, padding: const EdgeInsets.all(Spacing.x4),
      decoration: BoxDecoration(color: t.bgElevated, borderRadius: Radii.card, border: Border.all(color: t.border)),
      child: child,
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.title});
  final String title;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: Spacing.x3),
    child: Text(title, style: Theme.of(context).textTheme.titleMedium),
  );
}
"@ | Out-File -FilePath "$base\lib\features\notifications\presentation\pages\notification_preferences_page.dart" -Encoding UTF8

Write-Host "notification_preferences_page.dart created"
Write-Host "Batch 1 complete"
"@ | Out-File -FilePath "$base\gen_batch1.ps1" -Encoding UTF8