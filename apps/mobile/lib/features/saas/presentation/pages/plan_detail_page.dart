import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/permission_gate.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/widgets/state_views.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/rbac/permissions.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/permission_gate.dart';
import '../../../../core/widgets/state_views.dart';
import '../../domain/entities/saas.dart';
import '../providers/saas_providers.dart';

class SaasPlanDetailPage extends ConsumerWidget {
  const SaasPlanDetailPage({required this.planId, super.key});
  static const String routeName = 'saas-plan-detail';
  static const String routePath = '/saas/plans/:id';
  final String planId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(saasPlanDetailProvider(planId));
    return Scaffold(
      appBar: AppBar(title: const Text('Plan'), actions: [PermissionGate(permission: Permissions.adminSettingUpdate, child: IconButton(
        icon: const Icon(Icons.delete_outline), tooltip: 'Delete',
        onPressed: () async {
          final confirmed = await showDialog<bool>(context: context, builder: (c) => AlertDialog(
            title: const Text('Delete plan?'), content: const Text('This cannot be undone.'),
            actions: [TextButton(onPressed: () => Navigator.of(c).pop(false), child: const Text('Cancel')), FilledButton(onPressed: () => Navigator.of(c).pop(true), child: const Text('Delete'))],
          ));
          if (confirmed != true || !context.mounted) return;
          final r = await ref.read(saasPlanListControllerProvider.notifier).delete(planId);
          if (!context.mounted) return;
          r.fold((f) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(f.message))), (_) => Navigator.of(context).pop());
        },
      ))]),
      body: async.when(
        loading: () => const LoadingView(),
        error: (e, _) => FailureView(failure: e is Failure ? e : const ServerFailure('Could not load plan.'), onRetry: () => ref.invalidate(saasPlanDetailProvider(planId))),
        data: (p) => _PlanDetail(plan: p),
      ),
    );
  }
}

class _PlanDetail extends StatelessWidget {
  const _PlanDetail({required this.plan}); final SaasPlan plan;

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    return ListView(
      padding: const EdgeInsets.all(Spacing.x4),
      children: [
        _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Icon(Icons.card_membership, color: t.primary, size: 40),
            const SizedBox(width: Spacing.x3),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(plan.name, style: Theme.of(context).textTheme.titleLarge),
              Text(plan.billingInterval, style: TextStyle(color: t.textSecondary)),
            ])),
            Container(padding: const EdgeInsets.symmetric(horizontal: Spacing.x2_5, vertical: Spacing.x1),
              decoration: BoxDecoration(color: plan.isActive ? t.successLight : t.bgSunken, borderRadius: Radii.pill),
              child: Text(plan.isActive ? 'Active' : 'Inactive', style: TextStyle(color: plan.isActive ? t.success : t.textSecondary, fontSize: TypeScale.xs, fontWeight: TypeScale.medium))),
          ]),
          if (plan.description != null) Padding(padding: const EdgeInsets.only(top: Spacing.x2), child: Text(plan.description!, style: TextStyle(color: t.textSecondary))),
        ])),
        const SizedBox(height: Spacing.x4),
        _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const _SectionTitle(title: 'Pricing'),
          _FieldRow('Price', Formatters.currency(plan.price)), _FieldRow('Billing', plan.billingInterval),
        ])),
        const SizedBox(height: Spacing.x4),
        _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const _SectionTitle(title: 'Limits'), _FieldRow('Max Users', plan.maxUsers?.toString() ?? '—'),
          _FieldRow('Max Storage', plan.maxStorage != null ? '${plan.maxStorage} GB' : '—'),
        ])),
        if (plan.features.isNotEmpty) ...[
          const SizedBox(height: Spacing.x4),
          _SectionCard(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const _SectionTitle(title: 'Features'),
            ...plan.features.map((f) => Padding(padding: const EdgeInsets.symmetric(vertical: Spacing.x1), child: Row(children: [
              Icon(Icons.check, color: t.success, size: TypeScale.base), const SizedBox(width: Spacing.x2), Expanded(child: Text(f, style: TextStyle(color: t.text))),
            ]))),
          ])),
        ],
      ],
    );
  }
}

class SaasPlanFormPage extends ConsumerStatefulWidget {
  const SaasPlanFormPage({this.planId, super.key});
  static const String routeName = 'saas-plan-new';
  static const String routeEditName = 'saas-plan-edit';
  static const String routePath = '/saas/plans/new';
  static const String routeEditPath = '/saas/plans/:id/edit';
  final String? planId;

  @override
  ConsumerState<SaasPlanFormPage> createState() => _SaasPlanFormPageState();
}

