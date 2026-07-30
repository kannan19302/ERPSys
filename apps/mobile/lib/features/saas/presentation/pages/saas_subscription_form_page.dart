import '../../../../core/utils/formatters.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../providers/saas_providers.dart';

class SaasSubscriptionFormPage extends ConsumerStatefulWidget {
  const SaasSubscriptionFormPage({this.subscriptionId, super.key});
  static const String routeName = 'saas-subscription-new';
  static const String routeEditName = 'saas-subscription-edit';
  static const String routePath = '/saas/subscriptions/new';
  static const String routeEditPath = '/saas/subscriptions/:id/edit';
  final String? subscriptionId;

  @override
  ConsumerState<SaasSubscriptionFormPage> createState() => _SaasSubscriptionFormPageState();
}

class _SaasSubscriptionFormPageState extends ConsumerState<SaasSubscriptionFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _planIdCtrl = TextEditingController();
  final _tenantIdCtrl = TextEditingController();
  DateTime? _startDate;
  String _status = 'ACTIVE';
  String _billingCycle = 'MONTHLY';
  bool _saving = false;

  bool get _isEditing => widget.subscriptionId != null;

  @override
  void dispose() {
    _planIdCtrl.dispose();
    _tenantIdCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    final payload = <String, dynamic>{
      'planId': _planIdCtrl.text.trim(),
      'tenantId': _tenantIdCtrl.text.trim(),
      'status': _status,
      'currentPeriodStart': _startDate?.toIso8601String(),
      'billingCycle': _billingCycle,
    };
    final result = await ref.read(saasSubscriptionListControllerProvider.notifier).save(payload, id: widget.subscriptionId);
    if (!context.mounted) return;
    setState(() => _saving = false);
    result.fold(
      (f) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(f.message))),
      (_) => Navigator.of(context).pop(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    return Scaffold(
      appBar: AppBar(
        title: Text(_isEditing ? 'Edit Subscription' : 'New Subscription'),
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
              controller: _planIdCtrl,
              decoration: const InputDecoration(labelText: 'Plan ID *'),
              validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _tenantIdCtrl,
              decoration: const InputDecoration(labelText: 'Tenant ID *'),
              validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: Spacing.x4),
            InkWell(
              onTap: () async {
                final picked = await showDatePicker(
                  context: context,
                  initialDate: _startDate ?? DateTime.now(),
                  firstDate: DateTime(2000),
                  lastDate: DateTime(2100),
                );
                if (picked != null) setState(() => _startDate = picked);
              },
              child: InputDecorator(
                decoration: InputDecoration(
                  labelText: 'Start Date',
                  suffixIcon: const Icon(Icons.calendar_today),
                ),
                child: Text(_startDate != null ? Formatters.date(_startDate!) : 'Select date'),
              ),
            ),
            const SizedBox(height: Spacing.x4),
            DropdownButtonFormField<String>(
              value: _billingCycle,
              decoration: const InputDecoration(labelText: 'Billing Cycle'),
              items: const [
                DropdownMenuItem(value: 'MONTHLY', child: Text('Monthly')),
                DropdownMenuItem(value: 'YEARLY', child: Text('Yearly')),
                DropdownMenuItem(value: 'QUARTERLY', child: Text('Quarterly')),
              ],
              onChanged: (v) { if (v != null) setState(() => _billingCycle = v); },
            ),
            const SizedBox(height: Spacing.x4),
            DropdownButtonFormField<String>(
              value: _status,
              decoration: const InputDecoration(labelText: 'Status'),
              items: const [
                DropdownMenuItem(value: 'ACTIVE', child: Text('Active')),
                DropdownMenuItem(value: 'TRIALING', child: Text('Trialing')),
                DropdownMenuItem(value: 'PAST_DUE', child: Text('Past Due')),
              ],
              onChanged: (v) { if (v != null) setState(() => _status = v); },
            ),
          ],
        ),
      ),
    );
  }
}
