import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../providers/saas_providers.dart';

class SaasBillingFormPage extends ConsumerStatefulWidget {
  const SaasBillingFormPage({this.invoiceId, super.key});
  static const String routeName = 'saas-billing-new';
  static const String routeEditName = 'saas-billing-edit';
  static const String routePath = '/saas/billing/new';
  static const String routeEditPath = '/saas/billing/:id/edit';
  final String? invoiceId;

  @override
  ConsumerState<SaasBillingFormPage> createState() => _SaasBillingFormPageState();
}

class _SaasBillingFormPageState extends ConsumerState<SaasBillingFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _tenantIdCtrl = TextEditingController();
  final _amountCtrl = TextEditingController();
  final _periodCtrl = TextEditingController();
  String _status = 'PENDING';
  bool _saving = false;

  @override
  void dispose() {
    _tenantIdCtrl.dispose();
    _amountCtrl.dispose();
    _periodCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    final payload = <String, dynamic>{
      'tenantId': _tenantIdCtrl.text.trim(),
      'amount': double.tryParse(_amountCtrl.text) ?? 0,
      'status': _status,
      'periodEnd': _periodCtrl.text.trim(),
    };
    final result = await ref.read(saasInvoiceListControllerProvider.notifier).save(payload, id: widget.invoiceId);
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
        title: const Text('Create Invoice'),
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
              controller: _tenantIdCtrl,
              decoration: const InputDecoration(labelText: 'Tenant ID *'),
              validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _amountCtrl,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Amount *'),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _periodCtrl,
              decoration: const InputDecoration(labelText: 'Period', helperText: 'e.g. 2026-08'),
            ),
            const SizedBox(height: Spacing.x4),
            DropdownButtonFormField<String>(
              initialValue: _status,
              decoration: const InputDecoration(labelText: 'Status'),
              items: const [
                DropdownMenuItem(value: 'PENDING', child: Text('Pending')),
                DropdownMenuItem(value: 'PAID', child: Text('Paid')),
                DropdownMenuItem(value: 'OVERDUE', child: Text('Overdue')),
                DropdownMenuItem(value: 'CANCELED', child: Text('Canceled')),
              ],
              onChanged: (v) { if (v != null) setState(() => _status = v); },
            ),
          ],
        ),
      ),
    );
  }
}