class _SaasPlanFormPageState extends ConsumerState<SaasPlanFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController(); final _descriptionCtrl = TextEditingController();
  final _priceCtrl = TextEditingController(); final _maxUsersCtrl = TextEditingController();
  final _maxStorageCtrl = TextEditingController(); final _featuresCtrl = TextEditingController();
  String _billingInterval = 'MONTHLY'; bool _isActive = true; bool _saving = false;
  bool get _isEditing => widget.planId != null;

  @override
  void initState() { super.initState(); if (_isEditing) _load(); }

  Future<void> _load() async {
    final p = ref.read(saasPlanDetailProvider(widget.planId!)).valueOrNull;
    if (p != null) { _nameCtrl.text = p.name; _descriptionCtrl.text = p.description ?? ''; _priceCtrl.text = p.price.toString(); _maxUsersCtrl.text = p.maxUsers?.toString() ?? ''; _maxStorageCtrl.text = p.maxStorage?.toString() ?? ''; _featuresCtrl.text = p.features.join(', '); _billingInterval = p.billingInterval; _isActive = p.isActive; }
  }

  @override
  void dispose() { _nameCtrl.dispose(); _descriptionCtrl.dispose(); _priceCtrl.dispose(); _maxUsersCtrl.dispose(); _maxStorageCtrl.dispose(); _featuresCtrl.dispose(); super.dispose(); }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return; setState(() => _saving = true);
    final payload = <String, dynamic>{
      'name': _nameCtrl.text.trim(), 'description': _descriptionCtrl.text.trim().isEmpty ? null : _descriptionCtrl.text.trim(),
      'price': double.tryParse(_priceCtrl.text) ?? 0, 'billingInterval': _billingInterval, 'isActive': _isActive,
      'maxUsers': int.tryParse(_maxUsersCtrl.text), 'maxStorage': int.tryParse(_maxStorageCtrl.text),
      'features': _featuresCtrl.text.trim().isEmpty ? [] : _featuresCtrl.text.split(',').map((s) => s.trim()).where((s) => s.isNotEmpty).toList(),
    };
    final result = await ref.read(saasPlanListControllerProvider.notifier).save(payload, id: widget.planId);
    if (!context.mounted) return; setState(() => _saving = false);
    result.fold((f) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(f.message))), (_) => Navigator.of(context).pop());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_isEditing ? 'Edit Plan' : 'New Plan'), actions: [TextButton(onPressed: _saving ? null : _save, child: _saving ? const SizedBox(height: Spacing.x5, width: Spacing.x5, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Save'))]),
      body: Form(key: _formKey, child: ListView(padding: const EdgeInsets.all(Spacing.x4), children: [
        TextFormField(controller: _nameCtrl, decoration: const InputDecoration(labelText: 'Name *'), validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null),
        const SizedBox(height: Spacing.x4), TextFormField(controller: _descriptionCtrl, maxLines: 3, decoration: const InputDecoration(labelText: 'Description', alignLabelWithHint: true)),
        const SizedBox(height: Spacing.x4),
        Row(children: [Expanded(child: TextFormField(controller: _priceCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Price *'))), const SizedBox(width: Spacing.x3), Expanded(child: DropdownButtonFormField<String>(value: _billingInterval, decoration: const InputDecoration(labelText: 'Billing'), items: const [
          DropdownMenuItem(value: 'MONTHLY', child: Text('Monthly')), DropdownMenuItem(value: 'YEARLY', child: Text('Yearly')),
          DropdownMenuItem(value: 'QUARTERLY', child: Text('Quarterly')),
        ], onChanged: (v) { if (v != null) setState(() => _billingInterval = v); }))],
        ),
        const SizedBox(height: Spacing.x4),
        Row(children: [Expanded(child: TextFormField(controller: _maxUsersCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Max Users'))), const SizedBox(width: Spacing.x3), Expanded(child: TextFormField(controller: _maxStorageCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Max Storage (GB)')))],
        ),
        const SizedBox(height: Spacing.x4), TextFormField(controller: _featuresCtrl, maxLines: 3, decoration: const InputDecoration(labelText: 'Features', helperText: 'One per line or comma-separated')),
        const SizedBox(height: Spacing.x4), SwitchListTile(title: const Text('Active'), value: _isActive, onChanged: (v) => setState(() => _isActive = v), contentPadding: EdgeInsets.zero),
      ])),
    );
  }
}

class SaasSubscriptionDetailPage extends ConsumerWidget {
  const SaasSubscriptionDetailPage({required this.subscriptionId, super.key});
  static const String routeName = 'saas-subscription-detail';
  static const String routePath = '/saas/subscriptions/:id';
  final String subscriptionId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(appBar: AppBar(title: const Text('Subscription')), body: ListView(padding: const EdgeInsets.all(Spacing.x4), children: [Text('Subscription: $subscriptionId')]));
  }
}

