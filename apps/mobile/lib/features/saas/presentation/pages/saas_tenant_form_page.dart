import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../providers/saas_providers.dart';

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
  final _formKey = GlobalKey<FormState>();
  final _orgCtrl = TextEditingController();
  final _domainCtrl = TextEditingController();
  String _status = 'ACTIVE';
  bool _saving = false;

  bool get _isEditing => widget.tenantId != null;

  @override
  void dispose() { _orgCtrl.dispose(); _domainCtrl.dispose(); super.dispose(); }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    final payload = <String, dynamic>{
      'organizationName': _orgCtrl.text.trim(),
      'domain': _domainCtrl.text.trim().isEmpty ? null : _domainCtrl.text.trim(),
      'status': _status,
    };
    final result = await ref.read(saasTenantListControllerProvider.notifier).save(payload, id: widget.tenantId);
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
      appBar: AppBar(title: Text(_isEditing ? 'Edit Tenant' : 'New Tenant'), actions: [
        TextButton(onPressed: _saving ? null : _save, child: _saving ? const SizedBox(height: Spacing.x5, width: Spacing.x5, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Save')),
      ]),
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
