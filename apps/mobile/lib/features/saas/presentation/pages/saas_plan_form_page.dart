import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../providers/saas_providers.dart';

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
  final _nameCtrl = TextEditingController();
  final _descriptionCtrl = TextEditingController();
  final _priceCtrl = TextEditingController();
  final _maxUsersCtrl = TextEditingController();
  final _maxStorageCtrl = TextEditingController();
  final _featuresCtrl = TextEditingController();
  String _billingInterval = 'MONTHLY';
  bool _isActive = true;
  bool _saving = false;

  bool get _isEditing => widget.planId != null;

  @override
  void initState() { super.initState(); if (_isEditing) _load(); }

  Future<void> _load() async {
    final p = ref.read(saasPlanDetailProvider(widget.planId!)).valueOrNull;
    if (p != null) {
      _nameCtrl.text = p.name; _descriptionCtrl.text = p.description ?? '';
      _priceCtrl.text = p.price.toString(); _maxUsersCtrl.text = p.maxUsers?.toString() ?? '';
      _maxStorageCtrl.text = p.maxStorage?.toString() ?? ''; _featuresCtrl.text = p.features.join(', ');
      _billingInterval = p.billingInterval; _isActive = p.isActive;
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose(); _descriptionCtrl.dispose(); _priceCtrl.dispose();
    _maxUsersCtrl.dispose(); _maxStorageCtrl.dispose(); _featuresCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    final payload = <String, dynamic>{
      'name': _nameCtrl.text.trim(), 'description': _descriptionCtrl.text.trim().isEmpty ? null : _descriptionCtrl.text.trim(),
      'price': double.tryParse(_priceCtrl.text) ?? 0, 'billingInterval': _billingInterval, 'isActive': _isActive,
      'maxUsers': int.tryParse(_maxUsersCtrl.text), 'maxStorage': int.tryParse(_maxStorageCtrl.text),
      'features': _featuresCtrl.text.trim().isEmpty ? [] : _featuresCtrl.text.split(',').map((s) => s.trim()).where((s) => s.isNotEmpty).toList(),
    };
    final result = await ref.read(saasPlanListControllerProvider.notifier).save(payload, id: widget.planId);
    if (!context.mounted) return;
    setState(() => _saving = false);
    result.fold((f) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(f.message))), (_) => Navigator.of(context).pop());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_isEditing ? 'Edit Plan' : 'New Plan'), actions: [
        TextButton(onPressed: _saving ? null : _save, child: _saving ? const SizedBox(height: Spacing.x5, width: Spacing.x5, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Save')),
      ]),
      body: Form(key: _formKey, child: ListView(padding: const EdgeInsets.all(Spacing.x4), children: [
        TextFormField(controller: _nameCtrl, decoration: const InputDecoration(labelText: 'Name *'), validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null),
        const SizedBox(height: Spacing.x4), TextFormField(controller: _descriptionCtrl, maxLines: 3, decoration: const InputDecoration(labelText: 'Description', alignLabelWithHint: true)),
        const SizedBox(height: Spacing.x4),
        Row(children: [
          Expanded(child: TextFormField(controller: _priceCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Price *'))),
          const SizedBox(width: Spacing.x3),
          Expanded(child: DropdownButtonFormField<String>(value: _billingInterval, decoration: const InputDecoration(labelText: 'Billing'), items: const [
            DropdownMenuItem(value: 'MONTHLY', child: Text('Monthly')), DropdownMenuItem(value: 'YEARLY', child: Text('Yearly')),
            DropdownMenuItem(value: 'QUARTERLY', child: Text('Quarterly')),
          ], onChanged: (v) { if (v != null) setState(() => _billingInterval = v); })),
        ]),
        const SizedBox(height: Spacing.x4),
        Row(children: [
          Expanded(child: TextFormField(controller: _maxUsersCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Max Users'))),
          const SizedBox(width: Spacing.x3),
          Expanded(child: TextFormField(controller: _maxStorageCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Max Storage (GB)'))),
        ]),
        const SizedBox(height: Spacing.x4), TextFormField(controller: _featuresCtrl, maxLines: 3, decoration: const InputDecoration(labelText: 'Features', helperText: 'Comma-separated')),
        const SizedBox(height: Spacing.x4), SwitchListTile(title: const Text('Active'), value: _isActive, onChanged: (v) => setState(() => _isActive = v), contentPadding: EdgeInsets.zero),
      ])),
    );
  }
}