class SaasTenantDetailPage extends ConsumerWidget {
  const SaasTenantDetailPage({required this.tenantId, super.key});
  static const String routeName = 'saas-tenant-detail';
  static const String routePath = '/saas/tenants/:id';
  final String tenantId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(appBar: AppBar(title: const Text('Tenant')), body: ListView(padding: const EdgeInsets.all(Spacing.x4), children: [Text('Tenant: $tenantId')]));
  }
}

class SaasTenantFormPage extends ConsumerStatefulWidget {
  const SaasTenantFormPage({this.tenantId, super.key});
  static const String routeName = 'saas-tenant-new';
  static const String routeEditName = 'saas-tenant-edit';
  static const String routePath = '/saas/tenants/new';
  static const String routeEditPath = '/saas/tenants/:id/edit';
  final String? tenantId;

  @override
  ConsumerState<SaasTenantFormPage> createState() => _SaasTenantFormPageState();
}

class _SaasTenantFormPageState extends ConsumerState<SaasTenantFormPage> {
  final _formKey = GlobalKey<FormState>(); final _orgCtrl = TextEditingController(); final _domainCtrl = TextEditingController();
  String _status = 'ACTIVE'; bool _saving = false; bool get _isEditing => widget.tenantId != null;

  @override
  void dispose() { _orgCtrl.dispose(); _domainCtrl.dispose(); super.dispose(); }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return; setState(() => _saving = true);
    final payload = <String, dynamic>{'organizationName': _orgCtrl.text.trim(), 'domain': _domainCtrl.text.trim().isEmpty ? null : _domainCtrl.text.trim(), 'status': _status};
    final result = await ref.read(saasTenantListControllerProvider.notifier).save(payload, id: widget.tenantId);
    if (!context.mounted) return; setState(() => _saving = false);
    result.fold((f) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(f.message))), (_) => Navigator.of(context).pop());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_isEditing ? 'Edit Tenant' : 'New Tenant'), actions: [TextButton(onPressed: _saving ? null : _save, child: _saving ? const SizedBox(height: Spacing.x5, width: Spacing.x5, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Save'))]),
      body: Form(key: _formKey, child: ListView(padding: const EdgeInsets.all(Spacing.x4), children: [
        TextFormField(controller: _orgCtrl, decoration: const InputDecoration(labelText: 'Organization Name *'), validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null),
        const SizedBox(height: Spacing.x4), TextFormField(controller: _domainCtrl, decoration: const InputDecoration(labelText: 'Domain')),
        const SizedBox(height: Spacing.x4),
        DropdownButtonFormField<String>(value: _status, decoration: const InputDecoration(labelText: 'Status'), items: const [
          DropdownMenuItem(value: 'ACTIVE', child: Text('Active')), DropdownMenuItem(value: 'INACTIVE', child: Text('Inactive')),
          DropdownMenuItem(value: 'SUSPENDED', child: Text('Suspended')),
        ], onChanged: (v) { if (v != null) setState(() => _status = v); }),
      ])),
    );
  }
}

class BillingFormPage extends ConsumerStatefulWidget {
  const BillingFormPage({this.invoiceId, super.key});
  static const String routeName = 'billing-new';
  static const String routeEditName = 'billing-edit';
  static const String routePath = '/saas/billing/new';
  static const String routeEditPath = '/saas/billing/:id/edit';
  final String? invoiceId;

  @override
  ConsumerState<BillingFormPage> createState() => _BillingFormPageState();
}

class _BillingFormPageState extends ConsumerState<BillingFormPage> {
  final _formKey = GlobalKey<FormState>(); bool _saving = false;
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Billing Info'), actions: [TextButton(onPressed: _saving ? null : () {}, child: const Text('Save'))]),
      body: Form(key: _formKey, child: ListView(padding: const EdgeInsets.all(Spacing.x4), children: const [
        Text('Billing information management coming soon.'),
      ])),
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.child}); final Widget child;
  @override Widget build(BuildContext context) { final t = context.tokens; return Container(width: double.infinity, padding: const EdgeInsets.all(Spacing.x4), decoration: BoxDecoration(color: t.bgElevated, borderRadius: Radii.card, border: Border.all(color: t.border)), child: child); }
}
class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.title}); final String title;
  @override Widget build(BuildContext context) => Padding(padding: const EdgeInsets.only(bottom: Spacing.x3), child: Text(title, style: Theme.of(context).textTheme.titleMedium));
}
class _FieldRow extends StatelessWidget {
  const _FieldRow(this.label, this.value); final String label; final String value;
  @override Widget build(BuildContext context) { final t = context.tokens; return Padding(padding: const EdgeInsets.symmetric(vertical: Spacing.x1_5), child: Row(children: [Expanded(child: Text(label, style: TextStyle(color: t.textSecondary))), Text(value, style: Theme.of(context).textTheme.labelLarge)])); }
}